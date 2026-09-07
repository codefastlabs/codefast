import { describe, expect, it } from "vitest";

import { isSameDoc, readingOrder } from "#/features/package-docs/lib/reading-order";
import type { PackageSummary } from "#/features/package-docs/lib/rendered-doc";

const tracking: PackageSummary = {
  slug: "tracking",
  name: "@codefast/tracking",
  description: "",
  version: "1.0.0",
  license: "MIT",
  docs: [
    { kind: "readme", pages: [] },
    { kind: "spec", pages: ["spec-consent", "vectors"] },
    { kind: "changelog", pages: [] },
  ],
};

describe("readingOrder", () => {
  it("walks each kind's own page and then the pages beneath it, in sidebar order", () => {
    expect(readingOrder(tracking)).toEqual([
      { kind: "readme" },
      { kind: "spec" },
      { kind: "spec", page: "spec-consent" },
      { kind: "spec", page: "vectors" },
      { kind: "changelog" },
    ]);
  });
});

describe("isSameDoc", () => {
  it("compares the kind and the page together", () => {
    expect(isSameDoc({ kind: "spec" }, { kind: "spec" })).toBe(true);
    expect(isSameDoc({ kind: "spec" }, { kind: "spec", page: "vectors" })).toBe(false);
    expect(isSameDoc({ kind: "spec", page: "vectors" }, { kind: "spec", page: "vectors" })).toBe(true);
    expect(isSameDoc({ kind: "spec", page: "vectors" }, { kind: "changelog", page: "vectors" })).toBe(false);
  });
});
