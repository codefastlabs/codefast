/**
 * A generated corpus of everything a resolver can be asked, so a change can be checked against work
 * nobody thought to write a test for.
 *
 * The unit tests assert the behaviour someone considered. This walks a sweep instead — every variant
 * value, every pair, every slot with every variant overridden, every odd value a caller can pass —
 * and replays it with recurring caller classes, because a resolver that remembers must answer the
 * second pass exactly as it answered the first.
 */

import { extendTailwindMerge } from "cn/config";

import { createTV, tv } from "#index";
import type { TailwindVariantsOptions } from "#types";

type AnyConfig = Record<string, unknown>;
type AnyResolver = (props?: Record<string, unknown>) => unknown;

interface SweepCase {
  readonly config: AnyConfig;
  /** Variant pairs crossed value by value; every pair when omitted. */
  readonly crossedPairs?: ReadonlyArray<readonly [string, string]>;
  /** Drives each selection with fewer caller classes and no per-slot props, so a corpus of thousands stays fast. */
  readonly isLarge?: boolean;
  readonly name: string;
  readonly options?: TailwindVariantsOptions;
}

const BUTTON: AnyConfig = {
  base: "inline-flex px-4 py-2 text-sm",
  compoundVariants: [
    { class: "shadow-lg", size: "lg", variant: "primary" },
    { class: "ring-2", disabled: true, variant: "primary" },
    { class: "italic", size: ["sm", "lg"] },
    { className: "underline", loud: true },
    { class: "outline", disabled: false, loud: [false, null] },
    { class: "isolate", layer: 0 },
  ],
  defaultVariants: { size: "md", variant: "primary" },
  variants: {
    disabled: { false: "opacity-100", true: "opacity-50 px-2" },
    // `""` is spelled `"false"` by every lane, so this group's empty key is never selected.
    layer: { "": "z-auto", 0: "z-0", 1: "z-10" },
    loud: { true: "uppercase" },
    size: { lg: "px-8 text-lg", md: "px-4 text-base", sm: "px-2 text-xs" },
    variant: {
      ghost: "bg-transparent",
      primary: "bg-blue-500 text-white",
      secondary: ["bg-gray-500", ["text-black", { "hover:bg-gray-600": true, hidden: false }]],
    },
  },
};

const CARD: AnyConfig = {
  base: "block",
  compoundSlots: [
    { class: "gap-1", size: "sm", slots: ["header", "footer"] },
    { className: "gap-4", size: "lg", slots: ["header", "footer", "missing"] },
    { class: "ring-1", elevated: false, slots: ["title", "footer", "title"] },
  ],
  compoundVariants: [
    { class: { base: "ring", title: "font-black" }, size: "lg", tone: "loud" },
    { class: { title: "underline" }, className: "shadow-xl", elevated: true, size: ["lg", "sm"] },
  ],
  defaultVariants: { size: "md", tone: "quiet" },
  slots: {
    base: "rounded border",
    footer: "p-6 pt-0",
    header: "flex p-6",
    title: "text-xl",
  },
  variants: {
    bordered: { false: "", true: { base: "border-4" } },
    // A plain string in a slot configuration styles `base` alone, on every lane.
    elevated: { false: "shadow-none", true: "shadow-md" },
    size: {
      lg: { base: "max-w-lg", footer: "p-8", header: "p-8", title: "text-3xl" },
      md: { base: "max-w-md" },
      sm: { base: "max-w-sm", header: "p-3", title: "text-lg" },
    },
    tone: {
      loud: { base: "border-red-500", title: "text-red-700" },
      quiet: "opacity-90",
    },
  },
};

/** A compound condition on a variant the configuration never declares. */
const UNDECLARED_COMPOUND: AnyConfig = {
  base: "block",
  compoundVariants: [{ class: "text-red-500", ghost: true, size: "sm" }],
  defaultVariants: { size: "md" },
  variants: { size: { md: "p-4", sm: "p-2" } },
};

const NO_VARIANTS: AnyConfig = { base: ["a", ["b", { c: true, d: false }]] };
const EMPTY: AnyConfig = {};
const SLOTS_ONLY: AnyConfig = { slots: { base: "flex", label: "text-sm" } };

