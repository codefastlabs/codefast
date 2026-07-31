/** Renders one pivot library against any number of competitors; a head-to-head is the two-library case. */

import type { AggregatedScenarioResult, LibraryReport } from "#/report/aggregate";
import { formatRatioMultiple, formatThroughputOpsPerSecond, formatThroughputRatio } from "#/report/format";
import type { ThroughputQuality } from "#/report/reliability";
import {
  UNRELIABLE_RATIO_MARKER,
  formatNoisyIqrCaveatLine,
  formatReliabilityCaveatLine,
  isRatioNoisy,
  isRatioUnreliable,
  isThroughputCellNoisy,
  markRatioQuality,
  markThroughputQuality,
} from "#/report/reliability";

/** One library column: its aggregated report plus the labels used in table headers. */
export interface ComparisonLibrary {
  readonly report: LibraryReport;
  readonly displayName: string;
  /** Abbreviation for the width-constrained console table; falls back to `displayName`. */
  readonly shortName?: string;
}

/** One competitor's numbers for a single scenario; zeroed when it never measured that scenario. */
export interface ComparisonCompetitorCell {
  readonly hzPerOp: number;
  /** Pivot over competitor throughput; 0 when either side is missing, rendering as an em-dash. */
  readonly ratio: number;
  readonly iqrFraction: number;
}

/** One aligned row: the pivot's scenario plus one cell per competitor, in competitor order. */
export interface ComparisonScenarioRow {
  readonly id: string;
  readonly group: string;
  readonly batch: number;
  readonly what: string;
  readonly stress: boolean;
  readonly excludeFromAggregates: boolean;
  readonly pivotTrialsIncluded: number;
  readonly pivotHzPerOp: number;
  readonly pivotIqrFraction: number;
  readonly competitors: ReadonlyArray<ComparisonCompetitorCell>;
}

/** Copy and column choices for the Markdown report. */
export interface ComparisonMarkdownReportOptions {
  readonly documentHeading: string;
  readonly sectionHeading: string;
  /** Bullets printed under the section heading, before the tables. */
  readonly introLines?: ReadonlyArray<string>;
  /** Emits the fingerprint section; off when this report is appended to one that already has it. */
  readonly includeEnvironment?: boolean;
  /**
   * How the parent scheduled the libraries, stated in the environment section.
   *
   * @remarks A cross-library ratio depends on it: scheduling one library's whole suite before the
   * next one starts hands any drift over the run to whoever ran later. The child cannot know this,
   * so the parent passes it.
   */
  readonly runOrder?: string;
  /** Emits the skipped-scenario section; off when appended to a report that already has it. */
  readonly includeSanityFailures?: boolean;
}

/** Copy and column choices for the console report. */
export interface ComparisonConsoleReportOptions {
  readonly sectionHeading: string;
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
  /** Rows rendered in the table but kept out of every aggregate, by scenario declaration. */
  readonly excludedFromAggregatesIds: ReadonlyArray<string>;
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
  return { hzPerOp: 0, ratio: 0, iqrFraction: 0 };
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
  };
}

