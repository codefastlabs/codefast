import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { BenchOptions } from "tinybench";
import type { AnyBenchScenario } from "#/bench-scenario";
import { collectFingerprint } from "#/fingerprint";
import { createRunAllTrials } from "#/create-run-all-trials";
import { emitSubprocessPayload } from "#/protocol";
import { runSanityChecks } from "#/run-sanity-checks";

export type RunBenchmarkChildMainParameters = Readonly<{
  readonly libraryNameForFingerprint: string;
  /** Used in stderr when the subprocess fails (may differ from fingerprint name). */
  readonly libraryDisplayNameForErrors: string;
  readonly scenarioLogLabel: string;
  /**
   * Directory passed to `collectFingerprint` — typically the benchmark package root
   * (parent of `package.json`), i.e. `join(dirname(fileURLToPath(import.meta.url)), "..")`.
   */
  readonly benchmarkPackageRootDirectory: string;
  readonly collectScenarios: () => readonly AnyBenchScenario[];
  readonly defaultBenchOptions: BenchOptions;
}>;

/**
 * Shared bench subprocess flow: sanity → trials → framed JSON payload on stdout.
 */
export async function runBenchmarkChildMain(
  parameters: RunBenchmarkChildMainParameters,
): Promise<void> {
  const {
    libraryNameForFingerprint,
    libraryDisplayNameForErrors: _libraryDisplayNameForErrors,
    scenarioLogLabel,
    benchmarkPackageRootDirectory,
    collectScenarios,
    defaultBenchOptions,
  } = parameters;

  console.error(`[bench] subprocess ${scenarioLogLabel} started`);
  const scenarios = collectScenarios();
  const sanityFailures = await runSanityChecks(scenarios);
  const { runAllTrials } = createRunAllTrials({ defaultBenchOptions });
  const trials = await runAllTrials(scenarios, sanityFailures);

  emitSubprocessPayload({
    fingerprint: collectFingerprint(libraryNameForFingerprint, benchmarkPackageRootDirectory),
    trials,
    sanityFailures,
  });
  console.error(`[bench] subprocess ${scenarioLogLabel} completed`);
}

/**
 * Standard `main().catch` handler for bench entry files (exits 1, logs stack).
 */
export function exitBenchmarkChildProcessOnFailure(
  libraryDisplayNameForErrors: string,
  error: unknown,
): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`[${libraryDisplayNameForErrors}] bench subprocess failed: ${errorMessage}`);
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
