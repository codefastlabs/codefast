/** tailwind-variants (npm) bench subprocess (see `src/harness/run.ts`). */
import {
  BENCHMARK_SUITE_DEFAULT_BENCH_OPTIONS,
  exitBenchmarkChildProcessOnFailure,
  resolveBenchmarkPackageRootFromImportMetaUrl,
  runBenchmarkChildMain,
} from "@codefast/benchmark-harness";
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
