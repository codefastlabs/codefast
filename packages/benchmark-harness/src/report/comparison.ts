/** Renders one pivot library against any number of competitors; a head-to-head is the two-library case. */

import type { AggregatedScenarioResult, LibraryReport } from "#/report/aggregate";
import {
  formatIqrThroughputFraction,
  formatLatencyMeanMilliseconds,
  formatThroughputOpsPerSecond,
  formatThroughputRatio,
} from "#/report/format";
import {
  UNRELIABLE_RATIO_MARKER,
  formatReliabilityCaveatLine,
  isRatioUnreliable,
  markRatioReliability,
} from "#/report/reliability";

/** One library column: its aggregated report plus the labels used in table headers. */
export interface ComparisonLibrary {
  readonly report: LibraryReport;
  readonly displayName: string;
  /** Abbreviation for the width-constrained console table; falls back to `displayName`. */
  readonly shortName?: string;
}

/**
 * How many columns each library gets.
 *
 * @remarks
 * `full` adds per-library latency and IQR columns, which only fit while the library count is
 * small. `compact` keeps throughput and ratios so a wide comparison stays readable.
 */
export type ComparisonColumnProfile = "compact" | "full";

/** One competitor's numbers for a single scenario; zeroed when it never measured that scenario. */
export interface ComparisonCompetitorCell {
  readonly hzPerOp: number;
  /** Pivot over competitor throughput; 0 when either side is missing, rendering as an em-dash. */
  readonly ratio: number;
  readonly iqrFraction: number;
  readonly meanMs: number;
  readonly p99Ms: number;
}

/** One aligned row: the pivot's scenario plus one cell per competitor, in competitor order. */
export interface ComparisonScenarioRow {
  readonly id: string;
  readonly group: string;
  readonly batch: number;
  readonly what: string;
  readonly stress: boolean;
  readonly pivotHzPerOp: number;
  readonly pivotIqrFraction: number;
  readonly pivotMeanMs: number;
  readonly pivotP99Ms: number;
  readonly competitors: ReadonlyArray<ComparisonCompetitorCell>;
}

/** Copy and column choices for the Markdown report. */
export interface ComparisonMarkdownReportOptions {
  readonly documentHeading: string;
  readonly sectionHeading: string;
  readonly columnProfile: ComparisonColumnProfile;
  /** Bullets printed under the section heading, before the table. */
  readonly introLines?: ReadonlyArray<string>;
  /** Emits the fingerprint section; off when this report is appended to one that already has it. */
  readonly includeEnvironment?: boolean;
  /** Emits the skipped-scenario section; off when appended to a report that already has it. */
  readonly includeSanityFailures?: boolean;
}

/** Copy and column choices for the console report. */
export interface ComparisonConsoleReportOptions {
  readonly sectionHeading: string;
  readonly columnProfile: ComparisonColumnProfile;
  readonly footerHintLine?: string;
}

// A ratio within ±3% of 1.0 is statistical parity, not a win or a loss.
const HEAD_TO_HEAD_PARITY_BAND = 0.03;

/** One classified entry: scenario id plus its pivot/competitor throughput ratio. */
export interface ComparisonEntry {
  readonly id: string;
  readonly ratio: number;
  /** True when either side's throughput sits above the ceiling where a single row stops reproducing. */
  readonly unreliable: boolean;
}

/**
 * Geometric-mean ratio of one scenario group, so error-path outliers stay in their own
 * group instead of skewing the throughput headline.
 */
export interface ComparisonGroupGeomean {
  readonly group: string;
  readonly geomeanRatio: number;
  readonly count: number;
}

/** Win/parity/loss classification of every comparable scenario, from the pivot's viewpoint. */
export interface ComparisonHeadToHead {
  readonly comparableCount: number;
  readonly wins: ReadonlyArray<ComparisonEntry>;
  readonly parities: ReadonlyArray<ComparisonEntry>;
  readonly losses: ReadonlyArray<ComparisonEntry>;
  readonly medianRatio: number;
  /** Geometric mean of every comparable ratio — the standard aggregate for ratio data. */
  readonly geomeanRatio: number;
  /** Per-group geomean, ordered by first appearance, isolating error-path groups from throughput. */
  readonly groupGeomeans: ReadonlyArray<ComparisonGroupGeomean>;
  /** Comparable rows whose ratio does not reproduce between runs, so the aggregates are what survive. */
  readonly unreliableCount: number;
  readonly pivotOnlyIds: ReadonlyArray<string>;
  readonly competitorOnlyIds: ReadonlyArray<string>;
}

