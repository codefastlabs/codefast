import { describe, expect, it } from "vitest";

import { isSameDoc, packagePages } from "#/features/package-docs/lib/package-pages";
import type { PackageSummary } from "#/features/package-docs/lib/rendered-doc";

const tracking: PackageSummary = {
  slug: "tracking",
  name: "@codefast/tracking",
  description: "",
  version: "1.0.0",
  license: "MIT",
  docs: [
    { doc: "readme", pages: [] },
    { doc: "spec", pages: ["spec-consent", "vectors"] },
    { doc: "changelog", pages: [] },
  ],
};

describe("packagePages", () => {
  it("walks each kind's own page and then the pages beneath it, in sidebar order", () => {
    expect(packagePages(tracking)).toEqual([
      { doc: "readme" },
      { doc: "spec" },
      { doc: "spec", page: "spec-consent" },
      { doc: "spec", page: "vectors" },
      { doc: "changelog" },
    ]);
  });
});

describe("isSameDoc", () => {
  it("compares the kind and the page together", () => {
    expect(isSameDoc({ doc: "spec" }, { doc: "spec" })).toBe(true);
    expect(isSameDoc({ doc: "spec" }, { doc: "spec", page: "vectors" })).toBe(false);
    expect(isSameDoc({ doc: "spec", page: "vectors" }, { doc: "spec", page: "vectors" })).toBe(true);
    expect(isSameDoc({ doc: "spec", page: "vectors" }, { doc: "changelog", page: "vectors" })).toBe(false);
  });
});
