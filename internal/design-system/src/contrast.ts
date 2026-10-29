/** Converts an opaque `oklch()` color to gamma-encoded sRGB channels, or `undefined` for anything else. */
function encodedSrgb(color: string): [number, number, number] | undefined {
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
  const encode = (channel: number) => {
    const clipped = Math.min(1, Math.max(0, channel));
    return clipped <= 0.0031308 ? 12.92 * clipped : 1.055 * clipped ** (1 / 2.4) - 0.055;
  };
  return [
    encode(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    encode(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    encode(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

/** Computes the WCAG relative luminance of gamma-encoded sRGB channels. */
function relativeLuminance(channels: [number, number, number]): number {
  const [red = 0, green = 0, blue = 0] = channels.map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

/**
 * Computes the WCAG contrast ratio of two opaque `oklch()` colors, or `undefined` when either is not one.
 *
 * @remarks
 * A `tint` reads the ink on that share of itself laid over the ground, composited in gamma-encoded sRGB the way a
 * browser paints `bg-destructive/10`.
 *
 * @since 0.1.0
 */
export function contrastRatio(ink: string, ground: string, tint = 0): number | undefined {
  const inkChannels = encodedSrgb(ink);
  const groundChannels = encodedSrgb(ground);
  if (inkChannels === undefined || groundChannels === undefined) {
    return undefined;
  }
  const [inkRed, inkGreen, inkBlue] = inkChannels;
  const [groundRed, groundGreen, groundBlue] = groundChannels;
  const blend = (top: number, bottom: number) => tint * top + (1 - tint) * bottom;
  const first = relativeLuminance(inkChannels);
  const second = relativeLuminance([
    blend(inkRed, groundRed),
    blend(inkGreen, groundGreen),
    blend(inkBlue, groundBlue),
  ]);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}
