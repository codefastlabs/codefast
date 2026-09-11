/**
 * injection-js bench subprocess entry point.
 *
 * Mirror of `tsyringe-benches.ts`. Must run under `tsconfig.injection-js.json`
 * — legacy experimental decorators + `reflect-metadata`.
 */
import "reflect-metadata";
import { BENCHMARK_SUITE_DEFAULT_BENCH_OPTIONS } from "@internal/benchmark-harness/child/bench-options";
import {
  exitBenchmarkChildProcessOnFailure,
  resolveBenchmarkPackageRootFromImportMetaUrl,
  runBenchmarkChildMain,
} from "@internal/benchmark-harness/child/run-benchmark-child-main";

import { INJECTION_JS } from "#/harness/config";
import { collectAllInjectionJsScenarios } from "#/scenarios/collect-injection-js-scenarios";

void runBenchmarkChildMain({
  libraryName: INJECTION_JS.libraryName,
  scenarioName: INJECTION_JS.scenarioName,
  packageRoot: resolveBenchmarkPackageRootFromImportMetaUrl(import.meta.url),
  collectScenarios: collectAllInjectionJsScenarios,
  benchDefaults: BENCHMARK_SUITE_DEFAULT_BENCH_OPTIONS,
}).catch((error: unknown) => exitBenchmarkChildProcessOnFailure(INJECTION_JS.libraryName, error));
