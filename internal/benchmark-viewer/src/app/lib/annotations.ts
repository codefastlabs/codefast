/** Vertical markers on the run axis for the points where what a series measures changed. */
import type { Chart, Plugin } from "chart.js";

import type { EmbeddedLibraryMeta, EmbeddedRun, EmbeddedScenarioSeries } from "#types";

/**
 * One marker: the plotted point it sits on and the text drawn beside it.
 *
 * @since 0.8.0
 */
export interface ChartMarker {
  readonly label: string;
  readonly pointIndex: number;
}

/**
 * Markers for the runs where the suite changed the scenario's `batch` or description.
 *
 * @since 0.8.0
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
 *
 * @since 0.8.0
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
const LABEL_PLATE = "rgba(10, 10, 12, 0.82)";
const LABEL_FONT_SIZE = 12;
const LABEL_LINE_HEIGHT = 16;
const LABEL_OFFSET = 4;
const LABEL_PADDING = 3;

/**
 * Where one marker label lands: the lane it stacks in, counted from the top, and the left edge of its text.
 *
 * @since 0.10.3
 */
export interface MarkerLabelPlacement {
  readonly lane: number;
  readonly left: number;
}

/**
 * Places marker labels so no two overlap: each sits right of its rule, or left of it when it would run past the right
 * edge, in the topmost lane where it clears every label already there.
 *
 * @remarks Placements come back in the order of `labels`; they are laid out left to right by rule position.
 *
 * @since 0.10.3
 */
export function layoutMarkerLabels(
  labels: ReadonlyArray<{ readonly x: number; readonly width: number }>,
  bounds: { readonly left: number; readonly right: number },
  gap: number,
): Array<MarkerLabelPlacement> {
  const placements = new Map<number, MarkerLabelPlacement>();
  const lanes: Array<Array<readonly [number, number]>> = [];
  const order = labels.map((_, index) => index).toSorted((a, b) => labels[a]!.x - labels[b]!.x);
  for (const index of order) {
    const { x, width } = labels[index]!;
    const fitsRight = x + LABEL_OFFSET + width <= bounds.right;
    const left = fitsRight ? x + LABEL_OFFSET : Math.max(bounds.left, x - LABEL_OFFSET - width);
    const right = left + width;
    let lane = lanes.findIndex((spans) => spans.every(([start, end]) => right + gap <= start || left >= end + gap));
    if (lane === -1) {
      lane = lanes.length;
      lanes.push([]);
    }
    lanes[lane]!.push([left, right]);
    placements.set(index, { lane, left });
  }
  return labels.map((_, index) => placements.get(index)!);
}

/**
 * A Chart.js plugin that draws each marker as a dashed vertical rule with its label at the top.
 *
 * @remarks Labels stack into lanes so none overlap, and draw on a plate after every rule so no rule crosses their text;
 * drawing happens after the datasets so a rule never hides a line.
 *
 * @since 0.8.0
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
      const visible = markers
        .map((marker) => ({ label: marker.label, x: xScale.getPixelForValue(marker.pointIndex) }))
        .filter(({ x }) => Number.isFinite(x) && x >= area.left && x <= area.right);
      ctx.save();
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1;
      ctx.strokeStyle = MARKER_STROKE;
      for (const { x } of visible) {
        ctx.beginPath();
        ctx.moveTo(x, area.top);
        ctx.lineTo(x, area.bottom);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.font = `${LABEL_FONT_SIZE}px system-ui, sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      const widths = visible.map(({ label }) => ctx.measureText(label).width);
      const placements = layoutMarkerLabels(
        visible.map(({ x }, index) => ({ x, width: widths[index]! })),
        { left: area.left + LABEL_PADDING, right: area.right - LABEL_PADDING },
        LABEL_PADDING * 2,
      );
      visible.forEach(({ label }, index) => {
        const { lane, left } = placements[index]!;
        const top = area.top + 2 + lane * LABEL_LINE_HEIGHT;
        ctx.fillStyle = LABEL_PLATE;
        ctx.beginPath();
        ctx.roundRect(left - LABEL_PADDING, top, widths[index]! + LABEL_PADDING * 2, LABEL_LINE_HEIGHT - 1, 3);
        ctx.fill();
        ctx.fillStyle = MARKER_INK;
        ctx.fillText(label, left, top + LABEL_LINE_HEIGHT / 2);
      });
      ctx.restore();
    },
  };
}
