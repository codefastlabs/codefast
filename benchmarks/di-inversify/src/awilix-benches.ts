/**
 * Awilix bench subprocess entry point.
 *
 * Mirror of `codefast-benches.ts`. Awilix is decorator-free, so this runs
 * under `tsconfig.awilix.json` (no experimental decorators, no metadata emit).
 */
import { BENCHMARK_SUITE_DEFAULT_BENCH_OPTIONS } from "@codefast/benchmark-harness/child/bench-options";
import {
  exitBenchmarkChildProcessOnFailure,
  resolveBenchmarkPackageRootFromImportMetaUrl,
  runBenchmarkChildMain,
} from "@codefast/benchmark-harness/child/run-benchmark-child-main";

import { AWILIX } from "#/harness/config";
import { collectAllAwilixScenarios } from "#/scenarios/collect-awilix-scenarios";

void runBenchmarkChildMain({
  libraryName: AWILIX.libraryName,
  scenarioName: AWILIX.scenarioName,
  packageRoot: resolveBenchmarkPackageRootFromImportMetaUrl(import.meta.url),
  collectScenarios: collectAllAwilixScenarios,
  benchDefaults: BENCHMARK_SUITE_DEFAULT_BENCH_OPTIONS,
}).catch((error: unknown) => exitBenchmarkChildProcessOnFailure(AWILIX.libraryName, error));
