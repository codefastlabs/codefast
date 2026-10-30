import { compileVariantPlan } from "#compile/plan";
import { compileSelectionEncoder } from "#compile/selection";
import { tv } from "#index";

type FlatResolver = (props?: Record<string, unknown>) => string | undefined;
type SlotResolver = (props?: Record<string, unknown>) => Record<string, () => string | undefined>;

const untypedTv = tv as (configuration: object, options?: object) => FlatResolver;
const untypedSlotsTv = tv as (configuration: object, options?: object) => SlotResolver;

/** Values a caller may pass that a compound or a group key tells apart from one another. */
const AWKWARD_VALUES: ReadonlyArray<unknown> = [
  undefined,
  true,
  false,
  "true",
  "false",
  0,
  "0",
  1,
  "",
  null,
  Number.NaN,
  "sm",
  "lg",
  "unknown",
];

/** A deterministic pseudo-random sequence, so a failing draw reproduces. */
const createRandom = (seed: number): (() => number) => {
  let state = seed;

  return () => {
    state = (state * 1_103_515_245 + 12_345) % 2_147_483_648;

    return state / 2_147_483_648;
  };
};

const COMPOUND_CONFIG = {
  base: "block",
  compoundVariants: [
    { class: "ring", pressed: true, size: "sm" },
    { class: "ring-0", pressed: "true" },
    { class: "outline", size: ["lg", 0] },
    { class: "shadow", tone: Number.NaN },
    { class: "opacity-50", tone: [Number.NaN, null] },
    { class: "underline", ghost: true },
  ],
  variants: {
    pressed: { false: "opacity-75", true: "opacity-100" },
    size: { 0: "p-0", lg: "p-8", sm: "p-2" },
    tone: { null: "text-muted", sm: "text-sm" },
  },
};

describe("compileSelectionEncoder", () => {
  test("gives two selections one key only when every condition and group key agrees", () => {
    const plan = compileVariantPlan(COMPOUND_CONFIG as never, null);
    const { keyOf } = compileSelectionEncoder(plan);

    expect(keyOf({ pressed: true })).not.toBe(keyOf({ pressed: "true" }));
    expect(keyOf({ size: 0 })).not.toBe(keyOf({ size: "0" }));
    expect(keyOf({ tone: Number.NaN })).not.toBe(keyOf({ tone: "unknown" }));
    // Neither value is compared by a compound nor answered by the group, so they resolve alike.
    expect(keyOf({ tone: "unknown" })).toBe(keyOf({ tone: "other" }));
    expect(keyOf({ ghost: "x" })).toBe(keyOf({ ghost: "y" }));
    expect(keyOf({ ghost: true })).not.toBe(keyOf({ ghost: "y" }));
    expect(keyOf({})).toBe(keyOf({ size: undefined }));
  });

  test("keeps a numeric key while the selection space fits one safe integer", () => {
    const plan = compileVariantPlan(COMPOUND_CONFIG as never, null);

    expect(typeof compileSelectionEncoder(plan).keyOf({ size: "sm" })).toBe("number");
  });

  test("spans several safe integers rather than declining a selection space past one", () => {
    const variants: Record<string, Record<string, string>> = {};

    for (let group = 0; group < 20; group++) {
      const values: Record<string, string> = {};

      for (let value = 0; value < 20; value++) {
        values[`v${String(value)}`] = `g${String(group)}v${String(value)}`;
      }

      variants[`g${String(group)}`] = values;
    }

    const { keyOf } = compileSelectionEncoder(compileVariantPlan({ variants }, null));
    const first = keyOf({ g0: "v1", g19: "v2" });

    expect(typeof first).toBe("string");
    expect(keyOf({ g0: "v1", g19: "v2" })).toBe(first);
    expect(keyOf({ g0: "v1", g19: "v3" })).not.toBe(first);
    expect(keyOf({ g0: "v2", g19: "v2" })).not.toBe(first);
  });
});

describe("selection-keyed resolution", () => {
  test("answers every drawn selection as a resolver without a cache does", () => {
    const random = createRandom(7);
    const draw = (): unknown => AWKWARD_VALUES[Math.floor(random() * AWKWARD_VALUES.length)];
    const cached = untypedTv(COMPOUND_CONFIG);
    const uncached = untypedTv(COMPOUND_CONFIG, { cacheResolutions: false });

    for (let call = 0; call < 2000; call++) {
      const props = { ghost: draw(), pressed: draw(), size: draw(), tone: draw() };

      expect(cached(props)).toBe(uncached(props));
    }
  });

  test("answers every drawn slot selection as a resolver without a cache does", () => {
    const random = createRandom(11);
    const draw = (): unknown => AWKWARD_VALUES[Math.floor(random() * AWKWARD_VALUES.length)];
    const config = {
      compoundSlots: [{ class: "gap-2", pressed: true, slots: ["base", "label"] }],
      compoundVariants: [{ class: { label: "font-bold" }, size: ["lg", 0] }],
      slots: { base: "flex", label: "text-sm" },
      variants: {
        pressed: { false: { base: "opacity-75" }, true: { label: "underline" } },
        size: { 0: { base: "p-0" }, lg: { base: "p-8" }, sm: "p-2" },
      },
    };
    const cached = untypedSlotsTv(config);
    const uncached = untypedSlotsTv(config, { cacheResolutions: false });

    for (let call = 0; call < 1000; call++) {
      const props = { pressed: draw(), size: draw() };
      const expected = uncached(props);
      const actual = cached(props);

      expect(actual.base?.()).toBe(expected.base?.());
      expect(actual.label?.()).toBe(expected.label?.());
    }
  });

  test("remembers a selection of a configuration too wide for one safe integer", () => {
    const slots: Record<string, string> = { base: "flex" };
    const variants: Record<string, Record<string, Record<string, string>>> = {};
    const compoundVariants: Array<Record<string, unknown>> = [];

    for (let group = 0; group < 20; group++) {
      slots[`s${String(group)}`] = `s${String(group)}`;
      variants[`g${String(group)}`] = { off: {}, on: { [`s${String(group)}`]: "ring" } };
      compoundVariants.push({ class: { base: `c${String(group)}` }, [`g${String(group)}`]: "on" });
    }

    const card = untypedSlotsTv({ compoundVariants, slots, variants });
    const selection = { g0: "on", g13: "on", g19: "off" };

    card(selection);
    card(selection);

    expect(card(selection)).toBe(card({ ...selection }));
    expect(card(selection).base?.()).toBe("flex c0 c13");
  });
});
