/** @packageDocumentation Benchmark harness primitives shared across `benchmarks/*` packages. */

export { BENCHMARK_SUITE_DEFAULT_BENCH_OPTIONS } from "#/child/bench-options";

export type { AsyncBenchScenario, AnyBenchScenario, BenchScenario } from "#/child/bench-scenario";
export { isAsyncScenario } from "#/child/bench-scenario";

export type { CreateRunAllTrialsParameters, RunAllTrials } from "#/child/create-run-all-trials";
export { createRunAllTrials } from "#/child/create-run-all-trials";

export { runSanityChecks } from "#/child/run-sanity-checks";

export type { RunBenchmarkChildMainParameters } from "#/child/run-benchmark-child-main";
export {
  exitBenchmarkChildProcessOnFailure,
  resolveBenchmarkPackageRootFromImportMetaUrl,
  runBenchmarkChildMain,
} from "#/child/run-benchmark-child-main";

export { resolveBenchParentExitCode } from "#/parent/resolve-bench-parent-exit-code";

export type { Fingerprint, ScenarioTrialResult, SubprocessPayload, TrialPayload } from "#/protocol";

export {
  BENCH_RESULT_JSON_END,
  BENCH_RESULT_JSON_START,
  emitSubprocessPayload,
  extractSubprocessPayload,
} from "#/protocol";

export { collectFingerprint } from "#/child/fingerprint";

export type {
  AggregatedScenarioResult,
  LibraryReport,
  TwoWayMarkdownColumnTitles,
  TwoWayMarkdownReportOptions,
  TwoWayScenarioComparisonRow,
  TwoWayConsoleColumnLabels,
  TwoWayConsoleReportOptions,
} from "#/report/index";

export {
  buildLibraryReport,
  buildTwoWayComparisonRows,
  renderTwoWayConsoleReport,
  renderTwoWayMarkdownReport,
  writeJsonlRun,
  writeMarkdownFile,
} from "#/report/index";

export type { RunBenchSubprocessParameters } from "#/parent/run-bench-subprocess";

export {
  SubprocessExecutionError,
  buildSubprocessEnvironment,
  runBenchSubprocess,
} from "#/parent/run-bench-subprocess";

export type { JsonlBenchObservationRow } from "#/report/jsonl";

export {
  jsonlBenchObservationRowToFingerprint,
  jsonlBenchObservationRowToScenarioTrialResult,
} from "#/report/jsonl";

export { quantile, sortAscending } from "#/stats/quantiles";

export {
  formatIqrThroughputFraction,
  formatLatencyMeanMilliseconds,
  formatThroughputOpsPerSecond,
  formatThroughputRatio,
} from "#/presentation/format";

export type {
  BenchLibraryConfig,
  BenchServerOptions,
  EmbeddedLibraryMeta,
  EmbeddedLibraryRunData,
  EmbeddedRun,
  EmbeddedRunLibraryVersion,
  EmbeddedScenarioSeries,
  EmbeddedViewerPayload,
} from "#/server/server-types";

export { createBenchServer } from "#/server/create-bench-server";
export { findAvailablePort } from "#/server/find-available-port";
export type { StartBenchServerOptions } from "#/server/start-bench-server";
export { startBenchServer } from "#/server/start-bench-server";
