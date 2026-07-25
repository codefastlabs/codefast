import type { LibraryReport } from "#/report/aggregate";
import { formatLatencyMeanMilliseconds, formatThroughputOpsPerSecond, formatThroughputRatio } from "#/report/format";
import type { TwoWayHeadToHeadSummary } from "#/report/two-way";
import { buildTwoWayComparisonRows, summarizeTwoWayComparison } from "#/report/two-way";

/**
 * One library column in an N-way comparison: its aggregated report plus the
 * short label used in table headers.
 */
export interface NWayLibrary {
  readonly report: LibraryReport;
  readonly displayName: string;
}

/**
 * One competitor's number for a single scenario. `hzPerOp` is 0 when the
 * competitor never measured that scenario; `ratio` is pivot/competitor
 * throughput, 0 when either side is missing (renders as an em-dash).
 */
export interface NWayCompetitorCell {
  readonly hzPerOp: number;
  readonly ratio: number;
}

/**
 * One aligned row: the pivot's scenario plus each competitor's cell in the
 * same column order as the competitor array.
 */
export interface NWayScenarioRow {
  readonly id: string;
  readonly group: string;
  readonly batch: number;
  readonly what: string;
  readonly pivotHzPerOp: number;
  readonly pivotMeanMs: number;
  readonly competitors: ReadonlyArray<NWayCompetitorCell>;
}

/**
 * Copy for the single N-way table. Column headers derive from each library's
 * display name, so this stays free of library-specific vocabulary.
 */
export interface NWayReportOptions {
  readonly documentHeading: string;
  readonly sectionHeading: string;
  /** Bullets printed under the section heading before the table. */
  readonly introLines?: ReadonlyArray<string>;
}

/**
 * Aligns every competitor to the pivot by scenario `id`. A scenario appears
 * only when the pivot measured it; competitors that lack it get a zeroed cell.
 */
export function buildNWayComparisonRows(
  pivot: NWayLibrary,
  competitors: ReadonlyArray<NWayLibrary>,
): Array<NWayScenarioRow> {
  const competitorScenarioMaps = competitors.map(
    (competitor) => new Map(competitor.report.scenarios.map((scenario) => [scenario.id, scenario])),
  );

  const rows: Array<NWayScenarioRow> = [];
  for (const pivotScenario of pivot.report.scenarios) {
    const competitorCells: Array<NWayCompetitorCell> = competitorScenarioMaps.map((scenarioMap) => {
      const competitorScenario = scenarioMap.get(pivotScenario.id);
      const hzPerOp = competitorScenario?.hzPerOpMedian ?? 0;
      const comparable = hzPerOp > 0 && pivotScenario.hzPerOpMedian > 0;
      return { hzPerOp, ratio: comparable ? pivotScenario.hzPerOpMedian / hzPerOp : 0 };
    });
    rows.push({
      id: pivotScenario.id,
      group: pivotScenario.group,
      batch: pivotScenario.batch,
      what: pivotScenario.what,
      pivotHzPerOp: pivotScenario.hzPerOpMedian,
      pivotMeanMs: pivotScenario.meanMsMedian,
      competitors: competitorCells,
    });
  }
  return rows;
}

/**
 * One competitor's head-to-head classification against the pivot.
 */
export interface NWayCompetitorSummary {
  readonly displayName: string;
  readonly summary: TwoWayHeadToHeadSummary;
}

/**
 * Reuses the two-way ±3% band + geomean logic once per competitor, so each
 * summary reports geomean, median ratio, and win/parity/loss over the
 * scenarios both the pivot and that competitor measured.
 */
export function summarizeNWayComparison(
  pivot: NWayLibrary,
  competitors: ReadonlyArray<NWayLibrary>,
): Array<NWayCompetitorSummary> {
  return competitors.map((competitor) => ({
    displayName: competitor.displayName,
    summary: summarizeTwoWayComparison(buildTwoWayComparisonRows(pivot.report, competitor.report)),
  }));
}

function buildMarkdownHeaderLines(
  pivot: NWayLibrary,
  competitors: ReadonlyArray<NWayLibrary>,
): readonly [string, string] {
  const headerCells = [
    "Scenario",
    "Group",
    "batch",
    `${pivot.displayName} hz/op`,
    ...competitors.map((competitor) => `${competitor.displayName} hz/op`),
    ...competitors.map((competitor) => `${pivot.displayName} / ${competitor.displayName}`),
    `${pivot.displayName} mean ms`,
  ];
  const headerLine = `| ${headerCells.join(" | ")} |`;
  const separatorCells = headerCells.map((_cell, cellIndex) => (cellIndex < 2 ? "---" : "---:"));
  return [headerLine, `| ${separatorCells.join(" | ")} |`];
}

