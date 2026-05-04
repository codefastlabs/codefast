/**
 * @codefast/di bench subprocess entry point.
 *
 * Responsibilities:
 * - Gather scenarios from every `scenarios/codefast/*.ts` module.
 * - Run pre-bench sanity checks; skip scenarios that fail.
 * - Execute N trials and aggregate per-trial stats.
 * - Emit the resulting `SubprocessPayload` with framing markers so the
 *   parent harness can parse it unambiguously.
 *
 * Must run under `tsconfig.codefast.json` — Stage 3 decorators + emit
 * `Symbol.metadata`. The parent spawns it with `NODE_OPTIONS=--expose-gc
 * --no-warnings NODE_ENV=production`.
 */
import {
  BENCHMARK_SUITE_DEFAULT_BENCH_OPTIONS,
  exitBenchmarkChildProcessOnFailure,
  resolveBenchmarkPackageRootFromImportMetaUrl,
  runBenchmarkChildMain,
} from "@codefast/benchmark-harness";
import { CODEFAST_DI } from "#/harness/config";
import { collectAllCodefastScenarios } from "#/scenarios/collect-codefast-scenarios";

void runBenchmarkChildMain({
  libraryName: CODEFAST_DI.libraryName,
  scenarioName: CODEFAST_DI.scenarioName,
  packageRoot: resolveBenchmarkPackageRootFromImportMetaUrl(import.meta.url),
  collectScenarios: collectAllCodefastScenarios,
  benchDefaults: BENCHMARK_SUITE_DEFAULT_BENCH_OPTIONS,
}).catch((error: unknown) => exitBenchmarkChildProcessOnFailure(CODEFAST_DI.libraryName, error));
