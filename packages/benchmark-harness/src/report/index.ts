import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { JsonlBenchObservationRow } from "#/report/jsonl";
import {
  formatIqrThroughputFraction,
  formatLatencyMeanMilliseconds,
  formatThroughputOpsPerSecond,
  formatThroughputRatio,
} from "#/presentation/format";
import type { Fingerprint, ScenarioTrialResult, TrialPayload } from "#/protocol";
import { quantile, sortAscending } from "#/stats/quantiles";

/**
 * One (library, scenario) row after collapsing the per-trial payloads.
 */
export interface AggregatedScenarioResult {
  readonly id: string;
  readonly group: string;
  readonly stress: boolean;
  readonly batch: number;
  readonly what: string;
  readonly trialsIncluded: number;
  readonly hzPerOpMedian: number;
  readonly hzPerOpIqrFraction: number;
  readonly meanMsMedian: number;
  readonly p75MsMedian: number;
  readonly p99MsMedian: number;
  readonly p999MsMedian: number;
}

export interface LibraryReport {
  readonly fingerprint: Fingerprint;
  readonly trialCount: number;
  readonly sanityFailures: readonly string[];
  readonly scenarios: readonly AggregatedScenarioResult[];
}

function aggregateTrialsForScenario(
  scenarioId: string,
  perTrialResults: readonly ScenarioTrialResult[],
): AggregatedScenarioResult | undefined {
  const successfulTrials = perTrialResults.filter((trial) => trial.samples > 0);
  if (successfulTrials.length === 0) {
    return undefined;
  }
  const firstTrial = successfulTrials[0];
  if (firstTrial === undefined) {
    return undefined;
  }
  const hzPerOpSortedAscending = sortAscending(successfulTrials.map((trial) => trial.hzPerOp));
  const meanMsSortedAscending = sortAscending(successfulTrials.map((trial) => trial.meanMs));
  const p75MsSortedAscending = sortAscending(successfulTrials.map((trial) => trial.p75Ms));
  const p99MsSortedAscending = sortAscending(successfulTrials.map((trial) => trial.p99Ms));
  const p999MsSortedAscending = sortAscending(successfulTrials.map((trial) => trial.p999Ms));

  const hzPerOpMedian = quantile(hzPerOpSortedAscending, 0.5);
  const hzPerOpP25 = quantile(hzPerOpSortedAscending, 0.25);
  const hzPerOpP75 = quantile(hzPerOpSortedAscending, 0.75);
  const hzPerOpIqrFraction = hzPerOpMedian > 0 ? (hzPerOpP75 - hzPerOpP25) / hzPerOpMedian : 0;

  return {
    id: scenarioId,
    group: firstTrial.group,
    stress: firstTrial.stress,
    batch: firstTrial.batch,
    what: firstTrial.what,
    trialsIncluded: successfulTrials.length,
    hzPerOpMedian,
    hzPerOpIqrFraction,
    meanMsMedian: quantile(meanMsSortedAscending, 0.5),
    p75MsMedian: quantile(p75MsSortedAscending, 0.5),
    p99MsMedian: quantile(p99MsSortedAscending, 0.5),
    p999MsMedian: quantile(p999MsSortedAscending, 0.5),
  };
}

export function buildLibraryReport(
  fingerprint: Fingerprint,
  trials: readonly TrialPayload[],
  sanityFailures: readonly string[],
): LibraryReport {
  const perScenarioTrials = new Map<string, ScenarioTrialResult[]>();
  for (const trial of trials) {
    for (const scenarioResult of trial.scenarios) {
      const list = perScenarioTrials.get(scenarioResult.id);
      if (list === undefined) {
        perScenarioTrials.set(scenarioResult.id, [scenarioResult]);
      } else {
        list.push(scenarioResult);
      }
    }
  }

  const aggregated: AggregatedScenarioResult[] = [];
  for (const [scenarioId, perTrialResults] of perScenarioTrials) {
    const row = aggregateTrialsForScenario(scenarioId, perTrialResults);
    if (row !== undefined) {
      aggregated.push(row);
    }
  }

  return {
    fingerprint,
    trialCount: trials.length,
    sanityFailures,
    scenarios: aggregated,
  };
}