function renderMarkdownDataRow(row: NWayScenarioRow): string {
  const cells = [
    row.id,
    row.group,
    String(row.batch),
    formatThroughputOpsPerSecond(row.pivotHzPerOp),
    ...row.competitors.map((competitor) => formatThroughputOpsPerSecond(competitor.hzPerOp)),
    ...row.competitors.map((competitor) => formatThroughputRatio(row.pivotHzPerOp, competitor.hzPerOp)),
    formatLatencyMeanMilliseconds(row.pivotMeanMs),
  ];
  return `| ${cells.join(" | ")} |`;
}

function formatRatioTimes(ratio: number): string {
  return `${ratio >= 10 ? ratio.toFixed(1) : ratio.toFixed(2)}×`;
}

function buildSummaryMarkdownLines(pivot: NWayLibrary, competitors: ReadonlyArray<NWayLibrary>): Array<string> {
  const lines: Array<string> = [];
  for (const { displayName, summary } of summarizeNWayComparison(pivot, competitors)) {
    lines.push(
      `- **${pivot.displayName} vs ${displayName}**: ${String(summary.wins.length)} win / ${String(summary.parities.length)} parity / ${String(summary.losses.length)} loss of ${String(summary.comparableCount)} comparable — median ${formatRatioTimes(summary.medianRatio)}, geomean ${formatRatioTimes(summary.geomeanRatio)}.`,
    );
  }
  return lines;
}

/**
 * Renders a single Markdown table aligning the pivot against every competitor.
 */
export function renderNWayMarkdownReport(
  pivot: NWayLibrary,
  competitors: ReadonlyArray<NWayLibrary>,
  options: NWayReportOptions,
): string {
  const rows = buildNWayComparisonRows(pivot, competitors);
  const [headerRow, separatorRow] = buildMarkdownHeaderLines(pivot, competitors);

  const sections: Array<string> = [
    options.documentHeading,
    "",
    `## ${options.sectionHeading}`,
    "",
    ...(options.introLines ?? []),
    ...(options.introLines === undefined || options.introLines.length === 0 ? [] : [""]),
    ...buildSummaryMarkdownLines(pivot, competitors),
    "",
    headerRow,
    separatorRow,
    ...rows.map(renderMarkdownDataRow),
  ];
  return sections.join("\n");
}

const CLI_TABLE_COLUMN_GAP = "  ";

/**
 * Prints a compact N-way table to stdout with aligned ASCII columns.
 */
export function renderNWayConsoleReport(
  pivot: NWayLibrary,
  competitors: ReadonlyArray<NWayLibrary>,
  options: NWayReportOptions,
): void {
  const rows = buildNWayComparisonRows(pivot, competitors);
  const scenarioColumnWidth = Math.max(28, ...rows.map((row) => row.id.length));
  const groupColumnWidth = Math.max(10, ...rows.map((row) => row.group.length));

  const headerLine = [
    "Scenario".padEnd(scenarioColumnWidth),
    "Group".padEnd(groupColumnWidth),
    `${pivot.displayName} hz/op`.padStart(18),
    ...competitors.map((competitor) => `${competitor.displayName} hz/op`.padStart(18)),
    ...competitors.map((competitor) => `${pivot.displayName}/${competitor.displayName}`.padStart(14)),
  ].join(CLI_TABLE_COLUMN_GAP);

  console.log(`\n${options.sectionHeading}`);
  console.log(headerLine);
  console.log("-".repeat(headerLine.length));
  for (const row of rows) {
    console.log(
      [
        row.id.padEnd(scenarioColumnWidth),
        row.group.padEnd(groupColumnWidth),
        formatThroughputOpsPerSecond(row.pivotHzPerOp).padStart(18),
        ...row.competitors.map((competitor) => formatThroughputOpsPerSecond(competitor.hzPerOp).padStart(18)),
        ...row.competitors.map((competitor) =>
          formatThroughputRatio(row.pivotHzPerOp, competitor.hzPerOp).padStart(14),
        ),
      ].join(CLI_TABLE_COLUMN_GAP),
    );
  }

  console.log("");
  for (const line of buildSummaryMarkdownLines(pivot, competitors)) {
    console.log(line.replace(/^- /, "").replaceAll("**", ""));
  }
  console.log("");
}
