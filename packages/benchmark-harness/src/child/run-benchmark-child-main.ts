import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { BenchOptions } from "tinybench";
import type { AnyBenchScenario } from "#/child/bench-scenario";
import { collectFingerprint } from "#/child/fingerprint";
import { createRunAllTrials } from "#/child/create-run-all-trials";
import { emitSubprocessPayload } from "#/shared/protocol";
import { runSanityChecks } from "#/child/run-sanity-checks";

/**
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
  /** Default tinybench `Bench` timing; overridden when `BENCH_FAST` or `BENCH_FULL` is set. */
  readonly benchDefaults: BenchOptions;
}>;

/**
 * Shared bench subprocess flow: sanity → trials → framed JSON payload on stdout.
 *
 * @since 0.3.16-canary.0
 */
export async function runBenchmarkChildMain(
  parameters: RunBenchmarkChildMainParameters,
): Promise<void> {
  const { libraryName, scenarioName, packageRoot, collectScenarios, benchDefaults } = parameters;

  console.error(`[bench] subprocess ${scenarioName} started`);
  const scenarios = collectScenarios();
  const sanityFailures = await runSanityChecks(scenarios);
  const { runAllTrials } = createRunAllTrials({ benchDefaults });
  const trials = await runAllTrials(scenarios, sanityFailures);

  emitSubprocessPayload({
    fingerprint: collectFingerprint(libraryName, packageRoot),
    trials,
    sanityFailures,
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
