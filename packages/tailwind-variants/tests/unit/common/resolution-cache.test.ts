import { describe, expect, test } from "vitest";

import { tv } from "#/index";

describe("resolution cache", () => {
  test("answers a repeated selection with the same slot resolvers", () => {
    const card = tv({
      slots: { base: "rounded", title: "text-xl" },
      variants: { size: { lg: { base: "max-w-lg" }, sm: { base: "max-w-sm" } } },
    });

    expect(card({ size: "sm" })).toBe(card({ size: "sm" }));
    expect(card({ size: "sm" })).not.toBe(card({ size: "lg" }));
  });

  test("keeps every selection resolving to what it resolved without a cache", () => {
    const options = { size: { lg: "px-8", sm: "px-2" } };
    const cached = tv({ base: "flex", variants: options });
    const uncached = tv({ base: "flex", variants: options }, { cacheResolutions: false });

    for (const size of ["sm", "lg", "unknown", undefined]) {
      for (let pass = 0; pass < 3; pass++) {
        expect(cached({ size } as never)).toBe(uncached({ size } as never));
      }
    }
  });

  test("separates a caller's own classes from the selection", () => {
    const button = tv({ base: "px-4", variants: { size: { sm: "px-2" } } });

    expect(button({ size: "sm" })).toBe("px-2");
    expect(button({ className: "px-6", size: "sm" })).toBe("px-6");
    expect(button({ size: "sm" })).toBe("px-2");
    expect(button({ class: "px-8", size: "sm" })).toBe("px-8");
  });

  test("does not cache a clsx-shaped class value, which the key cannot carry", () => {
    const button = tv({ base: "px-4", variants: { size: { sm: "px-2" } } });

    expect(button({ className: ["px-6", { "py-1": true }], size: "sm" })).toBe("px-6 py-1");
    expect(button({ className: ["px-6", { "py-1": false }], size: "sm" })).toBe("px-6");
  });

  test("distinguishes a boolean from the string that shares its group key", () => {
    const toggle = tv({
      base: "block",
      compoundVariants: [{ class: "ring", pressed: true }],
      variants: { pressed: { false: "opacity-50", true: "opacity-100" } },
    });

    expect(toggle({ pressed: true })).toBe("block opacity-100 ring");
    expect(toggle({ pressed: "true" } as never)).toBe("block opacity-100");
  });

  test("keys a compound on a variant the configuration never declares", () => {
    const badge = tv({
      base: "block",
      compoundVariants: [{ class: "text-red-500", ghost: true, size: "sm" }],
      variants: { size: { md: "p-4", sm: "p-2" } },
    });

    expect(badge({ ghost: true, size: "sm" } as never)).toBe("block p-2 text-red-500");
    expect(badge({ size: "sm" } as never)).toBe("block p-2");
    expect(badge({ ghost: false, size: "sm" } as never)).toBe("block p-2");
  });

  test("does not mistake an inherited key for an already-assigned id", () => {
    const config = { base: "block", variants: { size: { md: "p-4", sm: "p-2" } } };
    const cached = tv(config);
    const uncached = tv(config, { cacheResolutions: false });

    for (const size of ["toString", "constructor", "hasOwnProperty", "valueOf"]) {
      expect(cached({ size } as never)).toBe(uncached({ size } as never));
    }
  });

  test("keeps resolving once a selection axis exhausts its capacity", () => {
    const chip = tv({
      base: "block",
      compoundVariants: [{ class: "ring", tone: "t1" }],
      variants: { tone: { t1: "p-1" } },
    });

    // Past the per-axis capacity a call stops being encodable, and must still resolve.
    for (let index = 0; index < 40; index++) {
      expect(chip({ tone: `t${String(index)}` } as never)).toBe(index === 1 ? "block p-1 ring" : "block");
    }

    expect(chip({ tone: "t1" } as never)).toBe("block p-1 ring");
  });
});
