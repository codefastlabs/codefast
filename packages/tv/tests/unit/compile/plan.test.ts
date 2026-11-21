import { compileGroupValue, compileVariantPlan } from "#compile/plan";
import { tv } from "#index";

type SlotResolver = (
  props?: Record<string, unknown>,
) => Record<string, (slotProps?: Record<string, unknown>) => string | undefined>;

const untypedSlotsTv = tv as (configuration: object, options?: object) => SlotResolver;

describe("compileVariantPlan", () => {
  test("compiles only the default up front and every other value on first selection", () => {
    const plan = compileVariantPlan(
      {
        defaultVariants: { size: "md" },
        slots: { base: "flex", label: "text-sm" },
        variants: { size: { lg: { label: "text-lg" }, md: "p-4", sm: { base: "p-2" } } },
      },
      null,
    );
    const [entry] = plan.entries;

    expect(entry === undefined ? [] : Object.keys(entry.group)).toEqual(["md"]);
    expect(entry === undefined ? undefined : compileGroupValue(entry, "lg")).toEqual({
      classes: ["text-lg"],
      slotIndexes: [1],
    });
    expect(entry === undefined ? [] : Object.keys(entry.group).sort()).toEqual(["lg", "md"]);
    expect(entry === undefined ? "missing" : compileGroupValue(entry, "xl")).toBeUndefined();
  });

  test("never writes into a group it reads in place", () => {
    const sizes = { lg: "p-8", sm: "p-2" };
    const plan = compileVariantPlan({ base: "block", variants: { size: sizes } }, null);
    const [entry] = plan.entries;

    expect(entry?.group).toBe(sizes);
    expect(entry === undefined ? "missing" : compileGroupValue(entry, "xl")).toBeUndefined();
    expect(sizes).toEqual({ lg: "p-8", sm: "p-2" });
  });
});

describe("lazily compiled resolution", () => {
  test("leaves the configuration untouched however many values callers select", () => {
    const configuration = {
      compoundVariants: [{ class: { label: "underline" }, size: "lg", tone: "accent" }],
      slots: { base: "flex", label: "text-sm" },
      variants: {
        size: { lg: { base: "p-8", label: "text-lg" }, sm: { base: "p-2" } },
        tone: { accent: ["text-accent", { "font-bold": true }], plain: "" },
      },
    };
    const snapshot = structuredClone(configuration);
    const card = untypedSlotsTv(configuration);
    const uncached = untypedSlotsTv(configuration, { cacheResolutions: false });

    for (const size of ["sm", "lg", "xl", "toString", "__proto__", undefined]) {
      for (const tone of ["accent", "plain", undefined]) {
        const actual = card({ size, tone });
        const expected = uncached({ size, tone });

        expect(actual.base?.()).toBe(expected.base?.());
        expect(actual.label?.()).toBe(expected.label?.());
        expect(actual.label?.({ size: "lg" })).toBe(expected.label?.({ size: "lg" }));
      }
    }

    expect(configuration).toEqual(snapshot);
  });
});
