import { expectTypeOf } from "vitest";

import type { ClassValue } from "#index";
import { cn, cx, tv } from "#index";

describe("Value spellings", () => {
  test("accepts readonly class arrays wherever classes are expected", () => {
    const classes = ["px-2", ["py-1"]] as const;
    const box = tv({ base: classes, variants: { size: { sm: classes } } });

    expectTypeOf(classes).toExtend<ClassValue>();
    expect(box({ class: classes, size: "sm" })).toBe("px-2 py-1");
    expect(cx(classes)).toBe("px-2 py-1");
    expect(cn(classes)).toBe("px-2 py-1");
  });
});
