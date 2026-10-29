import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";

import {
  COLOR_USAGE,
  CONTRAST_PAIRS,
  PALETTE,
  RADIUS_FULL,
  RADIUS_USAGE,
  SHADOW_USAGE,
  SPACING_STEPS,
  SYSTEM_NAME,
  TYPE_GROUPS,
} from "#config";
import { contrastRatio } from "#contrast";
import { byName, evaluateNumber, readBlock, readDeclarations, trimNumber } from "#css";
import { modulePath, repoPath, UI_ROOT } from "#paths";
import {
  tailwindBlur,
  tailwindBreakpoints,
  tailwindColors,
  tailwindFontWeights,
  tailwindLeading,
  tailwindPerspective,
  tailwindShadows,
  tailwindSizing,
  tailwindSpacing,
  tailwindTracking,
  tailwindTransitions,
  tailwindTypeStyles,
} from "#tailwind";

/** A token as the design-system page reads it: a name, a value, and where it is used. */
interface Token {
  name: string;
  usage: string;
  value: string;
}

/** A color token, valued per scheme. */
interface ColorToken {
  name: string;
  usage: string;
  value: { dark: string; light: string };
}

/**
 * One ink/ground pair that misses its WCAG minimum in at least one scheme.
 *
 * @since 0.1.0
 */
export interface ContrastShortfall {
  ground: string;
  ink: string;
  minimum: number;
  ratios: { dark: number; light: number };
  role: string;
}

/**
 * The variable font the system's type is set in, as the artifact stores it.
 *
 * @since 0.1.0
 */
export interface FontFile {
  family: string;
  source: string;
  target: string;
  weight: string;
}

/**
 * The token file plus what was learned building it.
 *
 * @since 0.1.0
 */
export interface TokenBuild {
  font: FontFile;
  shortfalls: Array<ContrastShortfall>;
  tokens: Record<string, unknown>;
}

const tailwindTheme = byName(readDeclarations(readFileSync(modulePath("tailwindcss/theme.css"), "utf8")));

function tailwindValue(name: string): string {
  const value = tailwindTheme.get(name)?.value;
  if (value === undefined) {
    throw new Error(`Tailwind's theme declares no --${name}`);
  }
  return value;
}

/** Resolves a palette value that points at a Tailwind color (`var(--color-blue-300)`) to its literal. */
function literalColor(value: string): string {
  const reference = /^var\(--(color-[\w-]+)\)$/.exec(value)?.[1];
  return reference ? tailwindValue(reference) : value;
}

function readPalette(): { colors: Array<ColorToken>; shortfalls: Array<ContrastShortfall> } {
  const css = readFileSync(join(UI_ROOT, `src/css/themes/${PALETTE}.css`), "utf8");
  const light = readBlock(css, ":root");
  const dark = byName(readBlock(css, ".dark"));
  const values = new Map(
    light.map((token) => [
      token.name,
      { dark: literalColor(dark.get(token.name)?.value ?? token.value), light: literalColor(token.value) },
    ]),
  );
  const shortfalls: Array<ContrastShortfall> = [];
  for (const pair of CONTRAST_PAIRS) {
    const ink = values.get(pair.ink);
    const ground = values.get(pair.ground);
    if (!ink || !ground) {
      throw new Error(`Contrast pair ${pair.ink} on ${pair.ground} names a token the palette lacks`);
    }
    const ratios = {
      dark: contrastRatio(ink.dark, ground.dark, pair.tint?.dark),
      light: contrastRatio(ink.light, ground.light, pair.tint?.light),
    };
    if (ratios.light === undefined || ratios.dark === undefined) {
      continue;
    }
    if (ratios.light < pair.minimum || ratios.dark < pair.minimum) {
      shortfalls.push({ ...pair, ratios: { dark: ratios.dark, light: ratios.light } });
    }
  }
  const swatch = (comment: string | undefined) => comment?.replace(/^--color-/, "") ?? "custom";
  const colors = light.map((token) => {
    const usage = COLOR_USAGE[token.name];
    if (usage === undefined) {
      throw new Error(`No usage note for color --${token.name}; add one to COLOR_USAGE`);
    }
    const flags = shortfalls
      .filter((shortfall) => shortfall.ink === token.name)
      .map(
        (shortfall) =>
          ` On \`${shortfall.ground}\` it measures ${shortfall.ratios.light.toFixed(1)}:1 light and ${shortfall.ratios.dark.toFixed(1)}:1 dark, under the ${shortfall.minimum}:1 ${shortfall.role} wants; kept exact from the source.`,
      )
      .join("");
    return {
      name: token.name,
      usage: `${usage} Light: ${swatch(token.comment)}; dark: ${swatch(dark.get(token.name)?.comment)}.${flags}`,
      value: values.get(token.name) ?? { dark: token.value, light: token.value },
    };
  });
  return { colors, shortfalls };
}

