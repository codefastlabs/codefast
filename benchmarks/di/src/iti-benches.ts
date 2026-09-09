/**
 * iti bench subprocess entry point.
 *
 * Mirror of `awilix-benches.ts`. iti is decorator-free, so this runs under
 * `tsconfig.iti.json` (no experimental decorators, no metadata emit).
 */
import { BENCHMARK_SUITE_DEFAULT_BENCH_OPTIONS } from "@codefast/benchmark-harness/child/bench-options";
import {
  exitBenchmarkChildProcessOnFailure,
  resolveBenchmarkPackageRootFromImportMetaUrl,
  runBenchmarkChildMain,
} from "@codefast/benchmark-harness/child/run-benchmark-child-main";

import { ITI } from "#/harness/config";
import { collectAllItiScenarios } from "#/scenarios/collect-iti-scenarios";

void runBenchmarkChildMain({
  libraryName: ITI.libraryName,
  scenarioName: ITI.scenarioName,
  packageRoot: resolveBenchmarkPackageRootFromImportMetaUrl(import.meta.url),
  collectScenarios: collectAllItiScenarios,
  benchDefaults: BENCHMARK_SUITE_DEFAULT_BENCH_OPTIONS,
}).catch((error: unknown) => exitBenchmarkChildProcessOnFailure(ITI.libraryName, error));
