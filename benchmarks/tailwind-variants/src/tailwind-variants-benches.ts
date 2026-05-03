/** tailwind-variants (npm) bench subprocess (see `src/harness/run.ts`). */
import {
  exitBenchmarkChildProcessOnFailure,
  resolveBenchmarkPackageRootFromImportMetaUrl,
  runBenchmarkChildMain,
} from "@codefast/benchmark-harness";
import { BENCHMARK_SUITE_DEFAULT_BENCH_OPTIONS } from "#/harness/tinybench-default-options";
import { collectAllTailwindVariantsNpmScenarios } from "#/scenarios/collect-tailwind-variants-scenarios";

const LIBRARY_NAME = "tailwind-variants";
const SCENARIO_LOG_NAME = "tailwind-variants";

void runBenchmarkChildMain({
  libraryNameForFingerprint: LIBRARY_NAME,
  libraryDisplayNameForErrors: LIBRARY_NAME,
  scenarioLogLabel: SCENARIO_LOG_NAME,
  benchmarkPackageRootDirectory: resolveBenchmarkPackageRootFromImportMetaUrl(import.meta.url),
  collectScenarios: collectAllTailwindVariantsNpmScenarios,
  defaultBenchOptions: BENCHMARK_SUITE_DEFAULT_BENCH_OPTIONS,
}).catch((error: unknown) => exitBenchmarkChildProcessOnFailure(LIBRARY_NAME, error));