/** One competitor's head-to-head against the pivot, paired with its label. */
export interface ComparisonCompetitorSummary {
  readonly displayName: string;
  readonly headToHead: ComparisonHeadToHead;
}

/** Geometric mean of positive ratios; 0 for an empty set. */
function geometricMean(ratios: ReadonlyArray<number>): number {
  if (ratios.length === 0) {
    return 0;
  }
  const sumOfLogs = ratios.reduce((total, ratio) => total + Math.log(ratio), 0);
  return Math.exp(sumOfLogs / ratios.length);
}

function medianOfSorted(ascending: ReadonlyArray<number>): number {
  if (ascending.length === 0) {
    return 0;
  }
  const midpoint = Math.floor(ascending.length / 2);
  return ascending.length % 2 === 1 ? ascending[midpoint]! : (ascending[midpoint - 1]! + ascending[midpoint]!) / 2;
}

function zeroedCell(): ComparisonCompetitorCell {
  return { hzPerOp: 0, ratio: 0, iqrFraction: 0, meanMs: 0, p99Ms: 0 };
}

function toCell(pivotHzPerOp: number, competitor: AggregatedScenarioResult | undefined): ComparisonCompetitorCell {
  if (competitor === undefined) {
    return zeroedCell();
  }
  const comparable = competitor.hzPerOpMedian > 0 && pivotHzPerOp > 0;
  return {
    hzPerOp: competitor.hzPerOpMedian,
    ratio: comparable ? pivotHzPerOp / competitor.hzPerOpMedian : 0,
    iqrFraction: competitor.hzPerOpIqrFraction,
    meanMs: competitor.meanMsMedian,
    p99Ms: competitor.p99MsMedian,
  };
}

/**
 * Aligns every competitor to the pivot by scenario id, in the pivot's order.
 *
 * @remarks
 * A scenario appears only when the pivot measured it — a competitor-only scenario has nothing
 * to compare against, and is reported through `competitorOnlyIds` on the head-to-head instead.
 */
export function buildComparisonRows(
  pivot: ComparisonLibrary,
  competitors: ReadonlyArray<ComparisonLibrary>,
): Array<ComparisonScenarioRow> {
  const competitorScenariosById = competitors.map(
    (competitor) => new Map(competitor.report.scenarios.map((scenario) => [scenario.id, scenario])),
  );

  return pivot.report.scenarios.map((scenario) => ({
    id: scenario.id,
    group: scenario.group,
    batch: scenario.batch,
    what: scenario.what,
    stress: scenario.stress,
    pivotHzPerOp: scenario.hzPerOpMedian,
    pivotIqrFraction: scenario.hzPerOpIqrFraction,
    pivotMeanMs: scenario.meanMsMedian,
    pivotP99Ms: scenario.p99MsMedian,
    competitors: competitorScenariosById.map((scenariosById) =>
      toCell(scenario.hzPerOpMedian, scenariosById.get(scenario.id)),
    ),
  }));
}

/**
 * Classifies one competitor's column into wins / parities / losses for the pivot.
 *
 * @param competitorIndex - position in the competitor array the rows were built from
 */
