/** @packageDocumentation Benchmark harness primitives shared across `benchmarks/*` packages. */

export type { BenchSubprocessConfig } from "#/shared/config";
export { resolveDisplayName } from "#/shared/config";

export type { AssertBenchEnvKeysOptions, BenchEnvSpec, BenchMode, IntegerEnvBounds } from "#/shared/env-keys";
export {
  BENCH_ENV_SPECS,
  BENCH_ISOLATE_ENV_KEY,
  BENCH_LIST_ENV_KEY,
  BENCH_MODE_ENV_KEY,
  BENCH_ONLY_ENV_KEY,
  BENCH_PORT_ENV_KEY,
  BENCH_RESULTS_DIR_NAME,
  BENCH_TRIALS_ENV_KEY,
  BENCH_VERBOSE_ENV_KEY,
  INTERNAL_BENCH_ENV_KEYS,
  MINIMUM_TRIAL_COUNT,
  OBSERVATIONS_FILE_NAME,
  USER_BENCH_ENV_KEYS,
  assertBenchEnvKeys,
  isEnvFlagEnabled,
  parseEnvInteger,
  parseScenarioFilter,
  resolveBenchModeFromEnvironment,
  resolveScenarioFilterFromEnvironment,
} from "#/shared/env-keys";

export { assertSubjectMeasuredSomething } from "#/parent/assert-subject-measured";

export type { Fingerprint, ScenarioTrialResult, SubprocessPayload, TrialPayload } from "#/shared/protocol";
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

export type { InterleavedLibraryRun, RunBenchSubprocessParameters } from "#/parent/run-bench-subprocess";
export {
  SubprocessExecutionError,
  buildSubprocessEnvironment,
  discoverBenchScenarioIds,
  isIsolatedBenchRunRequested,
  runBenchSubprocess,
  runBenchSubprocessesInterleaved,
} from "#/parent/run-bench-subprocess";

export type { BenchRunOutputPaths, WriteBenchRunArtifactsParameters } from "#/parent/bench-run-artifacts";
export { buildBenchRunOutputPaths, writeBenchRunArtifacts } from "#/parent/bench-run-artifacts";

export type { BenchScenarioInventory, BenchScenarioInventoryEntry } from "#/parent/run-bench-listing-main";
export { buildBenchScenarioInventory, runBenchScenarioListingMain } from "#/parent/run-bench-listing-main";

export type { AggregatedScenarioResult, LibraryReport } from "#/report/aggregate";
export { buildLibraryReport } from "#/report/aggregate";

export { formatRatioMultiple, formatThroughputOpsPerSecond, formatThroughputRatio } from "#/report/format";

export type { JsonlBenchObservationRow } from "#/report/jsonl";
export {
  isJsonlBenchObservationRow,
  jsonlBenchObservationRowToFingerprint,
  jsonlBenchObservationRowToScenarioTrialResult,
} from "#/report/jsonl";

export { quantile, sortAscending } from "#/report/quantiles";

export type { ThroughputQuality } from "#/report/reliability";
export {
  NOISY_IQR_FRACTION,
  NOISY_IQR_MARKER,
  THROUGHPUT_NOISE_CEILING_HZ_PER_OP,
  UNRELIABLE_RATIO_MARKER,
  formatNoisyIqrCaveatLine,
  formatReliabilityCaveatLine,
  isIqrNoisy,
  isRatioNoisy,
  isRatioUnreliable,
  isThroughputAboveNoiseCeiling,
  isThroughputCellNoisy,
  markRatioQuality,
  markThroughputQuality,
} from "#/report/reliability";

export type {
  ComparisonCompetitorCell,
  ComparisonCompetitorSummary,
  ComparisonConsoleReportOptions,
  ComparisonEntry,
  ComparisonGroupGeomean,
  ComparisonHeadToHead,
  ComparisonLibrary,
  ComparisonMarkdownReportOptions,
  ComparisonScenarioRow,
} from "#/report/comparison";
export {
  buildComparisonRows,
  renderComparisonConsoleReport,
  renderComparisonMarkdownReport,
  summarizeAgainstCompetitor,
  summarizeComparison,
} from "#/report/comparison";

export type {
  ComparisonDocument,
  ComparisonDocumentCell,
  ComparisonDocumentEnvironment,
  ComparisonDocumentLibrary,
  ComparisonDocumentRun,
  ComparisonDocumentRunInput,
  ComparisonDocumentScenario,
} from "#/report/comparison-document";
export { COMPARISON_DOCUMENT_SCHEMA_VERSION, buildComparisonDocument } from "#/report/comparison-document";

export { writeJsonFile, writeJsonlRun, writeMarkdownFile } from "#/report/write";
