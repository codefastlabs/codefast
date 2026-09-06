/**
 * A generated corpus of everything a resolver can be asked, so a change can be checked against work
 * nobody thought to write a test for.
 *
 * The unit tests assert the behaviour someone considered. This walks a sweep instead — every variant
 * value, every pair, every slot with and without per-slot props, every odd value a caller can pass —
 * and runs the whole thing twice, because a resolver that remembers must answer the second pass
 * exactly as it answered the first.
 */

import { createTV, tv } from "#/index";
import type { TailwindVariantsOptions } from "#/types";

type AnyConfig = Record<string, unknown>;
type AnyResolver = (props?: Record<string, unknown>) => unknown;

interface SweepCase {
  readonly config: AnyConfig;
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
  ],
  defaultVariants: { size: "md", variant: "primary" },
  variants: {
    disabled: { false: "opacity-100", true: "opacity-50 px-2" },
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
  ],
  compoundVariants: [{ class: { base: "ring", title: "font-black" }, size: "lg", tone: "loud" }],
  defaultVariants: { size: "md", tone: "quiet" },
  slots: {
    base: "rounded border",
    footer: "p-6 pt-0",
    header: "flex p-6",
    title: "text-xl",
  },
  variants: {
    bordered: { false: "", true: { base: "border-4" } },
    size: {
      lg: { base: "max-w-lg", footer: "p-8", header: "p-8", title: "text-3xl" },
      md: { base: "max-w-md" },
      sm: { base: "max-w-sm", header: "p-3", title: "text-lg" },
    },
    tone: {
      loud: { base: "border-red-500", title: "text-red-700" },
      quiet: "",
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

const CASES: ReadonlyArray<SweepCase> = [
  { config: BUTTON, name: "button/merge" },
  { config: BUTTON, name: "button/no-merge", options: { twMerge: false } },
  {
    config: BUTTON,
    name: "button/merge-config",
    options: { twMergeConfig: { extend: { classGroups: { "font-size": [{ text: ["tiny", "huge"] }] } } } },
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
];

const CUSTOM_CLASSES: ReadonlyArray<[string, unknown]> = [
  ["none", undefined],
  ["null", null],
  ["empty", ""],
  ["string", "custom px-1"],
  ["array", ["custom", ["nested", { off: false, on: true }]]],
  ["object", { "text-blue-500": false, "text-red-500": true }],
];

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
  1,
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
  Number.NaN,
];

const toSelectionValue = (groupKey: string): unknown => {
  if (groupKey === "true") {
    return true;
  }

  return groupKey === "false" ? false : groupKey;
};

const variantSweep = (config: AnyConfig): ReadonlyArray<Record<string, unknown>> => {
  const variants = (config.variants ?? {}) as Record<string, Record<string, unknown>>;
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
  for (const first of names) {
    for (const second of names) {
      if (first >= second) {
        continue;
      }

      for (const firstKey of Object.keys(variants[first] ?? {})) {
        for (const secondKey of Object.keys(variants[second] ?? {})) {
          sweep.push({ [first]: toSelectionValue(firstKey), [second]: toSelectionValue(secondKey) });
        }
      }
    }
  }

  return sweep;
};

const stable = (value: unknown): string => {
  return JSON.stringify(value, (_key, inner: unknown) => {
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
    const define = (): AnyResolver =>
      tv(sweepCase.config as never, { ...sweepCase.options, ...options }) as AnyResolver;
    const shared = define();
    const resolver: AnyResolver = run.freshResolverPerCall ? (props) => define()(props) : shared;
    const sweep = variantSweep(sweepCase.config);

    for (const selection of sweep) {
      for (const [customName, customValue] of CUSTOM_CLASSES) {
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

            // A slot called with props re-resolves from scratch; drive that lane too.
            for (const override of sweep.slice(0, 6)) {
              const slotProps = { ...override, [propertyName]: customValue };

              lines.push(`${label} :: ${slotName} :: ${stable(override)} :: ${String(slots[slotName]?.(slotProps))}`);
            }
          }
        }
      }
    }

    // The whole sweep again: anything remembered must answer a second pass identically.
    for (const selection of sweep) {
      const result = resolver({ ...selection });

      if (typeof result !== "object" || result === null) {
        lines.push(`${sweepCase.name} :: replay :: ${stable(selection)} :: ${String(result)}`);
        continue;
      }

      const slots = result as Record<string, AnyResolver>;

      for (const slotName of Object.keys(slots).sort()) {
        lines.push(
          `${sweepCase.name} :: replay :: ${stable(selection)} :: ${slotName} :: ${String(slots[slotName]?.())}`,
        );
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
