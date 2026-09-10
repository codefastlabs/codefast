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
// Seven hues spread for the widest pairwise separation (so no two lines read alike), each also kept
// clear of the ratio colours. Keep at least as many as the largest suite compares (the `di` suite has
// seven), or `paletteMap`'s modulo would hand two libraries the same colour.
export const PALETTE: ReadonlyArray<PaletteEntry> = [
  { border: "#2dd4bf", band: "rgba(45,212,191,0.18)", text: "rgb(187,241,234)" },
  { border: "#60a5fa", band: "rgba(96,165,250,0.16)", text: "rgb(177,210,251)" },
  { border: "#f59e42", band: "rgba(245,158,66,0.16)", text: "rgb(251,215,178)" },
  { border: "#f472b6", band: "rgba(244,114,182,0.16)", text: "rgb(249,168,212)" },
  { border: "#a855f7", band: "rgba(168,85,247,0.16)", text: "rgb(215,177,251)" },
  { border: "#86efac", band: "rgba(134,239,172,0.16)", text: "rgb(183,245,206)" },
  { border: "#f0abfc", band: "rgba(240,171,252,0.16)", text: "rgb(240,177,251)" },
];

/**
 * The line colors cycled across primary-÷-compare ratio series on the chart.
 *
 * @remarks Deliberately disjoint from {@link PALETTE} — a ratio line sharing a library's hue
 * reads as that library's series.
 *
 * @since 0.3.16-canary.1
 */
export const RATIO_COLORS = ["#f87171", "#22d3ee", "#a3e635", "#fde047"] as const;

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
 * A palette hex color at the given opacity, for lines that should recede behind the emphasised one.
 *
 * @since 0.8.0
 */
export function withAlpha(hex: string, alpha: number): string {
  const [red, green, blue] = hexToRgb(hex);
  return `rgba(${String(red)},${String(green)},${String(blue)},${String(alpha)})`;
}

function rgbToHsl(red: number, green: number, blue: number): [number, number, number] {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  if (max === min) {
    return [0, 0, lightness];
  }
  const delta = max - min;
  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let hue: number;
  if (max === r) {
    hue = (g - b) / delta + (g < b ? 6 : 0);
  } else if (max === g) {
    hue = (b - r) / delta + 2;
  } else {
    hue = (r - g) / delta + 4;
  }
  return [hue / 6, saturation, lightness];
}

function hslToHex(hue: number, saturation: number, lightness: number): string {
  const channel = (offset: number): string => {
    const k = (hue * 12 + offset) % 12;
    const a = saturation * Math.min(lightness, 1 - lightness);
    const value = lightness - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(value * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}

/** Lightness and saturation offsets per row within one library's colour family; the first row is the base. */
const SHADE_STEPS: ReadonlyArray<readonly [lightness: number, saturation: number]> = [
  [0, 0],
  [0.16, -0.05],
  [-0.14, 0.05],
  [0.3, -0.25],
];

/**
 * The shade a row takes inside its library's colour family: the base hue, moved in lightness far
 * enough to tell apart on a dark background.
 *
 * @since 0.8.0
 */
export function shadeOf(hex: string, step: number): string {
  const [lightnessOffset, saturationOffset] = SHADE_STEPS[step % SHADE_STEPS.length]!;
  if (lightnessOffset === 0 && saturationOffset === 0) {
    return hex;
  }
  const [hue, saturation, lightness] = rgbToHsl(...hexToRgb(hex));
  return hslToHex(
    hue,
    Math.min(1, Math.max(0, saturation + saturationOffset)),
    Math.min(0.92, Math.max(0.2, lightness + lightnessOffset)),
  );
}

export { PAN_PIXELS_X, ZOOM_STEP_X } from "#/app/lib/constants";