export function summarizeAgainstCompetitor(
  rows: ReadonlyArray<ComparisonScenarioRow>,
  competitorIndex: number,
  competitorReport: LibraryReport,
): ComparisonHeadToHead {
  const wins: Array<ComparisonEntry> = [];
  const parities: Array<ComparisonEntry> = [];
  const losses: Array<ComparisonEntry> = [];
  const pivotOnlyIds: Array<string> = [];
  // Per-group ratios kept in first-appearance order for a stable breakdown.
  const ratiosByGroup = new Map<string, Array<number>>();
  const pivotScenarioIds = new Set(rows.map((row) => row.id));

  for (const row of rows) {
    const cell = row.competitors[competitorIndex];
    if (cell === undefined || cell.hzPerOp === 0 || row.pivotHzPerOp === 0) {
      if (row.pivotHzPerOp > 0) {
        pivotOnlyIds.push(row.id);
      }
      continue;
    }
    const entry: ComparisonEntry = {
      id: row.id,
      ratio: row.pivotHzPerOp / cell.hzPerOp,
      unreliable: isRatioUnreliable(row.pivotHzPerOp, cell.hzPerOp),
    };
    if (entry.ratio > 1 + HEAD_TO_HEAD_PARITY_BAND) {
      wins.push(entry);
    } else if (entry.ratio < 1 - HEAD_TO_HEAD_PARITY_BAND) {
      losses.push(entry);
    } else {
      parities.push(entry);
    }
    (ratiosByGroup.get(row.group) ?? ratiosByGroup.set(row.group, []).get(row.group)!).push(entry.ratio);
  }

  const classified = [...wins, ...parities, ...losses];
  const ratios = classified.map((entry) => entry.ratio).sort((left, right) => left - right);

  return {
    comparableCount: ratios.length,
    wins,
    parities,
    losses,
    medianRatio: medianOfSorted(ratios),
    geomeanRatio: geometricMean(ratios),
    groupGeomeans: [...ratiosByGroup].map(([group, groupRatios]) => ({
      group,
      geomeanRatio: geometricMean(groupRatios),
      count: groupRatios.length,
    })),
    unreliableCount: classified.filter((entry) => entry.unreliable).length,
    pivotOnlyIds,
    competitorOnlyIds: competitorReport.scenarios
      .filter((scenario) => !pivotScenarioIds.has(scenario.id))
      .map((scenario) => scenario.id),
  };
}

/** One head-to-head per competitor, in competitor order. */
export function summarizeComparison(
  pivot: ComparisonLibrary,
  competitors: ReadonlyArray<ComparisonLibrary>,
): Array<ComparisonCompetitorSummary> {
  const rows = buildComparisonRows(pivot, competitors);
  return competitors.map((competitor, competitorIndex) => ({
    displayName: competitor.displayName,
    headToHead: summarizeAgainstCompetitor(rows, competitorIndex, competitor.report),
  }));
}

function formatRatioTimes(ratio: number): string {
  return `${ratio >= 10 ? ratio.toFixed(1) : ratio.toFixed(2)}×`;
}

function formatEntryList(entries: ReadonlyArray<ComparisonEntry>): string {
  return entries
    .map(
      (entry) => `\`${entry.id}\` (${formatRatioTimes(entry.ratio)}${entry.unreliable ? UNRELIABLE_RATIO_MARKER : ""})`,
    )
    .join(", ");
}

/** Counts rendered ratio cells the report cannot vouch for, across every competitor column. */
function countUnreliableRatioCells(rows: ReadonlyArray<ComparisonScenarioRow>): number {
  return rows.reduce(
    (total, row) =>
      total + row.competitors.filter((competitor) => isRatioUnreliable(row.pivotHzPerOp, competitor.hzPerOp)).length,
    0,
  );
}

function consoleLabel(library: ComparisonLibrary): string {
  return library.shortName ?? library.displayName;
}

