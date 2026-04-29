/** @packageDocumentation Benchmark harness primitives shared across `benchmarks/*` packages. */

export type { Fingerprint, ScenarioTrialResult, SubprocessPayload, TrialPayload } from "#/protocol";

export {
  BENCH_RESULT_JSON_END,
  BENCH_RESULT_JSON_START,
  emitSubprocessPayload,
  extractSubprocessPayload,
} from "#/protocol";

export { collectFingerprint } from "#/fingerprint";

export type {
  AggregatedScenarioResult,
  JsonlBenchObservationRow,
  LibraryReport,
  TwoWayMarkdownColumnTitles,
  TwoWayMarkdownReportOptions,
  TwoWayScenarioComparisonRow,
  TwoWayConsoleColumnLabels,
  TwoWayConsoleReportOptions,
} from "#/report";

export {
  buildLibraryReport,
  buildTwoWayComparisonRows,
  renderTwoWayConsoleReport,
  renderTwoWayMarkdownReport,
  writeJsonlRun,
  writeTwoWayMarkdownReport,
} from "#/report";

export type { RunBenchSubprocessParameters } from "#/subprocess/run-bench-subprocess";

export {
  SubprocessExecutionError,
  buildSubprocessEnvironment,
  runBenchSubprocess,
} from "#/subprocess/run-bench-subprocess";

export {
  jsonlBenchObservationRowToFingerprint,
  jsonlBenchObservationRowToScenarioTrialResult,
} from "#/jsonl-observations";

export { quantile, sortAscending } from "#/stats/quantiles";

export {
  formatIqrThroughputFraction,
  formatLatencyMeanMilliseconds,
  formatThroughputOpsPerSecond,
  formatThroughputRatio,
} from "#/presentation/format";
