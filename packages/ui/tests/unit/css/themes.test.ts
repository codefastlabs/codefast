import { readdirSync } from "node:fs";
import { join } from "node:path";

import { contrastRatio, mixOklab, readPalette, tintOver } from "#tests/unit/support/contrast";
import type { ColorScheme, Oklab } from "#tests/unit/support/contrast";

const themesDirectory = join(import.meta.dirname, "../../../src/css/themes");
const palettes = readdirSync(themesDirectory)
  .filter((file) => file.endsWith(".css"))
  .map((file) => file.replace(/\.css$/, ""));
const schemes: Array<ColorScheme> = ["light", "dark"];

// Headroom for the browser's 8-bit channel rounding, which this float math skips.
const margin = 0.05;
const textMinimum = 4.5 + margin;
const graphicMinimum = 3 + margin;

interface Pair {
  ground: (token: (name: string) => Oklab) => Oklab;
  ink: (token: (name: string) => Oklab) => Oklab;
  minimum: number;
  name: string;
}

/** Builds a pair of two plain tokens. */
function tokenPair(ink: string, ground: string, minimum: number, role: string): Pair {
  return {
    ground: (token) => token(ground),
    ink: (token) => token(ink),
    minimum,
    name: `${ink} on ${ground} (${role})`,
  };
}

const pairs: Array<Pair> = [
  tokenPair("--primary-foreground", "--primary", textMinimum, "default Button"),
  {
    // Mirrors `--color-primary-hover`, the hover fill of the default Button, Badge link and Bubble.
    ground: (token) => mixOklab(token("--primary"), token("--foreground"), 0.2),
    ink: (token) => token("--primary-foreground"),
    minimum: textMinimum,
    name: "--primary-foreground on the default Button's hover fill",
  },
  ...["--background", "--card", "--popover"].map((ground) =>
    tokenPair("--primary", ground, textMinimum, "text-primary and link Button"),
  ),
  ...["--background", "--card", "--popover", "--muted"].map((ground) =>
    tokenPair("--muted-foreground", ground, textMinimum, "secondary text"),
  ),
  tokenPair("--sidebar-primary-foreground", "--sidebar-primary", textMinimum, "sidebar primary"),
  ...["--background", "--card", "--popover", "--muted", "--sidebar"].map((ground) =>
    tokenPair("--ring", ground, graphicMinimum, "focus outline"),
  ),
  tokenPair("--sidebar-ring", "--sidebar", graphicMinimum, "sidebar focus ring"),
  ...["--background", "--card", "--popover"].map((ground) =>
    tokenPair("--destructive", ground, textMinimum, "error text and destructive focus outline"),
  ),
];

/** The shares of `--destructive` the destructive Button, Badge, Bubble and menu items fill with, at rest and hovered. */
const destructiveTints: Record<ColorScheme, Array<number>> = { dark: [0.2, 0.25], light: [0.1, 0.15] };

/** Builds the pairs of `--destructive` text on its own tint over each ground, for one scheme's tints. */
function destructiveTintPairs(scheme: ColorScheme): Array<Pair> {
  return destructiveTints[scheme].flatMap((share) =>
    ["--background", "--card", "--popover"].map((ground) => ({
      ground: (token) => tintOver(token("--destructive"), share, token(ground)),
      ink: (token) => token("--destructive"),
      minimum: textMinimum,
      name: `--destructive on its ${share * 100}% tint over ${ground} (destructive Button, Badge, Bubble)`,
    })),
  );
}

describe.each(palettes)("%s palette", (palette) => {
  describe.each(schemes)("%s", (scheme) => {
    const token = readPalette(join(themesDirectory, `${palette}.css`), scheme);

    test.each([...pairs, ...destructiveTintPairs(scheme)])("$name meets $minimum:1", ({ ground, ink, minimum }) => {
      expect(contrastRatio(ink(token), ground(token))).toBeGreaterThanOrEqual(minimum);
    });
  });
});