function readFont(): { families: Record<string, string>; font: FontFile } {
  const styles = byName(readDeclarations(readFileSync(repoPath("apps/web/src/styles.css"), "utf8")));
  const stack = (name: string): string => {
    const value = styles.get(name)?.value;
    if (value === undefined) {
      throw new Error(`apps/web declares no --${name}`);
    }
    const alias = /^var\(--([\w-]+)\)$/.exec(value)?.[1];
    return alias ? stack(alias) : value;
  };
  const fontsource = modulePath("@fontsource-variable/inter/index.css");
  const face = /\/\* inter-latin-wght-normal \*\/\s*@font-face\s*\{([^}]*)\}/.exec(
    readFileSync(fontsource, "utf8"),
  )?.[1];
  const family = /font-family:\s*'([^']+)'/.exec(face ?? "")?.[1];
  const weight = /font-weight:\s*([^;]+);/.exec(face ?? "")?.[1];
  const file = /src:\s*url\(\.\/([^)]+)\)/.exec(face ?? "")?.[1];
  if (!family || !weight || !file) {
    throw new Error("Could not read the latin variable face from @fontsource-variable/inter");
  }
  return {
    families: { heading: stack("font-heading"), mono: stack("font-mono"), sans: stack("font-sans") },
    font: {
      family,
      source: join(dirname(fontsource), file),
      target: `fonts/${family.replace(/\s+/g, "")}-latin.woff2`,
      weight,
    },
  };
}

function readTypeGroups(): Array<Record<string, unknown>> {
  const roles = TYPE_GROUPS.map((group) => ({
    family: group.family,
    name: group.name,
    styles: group.styles.map((style) => {
      const size = tailwindValue(`text-${style.size}`);
      const lineHeight = style.leading
        ? evaluateNumber(tailwindValue(`leading-${style.leading}`))
        : evaluateNumber(tailwindValue(`text-${style.size}--line-height`));
      return {
        fontSize: size,
        fontWeight: Number(tailwindValue(`font-weight-${style.weight}`)),
        ...(style.tracking ? { letterSpacing: tailwindValue(`tracking-${style.tracking}`) } : {}),
        lineHeight: Number(trimNumber(lineHeight)),
        name: style.name,
        sample: style.sample,
        usage: style.usage,
      };
    }),
  }));
  return [...roles, { family: "sans", name: "Tailwind scale", styles: tailwindTypeStyles() }];
}

function readRadius(): Array<Token> {
  const css = readFileSync(join(UI_ROOT, "src/css/foundation/tokens.css"), "utf8");
  const declarations = readDeclarations(css);
  const base = declarations.find((declaration) => declaration.name === "radius")?.value ?? "";
  const [, amount = "", unit = ""] = /^([\d.]+)([a-z]+)$/.exec(base) ?? [];
  const scale = declarations
    .filter((declaration) => declaration.name.startsWith("radius-"))
    .map((declaration) => {
      const factor =
        declaration.value === "var(--radius)" ? 1 : evaluateNumber(declaration.value.replace("var(--radius)", "1"));
      return { name: declaration.name, value: `${trimNumber(Number(amount) * factor)}${unit}` };
    });
  return [{ name: "radius", value: base }, ...scale]
    .map((token) => {
      const usage = RADIUS_USAGE[token.name];
      if (usage === undefined) {
        throw new Error(`No usage note for --${token.name}; add one to RADIUS_USAGE`);
      }
      return { ...token, usage };
    })
    .concat(RADIUS_FULL);
}

