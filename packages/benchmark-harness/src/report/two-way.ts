import type { LibraryReport } from "#/report/aggregate";
import {
  formatIqrThroughputFraction,
  formatLatencyMeanMilliseconds,
  formatThroughputOpsPerSecond,
  formatThroughputRatio,
} from "#/report/format";

/**
 * One zipped row for Markdown and console two-way comparisons.
 *
 * @since 0.3.16-canary.0
 */
export interface TwoWayScenarioComparisonRow {
  readonly id: string;
  readonly group: string;
  readonly batch: number;
  readonly what: string;
  readonly stress: boolean;
  readonly leftHzPerOp: number;
  readonly leftIqrFraction: number;
  readonly leftMeanMs: number;
  readonly leftP99Ms: number;
  readonly rightHzPerOp: number;
  readonly rightIqrFraction: number;
  readonly rightMeanMs: number;
  readonly rightP99Ms: number;
}

/**
 * Column titles for GitHub-flavoured Markdown throughput tables (12 columns incl. separators).
 *
 * @since 0.3.16-canary.0
 */
export type TwoWayMarkdownColumnTitles = {
  readonly leftThroughput: string;
  readonly rightThroughput: string;
  readonly ratioHeading: string;
  readonly leftMeanMs: string;
  readonly rightMeanMs: string;
  readonly leftP99Ms: string;
  readonly rightP99Ms: string;
  readonly iqrCombinedHeading: string;
};

/**
 * @since 0.3.16-canary.0
 */
export type TwoWayMarkdownReportOptions = {
  readonly columnTitles: TwoWayMarkdownColumnTitles;
  readonly documentHeading: string;
  /** Bullets printed under "## Comparable scenarios" before the table. */
  readonly comparableScenarioIntroLines: ReadonlyArray<string>;
  /** Short names for the "## Environment › Library versions" bullet. */
  readonly fingerprintLibraryVersionLabels: {
    readonly left: string;
    readonly right: string;
  };
  /** Markdown fragments for sanity failure bullets, e.g. "**@codefast/di**" vs "**inversify**". */
  readonly sanityBulletMarkdownLabels: {
    readonly left: string;
    readonly right: string;
  };
};

/**
 * @since 0.3.16-canary.0
 */
export type TwoWayConsoleColumnLabels = {
  readonly leftThroughputHeader: string;
  readonly rightThroughputHeader: string;
  readonly ratioHeader: string;
  readonly leftMeanHeader: string;
  readonly rightMeanHeader: string;
  readonly leftP99Header: string;
  readonly rightP99Header: string;
  readonly sectionHeading: string;
};

/**
 * @since 0.3.16-canary.0
 */
export type TwoWayConsoleReportOptions = {
  readonly footerHintLine?: string;
  /** Short names used in the head-to-head summary line, e.g. "codefast" / "inversify". */
  readonly headToHeadLabels?: {
    readonly left: string;
    readonly right: string;
  };
};

// A ratio within ±3% of 1.0 is statistical parity, not a win or a loss.
const HEAD_TO_HEAD_PARITY_BAND = 0.03;

/**
 * One classified head-to-head entry: scenario id plus its left/right throughput ratio.
 *
 * @since 0.3.16-canary.0
 */
export interface TwoWayHeadToHeadEntry {
  readonly id: string;
  readonly ratio: number;
}

/**
 * Win/parity/loss classification of every comparable scenario, from the left library's viewpoint.
 *
 * @since 0.3.16-canary.0
 */
export interface TwoWayHeadToHeadSummary {
  readonly comparableCount: number;
  readonly wins: ReadonlyArray<TwoWayHeadToHeadEntry>;
  readonly parities: ReadonlyArray<TwoWayHeadToHeadEntry>;
  readonly losses: ReadonlyArray<TwoWayHeadToHeadEntry>;
  readonly medianRatio: number;
  readonly leftOnlyIds: ReadonlyArray<string>;
  readonly rightOnlyIds: ReadonlyArray<string>;
}

/**
 * Classifies comparable rows into wins / parities / losses for the left library.
 *
 * @since 0.3.16-canary.0
 */
