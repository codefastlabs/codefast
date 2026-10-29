import { readFileSync } from "node:fs";

/** A color in Oklab with its alpha, the space the palettes are mixed in. */
interface Oklab {
  readonly alpha: number;
  readonly greenRed: number;
  readonly blueYellow: number;
  readonly lightness: number;
}

/** A color scheme a palette file declares: `:root` for light, `.dark` layered over it for dark. */
type ColorScheme = "dark" | "light";

const OKLCH = /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+)(%?))?\s*\)$/;

/** Parses an `oklch()` literal, the only form the palette files declare. */
function parseOklch(text: string): Oklab {
  const match = OKLCH.exec(text.trim());
  if (!match) {
    throw new Error(`Not an oklch() color: ${text}`);
  }
  const [, lightness = "", percent, chroma = "", hue = "", alpha, alphaPercent] = match;
  const hueRadians = (Number(hue) * Math.PI) / 180;
  return {
    alpha: alpha === undefined ? 1 : Number(alpha) / (alphaPercent ? 100 : 1),
    blueYellow: Number(chroma) * Math.sin(hueRadians),
    greenRed: Number(chroma) * Math.cos(hueRadians),
    lightness: Number(lightness) / (percent ? 100 : 1),
  };
}

/** Mixes two opaque colors in Oklab, as `color-mix(in oklab, first, second share)` does. */
function mixOklab(first: Oklab, second: Oklab, secondShare: number): Oklab {
  const lerp = (from: number, to: number) => from * (1 - secondShare) + to * secondShare;
  return {
    alpha: 1,
    blueYellow: lerp(first.blueYellow, second.blueYellow),
    greenRed: lerp(first.greenRed, second.greenRed),
    lightness: lerp(first.lightness, second.lightness),
  };
}

/** Converts Oklab to gamma-encoded sRGB channels, clipped to the gamut like a browser does. */
function toSrgb({ blueYellow, greenRed, lightness }: Oklab): [number, number, number] {
  const long = (lightness + 0.3963377774 * greenRed + 0.2158037573 * blueYellow) ** 3;
  const medium = (lightness - 0.1055613458 * greenRed - 0.0638541728 * blueYellow) ** 3;
  const short = (lightness - 0.0894841775 * greenRed - 1.291485548 * blueYellow) ** 3;
  const encode = (linear: number) => {
    const clipped = Math.min(1, Math.max(0, linear));
    return clipped <= 0.0031308 ? 12.92 * clipped : 1.055 * clipped ** (1 / 2.4) - 0.055;
  };
  return [
    encode(4.0767416621 * long - 3.3077115913 * medium + 0.2309699292 * short),
    encode(-1.2684380046 * long + 2.6097574011 * medium - 0.3413193965 * short),
    encode(-0.0041960863 * long - 0.7034186147 * medium + 1.707614701 * short),
  ];
}

/** Converts gamma-encoded sRGB channels to Oklab, the inverse of `toSrgb` inside the gamut. */
function fromSrgb(channels: [number, number, number]): Oklab {
  const [red = 0, green = 0, blue = 0] = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  const long = Math.cbrt(0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue);
  const medium = Math.cbrt(0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue);
  const short = Math.cbrt(0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue);
  return {
    alpha: 1,
    blueYellow: 0.0259040371 * long + 0.7827717662 * medium - 0.808675766 * short,
    greenRed: 1.9779984951 * long - 2.428592205 * medium + 0.4505937099 * short,
    lightness: 0.2104542553 * long + 0.793617785 * medium - 0.0040720468 * short,
  };
}

/** Composites a translucent ink over an opaque ground in gamma-encoded sRGB, as a browser paints it. */
function compositeOver(ink: Oklab, ground: Oklab): [number, number, number] {
  const [inkRed, inkGreen, inkBlue] = toSrgb(ink);
  const [groundRed, groundGreen, groundBlue] = toSrgb(ground);
  const blend = (top: number, bottom: number) => ink.alpha * top + (1 - ink.alpha) * bottom;
  return [blend(inkRed, groundRed), blend(inkGreen, groundGreen), blend(inkBlue, groundBlue)];
}

/** Computes the opaque fill a `share` tint of a color paints over a ground, as `bg-color/10` does. */
function tintOver(color: Oklab, share: number, ground: Oklab): Oklab {
  return fromSrgb(compositeOver({ ...color, alpha: share }, ground));
}

/** Computes the WCAG relative luminance of gamma-encoded sRGB channels. */
function relativeLuminance(channels: [number, number, number]): number {
  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * (red ?? 0) + 0.7152 * (green ?? 0) + 0.0722 * (blue ?? 0);
}

/** Computes the WCAG contrast ratio of two opaque colors. */
function contrastRatio(ink: Oklab, ground: Oklab): number {
  const [first, second] = [relativeLuminance(toSrgb(ink)), relativeLuminance(toSrgb(ground))];
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

/** Reads the custom properties one block of a palette file declares. */
function declarationsIn(block: string): Map<string, string> {
  return new Map(
    [...block.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(([, name = "", value = ""]) => [name, value.trim()]),
  );
}

/** Reads a palette file's tokens as one color scheme resolves them. */
function readPalette(path: string, scheme: ColorScheme): (token: string) => Oklab {
  const css = readFileSync(path, "utf8").replaceAll(/\/\*[\s\S]*?\*\//g, "");
  const darkStart = css.indexOf(".dark {");
  const tokens = declarationsIn(css.slice(0, darkStart));
  if (scheme === "dark") {
    for (const [name, value] of declarationsIn(css.slice(darkStart))) {
      tokens.set(name, value);
    }
  }
  return (token) => {
    const value = tokens.get(token);
    if (value === undefined) {
      throw new Error(`${path} declares no ${token}`);
    }
    return parseOklch(value);
  };
}

export { contrastRatio, mixOklab, readPalette, tintOver };
export type { ColorScheme, Oklab };
