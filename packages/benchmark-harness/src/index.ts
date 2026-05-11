/** @packageDocumentation Benchmark harness primitives shared across `benchmarks/*` packages. */

export type { BenchSubprocessConfig } from "#/shared/config";
export { resolveDisplayName } from "#/shared/config";

export {
  BENCH_FAST_ENV_KEY,
  BENCH_FULL_ENV_KEY,
  BENCH_PORT_ENV_KEY,
  BENCH_RESULTS_DIR_NAME,
  BENCH_VERBOSE_ENV_KEY,
  OBSERVATIONS_FILE_NAME,
} from "#/shared/env-keys";

export type {
  Fingerprint,
  ScenarioTrialResult,
  SubprocessPayload,
  TrialPayload,
} from "#/shared/protocol";
export {
  BENCH_RESULT_JSON_END,
  BENCH_RESULT_JSON_START,
  emitSubprocessPayload,
  extractSubprocessPayload,
} from "#/shared/protocol";

export { BENCHMARK_SUITE_DEFAULT_BENCH_OPTIONS } from "#/child/bench-options";

export type { AsyncBenchScenario, AnyBenchScenario, BenchScenario } from "#/child/bench-scenario";
export { isAsyncScenario } from "#/child/bench-scenario";

export type { CreateRunAllTrialsParameters, RunAllTrials } from "#/child/create-run-all-trials";
export { createRunAllTrials } from "#/child/create-run-all-trials";

export { collectFingerprint } from "#/child/fingerprint";

export type { RunBenchmarkChildMainParameters } from "#/child/run-benchmark-child-main";
export {
  exitBenchmarkChildProcessOnFailure,
  resolveBenchmarkPackageRootFromImportMetaUrl,
  runBenchmarkChildMain,
} from "#/child/run-benchmark-child-main";

export { runSanityChecks } from "#/child/run-sanity-checks";

export { resolveBenchParentExitCode } from "#/parent/resolve-bench-parent-exit-code";

export type { RunBenchSubprocessParameters } from "#/parent/run-bench-subprocess";
export {
  SubprocessExecutionError,
  buildSubprocessEnvironment,
  runBenchSubprocess,
} from "#/parent/run-bench-subprocess";

export type { AggregatedScenarioResult, LibraryReport } from "#/report/aggregate";
export { buildLibraryReport } from "#/report/aggregate";

export {
  formatIqrThroughputFraction,
  formatLatencyMeanMilliseconds,
  formatThroughputOpsPerSecond,
  formatThroughputRatio,
} from "#/report/format";

export type { JsonlBenchObservationRow } from "#/report/jsonl";
export {
  jsonlBenchObservationRowToFingerprint,
  jsonlBenchObservationRowToScenarioTrialResult,
} from "#/report/jsonl";

export { quantile, sortAscending } from "#/report/quantiles";

export type {
  TwoWayConsoleColumnLabels,
  TwoWayConsoleReportOptions,
  TwoWayMarkdownColumnTitles,
  TwoWayMarkdownReportOptions,
  TwoWayScenarioComparisonRow,
} from "#/report/two-way";
export {
  buildTwoWayComparisonRows,
  renderTwoWayConsoleReport,
  renderTwoWayMarkdownReport,
} from "#/report/two-way";

export { writeJsonlRun, writeMarkdownFile } from "#/report/write";