export function summarizeTwoWayComparison(rows: ReadonlyArray<TwoWayScenarioComparisonRow>): TwoWayHeadToHeadSummary {
  const wins: Array<TwoWayHeadToHeadEntry> = [];
  const parities: Array<TwoWayHeadToHeadEntry> = [];
  const losses: Array<TwoWayHeadToHeadEntry> = [];
  const leftOnlyIds: Array<string> = [];
  const rightOnlyIds: Array<string> = [];

  for (const row of rows) {
    if (row.rightHzPerOp === 0) {
      if (row.leftHzPerOp > 0) {
        leftOnlyIds.push(row.id);
      }
      continue;
    }
    if (row.leftHzPerOp === 0) {
      rightOnlyIds.push(row.id);
      continue;
    }
    const entry: TwoWayHeadToHeadEntry = { id: row.id, ratio: row.leftHzPerOp / row.rightHzPerOp };
    if (entry.ratio > 1 + HEAD_TO_HEAD_PARITY_BAND) {
      wins.push(entry);
    } else if (entry.ratio < 1 - HEAD_TO_HEAD_PARITY_BAND) {
      losses.push(entry);
    } else {
      parities.push(entry);
    }
  }

  const ratios = [...wins, ...parities, ...losses].map((entry) => entry.ratio).sort((left, right) => left - right);
  const midpoint = Math.floor(ratios.length / 2);
  const medianRatio =
    ratios.length === 0
      ? 0
      : ratios.length % 2 === 1
        ? ratios[midpoint]!
        : (ratios[midpoint - 1]! + ratios[midpoint]!) / 2;

  return { comparableCount: ratios.length, wins, parities, losses, medianRatio, leftOnlyIds, rightOnlyIds };
}

function formatRatioTimes(ratio: number): string {
  return `${ratio >= 10 ? ratio.toFixed(1) : ratio.toFixed(2)}×`;
}

function formatEntryList(entries: ReadonlyArray<TwoWayHeadToHeadEntry>): string {
  return entries.map((entry) => `\`${entry.id}\` (${formatRatioTimes(entry.ratio)})`).join(", ");
}

function buildHeadToHeadSummaryMarkdownLines(
  summary: TwoWayHeadToHeadSummary,
  versionLabels: TwoWayMarkdownReportOptions["fingerprintLibraryVersionLabels"],
): Array<string> {
  const { comparableCount, wins, parities, losses, medianRatio, leftOnlyIds, rightOnlyIds } = summary;
  const winPercent = comparableCount === 0 ? 0 : Math.round((wins.length / comparableCount) * 100);
  const lines = [
    "## Head-to-head summary",
    "",
    `**${versionLabels.left} wins ${String(wins.length)} of ${String(comparableCount)} comparable scenarios (${String(winPercent)}%) — ${String(parities.length)} parity, ${String(losses.length)} loss${losses.length === 1 ? "" : "es"}.** Median ratio ${formatRatioTimes(medianRatio)} (${versionLabels.left} / ${versionLabels.right}; win >1.03×, parity 0.97–1.03×, loss <0.97×).`,
    "",
  ];
  if (losses.length > 0) {
    lines.push(`- Losses: ${formatEntryList(losses)}`);
  }
  if (parities.length > 0) {
    lines.push(`- Parity: ${formatEntryList(parities)}`);
  }
  const topWins = [...wins].sort((left, right) => right.ratio - left.ratio).slice(0, 3);
  if (topWins.length > 0) {
    lines.push(`- Biggest wins: ${formatEntryList(topWins)}`);
  }
  if (leftOnlyIds.length > 0 || rightOnlyIds.length > 0) {
    lines.push(
      `- Not comparable: ${String(leftOnlyIds.length)} scenario(s) measured only for ${versionLabels.left}, ${String(rightOnlyIds.length)} only for ${versionLabels.right}.`,
    );
  }
  return lines;
}

function orderedScenarioIds(leftReport: LibraryReport, rightReport: LibraryReport): Array<string> {
  const seen = new Set<string>();
  const ordered: Array<string> = [];
  for (const scenario of leftReport.scenarios) {
    seen.add(scenario.id);
    ordered.push(scenario.id);
  }
  for (const scenario of rightReport.scenarios) {
    if (!seen.has(scenario.id)) {
      ordered.push(scenario.id);
    }
  }
  return ordered;
}

/**
 * @since 0.3.16-canary.0
 */
