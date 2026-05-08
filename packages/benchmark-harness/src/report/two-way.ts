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
};

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
  const leftByScenarioId = new Map(
    leftLibraryReport.scenarios.map((scenario) => [scenario.id, scenario]),
  );
  const rightByScenarioId = new Map(
    rightLibraryReport.scenarios.map((scenario) => [scenario.id, scenario]),
  );
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

function buildMarkdownHeaderLines(
  columnTitles: TwoWayMarkdownColumnTitles,
): readonly [string, string] {
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
          ...leftReport.sanityFailures.map(
            (id) => `- ${options.sanityBulletMarkdownLabels.left}: \`${id}\``,
          ),
          ...rightReport.sanityFailures.map(
            (id) => `- ${options.sanityBulletMarkdownLabels.right}: \`${id}\``,
          ),
        ].join("\n");

  const sections: Array<string> = [
    options.documentHeading,
    "",
    "## Environment",
    "",
    environmentLines.join("\n"),
    sanitySection,
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

  console.log("");
  console.log(options?.footerHintLine ?? "Cite the comparable scenarios table.");
  console.log("");
}
