import { spawn } from "node:child_process";
import { join } from "node:path";

import type { BenchScenarioTier } from "#/child/bench-scenario";
import { DEFAULT_BENCH_SCENARIO_TIER } from "#/child/bench-scenario";
import { PlainProgressDisplay } from "#/parent/progress/plain-progress-display";
import type { ProgressDisplay } from "#/parent/progress/progress-display";
import {
  BENCH_ISOLATE_ENV_KEY,
  BENCH_LIST_ENV_KEY,
  BENCH_ONLY_ENV_KEY,
  INTERNAL_BENCH_ENV_KEYS,
  isEnvFlagEnabled,
  resolveBenchModeFromEnvironment,
  resolveScenarioFilterFromEnvironment,
  resolveTierFilterFromEnvironment,
} from "#/shared/env-keys";
import { parseProgressEvent } from "#/shared/progress";
import { BENCH_RESULT_JSON_END, BENCH_RESULT_JSON_START, extractSubprocessPayload } from "#/shared/protocol";
import type { ScenarioListing, SubprocessPayload, TrialPayload } from "#/shared/protocol";

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

function createStreamLineForwarder(onLine: (line: string) => void): {
  feed: (chunk: string) => void;
  flush: () => void;
} {
  let bufferedRemainder = "";
  return {
    feed: (chunk: string): void => {
      bufferedRemainder += chunk;
      const lines = bufferedRemainder.split("\n");
      bufferedRemainder = lines.pop() ?? "";
      for (const line of lines) {
        onLine(line);
      }
    },
    flush: (): void => {
      if (bufferedRemainder.length > 0) {
        onLine(bufferedRemainder);
        bufferedRemainder = "";
      }
    },
  };
}

/**
 * Where a subprocess reports its progress: the display and the row it belongs to.
 *
 * @since 0.9.0
 */
export type SubprocessProgressTarget = Readonly<{
  readonly display: ProgressDisplay;
  /** The row key — the library name the report aligns on. */
  readonly key: string;
  /** The one scenario an isolated child measures, shown on its row while it runs. */
  readonly scenarioId?: string | undefined;
  /** A discovery child measures nothing, so its exit must not read as the library finishing. */
  readonly discovery?: boolean | undefined;
}>;

/**
 * The executable and arguments that start one bench child.
 *
 * @since 0.9.0
 */
export interface SubprocessLaunch {
  readonly command: string;
  readonly args: ReadonlyArray<string>;
}

/**
 * What a launcher is told about the child it starts.
 *
 * @since 0.9.0
 */
export interface SubprocessLaunchTarget {
  readonly tsconfigFileName: string;
  /** The entry relative to the package root, already joined under `src/`. */
  readonly entryPath: string;
}

/**
 * Builds the command that runs a child; the default runs the TypeScript entry through the suite's own tsx.
 *
 * @since 0.9.0
 */
export type SubprocessLauncher = (target: SubprocessLaunchTarget) => SubprocessLaunch;

/**
 * The launcher every suite uses: `pnpm exec tsx --tsconfig <tsconfig> <entry>` in the suite package.
 *
 * @since 0.9.0
 */
