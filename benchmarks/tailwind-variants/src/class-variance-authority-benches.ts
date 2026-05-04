/** class-variance-authority bench subprocess (see `src/harness/run.ts`). */
import {
  BENCHMARK_SUITE_DEFAULT_BENCH_OPTIONS,
  exitBenchmarkChildProcessOnFailure,
  resolveBenchmarkPackageRootFromImportMetaUrl,
  runBenchmarkChildMain,
} from "@codefast/benchmark-harness";
import { CVA } from "#/harness/config";
import { collectAllClassVarianceAuthorityScenarios } from "#/scenarios/collect-class-variance-authority-scenarios";

void runBenchmarkChildMain({
  libraryName: CVA.libraryName,
  scenarioName: CVA.scenarioName,
  packageRoot: resolveBenchmarkPackageRootFromImportMetaUrl(import.meta.url),
  collectScenarios: collectAllClassVarianceAuthorityScenarios,
  benchDefaults: BENCHMARK_SUITE_DEFAULT_BENCH_OPTIONS,
}).catch((error: unknown) => exitBenchmarkChildProcessOnFailure(CVA.libraryName, error));
