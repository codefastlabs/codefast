/** `@codefast/tailwind-variants` bench subprocess (see `src/harness/run.ts`). */
import { BENCHMARK_SUITE_DEFAULT_BENCH_OPTIONS } from "@internal/benchmark-harness/child/bench-options";
import {
  exitBenchmarkChildProcessOnFailure,
  resolveBenchmarkPackageRootFromImportMetaUrl,
  runBenchmarkChildMain,
} from "@internal/benchmark-harness/child/run-benchmark-child-main";

import { CODEFAST_TV } from "#harness/config";
import { codefast } from "#lib/codefast";
import { buildCodefastUncachedScenarios } from "#scenarios/codefast/uncached";
import { collectTvScenarios } from "#scenarios/collect-tv-scenarios";

void runBenchmarkChildMain({
  libraryName: CODEFAST_TV.libraryName,
  scenarioName: CODEFAST_TV.scenarioName,
  packageRoot: resolveBenchmarkPackageRootFromImportMetaUrl(import.meta.url),
  collectScenarios: () => collectTvScenarios(codefast, buildCodefastUncachedScenarios()),
  benchDefaults: BENCHMARK_SUITE_DEFAULT_BENCH_OPTIONS,
}).catch((error: unknown) => exitBenchmarkChildProcessOnFailure(CODEFAST_TV.libraryName, error));
