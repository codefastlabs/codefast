/** The console summary: one scoreboard row per competitor, geomeans by group, and the reliable losses. */
import type { ComparisonEntry, ComparisonLibrary, ComparisonScenarioRow } from "#/report/comparison";
import { summarizeComparison } from "#/report/comparison";
import type { ConsoleCell } from "#/report/console-table";
import { cell, renderConsoleTable } from "#/report/console-table";
import { formatRatioMultiple } from "#/report/format";
import { UNRELIABLE_RATIO_MARKER } from "#/report/reliability";
import type { RunDiff } from "#/report/run-diff";
import { describeDiffTarget, formatDeltaPercent } from "#/report/run-diff";
import { HEAD_TO_HEAD_PARITY_BAND, ratioTint } from "#/report/verdict";
import type { Palette, Tint } from "#/shared/palette";

/**
 * Options for {@link renderScoreboardLines}.
 */
export interface RenderScoreboardOptions {
  readonly palette: Palette;
  /** Adds the change against the previous comparable run beside each aggregate. */
  readonly diff?: RunDiff | undefined;
}

function consoleLabel(library: ComparisonLibrary): string {
  return library.shortName ?? library.displayName;
}

function formatEntry(entry: ComparisonEntry): string {
  return `${entry.id} ${formatRatioMultiple(entry.ratio)}${entry.unreliable ? UNRELIABLE_RATIO_MARKER : ""}`;
}

function countTint(count: number, positive: Tint, palette: Palette): Tint {
  return count > 0 ? positive : palette.dim;
}

const COUNTS_PATTERN = /(\d+) · (\d+) · (\d+)/;

// One "W · P · L" cell, tinted piecewise after the whole cell has been padded.
function countsCell(wins: number, parities: number, losses: number, palette: Palette): ConsoleCell {
  const tint: Tint = (padded) =>
    padded.replace(
      COUNTS_PATTERN,
      (_match, w: string, p: string, l: string) =>
        `${countTint(wins, palette.win, palette)(w)} ${palette.dim("·")} ${palette.dim(p)} ${palette.dim("·")} ${countTint(losses, palette.loss, palette)(l)}`,
    );
  return cell(`${String(wins)} · ${String(parities)} · ${String(losses)}`, tint, "right");
}

function deltaCell(delta: number | undefined, palette: Palette): ConsoleCell {
  if (delta === undefined) {
    return cell("—", palette.dim, "right");
  }
  const tint = delta > 0 ? palette.win : delta < 0 ? palette.loss : palette.dim;
  return cell(formatDeltaPercent(delta), tint, "right");
}

function scoreboardLines(
  pivot: ComparisonLibrary,
  competitors: ReadonlyArray<ComparisonLibrary>,
  options: RenderScoreboardOptions,
): Array<string> {
  const { palette, diff } = options;
  const summaries = summarizeComparison(pivot, competitors);
  const withDiff = diff?.comparable === true;
  const competitorDeltas = diff?.comparable === true ? diff.competitors : [];
  const bandPercent = String(Math.round(HEAD_TO_HEAD_PARITY_BAND * 100));
  const legend = `${consoleLabel(pivot)} ÷ competitor · win >1.0${bandPercent}× · parity ±${bandPercent}% · ${UNRELIABLE_RATIO_MARKER} not citable`;
  const heading = `${palette.heading("Scoreboard")}  ${palette.dim(`(${legend}${diff?.comparable === true ? ` · Δ vs ${describeDiffTarget(diff)}` : ""})`)}`;

  const header: Array<ConsoleCell> = [
    cell("vs"),
    cell("W · P · L", undefined, "right"),
    cell("of", undefined, "right"),
    cell("median", undefined, "right"),
    ...(withDiff ? [cell("Δ prev", undefined, "right")] : []),
    cell("geomean", undefined, "right"),
    ...(withDiff ? [cell("Δ prev", undefined, "right")] : []),
    cell("worst"),
  ];
  const rows = summaries.map(({ displayName, headToHead }) => {
    const worst = headToHead.losses.toSorted((left, right) => left.ratio - right.ratio)[0];
    const competitorDiff = competitorDeltas.find((entry) => entry.displayName === displayName);
    return [
      cell(displayName),
      countsCell(headToHead.wins.length, headToHead.parities.length, headToHead.losses.length, palette),
      cell(String(headToHead.comparableCount), palette.dim, "right"),
      cell(formatRatioMultiple(headToHead.medianRatio), ratioTint(headToHead.medianRatio, false, palette), "right"),
      ...(withDiff ? [deltaCell(competitorDiff?.medianDelta, palette)] : []),
      cell(formatRatioMultiple(headToHead.geomeanRatio), ratioTint(headToHead.geomeanRatio, false, palette), "right"),
      ...(withDiff ? [deltaCell(competitorDiff?.geomeanDelta, palette)] : []),
      worst === undefined
        ? cell("—", palette.dim)
        : cell(formatEntry(worst), worst.unreliable ? palette.dim : palette.loss),
    ];
  });
  return [heading, ...renderConsoleTable(header, rows, { headerTint: palette.dim })];
}

