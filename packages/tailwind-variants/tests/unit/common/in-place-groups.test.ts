import { describe, expect, test } from "vitest";

import { tv } from "#/index";

/**
 * A string-only variant group is read in place rather than copied, so these pin what that must never
 * change: an inherited member is not a variant value, and a group with its own prototype is copied.
 */
describe("groups read in place", () => {
  test("treats an inherited member as no selection, on the first call and on the plan", () => {
    const button = tv({ base: "block", variants: { size: { sm: "p-2" } } });

    for (const value of ["toString", "constructor", "valueOf", "hasOwnProperty", "__proto__"]) {
      expect(button({ size: value } as never)).toBe("block");
      expect(button({ size: value } as never)).toBe("block");
    }

    expect(button({ size: "sm" })).toBe("block p-2");
  });

  test("ignores a string a group inherits from a prototype of its own", () => {
    const size = Object.create({ inherited: "text-red-500" }) as Record<string, string>;

    size.sm = "p-2";

    const button = tv({ base: "block", variants: { size } } as never) as (
      props?: Record<string, unknown>,
    ) => string | undefined;

    for (let call = 0; call < 3; call++) {
      expect(button({ size: "inherited" })).toBe("block");
      expect(button({ size: "sm" })).toBe("block p-2");
    }
  });

  test("resolves a default that names a key the group does not own to nothing", () => {
    const badge = tv({
      base: "block",
      defaultVariants: { size: "toString" },
      variants: { size: { sm: "p-2" } },
    } as never) as (props?: Record<string, unknown>) => string | undefined;

    expect(badge()).toBe("block");
    expect(badge()).toBe("block");
    expect(badge()).toBe("block");
  });
});