export function buildTwoWayComparisonRows(
  leftLibraryReport: LibraryReport,
  rightLibraryReport: LibraryReport,
): Array<TwoWayScenarioComparisonRow> {
  const leftByScenarioId = new Map(leftLibraryReport.scenarios.map((scenario) => [scenario.id, scenario]));
  const rightByScenarioId = new Map(rightLibraryReport.scenarios.map((scenario) => [scenario.id, scenario]));
  const displayOrder = orderedScenarioIds(leftLibraryReport, rightLibraryReport);

  const rows: Array<TwoWayScenarioComparisonRow> = [];
  for (const scenarioId of displayOrder) {
    const left = leftByScenarioId.get(scenarioId);
    const right = rightByScenarioId.get(scenarioId);
    const anyPresent = left ?? right;
    if (anyPresent === undefined) {
      continue;
    }
    rows.push({
      id: scenarioId,
      group: anyPresent.group,
      batch: anyPresent.batch,
      what: anyPresent.what,
      stress: anyPresent.stress,
      leftHzPerOp: left?.hzPerOpMedian ?? 0,
      leftIqrFraction: left?.hzPerOpIqrFraction ?? 0,
      leftMeanMs: left?.meanMsMedian ?? 0,
      leftP99Ms: left?.p99MsMedian ?? 0,
      rightHzPerOp: right?.hzPerOpMedian ?? 0,
      rightIqrFraction: right?.hzPerOpIqrFraction ?? 0,
      rightMeanMs: right?.meanMsMedian ?? 0,
      rightP99Ms: right?.p99MsMedian ?? 0,
    });
  }
  return rows;
}

function buildMarkdownHeaderLines(columnTitles: TwoWayMarkdownColumnTitles): readonly [string, string] {
  const headerCells = [
    "Scenario",
    "Group",
    "batch",
    columnTitles.leftThroughput,
    columnTitles.rightThroughput,
    columnTitles.ratioHeading,
    columnTitles.leftMeanMs,
    columnTitles.rightMeanMs,
    columnTitles.leftP99Ms,
    columnTitles.rightP99Ms,
    columnTitles.iqrCombinedHeading,
  ];
  const headerLine = `| ${headerCells.join(" | ")} |`;
  const separatorCells = headerCells.map((_, cellIndex) => (cellIndex < 2 ? "---" : "---:"));
  const separatorLine = `| ${separatorCells.join(" | ")} |`;
  return [headerLine, separatorLine];
}

function renderMarkdownDataRow(row: TwoWayScenarioComparisonRow): string {
  const cells = [
    row.id,
    row.group,
    String(row.batch),
    formatThroughputOpsPerSecond(row.leftHzPerOp),
    formatThroughputOpsPerSecond(row.rightHzPerOp),
    formatThroughputRatio(row.leftHzPerOp, row.rightHzPerOp),
    formatLatencyMeanMilliseconds(row.leftMeanMs),
    formatLatencyMeanMilliseconds(row.rightMeanMs),
    formatLatencyMeanMilliseconds(row.leftP99Ms),
    formatLatencyMeanMilliseconds(row.rightP99Ms),
    `${formatIqrThroughputFraction(row.leftIqrFraction)} / ${formatIqrThroughputFraction(row.rightIqrFraction)}`,
  ];
  return `| ${cells.join(" | ")} |`;
}

function formatEnvironmentBulletsMarkdown(
  leftReport: LibraryReport,
  rightReport: LibraryReport,
  versionLabels: TwoWayMarkdownReportOptions["fingerprintLibraryVersionLabels"],
): Array<string> {
  return [
    `- Node ${leftReport.fingerprint.nodeVersion} / V8 ${leftReport.fingerprint.v8Version}`,
    `- ${leftReport.fingerprint.platform}/${leftReport.fingerprint.arch} · ${leftReport.fingerprint.cpuModel} × ${String(leftReport.fingerprint.cpuCount)}`,
    `- NODE_OPTIONS: \`${leftReport.fingerprint.nodeOptions || "(empty)"}\``,
    `- GC exposed: left=${String(leftReport.fingerprint.gcExposed)}, right=${String(rightReport.fingerprint.gcExposed)}`,
    `- Library versions: ${versionLabels.left} ${leftReport.fingerprint.libraryVersion}, ${versionLabels.right} ${rightReport.fingerprint.libraryVersion}`,
    `- Trials per library: ${String(leftReport.trialCount)} (left), ${String(rightReport.trialCount)} (right)`,
    `- Timestamp: ${leftReport.fingerprint.timestampIso} (left), ${rightReport.fingerprint.timestampIso} (right)`,
  ];
}

/**
 * Renders a full Markdown report for side-by-side two-library aggregates.
 *
 * @since 0.3.16-canary.0
 */