function orderedScenarioIds(leftReport: LibraryReport, rightReport: LibraryReport): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
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

/** One zipped row for Markdown and console two-way comparisons. */
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

export function buildTwoWayComparisonRows(
  leftLibraryReport: LibraryReport,
  rightLibraryReport: LibraryReport,
): TwoWayScenarioComparisonRow[] {
  const leftByScenarioId = new Map(
    leftLibraryReport.scenarios.map((scenario) => [scenario.id, scenario]),
  );
  const rightByScenarioId = new Map(
    rightLibraryReport.scenarios.map((scenario) => [scenario.id, scenario]),
  );
  const displayOrder = orderedScenarioIds(leftLibraryReport, rightLibraryReport);

  const rows: TwoWayScenarioComparisonRow[] = [];
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

/** Column titles for GitHub-flavoured Markdown throughput tables (12 columns incl. separators). */
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

export type TwoWayMarkdownReportOptions = {
  readonly columnTitles: TwoWayMarkdownColumnTitles;
  readonly documentHeading: string;
  /** Bullets printed under "## Comparable scenarios" before the table. */
  readonly comparableScenarioIntroLines: readonly string[];
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
): string[] {
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

/** Renders a full Markdown report for side-by-side two-library aggregates. */
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

  const sections: string[] = [
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

export type TwoWayConsoleReportOptions = {
  readonly footerHintLine?: string;
};

/** Prints a two-way comparison table to stdout with aligned ASCII columns. */
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

/** Writes a pre-rendered markdown string to `outputPath`, creating parent directories as needed. */
export function writeMarkdownFile(outputPath: string, markdown: string): void {
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${markdown}\n`, "utf8");
}

function flattenLibraryToJsonl(
  fingerprint: Fingerprint,
  trials: readonly TrialPayload[],
): JsonlBenchObservationRow[] {
  const observations: JsonlBenchObservationRow[] = [];
  for (const trial of trials) {
    for (const scenarioResult of trial.scenarios) {
      observations.push({
        timestampIso: fingerprint.timestampIso,
        libraryName: fingerprint.libraryName,
        libraryVersion: fingerprint.libraryVersion,
        nodeVersion: fingerprint.nodeVersion,
        v8Version: fingerprint.v8Version,
        platform: fingerprint.platform,
        arch: fingerprint.arch,
        cpuModel: fingerprint.cpuModel,
        cpuCount: fingerprint.cpuCount,
        nodeOptions: fingerprint.nodeOptions,
        gcExposed: fingerprint.gcExposed,
        trialIndex: trial.trialIndex,
        scenarioId: scenarioResult.id,
        group: scenarioResult.group,
        stress: scenarioResult.stress,
        batch: scenarioResult.batch,
        what: scenarioResult.what,
        hzPerIteration: scenarioResult.hzPerIteration,
        hzPerOp: scenarioResult.hzPerOp,
        meanMs: scenarioResult.meanMs,
        p75Ms: scenarioResult.p75Ms,
        p99Ms: scenarioResult.p99Ms,
        p999Ms: scenarioResult.p999Ms,
        samples: scenarioResult.samples,
      });
    }
  }
  return observations;
}

/** Writes one JSONL file containing flattened observations from one or more libraries. */
export function writeJsonlRun(
  outputPath: string,
  libraries: readonly { fingerprint: Fingerprint; trials: readonly TrialPayload[] }[],
): void {
  const allObservations = libraries.flatMap((library) =>
    flattenLibraryToJsonl(library.fingerprint, library.trials),
  );
  const serialised = allObservations.map((observation) => JSON.stringify(observation)).join("\n");
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${serialised}\n`, "utf8");
}
