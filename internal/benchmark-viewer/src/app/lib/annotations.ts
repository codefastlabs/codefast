/** Vertical markers on the run axis for the points where what a series measures changed. */
import type { Chart, Plugin } from "chart.js";

import type { EmbeddedLibraryMeta, EmbeddedRun, EmbeddedScenarioSeries } from "#/types";

/**
 * One marker: the plotted point it sits on and the text drawn beside it.
 */
export interface ChartMarker {
  readonly label: string;
  readonly pointIndex: number;
}

/**
 * Markers for the runs where the suite changed the scenario's `batch` or description.
 */
export function definitionChangeMarkers(
  scenario: EmbeddedScenarioSeries,
  runIndices: ReadonlyArray<number>,
): Array<ChartMarker> {
  const markers: Array<ChartMarker> = [];
  for (const change of scenario.changes ?? []) {
    const pointIndex = runIndices.indexOf(change.runIndex);
    if (pointIndex !== -1) {
      markers.push({ label: change.label, pointIndex });
    }
  }
  return markers;
}

/**
 * Markers for the plotted runs where a library's recorded version differs from the run before.
 */
export function versionChangeMarkers(
  runs: ReadonlyArray<EmbeddedRun>,
  runIndices: ReadonlyArray<number>,
  library: EmbeddedLibraryMeta | undefined,
): Array<ChartMarker> {
  if (library === undefined) {
    return [];
  }
  const markers: Array<ChartMarker> = [];
  let previousVersion: string | undefined;
  runIndices.forEach((globalIx, pointIndex) => {
    const version = runs[globalIx]?.libraryVersions.find((entry) => entry.key === library.key)?.version;
    if (version === undefined) {
      return;
    }
    if (previousVersion !== undefined && version !== previousVersion) {
      markers.push({ label: `${library.displayName} ${previousVersion} → ${version}`, pointIndex });
    }
    previousVersion = version;
  });
  return markers;
}

const MARKER_STROKE = "rgba(253, 224, 71, 0.45)";
const MARKER_INK = "rgba(253, 224, 71, 0.85)";
const LABEL_LINE_HEIGHT = 12;

/**
 * A Chart.js plugin that draws each marker as a dashed vertical rule with its label at the top.
 *
 * @remarks Labels on the same point stack downward; drawing happens after the datasets so a rule
 * never hides a line.
 */
export function createMarkersPlugin(markers: ReadonlyArray<ChartMarker>): Plugin<"line"> {
  return {
    id: "definition-change-markers",
    afterDatasetsDraw(chart: Chart<"line">) {
      if (markers.length === 0) {
        return;
      }
      const xScale = chart.scales["x"];
      const area = chart.chartArea;
      if (!xScale) {
        return;
      }
      const { ctx } = chart;
      const stackByPoint = new Map<number, number>();
      ctx.save();
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1;
      ctx.font = "10px system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      for (const marker of markers) {
        const x = xScale.getPixelForValue(marker.pointIndex);
        if (!Number.isFinite(x) || x < area.left || x > area.right) {
          continue;
        }
        ctx.strokeStyle = MARKER_STROKE;
        ctx.beginPath();
        ctx.moveTo(x, area.top);
        ctx.lineTo(x, area.bottom);
        ctx.stroke();
        const stacked = stackByPoint.get(marker.pointIndex) ?? 0;
        stackByPoint.set(marker.pointIndex, stacked + 1);
        ctx.fillStyle = MARKER_INK;
        ctx.fillText(marker.label, x + 4, area.top + 2 + stacked * LABEL_LINE_HEIGHT);
      }
      ctx.restore();
    },
  };
}
