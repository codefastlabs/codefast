import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { BenchOptions } from "tinybench";
import type { AnyBenchScenario } from "#/bench-scenario";
import { collectFingerprint } from "#/fingerprint";
import { createRunAllTrials } from "#/create-run-all-trials";
import { emitSubprocessPayload } from "#/protocol";
import { runSanityChecks } from "#/run-sanity-checks";

export type RunBenchmarkChildMainParameters = Readonly<{
  /** Library id stored on the fingerprint (e.g. `@codefast/di`, `inversify`). */
  readonly libraryName: string;
  /** Subprocess tag in stderr lines (matches parent `scenarioName` / harness prefixes). */
  readonly scenarioName: string;
  /** Benchmark package root passed to `collectFingerprint` (directory with that package's `package.json`). */
  readonly packageRoot: string;
  readonly collectScenarios: () => readonly AnyBenchScenario[];
  /** Default tinybench `Bench` timing; overridden when `BENCH_FAST` or `BENCH_FULL` is set. */
  readonly benchDefaults: BenchOptions;
}>;

/**
 * Shared bench subprocess flow: sanity → trials → framed JSON payload on stdout.
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
 */
export function resolveBenchmarkPackageRootFromImportMetaUrl(importMetaUrl: string): string {
  return join(dirname(fileURLToPath(importMetaUrl)), "..");
}
