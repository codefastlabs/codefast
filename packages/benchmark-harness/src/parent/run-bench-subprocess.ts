import { spawn } from "node:child_process";
import { join } from "node:path";

import {
  BENCH_ISOLATE_ENV_KEY,
  BENCH_LIST_ENV_KEY,
  BENCH_ONLY_ENV_KEY,
  INTERNAL_BENCH_ENV_KEYS,
  isEnvFlagEnabled,
  resolveBenchModeFromEnvironment,
  resolveScenarioFilterFromEnvironment,
} from "#/shared/env-keys";
import { BENCH_RESULT_JSON_END, BENCH_RESULT_JSON_START, extractSubprocessPayload } from "#/shared/protocol";
import type { SubprocessPayload, TrialPayload } from "#/shared/protocol";

const HEARTBEAT_SILENCE_MS = 10_000;

/**
 * Failure of a bench subprocess, carrying the exit code the child ended with.
 *
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
 * `--expose-gc` in the full profile, and `--no-warnings` to keep stdout parsable.
 *
 * @since 0.3.16-canary.0
 */
export function buildSubprocessEnvironment(): NodeJS.ProcessEnv {
  const parentEnvironment = process.env;
  const existingNodeOptions = parentEnvironment["NODE_OPTIONS"] ?? "";
  const requiredFlags =
    resolveBenchModeFromEnvironment() === "full" ? ["--expose-gc", "--no-warnings"] : ["--no-warnings"];
  const hasInspectFlag = existingNodeOptions.includes("--inspect-brk") || existingNodeOptions.includes("--inspect");
  if (hasInspectFlag) {
    console.warn(
      "[bench] Warning: NODE_OPTIONS contains debugger flags (--inspect/--inspect-brk); benchmark subprocesses may stall until timeout.",
    );
  }
  const mergedNodeOptions = [existingNodeOptions, ...requiredFlags]
    .filter((segment) => segment.trim().length > 0)
    .join(" ");
  const childEnvironment: NodeJS.ProcessEnv = {
    ...parentEnvironment,
    NODE_ENV: "production",
    NODE_OPTIONS: mergedNodeOptions,
  };
  // The protocol keys travel per subprocess, never by inheritance: a `BENCH_LIST` from the
  // surrounding shell would otherwise put every measuring child into discovery mode, and the run
  // would report an empty comparison as though the suite had no comparable rows.
  for (const internalKey of INTERNAL_BENCH_ENV_KEYS) {
    delete childEnvironment[internalKey];
  }
  return childEnvironment;
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
 * Parameters for {@link runBenchSubprocess}.
 *
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
  /**
   * Extra env vars for the child (merged over the pinned bench environment). Not a scenario-filter
   * channel: scheduling and reporting read `BENCH_ONLY` from the parent environment, and isolated
   * scheduling overwrites it per scenario.
   */
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

  console.error(`\nRunning ${harnessLabel} subprocess: ${benchEntryFileNameUnderSrc}…`);
  const benchMode = resolveBenchModeFromEnvironment();
  if (benchMode === "full") {
    console.error(
      "[bench] Running benchmark with --expose-gc (BENCH_MODE=full). This profile prioritizes stability and may still run significantly longer on large suites.",
    );
  } else if (benchMode === undefined) {
    console.error(
      "[bench] Running benchmark without --expose-gc (default profile). Use BENCH_MODE=fast for smoke checks or BENCH_MODE=full for GC-enabled stability runs.",
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
        console.error(`Still running ${scenarioName}... ${elapsedSeconds.toFixed(1)}s elapsed`);
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
  console.error(
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
 * True when the current run asked for per-scenario process isolation (`BENCH_ISOLATE=true`).
 *
 * @since 0.5.0-canary.7
 */
export function isIsolatedBenchRunRequested(): boolean {
  return isEnvFlagEnabled(BENCH_ISOLATE_ENV_KEY);
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
 * Runs one discovery subprocess and returns the scenario ids the library collected, in run order.
 *
 * @remarks Nothing is measured, so this is also the supported way to ask a suite what rows it has
 * without benching them — `BENCH_LIST` itself is a protocol key the parent owns.
 *
 * @since 0.6.0
 */
export async function discoverBenchScenarioIds(
  parameters: RunBenchSubprocessParameters,
): Promise<{ fingerprint: SubprocessPayload["fingerprint"]; scenarioIds: ReadonlyArray<string> }> {
  const listPayload = await runBenchSubprocess({
    ...parameters,
    harnessLabel: `${parameters.harnessLabel} [list]`,
    environmentOverrides: { ...parameters.environmentOverrides, [BENCH_LIST_ENV_KEY]: "true" },
  });
  const scenarioIds = listPayload.scenarioIds ?? [];
  if (scenarioIds.length === 0) {
    throw new Error(`${parameters.harnessLabel} list run returned no scenario ids.`);
  }
  return { fingerprint: listPayload.fingerprint, scenarioIds };
}

/**
 * One library to schedule in an interleaved isolated run.
 *
 * @since 0.5.0-canary.8
 */
export type InterleavedLibraryRun = Readonly<{
  /** Keys the returned map — the library name the report aligns on. */
  readonly key: string;
  readonly parameters: RunBenchSubprocessParameters;
}>;

/** The ordered union of the libraries' scenario ids, first library's order first. */
function unionScenarioIds(perLibraryIds: ReadonlyArray<ReadonlyArray<string>>): Array<string> {
  const ordered: Array<string> = [];
  const seen = new Set<string>();
  for (const ids of perLibraryIds) {
    for (const id of ids) {
      if (!seen.has(id)) {
        seen.add(id);
        ordered.push(id);
      }
    }
  }
  return ordered;
}

/**
 * Runs every library on the same scenario before moving to the next, rotating which library goes
 * first each time.
 *
 * Scheduling one library's whole suite before the next one starts puts minutes between the two sides
 * of every ratio, so drift over the run lands entirely on whoever is scheduled later — and that is
 * never the library the suite is written to promote. Interleaving spreads the drift across all of
 * them; rotating stops the first slot from being a permanent advantage.
 *
 * @remarks A library that does not implement a scenario is skipped for it, so partial suites cost
 * nothing. Results are collected in scenario order rather than run order, keeping report rows stable.
 *
 * @since 0.5.0-canary.8
 */
export async function runBenchSubprocessesInterleaved(
  libraries: ReadonlyArray<InterleavedLibraryRun>,
): Promise<Map<string, SubprocessPayload>> {
  const discoveries = new Map<string, Awaited<ReturnType<typeof discoverBenchScenarioIds>>>();
  for (const library of libraries) {
    discoveries.set(library.key, await discoverBenchScenarioIds(library.parameters));
  }

  // Filtered here rather than in the child: the loop below sets BENCH_ONLY per scenario, so a
  // filter left to the child would be overwritten and the whole suite would run anyway.
  const requestedScenarioIds = resolveScenarioFilterFromEnvironment();
  const discoveredScenarioIds = unionScenarioIds(
    libraries.map((library) => discoveries.get(library.key)?.scenarioIds ?? []),
  );
  const scenarioIds =
    requestedScenarioIds === undefined
      ? discoveredScenarioIds
      : discoveredScenarioIds.filter((id) => requestedScenarioIds.has(id));
  console.error(
    `[bench] BENCH_ISOLATE=true: ${String(scenarioIds.length)} scenarios × ${String(libraries.length)} libraries, interleaved with rotating order.`,
  );

  const workerPayloads = new Map<string, Array<SubprocessPayload>>(libraries.map((library) => [library.key, []]));
  for (const [scenarioIndex, scenarioId] of scenarioIds.entries()) {
    // Rotate over the libraries that implement this scenario — rotating the full list and then
    // filtering hands the first slot to whichever library survives the filter most often.
    const implementing = libraries.filter((library) =>
      (discoveries.get(library.key)?.scenarioIds ?? []).includes(scenarioId),
    );
    if (implementing.length === 0) {
      continue;
    }
    const rotation = scenarioIndex % implementing.length;
    const order = [...implementing.slice(rotation), ...implementing.slice(0, rotation)];
    for (const library of order) {
      const payload = await runBenchSubprocess({
        ...library.parameters,
        harnessLabel: `${library.parameters.harnessLabel} [${scenarioId}]`,
        environmentOverrides: { ...library.parameters.environmentOverrides, [BENCH_ONLY_ENV_KEY]: scenarioId },
      });
      workerPayloads.get(library.key)?.push(payload);
    }
  }

  const merged = new Map<string, SubprocessPayload>();
  for (const library of libraries) {
    const payloads = workerPayloads.get(library.key) ?? [];
    merged.set(library.key, {
      fingerprint: discoveries.get(library.key)!.fingerprint,
      trials: mergeIsolatedTrials(payloads),
      sanityFailures: payloads.flatMap((payload) => payload.sanityFailures),
      scenarioIds: discoveries.get(library.key)!.scenarioIds,
    });
  }
  return merged;
}
