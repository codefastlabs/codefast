import { expectTypeOf } from "vitest";

import type { ClassValue, VariantProps } from "#index";
import { cn, cx, tv } from "#index";

/**
 * Every spelling the runtime reads the same way must type-check the same way, or a valid call fails to compile.
 */
const rejectedValues = (): void => {
  tv({
    // @ts-expect-error — `"3"` is not one of the declared columns, in either spelling
    defaultVariants: { cols: "3" },
    variants: { cols: { 1: "grid-cols-1", 2: "grid-cols-2" } },
  });
};

describe("Value spellings", () => {
  test("keeps the rejections above with the compiler", () => {
    expect(rejectedValues).toBeTypeOf("function");
  });

  test("accepts a numeric variant key in both spellings", () => {
    const grid = tv({ variants: { cols: { 1: "grid-cols-1", 2: "grid-cols-2" } } });
    const quoted = tv({ variants: { cols: { "1": "grid-cols-1", "2": "grid-cols-2" } } });

    expectTypeOf<VariantProps<typeof grid>["cols"]>().toEqualTypeOf<"1" | "2" | 1 | 2 | undefined>();
    expectTypeOf<VariantProps<typeof quoted>["cols"]>().toEqualTypeOf<"1" | "2" | 1 | 2 | undefined>();
    expect(grid({ cols: "2" })).toBe("grid-cols-2");
    expect(quoted({ cols: 2 })).toBe("grid-cols-2");
  });

  test("accepts an explicit undefined default", () => {
    const button = tv({ base: "flex", defaultVariants: { size: undefined }, variants: { size: { sm: "px-2" } } });

    expect(button()).toBe("flex");
  });

  test("accepts readonly class arrays wherever classes are expected", () => {
    const classes = ["px-2", ["py-1"]] as const;
    const box = tv({ base: classes, variants: { size: { sm: classes } } });

    expectTypeOf(classes).toExtend<ClassValue>();
    expect(box({ class: classes, size: "sm" })).toBe("px-2 py-1");
    expect(cx(classes)).toBe("px-2 py-1");
    expect(cn(classes)).toBe("px-2 py-1");
  });
});
