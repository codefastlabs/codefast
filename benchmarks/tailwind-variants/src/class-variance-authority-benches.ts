/** class-variance-authority bench subprocess (see `src/harness/run.ts`). */
import {
  exitBenchmarkChildProcessOnFailure,
  resolveBenchmarkPackageRootFromImportMetaUrl,
  runBenchmarkChildMain,
} from "@codefast/benchmark-harness";
import { BENCHMARK_SUITE_DEFAULT_BENCH_OPTIONS } from "@codefast/benchmark-harness";
import { collectAllClassVarianceAuthorityScenarios } from "#/scenarios/collect-class-variance-authority-scenarios";

const LIBRARY_NAME = "class-variance-authority";
const SCENARIO_LOG_NAME = "cva";

void runBenchmarkChildMain({
  libraryName: LIBRARY_NAME,
  scenarioName: SCENARIO_LOG_NAME,
  packageRoot: resolveBenchmarkPackageRootFromImportMetaUrl(import.meta.url),
  collectScenarios: collectAllClassVarianceAuthorityScenarios,
  benchDefaults: BENCHMARK_SUITE_DEFAULT_BENCH_OPTIONS,
}).catch((error: unknown) => exitBenchmarkChildProcessOnFailure(LIBRARY_NAME, error));
