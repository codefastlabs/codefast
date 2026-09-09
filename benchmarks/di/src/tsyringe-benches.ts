/**
 * tsyringe bench subprocess entry point.
 *
 * Mirror of `inversify-benches.ts`. Must run under `tsconfig.tsyringe.json`
 * — legacy experimental decorators + `reflect-metadata`.
 */
import "reflect-metadata";
import { BENCHMARK_SUITE_DEFAULT_BENCH_OPTIONS } from "@codefast/benchmark-harness/child/bench-options";
import {
  exitBenchmarkChildProcessOnFailure,
  resolveBenchmarkPackageRootFromImportMetaUrl,
  runBenchmarkChildMain,
} from "@codefast/benchmark-harness/child/run-benchmark-child-main";

import { TSYRINGE } from "#/harness/config";
import { collectAllTsyringeScenarios } from "#/scenarios/collect-tsyringe-scenarios";

void runBenchmarkChildMain({
  libraryName: TSYRINGE.libraryName,
  scenarioName: TSYRINGE.scenarioName,
  packageRoot: resolveBenchmarkPackageRootFromImportMetaUrl(import.meta.url),
  collectScenarios: collectAllTsyringeScenarios,
  benchDefaults: BENCHMARK_SUITE_DEFAULT_BENCH_OPTIONS,
}).catch((error: unknown) => exitBenchmarkChildProcessOnFailure(TSYRINGE.libraryName, error));