const EXTENDED: AnyConfig = {
  base: "font-medium",
  extend: tv(BUTTON as never),
  variants: { size: { sm: "tracking-tight" }, tone: { dark: "bg-black" } },
};

/** Variant groups whose every value's classes name the group and the value, every other one a slot map when slotted. */
const manyGroups = (groupCount: number, valueCount: number, slotted: boolean): Record<string, unknown> => {
  const groups: Record<string, Record<string, unknown>> = {};

  for (let group = 0; group < groupCount; group++) {
    const values: Record<string, unknown> = {};

    for (let value = 0; value < valueCount; value++) {
      const classes = `g${String(group)}-v${String(value)} p-${String(value % 7)}`;

      values[`v${String(value)}`] = slotted && value % 2 === 1 ? { item: classes } : classes;
    }

    groups[`g${String(group)}`] = values;
  }

  return groups;
};

/** Eleven groups of thirty values: past one safe integer, so the key spans two parts, the last group in the second. */
const WIDE: AnyConfig = { base: "grid px-1", variants: manyGroups(11, 30, false) };

/** Enough selections for the slot store to retire a generation and promote out of it. */
const WIDE_SLOTS: AnyConfig = {
  compoundSlots: [{ class: "ring", g0: "v1", slots: ["item"] }],
  slots: { base: "flex", item: "px-2" },
  variants: manyGroups(2, 52, true),
};

const CASES: ReadonlyArray<SweepCase> = [
  { config: BUTTON, name: "button/merge" },
  { config: BUTTON, name: "button/no-merge", options: { twMerge: false } },
  {
    config: BUTTON,
    name: "button/merge-config",
    options: {
      twMerge: extendTailwindMerge({ extend: { classGroups: { "font-size": [{ text: ["tiny", "huge"] }] } } }),
    },
  },
  { config: CARD, name: "card/merge" },
  { config: CARD, name: "card/no-merge", options: { twMerge: false } },
  { config: UNDECLARED_COMPOUND, name: "undeclared-compound/merge" },
  { config: UNDECLARED_COMPOUND, name: "undeclared-compound/no-merge", options: { twMerge: false } },
  { config: NO_VARIANTS, name: "no-variants/merge" },
  { config: EMPTY, name: "empty/merge" },
  { config: SLOTS_ONLY, name: "slots-only/merge" },
  { config: EXTENDED, name: "extended/merge" },
  { config: EXTENDED, name: "extended/no-merge", options: { twMerge: false } },
  {
    config: WIDE,
    crossedPairs: [
      ["g0", "g10"],
      ["g1", "g10"],
      ["g2", "g9"],
    ],
    isLarge: true,
    name: "wide/merge",
  },
  { config: WIDE_SLOTS, crossedPairs: [["g0", "g1"]], isLarge: true, name: "wide-slots/merge" },
];

const CUSTOM_CLASSES: ReadonlyArray<readonly [string, unknown]> = [
  ["none", undefined],
  ["null", null],
  ["empty", ""],
  ["string", "custom px-1"],
  ["array", ["custom", ["nested", { off: false, on: true }]]],
  ["object", { "text-blue-500": false, "text-red-500": true }],
];

const LARGE_CUSTOM_CLASSES = CUSTOM_CLASSES.filter(([name]) => name === "none" || name === "string");

/** The caller classes per-slot props are driven with, the rest only reach the bare slot. */
const OVERRIDE_CUSTOM_CLASSES = new Set(["none", "string", "array"]);

/**
 * Caller classes the replay passes after a call without one: a string seen three times, so a
 * selection remembers it, then enough distinct ones for a merged selection to settle its prefix.
 */
const REPLAY_CLASSES: ReadonlyArray<readonly [string, string]> = [
  ["className", "custom px-1"],
  ["class", "custom px-1"],
  ["className", "custom px-1"],
  ["className", "px-6"],
  ["class", "text-lg font-bold"],
  ["className", "p-3 m-1"],
  ["class", "bg-red-500 px-2"],
  ["className", "px-6"],
  ["class", "text-lg font-bold"],
];

const LARGE_REPLAY_CLASSES = REPLAY_CLASSES.slice(0, 4);

/**
 * Values a caller can pass that no variant group declares, plus the ones that collide with a group
 * key once stringified — `true` and `"true"` select the same classes and compare differently — and
 * the inherited keys of a plain object, which any id table must not mistake for its own.
 */
