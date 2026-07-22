import { spawn } from "node:child_process";
import { join } from "node:path";

import {
  BENCH_FAST_ENV_KEY,
  BENCH_FULL_ENV_KEY,
  BENCH_ISOLATE_ENV_KEY,
  BENCH_LIST_ENV_KEY,
  BENCH_ONLY_ENV_KEY,
} from "#/shared/env-keys";
import { BENCH_RESULT_JSON_END, BENCH_RESULT_JSON_START, extractSubprocessPayload } from "#/shared/protocol";
import type { SubprocessPayload, TrialPayload } from "#/shared/protocol";

const HEARTBEAT_SILENCE_MS = 10_000;

/**
 * @since 0.3.16-canary.0
 */
export class SubprocessExecutionError extends Error {
  readonly exitCode: number | undefined;

  constructor(message: string, exitCode?: number) {
    super(message);
    this.name = "SubprocessExecutionError";
    this.exitCode = exitCode;
  }
}

/**
 * Environment pinned across bench subprocesses. Uses `NODE_OPTIONS` for
 * `--expose-gc` when `BENCH_FULL=1`, and `--no-warnings` to keep stdout parsable.
 *
 * @since 0.3.16-canary.0
 */
export function buildSubprocessEnvironment(): NodeJS.ProcessEnv {
  const parentEnvironment = process.env;
  const existingNodeOptions = parentEnvironment["NODE_OPTIONS"] ?? "";
  const fastModeEnabled = parentEnvironment[BENCH_FAST_ENV_KEY] === "1";
  const fullModeEnabled = parentEnvironment[BENCH_FULL_ENV_KEY] === "1";
  const requiredFlags = fastModeEnabled || !fullModeEnabled ? ["--no-warnings"] : ["--expose-gc", "--no-warnings"];
  const hasInspectFlag = existingNodeOptions.includes("--inspect-brk") || existingNodeOptions.includes("--inspect");
  if (hasInspectFlag) {
    console.warn(
      "[bench] Warning: NODE_OPTIONS contains debugger flags (--inspect/--inspect-brk); benchmark subprocesses may stall until timeout.",
    );
  }
  const mergedNodeOptions = [existingNodeOptions, ...requiredFlags]
    .filter((segment) => segment.trim().length > 0)
    .join(" ");
  return {
    ...parentEnvironment,
    NODE_ENV: "production",
    NODE_OPTIONS: mergedNodeOptions,
  };
}

function createStreamLineForwarder(
  prefix: string,
  write: (chunk: string) => void,
  onOutput: () => void,
): { feed: (chunk: string) => void; flush: () => void } {
  let bufferedRemainder = "";
  return {
    feed: (chunk: string): void => {
      onOutput();
      bufferedRemainder += chunk;
      const lines = bufferedRemainder.split("\n");
      bufferedRemainder = lines.pop() ?? "";
      for (const line of lines) {
        write(`${prefix}${line}\n`);
      }
    },
    flush: (): void => {
      if (bufferedRemainder.length > 0) {
        write(`${prefix}${bufferedRemainder}\n`);
        bufferedRemainder = "";
      }
    },
  };
}

/**
 * @since 0.3.16-canary.0
 */
export type RunBenchSubprocessParameters = Readonly<{
  /** Benchmark package directory (directory that contains package.json used for `pnpm exec`). */
  readonly packageRootDirectory: string;
  readonly tsconfigFileName: string;
  /** Filename only — joined with `src/`. Example: `"codefast-benches.ts"`. */
  readonly benchEntryFileNameUnderSrc: string;
  readonly harnessLabel: string;
  readonly scenarioName: string;
  readonly forwardChildStdoutVerbose: boolean;
  /** Extra env vars for the child (merged over the pinned bench environment). */
  readonly environmentOverrides?: Readonly<Record<string, string>> | undefined;
}>;

/**
 * Runs one tsx subprocess and returns the framed {@link SubprocessPayload}.
 *
 * @since 0.3.16-canary.0
 */