/** The pivot side of a row, in the shape the quality markers consume. */
function pivotQuality(row: ComparisonScenarioRow): ThroughputQuality {
  return { hzPerOp: row.pivotHzPerOp, iqrFraction: row.pivotIqrFraction };
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
    excludeFromAggregates: scenario.excludeFromAggregates,
    pivotTrialsIncluded: scenario.trialsIncluded,
    pivotHzPerOp: scenario.hzPerOpMedian,
    pivotIqrFraction: scenario.hzPerOpIqrFraction,
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
  const excludedFromAggregatesIds: Array<string> = [];
  // Per-group ratios kept in first-appearance order for a stable breakdown.
  const ratiosByGroup = new Map<string, Array<number>>();
  const pivotScenarioIds = new Set(rows.map((row) => row.id));

  for (const row of rows) {
    if (row.excludeFromAggregates) {
      excludedFromAggregatesIds.push(row.id);
      continue;
    }
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
    excludedFromAggregatesIds,
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

function formatEntryList(entries: ReadonlyArray<ComparisonEntry>): string {
  return entries
    .map(
      (entry) =>
        `\`${entry.id}\` (${formatRatioMultiple(entry.ratio)}${entry.unreliable ? UNRELIABLE_RATIO_MARKER : ""})`,
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

/** Counts rendered cells — throughput and ratio alike — resting on a median unstable within its run. */
function countNoisyCells(rows: ReadonlyArray<ComparisonScenarioRow>): number {
  return rows.reduce((total, row) => {
    const pivot = pivotQuality(row);
    const noisyRatios = row.competitors.filter((competitor) => isRatioNoisy(pivot, competitor)).length;
    return total + noisyRatios + (isThroughputCellNoisy(pivot) ? 1 : 0);
  }, 0);
}

function consoleLabel(library: ComparisonLibrary): string {
  return library.shortName ?? library.displayName;
}

/** Scenario groups in the order the pivot first measured them. */
function collectGroupOrder(rows: ReadonlyArray<ComparisonScenarioRow>): Array<string> {
  return [...new Set(rows.map((row) => row.group))];
}

/**
 * @param labelColumnCount - how many leading columns hold labels; every column past them
 * carries a number and lines up on the right
 */
function buildMarkdownTableLines(
  headerCells: ReadonlyArray<string>,
  dataRows: ReadonlyArray<Array<string>>,
  labelColumnCount: number,
): Array<string> {
  const separatorCells = headerCells.map((_cell, cellIndex) => (cellIndex < labelColumnCount ? "---" : "---:"));
  return [
    `| ${headerCells.join(" | ")} |`,
    `| ${separatorCells.join(" | ")} |`,
    ...dataRows.map((cells) => `| ${cells.join(" | ")} |`),
  ];
}

/**
 * One row per competitor, so the summary stays the same height whatever the table is wide.
 *
 * @param pivotScenarioCount - denominator of the coverage column, exposing a competitor that
 * implements only part of the suite
 */
function buildSummaryTableLines(
  pivot: ComparisonLibrary,
  summaries: ReadonlyArray<ComparisonCompetitorSummary>,
  pivotScenarioCount: number,
): Array<string> {
  return [
    `Ratios are \`${pivot.displayName} / competitor\` — above 1× means ${pivot.displayName} is faster. Win >1.03×, parity 0.97–1.03×, loss <0.97×. \`Comparable\` counts the rows both libraries measured, of ${String(pivotScenarioCount)} that ${pivot.displayName} measures; \`${UNRELIABLE_RATIO_MARKER}\` how many of those the median and geomean carry but no reader should cite alone.`,
    "",
    ...buildMarkdownTableLines(
      ["Competitor", "Comparable", "Win / parity / loss", "Median", "Geomean", UNRELIABLE_RATIO_MARKER],
      summaries.map(({ displayName, headToHead }) => [
        displayName,
        `${String(headToHead.comparableCount)} of ${String(pivotScenarioCount)}`,
        `${String(headToHead.wins.length)} / ${String(headToHead.parities.length)} / ${String(headToHead.losses.length)}`,
        formatRatioMultiple(headToHead.medianRatio),
        formatRatioMultiple(headToHead.geomeanRatio),
        String(headToHead.unreliableCount),
      ]),
      1,
    ),
  ];
}

/**
 * Geomean per group as a matrix, keeping error-path groups visibly separate from throughput
 * so a single fail-fast row cannot read as a typical speedup.
 */
function buildGroupGeomeanTableLines(
  groupOrder: ReadonlyArray<string>,
  summaries: ReadonlyArray<ComparisonCompetitorSummary>,
): Array<string> {
  if (groupOrder.length === 0 || summaries.length === 0) {
    return [];
  }
  const dataRows = groupOrder
    .map((group) => [
      group,
      ...summaries.map(({ headToHead }) => {
        const entry = headToHead.groupGeomeans.find((candidate) => candidate.group === group);
        return entry === undefined ? "—" : `${formatRatioMultiple(entry.geomeanRatio)} (${String(entry.count)})`;
      }),
    ])
    // A group no competitor implements is a coverage gap, already counted as `Comparable`.
    .filter((cells) => cells.slice(1).some((cell) => cell !== "—"));
  if (dataRows.length === 0) {
    return [];
  }
  return [
    "Geomean of the ratios in each group, with the comparable row count in parentheses.",
    "",
    ...buildMarkdownTableLines(["Group", ...summaries.map((summary) => summary.displayName)], dataRows, 1),
  ];
}

const PIVOT_ONLY_LIST_LIMIT = 12;

/** The exceptions no column holds: which rows lost, which drew, and what only one side ran. */
function buildCompetitorNoteLines(summaries: ReadonlyArray<ComparisonCompetitorSummary>): Array<string> {
  const lines: Array<string> = [];
  for (const { displayName, headToHead } of summaries) {
    const { losses, parities, competitorOnlyIds, pivotOnlyIds, excludedFromAggregatesIds } = headToHead;
    if (losses.length > 0) {
      lines.push(`- **${displayName}** — losses: ${formatEntryList(losses)}`);
    }
    if (parities.length > 0) {
      lines.push(`- **${displayName}** — parity: ${formatEntryList(parities)}`);
    }
    if (excludedFromAggregatesIds.length > 0) {
      lines.push(
        `- **${displayName}** — excluded from aggregates by declaration (incomparable work per op): ${excludedFromAggregatesIds.map((id) => `\`${id}\``).join(", ")}`,
      );
    }
    if (pivotOnlyIds.length > 0) {
      const listed =
        pivotOnlyIds.length <= PIVOT_ONLY_LIST_LIMIT ? `: ${pivotOnlyIds.map((id) => `\`${id}\``).join(", ")}` : ".";
      lines.push(`- **${displayName}** — has no counterpart for ${String(pivotOnlyIds.length)} pivot row(s)${listed}`);
    }
    if (competitorOnlyIds.length > 0) {
      lines.push(
        `- **${displayName}** — measures ${String(competitorOnlyIds.length)} scenario(s) this suite does not, so they have no row.`,
      );
    }
  }
  return lines;
}

/** Rows whose median rests on fewer surviving trials than the run scheduled. */
function buildPartialTrialNoteLines(
  pivot: ComparisonLibrary,
  competitors: ReadonlyArray<ComparisonLibrary>,
): Array<string> {
  const lines: Array<string> = [];
  for (const library of [pivot, ...competitors]) {
    const partial = library.report.scenarios.filter((scenario) => scenario.trialsIncluded < library.report.trialCount);
    if (partial.length > 0) {
      lines.push(
        `- **${library.displayName}** — medians resting on fewer trials than the run's ${String(library.report.trialCount)}: ${partial.map((scenario) => `\`${scenario.id}\` (${String(scenario.trialsIncluded)})`).join(", ")}`,
      );
    }
  }
  return lines;
}

function buildScenarioTableLines(
  pivot: ComparisonLibrary,
  competitors: ReadonlyArray<ComparisonLibrary>,
  rows: ReadonlyArray<ComparisonScenarioRow>,
): Array<string> {
  const headerCells = [
    "Scenario",
    "Group",
    "batch",
    `${pivot.displayName} hz/op`,
    ...competitors.map((competitor) => `vs ${competitor.displayName}`),
  ];
  const dataRows = rows.map((row) => {
    const pivotSample = pivotQuality(row);
    return [
      row.id,
      row.group,
      String(row.batch),
      markThroughputQuality(formatThroughputOpsPerSecond(row.pivotHzPerOp), pivotSample),
      ...row.competitors.map((competitor) =>
        markRatioQuality(formatThroughputRatio(row.pivotHzPerOp, competitor.hzPerOp), pivotSample, competitor),
      ),
    ];
  });
  return buildMarkdownTableLines(headerCells, dataRows, 2);
}

function buildEnvironmentBullets(
  pivot: ComparisonLibrary,
  competitors: ReadonlyArray<ComparisonLibrary>,
  runOrder: string | undefined,
): Array<string> {
  const everyLibrary = [pivot, ...competitors];
  const { fingerprint } = pivot.report;
  return [
    ...(runOrder === undefined ? [] : [`- Run order: ${runOrder}`]),
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
  const summaries = summarizeComparison(pivot, competitors);
  const unreliableCount = countUnreliableRatioCells(rows);
  const noisyCount = countNoisyCells(rows);
  const introLines = options.introLines ?? [];
  const noteLines = [...buildCompetitorNoteLines(summaries), ...buildPartialTrialNoteLines(pivot, competitors)];
  const groupTableLines = buildGroupGeomeanTableLines(collectGroupOrder(rows), summaries);

  const sections: Array<string> = [
    options.documentHeading,
    ...(options.includeEnvironment === true
      ? ["", "## Environment", "", ...buildEnvironmentBullets(pivot, competitors, options.runOrder)]
      : []),
    ...(options.includeSanityFailures === true ? buildSanityFailureLines(pivot, competitors) : []),
    "",
    `## ${options.sectionHeading}`,
    "",
    ...introLines,
    ...(introLines.length === 0 ? [] : [""]),
    ...(summaries.length === 0
      ? []
      : ["### Summary", "", ...buildSummaryTableLines(pivot, summaries, rows.length), ""]),
    ...(noteLines.length === 0 ? [] : [...noteLines, ""]),
    ...(groupTableLines.length === 0 ? [] : ["### Geomean by group", "", ...groupTableLines, ""]),
    "### Per scenario",
    "",
    ...buildScenarioTableLines(pivot, competitors, rows),
    // The caveats sit directly under the table so they travel with the marked cells.
    ...(unreliableCount === 0 ? [] : ["", formatReliabilityCaveatLine(unreliableCount)]),
    ...(noisyCount === 0 ? [] : ["", formatNoisyIqrCaveatLine(noisyCount)]),
  ];

  return sections.join("\n");
}

const CLI_TABLE_COLUMN_GAP = "  ";
const CONSOLE_THROUGHPUT_COLUMN_WIDTH = 18;
const CONSOLE_RATIO_COLUMN_WIDTH = 12;

/** Prints the comparison to stdout with aligned ASCII columns. */
export function renderComparisonConsoleReport(
  pivot: ComparisonLibrary,
  competitors: ReadonlyArray<ComparisonLibrary>,
  options: ComparisonConsoleReportOptions,
): void {
  const rows = buildComparisonRows(pivot, competitors);
  const scenarioColumnWidth = Math.max(28, ...rows.map((row) => row.id.length));
  const groupColumnWidth = Math.max(10, ...rows.map((row) => row.group.length));

  const headerLine = [
    "Scenario".padEnd(scenarioColumnWidth),
    "Group".padEnd(groupColumnWidth),
    `${consoleLabel(pivot)} hz/op`.padStart(CONSOLE_THROUGHPUT_COLUMN_WIDTH),
    ...competitors.map((competitor) => `vs ${consoleLabel(competitor)}`.padStart(CONSOLE_RATIO_COLUMN_WIDTH)),
  ].join(CLI_TABLE_COLUMN_GAP);

  console.log(`\n${options.sectionHeading}`);
  console.log(headerLine);
  console.log("-".repeat(headerLine.length));
  for (const row of rows) {
    const pivotSample = pivotQuality(row);
    console.log(
      [
        row.id.padEnd(scenarioColumnWidth),
        row.group.padEnd(groupColumnWidth),
        markThroughputQuality(formatThroughputOpsPerSecond(row.pivotHzPerOp), pivotSample).padStart(
          CONSOLE_THROUGHPUT_COLUMN_WIDTH,
        ),
        ...row.competitors.map((competitor) =>
          markRatioQuality(
            formatThroughputRatio(row.pivotHzPerOp, competitor.hzPerOp),
            pivotSample,
            competitor,
          ).padStart(CONSOLE_RATIO_COLUMN_WIDTH),
        ),
      ].join(CLI_TABLE_COLUMN_GAP),
    );
  }

  console.log("");
  for (const { displayName, headToHead } of summarizeComparison(pivot, competitors)) {
    console.log(
      `${consoleLabel(pivot)} vs ${displayName}: ${String(headToHead.wins.length)} wins · ${String(headToHead.parities.length)} parity · ${String(headToHead.losses.length)} loss${headToHead.losses.length === 1 ? "" : "es"} of ${String(headToHead.comparableCount)} comparable — median ${formatRatioMultiple(headToHead.medianRatio)}, geomean ${formatRatioMultiple(headToHead.geomeanRatio)}`,
    );
    if (headToHead.groupGeomeans.length > 0) {
      console.log(
        `  By group: ${headToHead.groupGeomeans.map((entry) => `${entry.group} ${formatRatioMultiple(entry.geomeanRatio)}`).join(" · ")}`,
      );
    }
    if (headToHead.losses.length > 0) {
      console.log(
        `  Losses: ${headToHead.losses
          .map(
            (entry) =>
              `${entry.id} (${formatRatioMultiple(entry.ratio)}${entry.unreliable ? UNRELIABLE_RATIO_MARKER : ""})`,
          )
          .join(", ")}`,
      );
    }
  }
  const unreliableCount = countUnreliableRatioCells(rows);
  if (unreliableCount > 0) {
    console.log(formatReliabilityCaveatLine(unreliableCount));
  }
  const noisyCount = countNoisyCells(rows);
  if (noisyCount > 0) {
    console.log(formatNoisyIqrCaveatLine(noisyCount));
  }
  if (options.footerHintLine !== undefined) {
    console.log("");
    console.log(options.footerHintLine);
  }
  console.log("");
}