function groupGeomeanLines(
  pivot: ComparisonLibrary,
  competitors: ReadonlyArray<ComparisonLibrary>,
  rows: ReadonlyArray<ComparisonScenarioRow>,
  palette: Palette,
): Array<string> {
  const summaries = summarizeComparison(pivot, competitors);
  const groups: Array<string> = [];
  for (const row of rows) {
    if (!groups.includes(row.group)) {
      groups.push(row.group);
    }
  }
  const geomeanOf = new Map(
    summaries.map((summary) => [
      summary.displayName,
      new Map(summary.headToHead.groupGeomeans.map((entry) => [entry.group, entry.geomeanRatio])),
    ]),
  );
  const comparedGroups = groups.filter((group) =>
    summaries.some((summary) => geomeanOf.get(summary.displayName)?.has(group)),
  );
  if (comparedGroups.length === 0) {
    return [];
  }
  const header = [
    cell("Geomean by group"),
    ...competitors.map((competitor) => cell(consoleLabel(competitor), undefined, "right")),
  ];
  const tableRows = comparedGroups.map((group) => [
    cell(group),
    ...summaries.map((summary) => {
      const ratio = geomeanOf.get(summary.displayName)?.get(group);
      return ratio === undefined
        ? cell("—", palette.dim, "right")
        : cell(formatRatioMultiple(ratio), ratioTint(ratio, false, palette), "right");
    }),
  ]);
  return renderConsoleTable(header, tableRows, { headerTint: palette.heading });
}

function lossLines(
  pivot: ComparisonLibrary,
  competitors: ReadonlyArray<ComparisonLibrary>,
  rows: ReadonlyArray<ComparisonScenarioRow>,
  palette: Palette,
): Array<string> {
  const groupOf = new Map(rows.map((row) => [row.id, row.group]));
  const losses = summarizeComparison(pivot, competitors)
    .flatMap(({ displayName, headToHead }) => headToHead.losses.map((entry) => ({ displayName, entry })))
    .toSorted((left, right) => left.entry.ratio - right.entry.ratio);
  const reliable = losses.filter(({ entry }) => !entry.unreliable);
  const hiddenCount = losses.length - reliable.length;
  const hiddenNote = hiddenCount === 0 ? "" : `; ${String(hiddenCount)} marked ${UNRELIABLE_RATIO_MARKER} hidden`;
  const heading = `${palette.heading("Losses")}  ${palette.dim(`(reliable only${hiddenNote})`)}`;
  if (reliable.length === 0) {
    return [heading, palette.dim("  none")];
  }
  const tableRows = reliable.map(({ displayName, entry }) => [
    cell(displayName),
    cell(entry.id),
    cell(formatRatioMultiple(entry.ratio), palette.loss, "right"),
    cell(groupOf.get(entry.id) ?? "", palette.dim),
  ]);
  return [
    heading,
    ...renderConsoleTable([cell("vs"), cell("scenario"), cell("ratio", undefined, "right"), cell("group")], tableRows, {
      headerTint: palette.dim,
    }),
  ];
}

/**
 * Renders the scoreboard, the geomean-by-group table and the reliable losses, blank-line separated.
 */
export function renderScoreboardLines(
  pivot: ComparisonLibrary,
  competitors: ReadonlyArray<ComparisonLibrary>,
  rows: ReadonlyArray<ComparisonScenarioRow>,
  options: RenderScoreboardOptions,
): Array<string> {
  const groupLines = groupGeomeanLines(pivot, competitors, rows, options.palette);
  return [
    ...scoreboardLines(pivot, competitors, options),
    ...(groupLines.length === 0 ? [] : ["", ...groupLines]),
    "",
    ...lossLines(pivot, competitors, rows, options.palette),
  ];
}
