import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { BenchOptions } from "tinybench";

import type { AnyBenchScenario } from "#/child/bench-scenario";
import { createRunAllTrials } from "#/child/create-run-all-trials";
import { collectFingerprint } from "#/child/fingerprint";
import { runSanityChecks } from "#/child/run-sanity-checks";
import type { BenchMode } from "#/shared/env-keys";
import {
  assertBenchEnvKeys,
  BENCH_LIST_ENV_KEY,
  BENCH_ONLY_ENV_KEY,
  isEnvFlagEnabled,
  resolveScenarioFilterFromEnvironment,
} from "#/shared/env-keys";
import { emitSubprocessPayload } from "#/shared/protocol";

/**
 * Parameters for {@link runBenchmarkChildMain}.
 *
 * @since 0.3.16-canary.0
 */
export type RunBenchmarkChildMainParameters = Readonly<{
  /** Library id stored on the fingerprint (e.g. `@codefast/di`, `inversify`). */
  readonly libraryName: string;
  /** Subprocess tag in stderr lines (matches parent `scenarioName` / harness prefixes). */
  readonly scenarioName: string;
  /** Benchmark package root passed to `collectFingerprint` (directory with that package's `package.json`). */
  readonly packageRoot: string;
  readonly collectScenarios: () => ReadonlyArray<AnyBenchScenario>;
  /** Default tinybench `Bench` timing; overridden when a mode is active. */
  readonly benchDefaults: BenchOptions;
  /** Explicit timing profile; when absent, falls back to `BENCH_MODE`. */
  readonly mode?: BenchMode | undefined;
  /** Explicit per-scenario trial count (minimum 3); when absent, falls back to `BENCH_TRIALS`. */
  readonly trialCount?: number | undefined;
}>;

/**
 * Shared bench subprocess flow: sanity → trials → framed JSON payload on stdout.
 *
 * @since 0.3.16-canary.0
 */
export async function runBenchmarkChildMain(parameters: RunBenchmarkChildMainParameters): Promise<void> {
  const { libraryName, scenarioName, packageRoot, collectScenarios, benchDefaults, mode, trialCount } = parameters;

  // A child is also a supported entry point (`bench:codefast`), so it validates its own environment
  // rather than trusting a parent to have done it.
  assertBenchEnvKeys({ allowInternalKeys: true });
  console.error(`[bench] subprocess ${scenarioName} started`);
  const allScenarios = collectScenarios();

  // Discovery mode for BENCH_ISOLATE: report ids only, run nothing.
  if (isEnvFlagEnabled(BENCH_LIST_ENV_KEY)) {
    emitSubprocessPayload({
      fingerprint: collectFingerprint(libraryName, packageRoot),
      trials: [],
      sanityFailures: [],
      scenarioIds: allScenarios.map((scenario) => scenario.id),
    });
    console.error(`[bench] subprocess ${scenarioName} completed (list mode)`);
    return;
  }

  // A scenario filter, either from the parent in isolated mode or set directly to bench one row.
  // Matching nothing measures nothing: only some libraries implement any given row, and failing
  // here would take the whole comparison down with them.
  const requestedScenarioIds = resolveScenarioFilterFromEnvironment();
  const scenarios =
    requestedScenarioIds === undefined
      ? allScenarios
      : allScenarios.filter((scenario) => requestedScenarioIds.has(scenario.id));
  if (scenarios.length === 0) {
    console.error(
      `[bench] ${scenarioName} implements none of ${BENCH_ONLY_ENV_KEY}="${process.env[BENCH_ONLY_ENV_KEY] ?? ""}"; measuring nothing.`,
    );
  }
  const sanityFailures = await runSanityChecks(scenarios);
  const { runAllTrials } = createRunAllTrials({ benchDefaults, mode, trialCount });
  const trials = await runAllTrials(scenarios, sanityFailures);

  emitSubprocessPayload({
    fingerprint: collectFingerprint(libraryName, packageRoot),
    trials,
    sanityFailures,
    // Every id the library has, not only the measured ones: the parent cannot otherwise tell a
    // filtered run from a whole suite, and a partial run must not read as the current state.
    scenarioIds: allScenarios.map((scenario) => scenario.id),
  });
  console.error(`[bench] subprocess ${scenarioName} completed`);
}

/**
 * Standard `main().catch` handler for bench entry files (exits 1, logs stack).
 *
 * @since 0.3.16-canary.0
 */
export function exitBenchmarkChildProcessOnFailure(libraryName: string, error: unknown): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`[${libraryName}] bench subprocess failed: ${errorMessage}`);
  if (error instanceof Error && error.stack !== undefined) {
    console.error(error.stack);
  }
  process.exit(1);
}

/**
 * Resolves the benchmark package root one directory above a file URL (typical `*-benches.ts` layout).
 *
 * @since 0.3.16-canary.0
 */
export function resolveBenchmarkPackageRootFromImportMetaUrl(importMetaUrl: string): string {
  return join(dirname(fileURLToPath(importMetaUrl)), "..");
}
