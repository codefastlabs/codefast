/** Series for the group overlay: every row of one group plotted together, one line per row and library. */
import { OVERLAY_DASHES, OVERLAY_PALETTE } from "#/app/lib/colors";
import type { EmbeddedLibraryMeta, EmbeddedScenarioSeries } from "#/types";

/**
 * One plotted line of a group overlay, with the row and library it came from.
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
  readonly scenarioId: string;
}

/**
 * The options the overlay is built from: the group's rows, the libraries in order, and the plotted runs.
 */
export interface BuildOverlaySeriesOptions {
  readonly libraries: ReadonlyArray<EmbeddedLibraryMeta>;
  readonly runIndices: ReadonlyArray<number>;
  readonly scenarios: ReadonlyArray<EmbeddedScenarioSeries>;
  readonly selectedScenarioId: string;
}

/**
 * The legend label of one overlay line, so a tooltip can find its row and library again.
 */
export function overlaySeriesLabel(scenarioId: string, libraryDisplayName: string): string {
  return `${scenarioId} · ${libraryDisplayName}`;
}

/**
 * Builds the overlay lines: colour follows the row, dash pattern follows the library.
 *
 * @remarks A library with no data for a row in the plotted runs draws nothing, so the legend only
 * lists lines that exist.
 */
export function buildOverlaySeries({
  libraries,
  runIndices,
  scenarios,
  selectedScenarioId,
}: BuildOverlaySeriesOptions): Array<OverlaySeries> {
  const series: Array<OverlaySeries> = [];

  scenarios.forEach((scenario, scenarioIndex) => {
    const color = OVERLAY_PALETTE[scenarioIndex % OVERLAY_PALETTE.length]!;

    libraries.forEach((library, libraryIndex) => {
      const libraryData = scenario.libraries[library.key];
      if (libraryData === undefined) {
        return;
      }
      const data = runIndices.map((globalIx) => libraryData.hz[globalIx] ?? null);
      if (data.every((value) => value === null)) {
        return;
      }
      series.push({
        borderDash: OVERLAY_DASHES[libraryIndex % OVERLAY_DASHES.length]!,
        color,
        data,
        emphasized: scenario.id === selectedScenarioId,
        iqrFraction: runIndices.map((globalIx) => libraryData.iqrFraction[globalIx] ?? null),
        label: overlaySeriesLabel(scenario.id, library.displayName),
        libraryKey: library.key,
        scenarioId: scenario.id,
      });
    });
  });

  return series;
}

/**
 * The runs where at least one library measured at least one of the given rows.
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