function readBreakpoint(): Token {
  const css = readFileSync(join(UI_ROOT, "src/css/foundation/variants.css"), "utf8");
  const value = readDeclarations(css).find((declaration) => declaration.name === "breakpoint-sidebar")?.value;
  if (!value) {
    throw new Error("The preset declares no --breakpoint-sidebar");
  }
  return {
    name: "breakpoint-sidebar",
    usage:
      "Width from which Sidebar docks instead of opening as a Sheet (the `sidebar:` variant); SidebarProvider reads the same value in JS.",
    value,
  };
}

function gitRef(): string {
  const run = (...args: Array<string>) => execFileSync("git", args, { cwd: UI_ROOT, encoding: "utf8" }).trim();
  return `${run("rev-parse", "--abbrev-ref", "HEAD")}@${run("rev-parse", "--short", "HEAD")}`;
}

/** Every family but `type` shares one namespace in the artifact; a repeated name would be dropped silently. */
function assertUniqueNames(tokens: Record<string, unknown>): void {
  const seen = new Map<string, string>();
  for (const [family, value] of Object.entries(tokens)) {
    const list = (value as { tokens?: Array<{ name: string }> } | undefined)?.tokens;
    for (const token of Array.isArray(list) ? list : []) {
      const previous = seen.get(token.name);
      if (previous !== undefined) {
        throw new Error(`Token "${token.name}" is in both ${previous} and ${family}; names are shared across families`);
      }
      seen.set(token.name, family);
    }
  }
}

/**
 * Builds `tokens.json` from the palette, the preset, Tailwind's theme and the site's typography.
 *
 * @since 0.1.0
 */
export function buildTokens(): TokenBuild {
  const { colors, shortfalls } = readPalette();
  const { families, font } = readFont();
  const tokens = {
    name: SYSTEM_NAME,
    version: 1,
    meta: {
      source: "github",
      repo: "codefastlabs/codefast",
      ref: gitRef(),
      package: "packages/ui",
      paths: {
        tokens: [
          `packages/ui/src/css/themes/${PALETTE}.css`,
          "packages/ui/src/css/foundation/tokens.css",
          "packages/ui/src/css/foundation/variants.css",
          "tailwindcss/theme.css",
        ],
        fonts: ["apps/web/src/styles.css", "@fontsource-variable/inter"],
        assets: ["apps/web/public/brand", "lucide-react"],
        docs: ["internal/design-system/content", "apps/web/src/registry"],
      },
      synced: new Date().toISOString().slice(0, 10),
    },
    color: {
      themes: [
        { id: "light", name: "Light" },
        { id: "dark", name: "Dark" },
      ],
      tokens: [...colors, ...tailwindColors()],
    },
    type: {
      fonts: [{ family: font.family, file: font.target, style: "normal", weight: font.weight }],
      families,
      groups: readTypeGroups(),
    },
    spacing: {
      note: "Tailwind 4 spacing: every `p-*`, `gap-*`, `h-*` utility is `spacing × N`. Only `spacing` drives the components; every multiple Tailwind ships is listed, with a note where the library uses it.",
      tokens: tailwindSpacing(new Map(SPACING_STEPS)),
    },
    radius: {
      note: "Every step derives from `radius`; the values here are at its default.",
      tokens: readRadius(),
    },
    shadow: {
      note: "Tailwind 4's full shadow set (box, inset, drop and text); notes mark the ones the components use. Shadows stay quiet: borders and `ring` do most of the separating.",
      tokens: tailwindShadows(SHADOW_USAGE),
    },
    breakpoint: {
      note: "Tailwind's responsive breakpoints, then the custom one the preset mints.",
      tokens: [...tailwindBreakpoints(), readBreakpoint()],
    },
    sizing: { note: "Tailwind's named container widths and aspect ratio.", tokens: tailwindSizing() },
    fontWeight: { note: "Tailwind's font weights. Inter Variable covers all nine.", tokens: tailwindFontWeights() },
    tracking: { note: "Tailwind's letter-spacing steps.", tokens: tailwindTracking() },
    leading: { note: "Tailwind's named line heights.", tokens: tailwindLeading() },
    blur: { note: "Tailwind's blur radii.", tokens: tailwindBlur() },
    perspective: { note: "Tailwind's 3D perspective distances.", tokens: tailwindPerspective() },
    transition: {
      note: "Tailwind's easing curves, animations and default transition. The preset's own motion tokens are in the brand book.",
      tokens: tailwindTransitions(),
    },
  };
  assertUniqueNames(tokens);
  return { font, shortfalls, tokens };
}
