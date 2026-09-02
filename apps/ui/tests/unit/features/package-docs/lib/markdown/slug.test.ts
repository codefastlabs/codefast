import { describe, expect, it } from "vitest";

import { Slugger, plainHeadingText, slugify } from "#/features/package-docs/lib/markdown/slug";

describe("slugify", () => {
  it("follows the GitHub rule the link audit checks anchors against", () => {
    expect(slugify("2.1 Naming — no `I` or `T` prefix")).toBe("21-naming-no-i-or-t-prefix");
    expect(slugify("  What InversifyJS v8 solved ")).toBe("what-inversifyjs-v8-solved");
    expect(slugify("`BindingScope`")).toBe("bindingscope");
  });

  it("keeps letters outside ASCII", () => {
    expect(slugify("Tổng quan")).toBe("tổng-quan");
  });
});

describe("Slugger", () => {
  it("suffixes duplicate headings like GitHub", () => {
    const slugger = new Slugger();

    expect(slugger.slug("Usage")).toBe("usage");
    expect(slugger.slug("Usage")).toBe("usage-1");
    expect(slugger.slug("Usage")).toBe("usage-2");
  });
});

describe("plainHeadingText", () => {
  it("strips inline markdown for labels", () => {
    expect(plainHeadingText("3.1 `BindingScope`")).toBe("3.1 BindingScope");
    expect(plainHeadingText("See [the spec](./SPEC.md) **now**")).toBe("See the spec now");
  });
});
