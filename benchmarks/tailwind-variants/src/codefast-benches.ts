/** @codefast/tailwind-variants bench subprocess (see `src/harness/run.ts`). */
import {
  BENCHMARK_SUITE_DEFAULT_BENCH_OPTIONS,
  exitBenchmarkChildProcessOnFailure,
  resolveBenchmarkPackageRootFromImportMetaUrl,
  runBenchmarkChildMain,
} from "@codefast/benchmark-harness";
import { CODEFAST_TV } from "#/harness/config";
import { collectAllCodefastScenarios } from "#/scenarios/collect-codefast-scenarios";

void runBenchmarkChildMain({
  libraryName: CODEFAST_TV.libraryName,
  scenarioName: CODEFAST_TV.scenarioName,
  packageRoot: resolveBenchmarkPackageRootFromImportMetaUrl(import.meta.url),
  collectScenarios: collectAllCodefastScenarios,
  benchDefaults: BENCHMARK_SUITE_DEFAULT_BENCH_OPTIONS,
}).catch((error: unknown) => exitBenchmarkChildProcessOnFailure(CODEFAST_TV.libraryName, error));