export const launchWithPnpmTsx: SubprocessLauncher = ({ tsconfigFileName, entryPath }) => ({
  command: "pnpm",
  args: ["exec", "tsx", "--tsconfig", tsconfigFileName, entryPath],
});

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
  /** Streams every child stdout and stderr line, progress lines included, as a prefixed log. */
  readonly forwardChildStdoutVerbose: boolean;
  /** Absent for a standalone call, which then logs milestones plainly on stderr. */
  readonly progress?: SubprocessProgressTarget | undefined;
  /** How the child is started; defaults to the suite's tsx. A test points it at a plain script. */
  readonly launch?: SubprocessLauncher | undefined;
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

  const progress = parameters.progress ?? standaloneProgressTarget(harnessLabel);
  const { display, key } = progress;
  const childOutputPrefix = `[${scenarioName}] `;

  if (progress.discovery === true) {
    display.discovering(key);
  } else {
    display.subprocessStarted(key, progress.scenarioId);
  }

  const spawnResult = await new Promise<{
    stdout: string;
    stderr: string;
    exitCode: number | null;
    signal: NodeJS.Signals | null;
  }>((resolve, reject) => {
    const launch = (parameters.launch ?? launchWithPnpmTsx)({
      tsconfigFileName,
      entryPath: join("src", benchEntryFileNameUnderSrc),
    });
    const childProcess = spawn(launch.command, [...launch.args], {
      cwd: packageRootDirectory,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...buildSubprocessEnvironment(), ...environmentOverrides },
    });

    let stdout = "";
    let stderr = "";

    childProcess.stdout?.setEncoding("utf8");
    childProcess.stderr?.setEncoding("utf8");

    const stdoutForwarder = createStreamLineForwarder((line) => {
      if (forwardChildStdoutVerbose) {
        display.log(`${childOutputPrefix}${line}`);
      }
    });
    // A progress line feeds the display; anything else the child says stays visible as a log.
    const stderrForwarder = createStreamLineForwarder((line) => {
      const event = parseProgressEvent(line);
      if (event !== undefined) {
        display.event(key, event);
      }
      if (event === undefined || forwardChildStdoutVerbose) {
        display.log(`${childOutputPrefix}${line}`);
      }
    });

    childProcess.stdout?.on("data", (chunk: string) => {
      stdout += chunk;
      stdoutForwarder.feed(chunk);
    });
    childProcess.stderr?.on("data", (chunk: string) => {
      stderr += chunk;
      stderrForwarder.feed(chunk);
    });

    childProcess.on("error", (error) => {
      reject(error);
    });

    childProcess.on("close", (exitCode, signal) => {
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

  if (progress.discovery !== true) {
    display.subprocessFinished(key, spawnResult.exitCode ?? undefined);
  }

  if (spawnResult.exitCode !== 0) {
    dumpChildOutput(display, spawnResult.stderr, spawnResult.stdout, "subprocess stdout");
    throw new SubprocessExecutionError(
      `${harnessLabel} subprocess failed (${benchEntryFileNameUnderSrc}), exit ${String(spawnResult.exitCode)}, signal ${String(spawnResult.signal)}`,
      spawnResult.exitCode ?? undefined,
    );
  }

  const hasStartMarker = spawnResult.stdout.includes(BENCH_RESULT_JSON_START);
  const hasEndMarker = spawnResult.stdout.includes(BENCH_RESULT_JSON_END);
  if (!hasStartMarker || !hasEndMarker) {
    dumpChildOutput(display, spawnResult.stderr, spawnResult.stdout, "subprocess stdout (missing framing markers)");
    throw new Error(
      `${harnessLabel} subprocess stdout did not contain ${BENCH_RESULT_JSON_START}/${BENCH_RESULT_JSON_END}; cannot parse result.`,
    );
  }

  const payload = extractSubprocessPayload(spawnResult.stdout);
  if (payload === undefined) {
    dumpChildOutput(
      display,
      spawnResult.stderr,
      spawnResult.stdout,
      "subprocess stdout (framing markers present but JSON invalid)",
    );
    throw new Error(`${harnessLabel} subprocess returned framing markers but the enclosed JSON failed to parse.`);
  }

  return payload;
}

// A standalone call (a suite's `bench:list`, a one-off) still gets readable milestones on stderr.
function standaloneProgressTarget(label: string): SubprocessProgressTarget {
  const display = new PlainProgressDisplay({ write: (line) => process.stderr.write(`${line}\n`) });
  display.register(label, label);
  return { display, key: label };
}

function dumpChildOutput(display: ProgressDisplay, stderr: string, stdout: string, stdoutTitle: string): void {
  display.log("--- subprocess stderr ---");
  display.log(stderr);
  display.log(`--- ${stdoutTitle} ---`);
  display.log(stdout);
}

/**
 * True when the current run asked for per-scenario process isolation (`BENCH_ISOLATE=true`).
 *
 * @since 0.5.0-canary.7
 */
export function isIsolatedBenchRunRequested(): boolean {
  return isEnvFlagEnabled(BENCH_ISOLATE_ENV_KEY);
}

/**
 * The run-order caveat for an isolated run: scenario-major and rotated, so ratios are citable.
 *
 * @since 0.9.0
 */
export const INTERLEAVED_RUN_ORDER =
  "interleaved — every library runs a scenario before the next scenario starts, rotating which goes first";

/**
 * The run-order caveat for a shared run: one library's whole suite before the next, so ratios are provisional.
 *
 * @since 0.9.0
 */
export const LIBRARY_MAJOR_RUN_ORDER =
  "library-major — each library's whole suite runs before the next starts, so drift over the run lands on whoever ran later; cross-library ratios from this profile are provisional";

/**
 * Selects the run-order caveat that matches a run's execution shape.
 *
 * @since 0.9.0
 */
export function runOrderForShape(isolated: boolean): string {
  return isolated ? INTERLEAVED_RUN_ORDER : LIBRARY_MAJOR_RUN_ORDER;
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
export async function discoverBenchScenarioIds(parameters: RunBenchSubprocessParameters): Promise<{
  fingerprint: SubprocessPayload["fingerprint"];
  scenarioIds: ReadonlyArray<string>;
  scenarioListings: ReadonlyArray<ScenarioListing>;
}> {
  const listPayload = await runBenchSubprocess({
    ...parameters,
    harnessLabel: `${parameters.harnessLabel} [list]`,
    progress: parameters.progress === undefined ? undefined : { ...parameters.progress, discovery: true },
    environmentOverrides: { ...parameters.environmentOverrides, [BENCH_LIST_ENV_KEY]: "true" },
  });
  const scenarioIds = listPayload.scenarioIds ?? [];
  if (scenarioIds.length === 0) {
    throw new Error(`${parameters.harnessLabel} list run returned no scenario ids.`);
  }
  // A child predating listings is read as all-contract, which is what a suite without tiers is.
  const scenarioListings =
    listPayload.scenarioListings ?? scenarioIds.map((id) => ({ id, tier: DEFAULT_BENCH_SCENARIO_TIER, requires: [] }));
  return { fingerprint: listPayload.fingerprint, scenarioIds, scenarioListings };
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
  display?: ProgressDisplay,
): Promise<Map<string, SubprocessPayload>> {
  const progressFor = (library: InterleavedLibraryRun, scenarioId?: string): SubprocessProgressTarget | undefined =>
    display === undefined ? undefined : { display, key: library.key, scenarioId };
  for (const library of libraries) {
    display?.register(library.key, library.parameters.harnessLabel, { subprocessScope: "scenario" });
  }
  const discoveries = new Map<string, Awaited<ReturnType<typeof discoverBenchScenarioIds>>>();
  for (const library of libraries) {
    discoveries.set(
      library.key,
      await discoverBenchScenarioIds({ ...library.parameters, progress: progressFor(library) }),
    );
  }

  // Filtered here rather than in the child: the loop below sets BENCH_ONLY per scenario, so a
  // filter left to the child would be overwritten and the whole suite would run anyway.
  const requestedScenarioIds = resolveScenarioFilterFromEnvironment();
  const requestedTier = resolveTierFilterFromEnvironment();
  const discoveredScenarioIds = unionScenarioIds(
    libraries.map((library) => discoveries.get(library.key)?.scenarioIds ?? []),
  );
  const tierOf = new Map<string, BenchScenarioTier>();
  for (const library of libraries) {
    for (const listing of discoveries.get(library.key)?.scenarioListings ?? []) {
      tierOf.set(listing.id, listing.tier);
    }
  }
  const scenarioIds = discoveredScenarioIds.filter(
    (id) =>
      (requestedScenarioIds === undefined || requestedScenarioIds.has(id)) &&
      (requestedTier === undefined || (tierOf.get(id) ?? DEFAULT_BENCH_SCENARIO_TIER) === requestedTier),
  );
  for (const library of libraries) {
    const implemented = discoveries.get(library.key)?.scenarioIds ?? [];
    display?.setScenarioCount(library.key, scenarioIds.filter((id) => implemented.includes(id)).length);
  }
  const tierNote = requestedTier === undefined ? "" : ` (${requestedTier} tier)`;
  display?.log(
    `[bench] BENCH_ISOLATE=true: ${String(scenarioIds.length)} scenarios${tierNote} × ${String(libraries.length)} libraries, interleaved with rotating order.`,
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
        progress: progressFor(library, scenarioId),
        environmentOverrides: { ...library.parameters.environmentOverrides, [BENCH_ONLY_ENV_KEY]: scenarioId },
      });
      workerPayloads.get(library.key)?.push(payload);
    }
  }

  const merged = new Map<string, SubprocessPayload>();
  for (const library of libraries) {
    display?.libraryDone(library.key);
    const payloads = workerPayloads.get(library.key) ?? [];
    merged.set(library.key, {
      fingerprint: discoveries.get(library.key)!.fingerprint,
      trials: mergeIsolatedTrials(payloads),
      sanityFailures: payloads.flatMap((payload) => payload.sanityFailures),
      scenarioIds: discoveries.get(library.key)!.scenarioIds,
      scenarioListings: discoveries.get(library.key)!.scenarioListings,
    });
  }
  return merged;
}
