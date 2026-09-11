/**
 * Brandi bench subprocess entry point.
 *
 * Mirror of `awilix-benches.ts`. Brandi is decorator-free, so this runs under
 * `tsconfig.brandi.json` (no experimental decorators, no metadata emit).
 */
import { BENCHMARK_SUITE_DEFAULT_BENCH_OPTIONS } from "@internal/benchmark-harness/child/bench-options";
import {
  exitBenchmarkChildProcessOnFailure,
  resolveBenchmarkPackageRootFromImportMetaUrl,
  runBenchmarkChildMain,
} from "@internal/benchmark-harness/child/run-benchmark-child-main";

import { BRANDI } from "#/harness/config";
import { collectAllBrandiScenarios } from "#/scenarios/collect-brandi-scenarios";

void runBenchmarkChildMain({
  libraryName: BRANDI.libraryName,
  scenarioName: BRANDI.scenarioName,
  packageRoot: resolveBenchmarkPackageRootFromImportMetaUrl(import.meta.url),
  collectScenarios: collectAllBrandiScenarios,
  benchDefaults: BENCHMARK_SUITE_DEFAULT_BENCH_OPTIONS,
}).catch((error: unknown) => exitBenchmarkChildProcessOnFailure(BRANDI.libraryName, error));
