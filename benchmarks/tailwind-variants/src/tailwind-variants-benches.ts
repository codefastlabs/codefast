/** tailwind-variants (npm) bench subprocess (see `src/harness/run.ts`). */
import {
  BENCHMARK_SUITE_DEFAULT_BENCH_OPTIONS,
  exitBenchmarkChildProcessOnFailure,
  resolveBenchmarkPackageRootFromImportMetaUrl,
  runBenchmarkChildMain,
} from "@codefast/benchmark-harness";
import { collectAllTailwindVariantsNpmScenarios } from "#/scenarios/collect-tailwind-variants-scenarios";

const LIBRARY_NAME = "tailwind-variants";
const SCENARIO_LOG_NAME = "tailwind-variants";

void runBenchmarkChildMain({
  libraryName: LIBRARY_NAME,
  scenarioName: SCENARIO_LOG_NAME,
  packageRoot: resolveBenchmarkPackageRootFromImportMetaUrl(import.meta.url),
  collectScenarios: collectAllTailwindVariantsNpmScenarios,
  benchDefaults: BENCHMARK_SUITE_DEFAULT_BENCH_OPTIONS,
}).catch((error: unknown) => exitBenchmarkChildProcessOnFailure(LIBRARY_NAME, error));
