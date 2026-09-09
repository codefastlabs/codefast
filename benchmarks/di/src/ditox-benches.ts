/**
 * Ditox bench subprocess entry point.
 *
 * Mirror of `awilix-benches.ts`. Ditox is decorator-free, so this runs under
 * `tsconfig.ditox.json` (no experimental decorators, no metadata emit).
 */
import { BENCHMARK_SUITE_DEFAULT_BENCH_OPTIONS } from "@codefast/benchmark-harness/child/bench-options";
import {
  exitBenchmarkChildProcessOnFailure,
  resolveBenchmarkPackageRootFromImportMetaUrl,
  runBenchmarkChildMain,
} from "@codefast/benchmark-harness/child/run-benchmark-child-main";

import { DITOX } from "#/harness/config";
import { collectAllDitoxScenarios } from "#/scenarios/collect-ditox-scenarios";

void runBenchmarkChildMain({
  libraryName: DITOX.libraryName,
  scenarioName: DITOX.scenarioName,
  packageRoot: resolveBenchmarkPackageRootFromImportMetaUrl(import.meta.url),
  collectScenarios: collectAllDitoxScenarios,
  benchDefaults: BENCHMARK_SUITE_DEFAULT_BENCH_OPTIONS,
}).catch((error: unknown) => exitBenchmarkChildProcessOnFailure(DITOX.libraryName, error));
