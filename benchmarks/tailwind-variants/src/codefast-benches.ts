/** @codefast/tailwind-variants bench subprocess (see `src/harness/run.ts`). */
import {
  exitBenchmarkChildProcessOnFailure,
  resolveBenchmarkPackageRootFromImportMetaUrl,
  runBenchmarkChildMain,
} from "@codefast/benchmark-harness";
import { BENCHMARK_SUITE_DEFAULT_BENCH_OPTIONS } from "@codefast/benchmark-harness";
import { collectAllCodefastScenarios } from "#/scenarios/collect-codefast-scenarios";

const LIBRARY_NAME = "@codefast/tailwind-variants";
const SCENARIO_LOG_NAME = "codefast";

void runBenchmarkChildMain({
  libraryName: LIBRARY_NAME,
  scenarioName: SCENARIO_LOG_NAME,
  packageRoot: resolveBenchmarkPackageRootFromImportMetaUrl(import.meta.url),
  collectScenarios: collectAllCodefastScenarios,
  benchDefaults: BENCHMARK_SUITE_DEFAULT_BENCH_OPTIONS,
}).catch((error: unknown) => exitBenchmarkChildProcessOnFailure(LIBRARY_NAME, error));