function buildHeadToHeadMarkdownLines(
  pivot: ComparisonLibrary,
  competitors: ReadonlyArray<ComparisonLibrary>,
): Array<string> {
  const lines: Array<string> = [];
  for (const { displayName, headToHead } of summarizeComparison(pivot, competitors)) {
    const {
      comparableCount,
      wins,
      parities,
      losses,
      medianRatio,
      geomeanRatio,
      groupGeomeans,
      unreliableCount,
      pivotOnlyIds,
      competitorOnlyIds,
    } = headToHead;
    const winPercent = comparableCount === 0 ? 0 : Math.round((wins.length / comparableCount) * 100);
    lines.push(
      `- **${pivot.displayName} vs ${displayName}**: ${String(wins.length)} win / ${String(parities.length)} parity / ${String(losses.length)} loss of ${String(comparableCount)} comparable (${String(winPercent)}%) — median ${formatRatioTimes(medianRatio)}, geomean ${formatRatioTimes(geomeanRatio)} (win >1.03×, parity 0.97–1.03×, loss <0.97×).`,
    );
    if (groupGeomeans.length > 0) {
      // Per-group geomean keeps error-path groups visibly separate from throughput, so a
      // single fail-fast row can't read as a typical speedup.
      lines.push(
        `  - Geomean by group: ${groupGeomeans.map((entry) => `${entry.group} ${formatRatioTimes(entry.geomeanRatio)} (${String(entry.count)})`).join(", ")}.`,
      );
    }
    if (losses.length > 0) {
      lines.push(`  - Losses: ${formatEntryList(losses)}`);
    }
    if (parities.length > 0) {
      lines.push(`  - Parity: ${formatEntryList(parities)}`);
    }
    const topWins = [...wins].sort((left, right) => right.ratio - left.ratio).slice(0, 3);
    if (topWins.length > 0) {
      lines.push(`  - Biggest wins: ${formatEntryList(topWins)}`);
    }
    if (unreliableCount > 0) {
      // A marked row landing in the loss column is the failure this warning exists for.
      lines.push(`  - ${formatReliabilityCaveatLine(unreliableCount)}`);
    }
    if (pivotOnlyIds.length > 0 || competitorOnlyIds.length > 0) {
      lines.push(
        `  - Not comparable: ${String(pivotOnlyIds.length)} scenario(s) measured only for ${pivot.displayName}, ${String(competitorOnlyIds.length)} only for ${displayName}.`,
      );
    }
  }
  return lines;
}

function buildMarkdownHeaderCells(
  pivot: ComparisonLibrary,
  competitors: ReadonlyArray<ComparisonLibrary>,
  columnProfile: ComparisonColumnProfile,
): Array<string> {
  const everyLibrary = [pivot, ...competitors];
  const ratioHeadings = competitors.map((competitor) => `${pivot.displayName} / ${competitor.displayName}`);
  if (columnProfile === "compact") {
    return [
      "Scenario",
      "Group",
      "batch",
      ...everyLibrary.map((library) => `${library.displayName} hz/op`),
      ...ratioHeadings,
      `${pivot.displayName} mean ms`,
    ];
  }
  return [
    "Scenario",
    "Group",
    "batch",
    ...everyLibrary.map((library) => `${library.displayName} hz/op`),
    ...ratioHeadings,
    ...everyLibrary.map((library) => `${library.displayName} mean ms`),
    ...everyLibrary.map((library) => `${library.displayName} p99 ms`),
    `IQR (${everyLibrary.map((library) => consoleLabel(library)).join(" / ")})`,
  ];
}

function buildMarkdownDataCells(row: ComparisonScenarioRow, columnProfile: ComparisonColumnProfile): Array<string> {
  const throughputs = [row.pivotHzPerOp, ...row.competitors.map((competitor) => competitor.hzPerOp)];
  const ratios = row.competitors.map((competitor) =>
    markRatioReliability(
      formatThroughputRatio(row.pivotHzPerOp, competitor.hzPerOp),
      row.pivotHzPerOp,
      competitor.hzPerOp,
    ),
  );
  const leading = [row.id, row.group, String(row.batch), ...throughputs.map(formatThroughputOpsPerSecond), ...ratios];
  if (columnProfile === "compact") {
    return [...leading, formatLatencyMeanMilliseconds(row.pivotMeanMs)];
  }
  return [
    ...leading,
    ...[row.pivotMeanMs, ...row.competitors.map((competitor) => competitor.meanMs)].map(formatLatencyMeanMilliseconds),
    ...[row.pivotP99Ms, ...row.competitors.map((competitor) => competitor.p99Ms)].map(formatLatencyMeanMilliseconds),
    [row.pivotIqrFraction, ...row.competitors.map((competitor) => competitor.iqrFraction)]
      .map(formatIqrThroughputFraction)
      .join(" / "),
  ];
}

