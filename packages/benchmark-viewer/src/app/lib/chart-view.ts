/**
 * Category-axis initial window + toolbar disabled state for the bench chart (Chart.js +
 * chartjs-plugin-zoom). Keeps scale bounds logic DRY between imperative chart setup and UI.
 */
import type { Chart } from "chart.js";

import { CHART_CATEGORY_VIEW_EPS, CHART_MIN_X_SPAN_FOR_ZOOM_IN } from "#/app/lib/constants";

/**
 * The disabled flag for each chart toolbar control at the current zoom/pan window.
 *
 * @since 0.3.16-canary.1
 */
export interface ChartToolbarDisabled {
  earlier: boolean;
  later: boolean;
  reset: boolean;
  zoomIn: boolean;
  zoomOut: boolean;
}

/**
 * The toolbar state with every control disabled, used when the chart cannot zoom or pan.
 *
 * @since 0.3.16-canary.1
 */
export const ALL_TOOLBAR_DISABLED: ChartToolbarDisabled = {
  earlier: true,
  later: true,
  reset: true,
  zoomIn: true,
  zoomOut: true,
};

/**
 * Numeric window matching what Chart shows after mount (including implicit full range when there
 * are fewer than six points). Used for Reset zoom comparison and {@link categoryXScaleWindow}.
 *
 * @since 0.3.16-canary.1
 */
export function computeInitialCategoryWindow(pointCount: number): { max: number; min: number } {
  const lastIx = pointCount - 1;
  if (pointCount <= 0) {
    return { min: 0, max: 0 };
  }
  if (pointCount < 6) {
    return { min: 0, max: lastIx };
  }
  const span = Math.min(Math.max(Math.floor(pointCount * 0.5), 18), Math.min(56, lastIx + 1));
  return { min: Math.max(0, lastIx - span + 1), max: lastIx };
}

/**
 * Optional `{ min, max }` for Chart category x-scale when we crop to the newest slice (pointCount≥6).
 * When undefined, Chart defaults to the full label range — equivalent to {@link computeInitialCategoryWindow} for short series.
 *
 * @since 0.3.16-canary.1
 */
export function categoryXScaleWindow(pointCount: number): { max: number; min: number } | undefined {
  if (pointCount < 6) {
    return undefined;
  }
  return computeInitialCategoryWindow(pointCount);
}

/**
 * A zoom/pan window kept relative to the newest point, so a rebuilt chart with a different
 * point count restores the same view of recent history.
 */
export interface RelativeCategoryView {
  readonly visibleCount: number;
  readonly offsetFromEnd: number;
}

/**
 * Captures the chart's x window relative to its newest point, or `undefined` at the default view.
 *
 * @remarks A default view stays `undefined` on purpose: the next chart should open on its own
 * default window, not inherit the previous series' window size.
 */
export function captureRelativeCategoryView(
  chart: Chart,
  initial: { max: number; min: number },
  pointCount: number,
): RelativeCategoryView | undefined {
  const xScale = chart.scales["x"];
  if (!xScale || typeof xScale.min !== "number" || typeof xScale.max !== "number" || pointCount < 2) {
    return undefined;
  }
  const eps = CHART_CATEGORY_VIEW_EPS;
  const atInitial = Math.abs(xScale.min - initial.min) < eps && Math.abs(xScale.max - initial.max) < eps;
  if (atInitial) {
    return undefined;
  }
  return { visibleCount: xScale.max - xScale.min, offsetFromEnd: pointCount - 1 - xScale.max };
}

/**
 * Maps a captured view onto a series of `pointCount` points; `undefined` means the full range.
 */
export function applyRelativeCategoryView(
  view: RelativeCategoryView,
  pointCount: number,
): { max: number; min: number } | undefined {
  if (pointCount < 2) {
    return undefined;
  }
  const lastIx = pointCount - 1;
  let max = Math.min(lastIx, Math.max(0, lastIx - view.offsetFromEnd));
  const min = Math.max(0, max - view.visibleCount);
  // Clamping at the start must not shrink the window to a sliver — keep its size where possible.
  max = Math.min(lastIx, Math.max(max, min + view.visibleCount));
  if (min <= 0 && max >= lastIx) {
    return undefined;
  }
  return { min, max };
}

/**
 * Computes which toolbar controls to disable from the chart's current x-scale window.
 *
 * @since 0.3.16-canary.1
 */
export function computeChartToolbarDisabled(
  chart: Chart,
  initial: { max: number; min: number },
  pointCount: number,
): ChartToolbarDisabled {
  if (pointCount < 2) {
    return ALL_TOOLBAR_DISABLED;
  }
  const xScale = chart.scales.x;
  if (!xScale || typeof xScale.min !== "number" || typeof xScale.max !== "number") {
    return ALL_TOOLBAR_DISABLED;
  }
  const lastIx = pointCount - 1;
  const min = xScale.min;
  const max = xScale.max;
  const span = max - min;
  const eps = CHART_CATEGORY_VIEW_EPS;

  const atFullExtent = min <= eps && max >= lastIx - eps;
  const atInitial = Math.abs(min - initial.min) < eps && Math.abs(max - initial.max) < eps;

  return {
    earlier: min <= eps,
    later: max >= lastIx - eps,
    reset: atInitial,
    zoomIn: span <= CHART_MIN_X_SPAN_FOR_ZOOM_IN,
    zoomOut: atFullExtent,
  };
}