const ODD_VALUES: ReadonlyArray<unknown> = [
  undefined,
  null,
  "nope",
  "",
  0,
  -0,
  1,
  1n,
  "0",
  "1",
  true,
  false,
  "true",
  "false",
  "null",
  "undefined",
  "toString",
  "constructor",
  "hasOwnProperty",
  "valueOf",
  "__proto__",
  Number.NaN,
  Symbol("odd"),
  { lg: true },
  ["lg"],
  () => "lg",
  Object.assign(() => undefined, { toString: () => "lg" }),
];

/** Odd values per-slot props are driven with, beside every key of every group. */
const SLOT_ODD_VALUES: ReadonlyArray<unknown> = [undefined, null, "nope", "", 0, false, true, "__proto__"];

const toSelectionValue = (groupKey: string): unknown => {
  if (groupKey === "true") {
    return true;
  }

  return groupKey === "false" ? false : groupKey;
};

const variantGroupsOf = (config: AnyConfig): Record<string, Record<string, unknown>> => {
  return (config.variants ?? {}) as Record<string, Record<string, unknown>>;
};

const variantSweep = (
  config: AnyConfig,
  crossedPairs?: ReadonlyArray<readonly [string, string]>,
): ReadonlyArray<Record<string, unknown>> => {
  const variants = variantGroupsOf(config);
  const names = Object.keys(variants);
  const sweep: Array<Record<string, unknown>> = [{}];

  for (const name of names) {
    for (const groupKey of Object.keys(variants[name] ?? {})) {
      sweep.push({ [name]: toSelectionValue(groupKey) });
    }

    for (const odd of ODD_VALUES) {
      sweep.push({ [name]: odd });
    }
  }

  // Pairs, so a compound condition that needs two variants at once is actually reached.
  const pairs: Array<readonly [string, string]> = [];

  if (crossedPairs === undefined) {
    for (const first of names) {
      for (const second of names) {
        if (first < second) {
          pairs.push([first, second]);
        }
      }
    }
  } else {
    pairs.push(...crossedPairs);
  }

  for (const [first, second] of pairs) {
    for (const firstKey of Object.keys(variants[first] ?? {})) {
      for (const secondKey of Object.keys(variants[second] ?? {})) {
        sweep.push({ [first]: toSelectionValue(firstKey), [second]: toSelectionValue(secondKey) });
      }
    }
  }

  return sweep;
};

/** Per-slot props overriding every variant with each of its keys and the odd values, one variant at a time. */
const slotOverrides = (config: AnyConfig): ReadonlyArray<Record<string, unknown>> => {
  const variants = variantGroupsOf(config);
  const overrides: Array<Record<string, unknown>> = [{}];

  for (const name of Object.keys(variants)) {
    for (const groupKey of Object.keys(variants[name] ?? {})) {
      overrides.push({ [name]: toSelectionValue(groupKey) });
    }

    for (const odd of SLOT_ODD_VALUES) {
      overrides.push({ [name]: odd });
    }
  }

  return overrides;
};

/** Whether a selection names only declared keys, which is where per-slot props are worth driving. */
const isDeclaredSelection = (config: AnyConfig, selection: Record<string, unknown>): boolean => {
  const variants = variantGroupsOf(config);

  return Object.keys(selection).every((name) => {
    const value = selection[name];

    return typeof value === "string" || typeof value === "boolean"
      ? Object.hasOwn(variants[name] ?? {}, String(value))
      : false;
  });
};

const stable = (value: unknown): string => {
  return JSON.stringify(value, (_key, inner: unknown) => {
    if (typeof inner === "bigint") {
      return `${String(inner)}n`;
    }

    if (typeof inner === "symbol" || typeof inner === "function") {
      return `[${typeof inner}]`;
    }

    if (Object.is(inner, -0)) {
      return "-0";
    }

    if (typeof inner !== "object" || inner === null || Array.isArray(inner)) {
      return inner;
    }

    const record = inner as Record<string, unknown>;

    return Object.fromEntries(
      Object.keys(record)
        .sort()
        .map((key) => [key, record[key]]),
    );
  });
};

