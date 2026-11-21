import { expectTypeOf } from "vitest";

import type { VariantProps } from "#index";
import { tv } from "#index";

/**
 * The other type tests prove what compiles. These prove what must not, because every gap they cover
 * failed the same way: a typo in a configuration is accepted, resolves to nothing, and says nothing.
 *
 * They live in a function nothing calls. `@ts-expect-error` silences the compiler, not the runtime,
 * and several of these configurations throw when executed — but the compiler checks every line
 * regardless, and reports an unused directive the moment one stops erroring.
 */
const rejectedConfigurations = (): void => {
  // @ts-expect-error — `colour` is not a declared variant
  tv({ defaultVariants: { colour: "red" }, variants: { size: { sm: "px-2" } } });

  tv({
    // @ts-expect-error — `size` is declared, `"enormous"` is not one of its values
    defaultVariants: { size: "enormous" },
    variants: { size: { sm: "px-2" } },
  });

  // @ts-expect-error — `colour` is not a declared variant
  tv({ compoundVariants: [{ class: "ring", colour: "red" }], variants: { size: { sm: "px-2" } } });

  tv({
    // @ts-expect-error — `"enormous"` is not one of `size`'s values
    compoundVariants: [{ class: "ring", size: "enormous" }],
    variants: { size: { sm: "px-2" } },
  });

  // @ts-expect-error — `notASlot` is not a declared slot
  tv({ slots: { base: "rounded", title: "text-xl" }, variants: { size: { sm: { notASlot: "p-3" } } } });

  tv({
    // @ts-expect-error — `notASlot` is not a declared slot
    compoundSlots: [{ class: "gap-1", slots: ["notASlot"] }],
    slots: { base: "rounded" },
  });

  // @ts-expect-error — `slots` is what a compound slot targets, so it is required
  tv({ compoundSlots: [{ class: "gap-1" }], slots: { base: "rounded" } });

  // @ts-expect-error — `extend` takes a variant resolver, so nothing else enters that overload
  tv({ base: "block", extend: {} });

  // @ts-expect-error — `unknownOption` is not a tv option
  tv({ base: "block" }, { unknownOption: true });

  const tone = tv({ variants: { tone: { muted: "text-muted", loud: "text-loud" } } });

  // @ts-expect-error — `tonee` is not a declared variant, though the extension declares none of its own
  tv({ base: "text-sm", extend: tone })({ tonee: "muted" });

  // @ts-expect-error — `tonee` is not a declared variant, though the extension only adds compounds
  tv({ compoundVariants: [{ class: "font-bold", tone: "loud" }], extend: tone })({ tonee: "muted" });

  const card = tv({ slots: { base: "rounded", title: "text-xl" } });

  // @ts-expect-error — `notASlot` is not a declared slot, though the extension declares none of its own
  void tv({ base: "p-4", extend: card })().notASlot;
  tv({
    // @ts-expect-error — `"huge"` is not one of the extension's own `size` values
    compoundVariants: [{ class: "ring", size: "huge" }],
    extend: tone,
    variants: { size: { sm: "px-2" } },
  });

  tv({
    // @ts-expect-error — `"huge"` is not one of the extension's own `size` values
    defaultVariants: { size: "huge" },
    extend: tone,
    variants: { size: { sm: "px-2" } },
  });

  tv({
    // @ts-expect-error — `notASlot` is not a declared slot, so a compound's slot map cannot target it
    compoundVariants: [{ className: { notASlot: "p-3" }, size: "sm" }],
    slots: { title: "text-xl" },
    variants: { size: { sm: "" } },
  });

  // @ts-expect-error — `notASlot` is neither the extended resolver's slot nor the extension's
  tv({ extend: card, variants: { tone: { loud: { notASlot: "p-3" } } } });

  // @ts-expect-error — `notASlot` is neither the extended resolver's slot nor the extension's
  tv({ compoundVariants: [{ className: { notASlot: "p-3" } }], extend: card });

  tv({
    // @ts-expect-error — `"huge"` is not one of `size`'s values, in an array or not
    compoundSlots: [{ class: "gap-1", size: ["sm", "huge"], slots: ["title"] }],
    slots: { title: "text-xl" },
    variants: { size: { md: "", sm: "" } },
  });
};

