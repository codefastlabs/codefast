/**
 * InversifyJS 8 bench subprocess entry point.
 *
 * Mirror of `codefast-benches.ts`. Must run under `tsconfig.inversify.json`
 * — legacy experimental decorators + `reflect-metadata`.
 */
import "reflect-metadata";
import {
  exitBenchmarkChildProcessOnFailure,
  resolveBenchmarkPackageRootFromImportMetaUrl,
  runBenchmarkChildMain,
} from "@codefast/benchmark-harness";
import { BENCHMARK_SUITE_DEFAULT_BENCH_OPTIONS } from "#/harness/tinybench-default-options";
import { collectAllInversifyScenarios } from "#/scenarios/collect-inversify-scenarios";

const INVERSIFY_LIBRARY_NAME = "inversify";
const INVERSIFY_SCENARIO_NAME = "inversify";

void runBenchmarkChildMain({
  libraryName: INVERSIFY_LIBRARY_NAME,
  scenarioName: INVERSIFY_SCENARIO_NAME,
  packageRoot: resolveBenchmarkPackageRootFromImportMetaUrl(import.meta.url),
  collectScenarios: collectAllInversifyScenarios,
  benchDefaults: BENCHMARK_SUITE_DEFAULT_BENCH_OPTIONS,
}).catch((error: unknown) => exitBenchmarkChildProcessOnFailure(INVERSIFY_LIBRARY_NAME, error));
