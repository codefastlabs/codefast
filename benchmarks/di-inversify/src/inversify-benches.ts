/**
 * InversifyJS 8 bench subprocess entry point.
 *
 * Mirror of `codefast-benches.ts`. Must run under `tsconfig.inversify.json`
 * — legacy experimental decorators + `reflect-metadata`.
 */
import "reflect-metadata";
import {
  BENCHMARK_SUITE_DEFAULT_BENCH_OPTIONS,
  exitBenchmarkChildProcessOnFailure,
  resolveBenchmarkPackageRootFromImportMetaUrl,
  runBenchmarkChildMain,
} from "@codefast/benchmark-harness";
import { INVERSIFY } from "#/harness/config";
import { collectAllInversifyScenarios } from "#/scenarios/collect-inversify-scenarios";

void runBenchmarkChildMain({
  libraryName: INVERSIFY.libraryName,
  scenarioName: INVERSIFY.scenarioName,
  packageRoot: resolveBenchmarkPackageRootFromImportMetaUrl(import.meta.url),
  collectScenarios: collectAllInversifyScenarios,
  benchDefaults: BENCHMARK_SUITE_DEFAULT_BENCH_OPTIONS,
}).catch((error: unknown) => exitBenchmarkChildProcessOnFailure(INVERSIFY.libraryName, error));
