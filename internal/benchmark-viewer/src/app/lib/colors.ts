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
 * @remarks Seven hues at one lightness band on the dark surface, so no library outweighs another, ordered so
 * neighbours stay apart under colour-vision deficiency. Keep at least as many as the largest suite compares — the
 * `di` suite has seven — or `paletteMap`'s modulo hands two libraries the same colour.
 *
 * @since 0.3.16-canary.1
 */
export const PALETTE: ReadonlyArray<PaletteEntry> = [
  { border: "#0d9488", band: "rgba(13,148,136,0.2)", text: "rgb(187,241,234)" },
  { border: "#3b82f6", band: "rgba(59,130,246,0.18)", text: "rgb(177,210,251)" },
  { border: "#ea580c", band: "rgba(234,88,12,0.18)", text: "rgb(251,215,178)" },
  { border: "#ec4899", band: "rgba(236,72,153,0.18)", text: "rgb(249,168,212)" },
  { border: "#a855f7", band: "rgba(168,85,247,0.18)", text: "rgb(215,177,251)" },
  { border: "#16a34a", band: "rgba(22,163,74,0.2)", text: "rgb(183,245,206)" },
  { border: "#d946ef", band: "rgba(217,70,239,0.18)", text: "rgb(240,177,251)" },
];

/**
 * The line colors cycled across primary-÷-compare ratio series on the chart.
 *
 * @remarks Deliberately disjoint from {@link PALETTE} — a ratio line sharing a library's hue reads as that library's
 * series. Red and yellow come last: red sits near the orange and pink libraries, and yellow is the change rules' ink.
 *
 * @since 0.3.16-canary.1
 */
export const RATIO_COLORS = ["#22d3ee", "#a3e635", "#f87171", "#fde047"] as const;

/**
 * The plot area's background on the page, which fills hollow markers and backs an exported image.
 *
 * @since 0.10.3
 */
export const CHART_SURFACE = "#0c0c0f";

/**
 * The dash patterns cycled across the rows of a group overlay; the first row of a group draws solid.
 *
 * @since 0.8.0
 */
export const OVERLAY_DASHES: ReadonlyArray<ReadonlyArray<number>> = [[], [6, 4], [2, 3], [10, 4, 2, 4]];

/**
 * The point shapes cycled across the rows of a group overlay, so a row reads at its markers as well as its dash.
 *
 * @since 0.8.0
 */
export const OVERLAY_POINT_STYLES: ReadonlyArray<"circle" | "rect" | "rectRot" | "triangle"> = [
  "circle",
  "triangle",
  "rect",
  "rectRot",
];

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
}

/**
 * A palette hex color at the given opacity, for lines faded behind the row a reader lifts.
 *
 * @since 0.8.0
 */
export function withAlpha(hex: string, alpha: number): string {
  const [red, green, blue] = hexToRgb(hex);
  return `rgba(${String(red)},${String(green)},${String(blue)},${String(alpha)})`;
}

export { PAN_PIXELS_X, ZOOM_STEP_X } from "#app/lib/constants";
