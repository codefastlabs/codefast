/** tailwind-variants (npm) bench subprocess (see `src/harness/run.ts`). */
import { BENCHMARK_SUITE_DEFAULT_BENCH_OPTIONS } from "@codefast/benchmark-harness/child/bench-options";
import {
  exitBenchmarkChildProcessOnFailure,
  resolveBenchmarkPackageRootFromImportMetaUrl,
  runBenchmarkChildMain,
} from "@codefast/benchmark-harness/child/run-benchmark-child-main";
import { TAILWIND_VARIANTS } from "#/harness/config";
import { collectAllTailwindVariantsNpmScenarios } from "#/scenarios/collect-tailwind-variants-scenarios";

void runBenchmarkChildMain({
  libraryName: TAILWIND_VARIANTS.libraryName,
  scenarioName: TAILWIND_VARIANTS.scenarioName,
  packageRoot: resolveBenchmarkPackageRootFromImportMetaUrl(import.meta.url),
  collectScenarios: collectAllTailwindVariantsNpmScenarios,
  benchDefaults: BENCHMARK_SUITE_DEFAULT_BENCH_OPTIONS,
}).catch((error: unknown) =>
  exitBenchmarkChildProcessOnFailure(TAILWIND_VARIANTS.libraryName, error),
);