/**
 * How a sweep reaches its resolvers: one per case, or a fresh one for every call.
 *
 * @remarks A fresh resolver per call keeps every answer on the first-call lane, which resolves the
 * configuration directly rather than through a compiled plan.
 */
export interface SweepRun {
  readonly freshResolverPerCall?: boolean;
}

/**
 * Every outcome the corpus produces, one line each, under the given options.
 *
 * @param options - merged over each case's own, so one sweep can be run twice and compared
 * @param run - how resolvers are obtained; the default shares one per case
 */
export const collectSweepOutcomes = (options: TailwindVariantsOptions, run: SweepRun = {}): ReadonlyArray<string> => {
  const lines: Array<string> = [];

  for (const sweepCase of CASES) {
    const define = (): AnyResolver => {
      // tsc infers a resolver over `Record<string, never>` props here, which the linter's checker misses.
      // oxlint-disable-next-line typescript/no-unnecessary-type-assertion
      return tv(sweepCase.config as never, { ...sweepCase.options, ...options }) as AnyResolver;
    };
    const shared = define();
    const resolver: AnyResolver = run.freshResolverPerCall ? (props) => define()(props) : shared;
    const sweep = variantSweep(sweepCase.config, sweepCase.crossedPairs);
    const overrides = sweepCase.isLarge ? [] : slotOverrides(sweepCase.config);
    const customClasses = sweepCase.isLarge ? LARGE_CUSTOM_CLASSES : CUSTOM_CLASSES;

    for (const selection of sweep) {
      const overridesHere = isDeclaredSelection(sweepCase.config, selection) ? overrides : [];

      for (const [customName, customValue] of customClasses) {
        for (const propertyName of ["className", "class"]) {
          const result = resolver({ ...selection, [propertyName]: customValue });
          const label = `${sweepCase.name} :: ${stable(selection)} :: ${propertyName}=${customName}`;

          if (typeof result !== "object" || result === null) {
            lines.push(`${label} :: ${String(result)}`);
            continue;
          }

          const slots = result as Record<string, AnyResolver>;

          for (const slotName of Object.keys(slots).sort()) {
            lines.push(`${label} :: ${slotName} :: ${String(slots[slotName]?.())}`);

            if (!OVERRIDE_CUSTOM_CLASSES.has(customName)) {
              continue;
            }

            // A slot called with props re-resolves from scratch; drive that lane with every variant.
            for (const override of overridesHere) {
              const slotProps = { ...override, [propertyName]: customValue };

              lines.push(`${label} :: ${slotName} :: ${stable(override)} :: ${String(slots[slotName]?.(slotProps))}`);
            }
          }
        }
      }
    }

    // The whole sweep again, with recurring caller classes: anything remembered must answer identically.
    const replayClasses = sweepCase.isLarge ? LARGE_REPLAY_CLASSES : REPLAY_CLASSES;

    for (const selection of sweep) {
      const label = `${sweepCase.name} :: replay :: ${stable(selection)}`;
      const bare = resolver({ ...selection });

      if (typeof bare !== "object" || bare === null) {
        lines.push(`${label} :: ${String(bare)}`);

        for (const [propertyName, className] of replayClasses) {
          lines.push(
            `${label} :: ${propertyName}=${className} :: ${String(resolver({ ...selection, [propertyName]: className }))}`,
          );
        }

        continue;
      }

      const slots = bare as Record<string, AnyResolver>;

      for (const slotName of Object.keys(slots).sort()) {
        lines.push(`${label} :: ${slotName} :: ${String(slots[slotName]?.())}`);

        for (const [propertyName, className] of replayClasses) {
          const answer = slots[slotName]?.({ [propertyName]: className });

          lines.push(`${label} :: ${slotName} :: ${propertyName}=${className} :: ${String(answer)}`);
        }
      }
    }
  }

  // The factory reaches `tv` by a different path, so it gets its own pass.
  for (const twMerge of [true, false]) {
    const api = createTV({ ...options, twMerge });
    const scoped = api.tv(BUTTON as never) as AnyResolver;

    for (const selection of variantSweep(BUTTON)) {
      const answer = run.freshResolverPerCall ? (api.tv(BUTTON as never) as AnyResolver)(selection) : scoped(selection);

      lines.push(`createTV(${String(twMerge)}) :: ${stable(selection)} :: ${String(answer)}`);
    }
  }

  return lines;
};
