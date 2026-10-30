import { expectTypeOf } from "vitest";

import type { SlotSchema, VariantProps, VariantResolver, VariantSchema } from "#index";
import { createTV, tv } from "#index";

/**
 * Which `tv` overload a configuration selects decides the whole result type, so these pin that choice
 * for configurations held in variables, where no excess-property check can steer it.
 */
const rejectedCalls = (): void => {
  const card = tv({ slots: { base: "rounded", title: "text-xl" } });

  // @ts-expect-error — a resolver without variants takes no variant props, slots or not
  card({ bogus: "x" });

  // @ts-expect-error — a resolver without variants takes no variant props
  createTV().tv({ base: "flex" })({ bogus: "x" });

  const slotConfig = { slots: { title: "text-xl" }, variants: { size: { sm: "p-2" } } };

  // @ts-expect-error — a slot configuration in a variable still yields slot resolvers, not a string
  tv(slotConfig)().toUpperCase();

  const flat = tv({ variants: { size: { sm: "p-2" } } });

  // @ts-expect-error — a resolver without slots answers with a string, so it is no resolver with slots
  const asSlotted: VariantResolver<VariantSchema, SlotSchema> = flat;

  // @ts-expect-error — a resolver with slots answers with slot resolvers, so it is no resolver without slots
  const asFlat: VariantResolver<VariantSchema> = card;

  void asSlotted;
  void asFlat;
};

describe("Overload selection", () => {
  test("keeps the rejections above with the compiler", () => {
    expect(rejectedCalls).toBeTypeOf("function");
  });

  test("types a slot configuration held in a variable as slot resolvers", () => {
    const config = { slots: { title: "text-xl" }, variants: { size: { lg: "p-8", sm: "p-2" } } };
    const card = tv(config);

    expectTypeOf<keyof ReturnType<typeof card>>().toEqualTypeOf<"base" | "title">();
    expectTypeOf<keyof VariantProps<typeof card>>().toEqualTypeOf<"size">();
    expect(card({ size: "sm" }).title()).toBe("text-xl");
  });

  test("keeps the inherited variants of an extension held in a variable", () => {
    const base = tv({ variants: { tone: { loud: "text-loud", muted: "text-muted" } } });
    const config = { extend: base, variants: { size: { lg: "p-8", sm: "p-2" } } };
    const chip = tv(config);

    expectTypeOf<keyof VariantProps<typeof chip>>().toEqualTypeOf<"size" | "tone">();
    expect(chip({ size: "sm", tone: "loud" })).toBe("p-2 text-loud");
  });

  test("leaves a resolver with slots but no variants with no variant props", () => {
    const card = tv({ slots: { base: "rounded", title: "text-xl" } });

    expectTypeOf<keyof VariantProps<typeof card>>().toEqualTypeOf<never>();
  });

  test("keeps the literal values of an extension over a resolver with slots but no variants", () => {
    const card = tv({ slots: { base: "rounded", title: "text-xl" } });
    const sized = tv({ extend: card, variants: { size: { lg: { title: "text-3xl" }, sm: { title: "text-lg" } } } });

    expectTypeOf<VariantProps<typeof sized>["size"]>().toEqualTypeOf<"lg" | "sm" | undefined>();
    expect(sized({ size: "sm" }).title()).toBe("text-lg");
  });

  test("types an extension that adds slots to a resolver without them as slot resolvers", () => {
    const flat = tv({ base: "p-4", variants: { tone: { loud: "text-loud" } } });
    const card = tv({ extend: flat, slots: { title: "t" } });

    expectTypeOf(card().title).toEqualTypeOf<(props?: Parameters<ReturnType<typeof card>["base"]>[0]) => string>();
    expectTypeOf<keyof VariantProps<typeof card>>().toEqualTypeOf<"tone">();
    expect(card().title()).toBe("t");
  });

  test("gives createTV's tv exactly the type of tv", () => {
    expectTypeOf(createTV().tv).toEqualTypeOf<typeof tv>();
  });

  test("answers with a string without slots and a string per slot with them", () => {
    expectTypeOf(tv({ base: "flex" })()).toEqualTypeOf<string>();
    expectTypeOf(tv({ slots: { title: "text-xl" } })().title()).toEqualTypeOf<string>();
  });
});
