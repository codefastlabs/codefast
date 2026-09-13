/** Runs every library of a suite behind one progress display, in the run shape the environment asks for. */
import { createProgressDisplay } from "#/parent/progress/create-progress-display";
import type { ProgressDisplay } from "#/parent/progress/progress-display";
import type { RunBenchSubprocessParameters } from "#/parent/run-bench-subprocess";
import {
  INTERLEAVED_RUN_ORDER,
  isIsolatedBenchRunRequested,
  LIBRARY_MAJOR_RUN_ORDER,
  runBenchSubprocess,
  runBenchSubprocessesInterleaved,
} from "#/parent/run-bench-subprocess";
import type { BenchSubprocessConfig } from "#/shared/config";
import { resolveDisplayName } from "#/shared/config";
import { resolveBenchModeFromEnvironment } from "#/shared/env-keys";
import type { SubprocessPayload } from "#/shared/protocol";

/**
 * Options for {@link runBenchLibraries}.
 *
 * @since 0.9.0
 */
export interface RunBenchLibrariesOptions {
  readonly packageRootDirectory: string;
  /** Subject first: the order the progress rows, the report columns and the spawns all share. */
  readonly libraries: ReadonlyArray<BenchSubprocessConfig>;
  /** Streams every child line as a prefixed log instead of drawing progress in place. */
  readonly verbose: boolean;
  /** Defaults to a live block on an interactive stderr, or plain milestones anywhere else. */
  readonly display?: ProgressDisplay | undefined;
}

/**
 * Every library's payload keyed by library name, plus the run-order caveat the report cites.
 *
 * @since 0.9.0
 */
export interface RunBenchLibrariesResult {
  readonly payloads: ReadonlyMap<string, SubprocessPayload>;
  readonly runOrder: string;
}

function describeBenchMode(): string | undefined {
  const mode = resolveBenchModeFromEnvironment();
  if (mode === "full") {
    return "[bench] BENCH_MODE=full: --expose-gc is on for every child. The stability profile, which runs longer on large suites.";
  }
  if (mode === undefined) {
    return "[bench] Default profile, no --expose-gc. BENCH_MODE=fast is the smoke profile; BENCH_MODE=full the stability profile.";
  }
  return undefined;
}

/**
 * Runs the libraries library-major, or interleaved per scenario under `BENCH_ISOLATE`, reporting to one display.
 *
 * @remarks Isolated runs interleave because a cross-library ratio is only as good as the gap between
 * the two measurements it divides; a shared run has one process per library and nothing to interleave.
 *
 * @since 0.9.0
 */
export async function runBenchLibraries(options: RunBenchLibrariesOptions): Promise<RunBenchLibrariesResult> {
  const { packageRootDirectory, libraries, verbose } = options;
  const display = options.display ?? createProgressDisplay({ verbose });
  const modeNote = describeBenchMode();
  if (modeNote !== undefined) {
    display.log(modeNote);
  }

  const parametersFor = (config: BenchSubprocessConfig): RunBenchSubprocessParameters => ({
    packageRootDirectory,
    tsconfigFileName: config.tsconfigFileName,
    benchEntryFileNameUnderSrc: config.benchEntryFileName,
    harnessLabel: resolveDisplayName(config),
    scenarioName: config.scenarioName,
    forwardChildStdoutVerbose: verbose,
  });

  try {
    if (isIsolatedBenchRunRequested()) {
      const payloads = await runBenchSubprocessesInterleaved(
        libraries.map((config) => ({ key: config.libraryName, parameters: parametersFor(config) })),
        display,
      );
      return { payloads, runOrder: INTERLEAVED_RUN_ORDER };
    }
    for (const config of libraries) {
      display.register(config.libraryName, resolveDisplayName(config));
    }
    const payloads = new Map<string, SubprocessPayload>();
    for (const config of libraries) {
      payloads.set(
        config.libraryName,
        await runBenchSubprocess({ ...parametersFor(config), progress: { display, key: config.libraryName } }),
      );
    }
    return { payloads, runOrder: LIBRARY_MAJOR_RUN_ORDER };
  } finally {
    display.finish();
  }
}
