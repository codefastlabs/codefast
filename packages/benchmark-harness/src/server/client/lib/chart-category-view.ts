/**
 * Category-axis initial window + toolbar disabled state for the bench chart (Chart.js +
 * chartjs-plugin-zoom). Keeps scale bounds logic DRY between imperative chart setup and UI.
 */
import type { Chart } from "chart.js";

import {
  CHART_CATEGORY_VIEW_EPS,
  CHART_MIN_X_SPAN_FOR_ZOOM_IN,
} from "#/server/client/lib/constants";

export interface ChartToolbarDisabled {
  earlier: boolean;
  later: boolean;
  reset: boolean;
  zoomIn: boolean;
  zoomOut: boolean;
}

const ALL_TOOLBAR_DISABLED: ChartToolbarDisabled = {
  earlier: true,
  later: true,
  reset: true,
  zoomIn: true,
  zoomOut: true,
};

/**
 * Numeric window matching what Chart shows after mount (including implicit full range when there
 * are fewer than six points). Used for Reset zoom comparison and {@link categoryXScaleWindow}.
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
 * Optional `{ min, max }` for Chart category x-scale when we crop to the newest slice (L≥6).
 * When undefined, Chart defaults to the full label range — equivalent to {@link computeInitialCategoryWindow} for short series.
 */
export function categoryXScaleWindow(pointCount: number): { max: number; min: number } | undefined {
  if (pointCount < 6) {
    return undefined;
  }
  return computeInitialCategoryWindow(pointCount);
}

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
