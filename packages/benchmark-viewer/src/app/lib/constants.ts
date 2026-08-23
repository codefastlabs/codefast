/**
 * The zoom factor one toolbar zoom-in/out click applies to the chart's x axis.
 *
 * @since 0.3.16-canary.1
 */
export const ZOOM_STEP_X = 1.15;
/**
 * The distance in pixels one earlier/later pan click moves the chart along the x axis.
 *
 * @since 0.3.16-canary.1
 */
export const PAN_PIXELS_X = 120;
/**
 * The IQR÷median fraction above which a plotted run counts as high dispersion.
 *
 * @since 0.3.16-canary.1
 */
export const DISPERSION_IQR_ALERT = 0.25;

/**
 * Compares Chart.js category-axis min/max after zoom/pan (fractional indices allowed).
 *
 * @since 0.3.16-canary.1
 */
export const CHART_CATEGORY_VIEW_EPS = 0.12;
/**
 * Zoom-in disabled when visible span (indices) is at or below this width.
 *
 * @since 0.3.16-canary.1
 */
export const CHART_MIN_X_SPAN_FOR_ZOOM_IN = 1.22;