function buildEnvironmentBullets(
  pivot: ComparisonLibrary,
  competitors: ReadonlyArray<ComparisonLibrary>,
): Array<string> {
  const everyLibrary = [pivot, ...competitors];
  const { fingerprint } = pivot.report;
  return [
    `- Node ${fingerprint.nodeVersion} / V8 ${fingerprint.v8Version}`,
    `- ${fingerprint.platform}/${fingerprint.arch} · ${fingerprint.cpuModel} × ${String(fingerprint.cpuCount)}`,
    `- NODE_OPTIONS: \`${fingerprint.nodeOptions || "(empty)"}\``,
    `- GC exposed: ${everyLibrary.map((library) => `${library.displayName}=${String(library.report.fingerprint.gcExposed)}`).join(", ")}`,
    `- Library versions: ${everyLibrary.map((library) => `${library.displayName} ${library.report.fingerprint.libraryVersion}`).join(", ")}`,
    `- Trials per library: ${everyLibrary.map((library) => `${library.displayName} ${String(library.report.trialCount)}`).join(", ")}`,
    `- Timestamp: ${everyLibrary.map((library) => `${library.displayName} ${library.report.fingerprint.timestampIso}`).join(", ")}`,
  ];
}

function buildSanityFailureLines(
  pivot: ComparisonLibrary,
  competitors: ReadonlyArray<ComparisonLibrary>,
): Array<string> {
  const everyLibrary = [pivot, ...competitors];
  const bullets = everyLibrary.flatMap((library) =>
    library.report.sanityFailures.map((id) => `- **${library.displayName}**: \`${id}\``),
  );
  if (bullets.length === 0) {
    return [];
  }
  return [
    "",
    "## Sanity failures",
    "",
    "These scenarios failed their pre-bench sanity check and were skipped:",
    "",
    ...bullets,
  ];
}

/** Renders the Markdown report for a pivot against any number of competitors. */
export function renderComparisonMarkdownReport(
  pivot: ComparisonLibrary,
  competitors: ReadonlyArray<ComparisonLibrary>,
  options: ComparisonMarkdownReportOptions,
): string {
  const rows = buildComparisonRows(pivot, competitors);
  const headerCells = buildMarkdownHeaderCells(pivot, competitors, options.columnProfile);
  const separatorCells = headerCells.map((_cell, cellIndex) => (cellIndex < 2 ? "---" : "---:"));
  const unreliableCount = countUnreliableRatioCells(rows);
  const introLines = options.introLines ?? [];

  const sections: Array<string> = [
    options.documentHeading,
    ...(options.includeEnvironment === true
      ? ["", "## Environment", "", ...buildEnvironmentBullets(pivot, competitors)]
      : []),
    ...(options.includeSanityFailures === true ? buildSanityFailureLines(pivot, competitors) : []),
    "",
    `## ${options.sectionHeading}`,
    "",
    ...introLines,
    ...(introLines.length === 0 ? [] : [""]),
    ...buildHeadToHeadMarkdownLines(pivot, competitors),
    "",
    `| ${headerCells.join(" | ")} |`,
    `| ${separatorCells.join(" | ")} |`,
    ...rows.map((row) => `| ${buildMarkdownDataCells(row, options.columnProfile).join(" | ")} |`),
    // The caveat sits directly under the table so it travels with the marked ratios.
    ...(unreliableCount === 0 ? [] : ["", formatReliabilityCaveatLine(unreliableCount)]),
  ];

  return sections.join("\n");
}

const CLI_TABLE_COLUMN_GAP = "  ";
const CONSOLE_THROUGHPUT_COLUMN_WIDTH = 18;
const CONSOLE_LATENCY_COLUMN_WIDTH = 12;
const CONSOLE_RATIO_COLUMN_WIDTH = 14;

