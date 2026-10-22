import { readFileSync } from "node:fs";

import { evaluateNumber, trimNumber } from "#css";
import { modulePath } from "#paths";

/**
 * A token as the design-system page reads it: a name, a value, and where it is used.
 *
 * @since 0.3.0
 */
export interface TailwindToken {
  name: string;
  usage: string;
  value: string;
}

/**
 * A color token whose value is the same in every scheme.
 *
 * @since 0.3.0
 */
export interface TailwindColorToken {
  name: string;
  usage: string;
  value: { dark: string; light: string };
}

/**
 * Every custom property Tailwind's default theme declares, in source order, values on one line.
 *
 * @remarks
 * Unlike the single-line reader in `#css`, this one follows a value onto the next line (the font stacks and the larger
 * text shadows are wrapped) and leaves out `--theme()` indirections, which have no literal value.
 */
const theme: Map<string, string> = new Map(
  [...readFileSync(modulePath("tailwindcss/theme.css"), "utf8").matchAll(/^[ \t]*--([\w-]+):\s*([^;]+);/gm)]
    .map((match): [string, string] => [match[1] ?? "", (match[2] ?? "").replace(/\s+/g, " ").trim()])
    .filter(([, value]) => !value.includes("--theme(")),
);

/** The default theme's declarations whose name matches `pattern`, in source order. */
function entries(pattern: RegExp): Array<[name: string, value: string]> {
  return [...theme.entries()].filter(([name]) => pattern.test(name));
}

function required(name: string): string {
  const value = theme.get(name);
  if (value === undefined) {
    throw new Error(`Tailwind's theme declares no --${name}`);
  }
  return value;
}

/**
 * Tailwind's default palette: every hue at every step, plus `black` and `white`.
 *
 * @since 0.3.0
 */
export function tailwindColors(): Array<TailwindColorToken> {
  return entries(/^color-/).map(([name, value]) => {
    const token = name.replace(/^color-/, "");
    return {
      name: token,
      usage: `Tailwind default palette, \`${token}\` in \`bg-*\`, \`text-*\` and \`border-*\`. The components read the semantic tokens above, which resolve to steps of this scale.`,
      value: { dark: value, light: value },
    };
  });
}

/**
 * Tailwind's text-size scale as type styles, named `type-<size>` so they never share a class with a Tailwind utility.
 *
 * @since 0.3.0
 */
export function tailwindTypeStyles(): Array<Record<string, unknown>> {
  return entries(/^text-[0-9a-z]+$/).map(([name, size]) => {
    const step = name.replace(/^text-/, "");
    const lineHeight = Number(trimNumber(evaluateNumber(required(`${name}--line-height`))));
    return {
      fontSize: size,
      fontWeight: 400,
      lineHeight,
      name: `type-${step}`,
      sample: "Quick brown fox",
      usage: `Tailwind \`text-${step}\`: ${size} on a ${lineHeight} line height.`,
    };
  });
}

/** Tailwind's spacing steps, the multiples of `spacing` it ships utilities for. */
const SPACING_MULTIPLES: Array<number | "px"> = [
  0,
  "px",
  0.5,
  1,
  1.5,
  2,
  2.5,
  3,
  3.5,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  14,
  16,
  20,
  24,
  28,
  32,
  36,
  40,
  44,
  48,
  52,
  56,
  60,
  64,
  72,
  80,
  96,
];

/**
 * The spacing family: the base unit and every multiple, with `known` notes where the components use a step.
 *
 * @since 0.3.0
 */
