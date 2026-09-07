/** Series for the group overlay: every row of one group plotted together, one line per row and library. */
import { OVERLAY_DASHES, OVERLAY_POINT_STYLES, shadeOf } from "#/app/lib/colors";
import type { PaletteEntry } from "#/app/lib/colors";
import type { EmbeddedLibraryMeta, EmbeddedScenarioSeries } from "#/types";

/**
 * One plotted line of a group overlay, with the row and library it came from.
 *
 * @since 0.8.0
 */
export interface OverlaySeries {
  readonly borderDash: ReadonlyArray<number>;
  readonly color: string;
  readonly data: ReadonlyArray<number | null>;
  /** Whether this line belongs to the row the user has selected, which draws heavier. */
  readonly emphasized: boolean;
  readonly iqrFraction: ReadonlyArray<number | null>;
  readonly label: string;
  readonly libraryKey: string;
  /** The marker drawn at this line's points; every line of one row shares it. */
  readonly pointStyle: (typeof OVERLAY_POINT_STYLES)[number];
  readonly scenarioId: string;
  /** The row's id with its group's name removed, which is all a legend inside that group needs. */
  readonly shortLabel: string;
}

/**
 * A row's id with the group's name taken out, since every row of an overlay shares it.
 *
 * @remarks `uncached-simple-with-merge` in group `simple` reads `uncached-with-merge`; a row named
 * exactly after its group keeps its id.
 *
 * @since 0.8.0
 */
export function rowShortLabel(scenarioId: string, group: string): string {
  const idTokens = scenarioId.split("-");
  const groupTokens = group.split("-");
  for (let start = 0; start + groupTokens.length <= idTokens.length; start++) {
    if (groupTokens.every((token, offset) => idTokens[start + offset] === token)) {
      const remaining = [...idTokens.slice(0, start), ...idTokens.slice(start + groupTokens.length)];
      return remaining.length > 0 ? remaining.join("-") : scenarioId;
    }
  }
  return scenarioId;
}

/**
 * A series expressed as a percentage of its first plotted point, so lines of any scale share one axis.
 *
 * @since 0.8.0
 */
export function indexToFirst(values: ReadonlyArray<number | null>): {
  readonly base: number | null;
  readonly values: Array<number | null>;
} {
  const base = values.find((value): value is number => typeof value === "number" && value > 0) ?? null;
  if (base === null) {
    return { base, values: values.map(() => null) };
  }
  return { base, values: values.map((value) => (typeof value === "number" ? (value / base) * 100 : null)) };
}

/**
 * The options the overlay is built from: the group's rows, the libraries with their colours, and the plotted runs.
 *
 * @since 0.8.0
 */
export interface BuildOverlaySeriesOptions {
  /** Rows the user has hidden with the row chips; they draw nothing and take no legend entry. */
  readonly hiddenScenarioIds: ReadonlyArray<string>;
  readonly libraries: ReadonlyArray<EmbeddedLibraryMeta>;
  readonly paletteMap: Readonly<Record<string, PaletteEntry>>;
  readonly runIndices: ReadonlyArray<number>;
  readonly scenarios: ReadonlyArray<EmbeddedScenarioSeries>;
  readonly selectedScenarioId: string;
}

/**
 * The legend label of one overlay line, so a tooltip can find its row and library again.
 *
 * @since 0.8.0
 */
export function overlaySeriesLabel(scenarioId: string, libraryDisplayName: string): string {
  return `${scenarioId} · ${libraryDisplayName}`;
}

/**
 * Builds the overlay lines: each library keeps its colour family, and a row's position in its group
 * picks the shade, the dash pattern and the point shape every line of that row shares.
 *
 * @remarks A library with no data for a row in the plotted runs draws nothing, so the legend only
 * lists lines that exist.
 *
 * @since 0.8.0
 */
export function buildOverlaySeries({
  hiddenScenarioIds,
  libraries,
  paletteMap,
  runIndices,
  scenarios,
  selectedScenarioId,
}: BuildOverlaySeriesOptions): Array<OverlaySeries> {
  const series: Array<OverlaySeries> = [];

  scenarios.forEach((scenario, scenarioIndex) => {
    if (hiddenScenarioIds.includes(scenario.id)) {
      return;
    }
    const borderDash = OVERLAY_DASHES[scenarioIndex % OVERLAY_DASHES.length]!;
    const pointStyle = OVERLAY_POINT_STYLES[scenarioIndex % OVERLAY_POINT_STYLES.length]!;
    const shortLabel = rowShortLabel(scenario.id, scenario.group);

    for (const library of libraries) {
      const libraryData = scenario.libraries[library.key];
      const baseColor = paletteMap[library.key]?.border;
      if (libraryData === undefined || baseColor === undefined) {
        continue;
      }
      const color = shadeOf(baseColor, scenarioIndex);
      const data = runIndices.map((globalIx) => libraryData.hz[globalIx] ?? null);
      if (data.every((value) => value === null)) {
        continue;
      }
      series.push({
        borderDash,
        color,
        data,
        emphasized: scenario.id === selectedScenarioId,
        iqrFraction: runIndices.map((globalIx) => libraryData.iqrFraction[globalIx] ?? null),
        label: overlaySeriesLabel(shortLabel, library.displayName),
        libraryKey: library.key,
        pointStyle,
        scenarioId: scenario.id,
        shortLabel,
      });
    }
  });

  return series;
}

/**
 * The runs where at least one library measured at least one of the given rows.
 *
 * @since 0.8.0
 */
export function runIndicesWithData(
  scenarios: ReadonlyArray<EmbeddedScenarioSeries>,
  runIndices: ReadonlyArray<number>,
): Array<number> {
  return runIndices.filter((globalIx) =>
    scenarios.some((scenario) =>
      Object.values(scenario.libraries).some((library) => typeof library.hz[globalIx] === "number"),
    ),
  );
}

/**
 * Whether a logarithmic tick is worth a label: only the 1, 2 and 5 of each decade, so the axis stays legible.
 *
 * @since 0.8.0
 */
export function isSparseLogTick(value: number): boolean {
  if (!(value > 0) || !Number.isFinite(value)) {
    return false;
  }
  const mantissa = value / 10 ** Math.floor(Math.log10(value));
  return [1, 2, 5].some((step) => Math.abs(mantissa - step) < 1e-6);
}
