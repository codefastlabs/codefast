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
  exitBenchmarkChildProcessOnFailure,
  resolveBenchmarkPackageRootFromImportMetaUrl,
  runBenchmarkChildMain,
} from "@codefast/benchmark-harness";
import { BENCHMARK_SUITE_DEFAULT_BENCH_OPTIONS } from "#/harness/tinybench-default-options";
import { collectAllCodefastScenarios } from "#/scenarios/collect-codefast-scenarios";

const CODEFAST_LIBRARY_NAME = "@codefast/di";
const CODEFAST_SCENARIO_NAME = "codefast";

void runBenchmarkChildMain({
  libraryNameForFingerprint: CODEFAST_LIBRARY_NAME,
  libraryDisplayNameForErrors: CODEFAST_LIBRARY_NAME,
  scenarioLogLabel: CODEFAST_SCENARIO_NAME,
  benchmarkPackageRootDirectory: resolveBenchmarkPackageRootFromImportMetaUrl(import.meta.url),
  collectScenarios: collectAllCodefastScenarios,
  defaultBenchOptions: BENCHMARK_SUITE_DEFAULT_BENCH_OPTIONS,
}).catch((error: unknown) => exitBenchmarkChildProcessOnFailure(CODEFAST_LIBRARY_NAME, error));