export function tailwindSpacing(known: Map<number, string>): Array<TailwindToken> {
  const base = required("spacing");
  const [, amount = "", unit = ""] = /^([\d.]+)([a-z]+)$/.exec(base) ?? [];
  return [
    {
      name: "spacing",
      usage:
        "The base unit every spacing, size and inset utility multiplies. Change this to scale the whole library's density.",
      value: base,
    },
    ...SPACING_MULTIPLES.map((step): TailwindToken => {
      if (step === "px") {
        return { name: "spacing-px", usage: "A one-pixel hairline (`border`, `size-px`, `h-px`).", value: "1px" };
      }
      const note = known.get(step);
      return {
        name: `spacing-${step}`,
        usage: note
          ? `spacing × ${step}. ${note}`
          : `spacing × ${step}: \`p-${step}\`, \`gap-${step}\`, \`size-${step}\`.`,
        value: step === 0 ? "0" : `${trimNumber(Number(amount) * step)}${unit}`,
      };
    }),
  ];
}

/**
 * Every Tailwind shadow: box, inset, drop and text. `known` carries the notes for the ones the components use.
 *
 * @since 0.3.0
 */
export function tailwindShadows(known: Record<string, string>): Array<TailwindToken> {
  return entries(/^(shadow|inset-shadow|drop-shadow|text-shadow)-[0-9a-z]+$/)
    .filter(([name]) => name !== "shadow-inner")
    .map(([name, value]) => ({
      name,
      usage: known[name] ?? `Tailwind default \`${name}\`.`,
      value,
    }));
}

/**
 * Tailwind's responsive breakpoints.
 *
 * @since 0.3.0
 */
export function tailwindBreakpoints(): Array<TailwindToken> {
  return entries(/^breakpoint-/).map(([name, value]) => {
    const step = name.replace(/^breakpoint-/, "");
    return { name, usage: `Min-width of the \`${step}:\` variant.`, value };
  });
}

/**
 * Tailwind's named container widths, plus the `video` aspect ratio.
 *
 * @since 0.3.0
 */
export function tailwindSizing(): Array<TailwindToken> {
  return [
    ...entries(/^container-/).map(([name, value]) => {
      const step = name.replace(/^container-/, "");
      return { name, usage: `\`max-w-${step}\` and the \`@${step}\` container-query variant.`, value };
    }),
    ...entries(/^aspect-/).map(([name, value]) => ({
      name,
      usage: `\`${name}\`: the ratio as a width over a height.`,
      value,
    })),
  ];
}

function plain(pattern: RegExp, usage: (name: string) => string): Array<TailwindToken> {
  return entries(pattern).map(([name, value]) => ({ name, usage: usage(name), value }));
}

/**
 * Tailwind's font weights, as the utilities name them.
 *
 * @since 0.3.0
 */
export function tailwindFontWeights(): Array<TailwindToken> {
  return plain(/^font-weight-/, (name) => `\`font-${name.replace(/^font-weight-/, "")}\`.`);
}

/**
 * Tailwind's letter-spacing steps.
 *
 * @since 0.3.0
 */
export function tailwindTracking(): Array<TailwindToken> {
  return plain(/^tracking-/, (name) => `\`${name}\`, in em so it scales with the text.`);
}

/**
 * Tailwind's named line heights.
 *
 * @since 0.3.0
 */
export function tailwindLeading(): Array<TailwindToken> {
  return plain(/^leading-/, (name) => `\`${name}\`, unitless so it scales with the text.`);
}

/**
 * Tailwind's blur radii.
 *
 * @since 0.3.0
 */
export function tailwindBlur(): Array<TailwindToken> {
  return plain(/^blur-[0-9a-z]+$/, (name) => `\`${name}\` and \`backdrop-${name}\`.`);
}

/**
 * Tailwind's 3D perspective distances.
 *
 * @since 0.3.0
 */
export function tailwindPerspective(): Array<TailwindToken> {
  return plain(/^perspective-/, (name) => `\`${name}\` for \`perspective-*\` utilities.`);
}

/**
 * Tailwind's easing curves, animations and the default transition.
 *
 * @since 0.3.0
 */
export function tailwindTransitions(): Array<TailwindToken> {
  return plain(/^(ease-|animate-|default-transition-)/, (name) =>
    name.startsWith("default-transition-")
      ? `What a bare \`transition\` utility uses for ${name.replace("default-transition-", "").replace(/-/g, " ")}.`
      : `\`${name}\`.`,
  );
}
