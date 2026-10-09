/** Converts an opaque `oklch()` color to its WCAG relative luminance, or `undefined` for anything else. */
function relativeLuminance(color: string): number | undefined {
  const match = /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+|none)\s*(?:\/\s*([\d.]+)(%?))?\s*\)$/.exec(color);
  if (!match) {
    return undefined;
  }
  const [, lightnessText = "", percent, chromaText = "", hueText = "", alphaText, alphaPercent] = match;
  const alpha = alphaText === undefined ? 1 : Number(alphaText) / (alphaPercent ? 100 : 1);
  if (alpha < 1) {
    return undefined;
  }
  const lightness = Number(lightnessText) / (percent ? 100 : 1);
  const chroma = Number(chromaText);
  const hue = hueText === "none" ? 0 : (Number(hueText) * Math.PI) / 180;
  const a = chroma * Math.cos(hue);
  const b = chroma * Math.sin(hue);
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const clamp = (channel: number) => Math.min(1, Math.max(0, channel));
  const red = clamp(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s);
  const green = clamp(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s);
  const blue = clamp(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

/**
 * Computes the WCAG contrast ratio of two opaque `oklch()` colors, or `undefined` when either is not one.
 *
 * @since 0.1.0
 */
export function contrastRatio(ink: string, ground: string): number | undefined {
  const first = relativeLuminance(ink);
  const second = relativeLuminance(ground);
  if (first === undefined || second === undefined) {
    return undefined;
  }
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}