describe("Configuration Authoring Type Safety", () => {
  test("holds the rejections above to the compiler, never to the runtime", () => {
    expect(rejectedConfigurations).toBeTypeOf("function");
  });

  test("keeps a configuration without extend off the extend overload", () => {
    const button = tv({ variants: { size: { lg: "px-8", sm: "px-2" } } });

    // This is where the widening happened: `extend` was optional, so a configuration the earlier
    // overloads rejected still matched here, and the schema's key became `string`.
    expectTypeOf<keyof VariantProps<typeof button>>().toEqualTypeOf<"size">();
  });

  test("keeps an extension without variants or slots of its own to the extended resolver's", () => {
    // An omitted `variants` or `slots` left its type parameter with no inference candidate, so it fell
    // back to its constraint — a string index — and every key of the merged schema became `string`.
    const tone = tv({ variants: { tone: { loud: "text-loud", muted: "text-muted" } } });
    const card = tv({ slots: { base: "rounded", title: "text-xl" }, variants: { tone: { loud: "", muted: "" } } });

    expectTypeOf<keyof VariantProps<ReturnType<typeof extendOnlyBase>>>().toEqualTypeOf<"tone">();
    expectTypeOf<keyof VariantProps<ReturnType<typeof extendOnlyCompounds>>>().toEqualTypeOf<"tone">();
    expectTypeOf<keyof VariantProps<ReturnType<typeof extendWithVariants>>>().toEqualTypeOf<"size" | "tone">();
    expectTypeOf<keyof ReturnType<ReturnType<typeof extendSlotsOnlyBase>>>().toEqualTypeOf<"base" | "title">();

    function extendOnlyBase() {
      return tv({ base: "text-sm", extend: tone });
    }
    function extendOnlyCompounds() {
      return tv({ compoundVariants: [{ class: "font-bold", tone: "loud" }], extend: tone });
    }
    function extendWithVariants() {
      return tv({ extend: tone, variants: { size: { lg: "px-8", sm: "px-2" } } });
    }
    function extendSlotsOnlyBase() {
      return tv({ base: "p-4", extend: card });
    }

    expect(extendOnlyBase()({ tone: "loud" })).toBe("text-sm text-loud");
    expect(extendOnlyCompounds()({ tone: "loud" })).toBe("text-loud font-bold");
    expect(extendSlotsOnlyBase()({ tone: "loud" }).title()).toBe("text-xl");
  });

  test("keeps an extension's compounds and defaults reading its own variants", () => {
    const tone = tv({ variants: { tone: { loud: "text-loud", muted: "text-muted" } } });
    const chip = tv({
      compoundVariants: [{ class: "ring", size: "sm", tone: "loud" }],
      defaultVariants: { size: "sm" },
      extend: tone,
      variants: { size: { lg: "px-8", sm: "px-2" } },
    });

    expectTypeOf<keyof VariantProps<typeof chip>>().toEqualTypeOf<"size" | "tone">();
    expect(chip({ tone: "loud" })).toBe("px-2 text-loud ring");
  });

  test("keeps declaring a default, a compound and a slot map compiling — and applying", () => {
    expect(tv({ defaultVariants: { size: "sm" }, variants: { size: { sm: "px-2" } } })()).toBe("px-2");

    const chip = tv({
      compoundVariants: [
        { class: "ring", size: "sm" },
        { class: "italic", size: ["lg", "sm"] },
        { class: "uppercase", loud: true },
      ],
      variants: { loud: { true: "font-bold" }, size: { lg: "px-8", sm: "px-2" } },
    });

    expect(chip({ loud: true, size: "sm" })).toBe("font-bold px-2 ring italic uppercase");

    const card = tv({
      slots: { base: "rounded", title: "text-xl" },
      variants: { size: { lg: "", sm: { base: "max-w-sm", title: "text-lg" } } },
    });

    expect(card({ size: "sm" }).title()).toBe("text-lg");

    const stack = tv({ compoundSlots: [{ class: "gap-1", slots: ["base"] }], slots: { base: "rounded" } });

    expect(stack().base()).toBe("rounded gap-1");
  });

  test("keeps a configuration without slots free to use clsx object values", () => {
    // With no slots declared an object is clsx conditions, not slot names, and must stay allowed —
    // asserted at runtime too, because that is the behaviour the type is protecting.
    const box = tv({ variants: { size: { sm: { "px-2": true, "px-8": false } } } });

    expect(box({ size: "sm" })).toBe("px-2");

    const loud = tv({
      compoundVariants: [{ className: { "font-bold": true }, size: "sm" }],
      extend: box,
      variants: { tone: { loud: { "text-red-500": true } } },
    });

    expect(loud({ size: "sm", tone: "loud" })).toBe("text-red-500 px-2 font-bold");
  });

  test("accepts alternatives in a compound slot condition", () => {
    const card = tv({
      compoundSlots: [{ class: "gap-1", size: ["md", "sm"], slots: ["title"] }],
      slots: { title: "text-xl" },
      variants: { size: { lg: "", md: "", sm: "" } },
    });

    expect(card({ size: "sm" }).title()).toBe("text-xl gap-1");
    expect(card({ size: "lg" }).title()).toBe("text-xl");
  });

  test("keeps an extension's slot maps targeting the slots it inherits", () => {
    const card = tv({ slots: { base: "rounded", title: "text-xl" } });
    const loud = tv({
      compoundVariants: [{ className: { title: "uppercase" }, tone: "loud" }],
      extend: card,
      variants: { tone: { loud: { title: "font-bold" } } },
    });

    expect(loud({ tone: "loud" }).title()).toBe("text-xl font-bold uppercase");
  });

  test("keeps both conflicting classes when merging is off", () => {
    // Asserted by count, not by order: the formatter sorts class strings inside `tv`, so an
    // expectation spelling one out would be rewritten out from under this test.
    const kept = tv({ base: "px-2 px-4" }, { twMerge: false })();

    expect(kept?.split(" ")).toHaveLength(2);
    expect(tv({ base: "px-2 px-4" }, { twMerge: true })()?.split(" ")).toHaveLength(1);
  });
});