export async function runBenchSubprocess(parameters: RunBenchSubprocessParameters): Promise<SubprocessPayload> {
  const {
    packageRootDirectory,
    tsconfigFileName,
    benchEntryFileNameUnderSrc,
    harnessLabel,
    scenarioName,
    forwardChildStdoutVerbose,
    environmentOverrides,
  } = parameters;

  console.log(`\nRunning ${harnessLabel} subprocess: ${benchEntryFileNameUnderSrc}…`);
  const fastModeEnabled = process.env[BENCH_FAST_ENV_KEY] === "1";
  const fullModeEnabled = process.env[BENCH_FULL_ENV_KEY] === "1";
  if (fullModeEnabled) {
    console.log(
      "[bench] Running benchmark with --expose-gc (BENCH_FULL=1). This profile prioritizes stability and may still run significantly longer on large suites.",
    );
  } else if (!fastModeEnabled) {
    console.log(
      "[bench] Running benchmark without --expose-gc (default profile). Use BENCH_FAST=1 for smoke checks or BENCH_FULL=1 for GC-enabled stability runs.",
    );
  }
  const startedAtMs = performance.now();
  const childOutputPrefix = `[${scenarioName}] `;

  const spawnResult = await new Promise<{
    stdout: string;
    stderr: string;
    exitCode: number | null;
    signal: NodeJS.Signals | null;
  }>((resolve, reject) => {
    const childProcess = spawn(
      "pnpm",
      ["exec", "tsx", "--tsconfig", tsconfigFileName, join("src", benchEntryFileNameUnderSrc)],
      {
        cwd: packageRootDirectory,
        stdio: ["ignore", "pipe", "pipe"],
        env: { ...buildSubprocessEnvironment(), ...environmentOverrides },
      },
    );

    let stdout = "";
    let stderr = "";
    let lastOutputAtMs = performance.now();
    let lastHeartbeatAtMs = startedAtMs;

    const refreshOutputTimestamp = (): void => {
      lastOutputAtMs = performance.now();
      lastHeartbeatAtMs = performance.now();
    };

    const heartbeatTimer = setInterval(() => {
      const nowMs = performance.now();
      if (nowMs - lastOutputAtMs >= HEARTBEAT_SILENCE_MS && nowMs - lastHeartbeatAtMs >= HEARTBEAT_SILENCE_MS) {
        const elapsedSeconds = (nowMs - startedAtMs) / 1000;
        console.log(`Still running ${scenarioName}... ${elapsedSeconds.toFixed(1)}s elapsed`);
        lastHeartbeatAtMs = nowMs;
      }
    }, 1000);

    childProcess.stdout?.setEncoding("utf8");
    childProcess.stderr?.setEncoding("utf8");

    const stdoutForwarder = createStreamLineForwarder(
      childOutputPrefix,
      (chunk) => (forwardChildStdoutVerbose ? process.stdout.write(chunk) : undefined),
      refreshOutputTimestamp,
    );
    const stderrForwarder = createStreamLineForwarder(
      childOutputPrefix,
      (chunk) => process.stderr.write(chunk),
      refreshOutputTimestamp,
    );

    childProcess.stdout?.on("data", (chunk: string) => {
      stdout += chunk;
      stdoutForwarder.feed(chunk);
    });
    childProcess.stderr?.on("data", (chunk: string) => {
      stderr += chunk;
      stderrForwarder.feed(chunk);
    });

    childProcess.on("error", (error) => {
      clearInterval(heartbeatTimer);
      reject(error);
    });

    childProcess.on("close", (exitCode, signal) => {
      clearInterval(heartbeatTimer);
      stdoutForwarder.flush();
      stderrForwarder.flush();
      resolve({
        stdout,
        stderr,
        exitCode,
        signal,
      });
    });
  });

  const elapsedSeconds = (performance.now() - startedAtMs) / 1000;
  console.log(
    `${harnessLabel} subprocess finished in ${elapsedSeconds.toFixed(1)}s wall (exit ${String(spawnResult.exitCode)}).`,
  );

  if (spawnResult.exitCode !== 0) {
    console.error("--- subprocess stderr ---");
    console.error(spawnResult.stderr);
    console.error("--- subprocess stdout ---");
    console.error(spawnResult.stdout);
    throw new SubprocessExecutionError(
      `${harnessLabel} subprocess failed (${benchEntryFileNameUnderSrc}), exit ${String(spawnResult.exitCode)}, signal ${String(spawnResult.signal)}`,
      spawnResult.exitCode ?? undefined,
    );
  }

  const hasStartMarker = spawnResult.stdout.includes(BENCH_RESULT_JSON_START);
  const hasEndMarker = spawnResult.stdout.includes(BENCH_RESULT_JSON_END);
  if (!hasStartMarker || !hasEndMarker) {
    console.error("--- subprocess stderr ---");
    console.error(spawnResult.stderr);
    console.error("--- subprocess stdout (missing framing markers) ---");
    console.error(spawnResult.stdout);
    throw new Error(
      `${harnessLabel} subprocess stdout did not contain ${BENCH_RESULT_JSON_START}/${BENCH_RESULT_JSON_END}; cannot parse result.`,
    );
  }

  const payload = extractSubprocessPayload(spawnResult.stdout);
  if (payload === undefined) {
    console.error("--- subprocess stderr ---");
    console.error(spawnResult.stderr);
    console.error("--- subprocess stdout (framing markers present but JSON invalid) ---");
    console.error(spawnResult.stdout);
    throw new Error(`${harnessLabel} subprocess returned framing markers but the enclosed JSON failed to parse.`);
  }

  return payload;
}