export function renderTwoWayMarkdownReport(
  leftReport: LibraryReport,
  rightReport: LibraryReport,
  options: TwoWayMarkdownReportOptions,
): string {
  const rows = buildTwoWayComparisonRows(leftReport, rightReport);
  const [headerRow, separatorRow] = buildMarkdownHeaderLines(options.columnTitles);
  const environmentLines = formatEnvironmentBulletsMarkdown(
    leftReport,
    rightReport,
    options.fingerprintLibraryVersionLabels,
  );
  const sanitySection =
    leftReport.sanityFailures.length === 0 && rightReport.sanityFailures.length === 0
      ? ""
      : [
          "",
          "## Sanity failures",
          "",
          "These scenarios failed their pre-bench sanity check and were skipped:",
          "",
          ...leftReport.sanityFailures.map((id) => `- ${options.sanityBulletMarkdownLabels.left}: \`${id}\``),
          ...rightReport.sanityFailures.map((id) => `- ${options.sanityBulletMarkdownLabels.right}: \`${id}\``),
        ].join("\n");

  const headToHeadLines = buildHeadToHeadSummaryMarkdownLines(
    summarizeTwoWayComparison(rows),
    options.fingerprintLibraryVersionLabels,
  );

  const sections: Array<string> = [
    options.documentHeading,
    "",
    "## Environment",
    "",
    environmentLines.join("\n"),
    sanitySection,
    "",
    headToHeadLines.join("\n"),
    "",
    "## Comparable scenarios",
    "",
    ...options.comparableScenarioIntroLines,
    "",
    headerRow,
    separatorRow,
    ...rows.map(renderMarkdownDataRow),
  ];

  return sections.join("\n");
}

const CLI_TABLE_COLUMN_GAP = "  ";

/**
 * Prints a two-way comparison table to stdout with aligned ASCII columns.
 *
 * @since 0.3.16-canary.0
 */
export function renderTwoWayConsoleReport(
  leftReport: LibraryReport,
  rightReport: LibraryReport,
  columnLabels: TwoWayConsoleColumnLabels,
  options?: TwoWayConsoleReportOptions,
): void {
  const rows = buildTwoWayComparisonRows(leftReport, rightReport);

  const scenarioColumnWidth = Math.max(28, ...rows.map((row) => row.id.length));
  const groupColumnWidth = Math.max(10, ...rows.map((row) => row.group.length));

  const headerLine = [
    "Scenario".padEnd(scenarioColumnWidth),
    "Group".padEnd(groupColumnWidth),
    columnLabels.leftThroughputHeader.padStart(16),
    columnLabels.rightThroughputHeader.padStart(16),
    columnLabels.ratioHeader.padStart(8),
    columnLabels.leftMeanHeader.padStart(12),
    columnLabels.rightMeanHeader.padStart(12),
    columnLabels.leftP99Header.padStart(12),
    columnLabels.rightP99Header.padStart(12),
  ].join(CLI_TABLE_COLUMN_GAP);

  console.log(`\n${columnLabels.sectionHeading}`);
  console.log(headerLine);
  console.log("-".repeat(headerLine.length));
  for (const row of rows) {
    const ratio = formatThroughputRatio(row.leftHzPerOp, row.rightHzPerOp);
    console.log(
      [
        row.id.padEnd(scenarioColumnWidth),
        row.group.padEnd(groupColumnWidth),
        formatThroughputOpsPerSecond(row.leftHzPerOp).padStart(16),
        formatThroughputOpsPerSecond(row.rightHzPerOp).padStart(16),
        ratio.padStart(8),
        formatLatencyMeanMilliseconds(row.leftMeanMs).padStart(12),
        formatLatencyMeanMilliseconds(row.rightMeanMs).padStart(12),
        formatLatencyMeanMilliseconds(row.leftP99Ms).padStart(12),
        formatLatencyMeanMilliseconds(row.rightP99Ms).padStart(12),
      ].join(CLI_TABLE_COLUMN_GAP),
    );
  }

  const summary = summarizeTwoWayComparison(rows);
  const labels = options?.headToHeadLabels ?? { left: "left", right: "right" };
  console.log("");
  console.log(
    `Head-to-head: ${labels.left} ${String(summary.wins.length)} wins · ${String(summary.parities.length)} parity · ${String(summary.losses.length)} loss${summary.losses.length === 1 ? "" : "es"} (of ${String(summary.comparableCount)} comparable vs ${labels.right}) — median ratio ${formatRatioTimes(summary.medianRatio)}`,
  );
  if (summary.losses.length > 0) {
    console.log(
      `Losses: ${summary.losses.map((entry) => `${entry.id} (${formatRatioTimes(entry.ratio)})`).join(", ")}`,
    );
  }
  console.log("");
  console.log(options?.footerHintLine ?? "Cite the comparable scenarios table.");
  console.log("");
}
