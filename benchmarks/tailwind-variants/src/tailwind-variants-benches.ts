/** tailwind-variants (npm) bench subprocess (see `src/harness/run.ts`). */
import { BENCHMARK_SUITE_DEFAULT_BENCH_OPTIONS } from "@internal/benchmark-harness/child/bench-options";
import {
  exitBenchmarkChildProcessOnFailure,
  resolveBenchmarkPackageRootFromImportMetaUrl,
  runBenchmarkChildMain,
} from "@internal/benchmark-harness/child/run-benchmark-child-main";

import { TAILWIND_VARIANTS } from "#harness/config";
import { tailwindVariants } from "#lib/tailwind-variants";
import { collectTvScenarios } from "#scenarios/collect-tv-scenarios";

void runBenchmarkChildMain({
  libraryName: TAILWIND_VARIANTS.libraryName,
  scenarioName: TAILWIND_VARIANTS.scenarioName,
  packageRoot: resolveBenchmarkPackageRootFromImportMetaUrl(import.meta.url),
  collectScenarios: () => collectTvScenarios(tailwindVariants),
  benchDefaults: BENCHMARK_SUITE_DEFAULT_BENCH_OPTIONS,
}).catch((error: unknown) => exitBenchmarkChildProcessOnFailure(TAILWIND_VARIANTS.libraryName, error));
