export type { AggregatedScenarioResult, LibraryReport } from "#/report/aggregate";
export { buildLibraryReport } from "#/report/aggregate";

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