/** Prints the comparison to stdout with aligned ASCII columns. */
export function renderComparisonConsoleReport(
  pivot: ComparisonLibrary,
  competitors: ReadonlyArray<ComparisonLibrary>,
  options: ComparisonConsoleReportOptions,
): void {
  const rows = buildComparisonRows(pivot, competitors);
  const everyLibrary = [pivot, ...competitors];
  const scenarioColumnWidth = Math.max(28, ...rows.map((row) => row.id.length));
  const groupColumnWidth = Math.max(10, ...rows.map((row) => row.group.length));
  const isFull = options.columnProfile === "full";

  const headerLine = [
    "Scenario".padEnd(scenarioColumnWidth),
    "Group".padEnd(groupColumnWidth),
    ...everyLibrary.map((library) => `${consoleLabel(library)} hz/op`.padStart(CONSOLE_THROUGHPUT_COLUMN_WIDTH)),
    ...competitors.map((competitor) =>
      `${consoleLabel(pivot)}/${consoleLabel(competitor)}`.padStart(CONSOLE_RATIO_COLUMN_WIDTH),
    ),
    ...(isFull
      ? [
          ...everyLibrary.map((library) => `${consoleLabel(library)} mean ms`.padStart(CONSOLE_LATENCY_COLUMN_WIDTH)),
          ...everyLibrary.map((library) => `${consoleLabel(library)} p99 ms`.padStart(CONSOLE_LATENCY_COLUMN_WIDTH)),
        ]
      : []),
  ].join(CLI_TABLE_COLUMN_GAP);

  console.log(`\n${options.sectionHeading}`);
  console.log(headerLine);
  console.log("-".repeat(headerLine.length));
  for (const row of rows) {
    const throughputs = [row.pivotHzPerOp, ...row.competitors.map((competitor) => competitor.hzPerOp)];
    console.log(
      [
        row.id.padEnd(scenarioColumnWidth),
        row.group.padEnd(groupColumnWidth),
        ...throughputs.map((hzPerOp) =>
          formatThroughputOpsPerSecond(hzPerOp).padStart(CONSOLE_THROUGHPUT_COLUMN_WIDTH),
        ),
        ...row.competitors.map((competitor) =>
          markRatioReliability(
            formatThroughputRatio(row.pivotHzPerOp, competitor.hzPerOp),
            row.pivotHzPerOp,
            competitor.hzPerOp,
          ).padStart(CONSOLE_RATIO_COLUMN_WIDTH),
        ),
        ...(isFull
          ? [
              ...[row.pivotMeanMs, ...row.competitors.map((competitor) => competitor.meanMs)].map((ms) =>
                formatLatencyMeanMilliseconds(ms).padStart(CONSOLE_LATENCY_COLUMN_WIDTH),
              ),
              ...[row.pivotP99Ms, ...row.competitors.map((competitor) => competitor.p99Ms)].map((ms) =>
                formatLatencyMeanMilliseconds(ms).padStart(CONSOLE_LATENCY_COLUMN_WIDTH),
              ),
            ]
          : []),
      ].join(CLI_TABLE_COLUMN_GAP),
    );
  }

  console.log("");
  for (const { displayName, headToHead } of summarizeComparison(pivot, competitors)) {
    console.log(
      `${consoleLabel(pivot)} vs ${displayName}: ${String(headToHead.wins.length)} wins · ${String(headToHead.parities.length)} parity · ${String(headToHead.losses.length)} loss${headToHead.losses.length === 1 ? "" : "es"} of ${String(headToHead.comparableCount)} comparable — median ${formatRatioTimes(headToHead.medianRatio)}, geomean ${formatRatioTimes(headToHead.geomeanRatio)}`,
    );
    if (headToHead.groupGeomeans.length > 0) {
      console.log(
        `  By group: ${headToHead.groupGeomeans.map((entry) => `${entry.group} ${formatRatioTimes(entry.geomeanRatio)}`).join(" · ")}`,
      );
    }
    if (headToHead.losses.length > 0) {
      console.log(
        `  Losses: ${headToHead.losses
          .map(
            (entry) =>
              `${entry.id} (${formatRatioTimes(entry.ratio)}${entry.unreliable ? UNRELIABLE_RATIO_MARKER : ""})`,
          )
          .join(", ")}`,
      );
    }
  }
  const unreliableCount = countUnreliableRatioCells(rows);
  if (unreliableCount > 0) {
    console.log(formatReliabilityCaveatLine(unreliableCount));
  }
  if (options.footerHintLine !== undefined) {
    console.log("");
    console.log(options.footerHintLine);
  }
  console.log("");
}
