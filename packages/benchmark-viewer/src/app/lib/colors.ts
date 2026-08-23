/**
 * The border, band-fill, and text colors assigned to one library's series.
 *
 * @since 0.3.16-canary.1
 */
export interface PaletteEntry {
  border: string;
  band: string;
  text: string;
}

/**
 * The color palette cycled across libraries in charts, metrics, and tables.
 *
 * @since 0.3.16-canary.1
 */
export const PALETTE: ReadonlyArray<PaletteEntry> = [
  { border: "#6ee7c5", band: "rgba(110,231,197,0.18)", text: "rgb(167,243,208)" },
  { border: "#93b4ff", band: "rgba(147,180,255,0.16)", text: "rgb(186,213,254)" },
  { border: "#fbbf77", band: "rgba(251,191,119,0.16)", text: "rgb(253,224,169)" },
  { border: "#f472b6", band: "rgba(244,114,182,0.16)", text: "rgb(249,168,212)" },
  { border: "#a78bfa", band: "rgba(167,139,250,0.16)", text: "rgb(196,181,253)" },
];

/**
 * The line colors cycled across primary-÷-compare ratio series on the chart.
 *
 * @since 0.3.16-canary.1
 */
export const RATIO_COLORS = ["#fbbf77", "#f472b6", "#a78bfa", "#34d399"] as const;

export { DISPERSION_IQR_ALERT, PAN_PIXELS_X, ZOOM_STEP_X } from "#/app/lib/constants";
