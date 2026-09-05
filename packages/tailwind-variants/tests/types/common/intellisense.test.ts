import { expectTypeOf } from "vitest";

import type { VariantProps, VariantValue } from "#/index";
import { tv } from "#/index";

/**
 * What an editor offers at each authoring site is exactly the literal union the checker holds there,
 * so these pin the unions that drive completion and the rejections that drive red squiggles.
 */
const button = tv({
  compoundVariants: [{ class: "ring", size: "lg", variant: "outline" }],
  defaultVariants: { size: "md", variant: "primary" },
  variants: {
    disabled: { false: "", true: "opacity-50" },
    size: { lg: "px-8", md: "px-4", sm: "px-2" },
    variant: { outline: "border", primary: "bg-primary" },
  },
});

const card = tv({
  compoundSlots: [{ class: "gap-1", size: "sm", slots: ["header", "footer"] }],
  slots: { footer: "p-6", header: "p-6", title: "text-xl" },
  variants: {
    size: { lg: { header: "p-8", title: "text-3xl" }, sm: { header: "p-3" } },
    tone: { loud: { base: "border-red-500" }, quiet: "" },
  },
});

const textarea = tv({
  defaultVariants: { size: "lg" },
  extend: button,
  variants: { resize: { none: "resize-none", y: "resize-y" } },
});

const rejectedCallSites = (): void => {
  // @ts-expect-error — `"huge"` is not a `size`
  button({ size: "huge" });

  // @ts-expect-error — a boolean group takes a boolean, not the string that shares its key
  button({ disabled: "true" });

  // @ts-expect-error — `sizee` is not a variant
  button({ sizee: "sm" });

  // @ts-expect-error — a slot resolver's own props are the same selection
  card().header({ size: "huge" });

  // @ts-expect-error — an extended resolver still rejects a value the base never declared
  textarea({ size: "huge" });

  tv({
    // @ts-expect-error — a default on an extended resolver is checked against the merged variants
    defaultVariants: { variant: "ghost" },
    extend: button,
  });
};

describe("IntelliSense-driving types", () => {
  test("keeps the rejections above with the compiler", () => {
    expect(rejectedCallSites).toBeTypeOf("function");
  });

  test("offers each variant's literal values at the call site", () => {
    type Props = NonNullable<Parameters<typeof button>[0]>;

    expectTypeOf<Props["size"]>().toEqualTypeOf<"lg" | "md" | "sm" | undefined>();
    expectTypeOf<Props["variant"]>().toEqualTypeOf<"outline" | "primary" | undefined>();
    expectTypeOf<Props["disabled"]>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<keyof Props>().toEqualTypeOf<"class" | "className" | "disabled" | "size" | "variant">();
  });

  test("derives VariantProps from the call signature, for flat and slot resolvers alike", () => {
    expectTypeOf<keyof VariantProps<typeof button>>().toEqualTypeOf<"disabled" | "size" | "variant">();
    expectTypeOf<VariantProps<typeof button>["size"]>().toEqualTypeOf<"lg" | "md" | "sm" | undefined>();
    expectTypeOf<keyof VariantProps<typeof card>>().toEqualTypeOf<"size" | "tone">();
    expectTypeOf<VariantProps<typeof card>["tone"]>().toEqualTypeOf<"loud" | "quiet" | undefined>();
    expectTypeOf<keyof VariantProps<typeof textarea>>().toEqualTypeOf<"disabled" | "resize" | "size" | "variant">();
  });

  test("leaves a resolver without variants with no variant props", () => {
    const plain = tv({ base: "flex" });

    expectTypeOf<keyof VariantProps<typeof plain>>().toEqualTypeOf<never>();
  });

  test("offers the declared slots, plus base, on a slot resolver's result", () => {
    expectTypeOf<keyof ReturnType<typeof card>>().toEqualTypeOf<"base" | "footer" | "header" | "title">();

    type HeaderProps = NonNullable<Parameters<ReturnType<typeof card>["header"]>[0]>;

    expectTypeOf<HeaderProps["size"]>().toEqualTypeOf<"lg" | "sm" | undefined>();
    expectTypeOf<keyof HeaderProps>().toEqualTypeOf<"class" | "className" | "size" | "tone">();
  });

  test("spells a boolean group as boolean and any other group as its keys", () => {
    expectTypeOf<VariantValue<"false" | "true">>().toEqualTypeOf<boolean>();
    expectTypeOf<VariantValue<"lg" | "sm">>().toEqualTypeOf<"lg" | "sm">();
    expectTypeOf<VariantValue<1 | 2>>().toEqualTypeOf<1 | 2>();
  });

  test("still resolves what the types describe", () => {
    expect(button({ size: "lg", variant: "outline" })).toBe("px-8 border ring");
    // `p-6` and `p-3` share a class group, so tailwind-merge keeps the later one.
    expect(card({ size: "sm" }).header()).toBe("p-3 gap-1");
    expect(textarea({ resize: "y" })).toBe("px-8 bg-primary resize-y");
  });
});
