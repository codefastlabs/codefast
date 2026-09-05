import { describe, expect, test } from "vitest";

import { tv } from "#/index";

describe("resolver metadata", () => {
  test("lists variant keys in declaration order", () => {
    const button = tv({ variants: { size: { sm: "px-2" }, variant: { primary: "bg-primary" } } });

    expect(button.variantKeys).toEqual(["size", "variant"]);
    expect(button.config.variants).toEqual({ size: { sm: "px-2" }, variant: { primary: "bg-primary" } });
  });

  test("puts an extended resolver's keys first and adds the extension's after", () => {
    const base = tv({ variants: { size: { sm: "px-2" } } });
    const extended = tv({ extend: base, variants: { tone: { loud: "font-bold" } } });

    expect(extended.variantKeys).toEqual(["size", "tone"]);
  });

  test("answers an empty list for a configuration without variants", () => {
    expect(tv({ base: "flex" }).variantKeys).toEqual([]);
    expect(tv({ slots: { base: "flex" } }).variantKeys).toEqual([]);
  });
});