/**
 * True when the current run asked for per-scenario process isolation (`BENCH_ISOLATE=1`).
 */
export function isIsolatedBenchRunRequested(): boolean {
  return process.env[BENCH_ISOLATE_ENV_KEY] === "1";
}

function mergeIsolatedTrials(workerPayloads: ReadonlyArray<SubprocessPayload>): Array<TrialPayload> {
  const trialCount = Math.max(0, ...workerPayloads.map((payload) => payload.trials.length));
  const merged: Array<TrialPayload> = [];
  for (let trialIndex = 0; trialIndex < trialCount; trialIndex += 1) {
    merged.push({
      trialIndex,
      scenarios: workerPayloads.flatMap((payload) => payload.trials[trialIndex]?.scenarios ?? []),
    });
  }
  return merged;
}

/**
 * Runs every scenario in its own subprocess and merges the results into one payload.
 *
 * A single long-lived bench process trains the library's hot-path inline caches with
 * every scenario that ran before, so later scenarios (measured: ~30% on async chains)
 * pay for earlier ones. Isolation makes each row order-independent at the cost of one
 * process spawn per scenario.
 */
export async function runBenchSubprocessIsolated(parameters: RunBenchSubprocessParameters): Promise<SubprocessPayload> {
  const listPayload = await runBenchSubprocess({
    ...parameters,
    harnessLabel: `${parameters.harnessLabel} [list]`,
    environmentOverrides: { ...parameters.environmentOverrides, [BENCH_LIST_ENV_KEY]: "1" },
  });
  const scenarioIds = listPayload.scenarioIds ?? [];
  if (scenarioIds.length === 0) {
    throw new Error(`${parameters.harnessLabel} list run returned no scenario ids; cannot run isolated.`);
  }

  console.log(`[bench] BENCH_ISOLATE=1: running ${String(scenarioIds.length)} scenarios in separate subprocesses…`);
  const workerPayloads: Array<SubprocessPayload> = [];
  for (const scenarioId of scenarioIds) {
    workerPayloads.push(
      await runBenchSubprocess({
        ...parameters,
        harnessLabel: `${parameters.harnessLabel} [${scenarioId}]`,
        environmentOverrides: { ...parameters.environmentOverrides, [BENCH_ONLY_ENV_KEY]: scenarioId },
      }),
    );
  }

  return {
    fingerprint: listPayload.fingerprint,
    trials: mergeIsolatedTrials(workerPayloads),
    sanityFailures: workerPayloads.flatMap((payload) => payload.sanityFailures),
  };
}
