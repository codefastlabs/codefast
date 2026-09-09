import { describe, expect, it } from "vitest";

import { applyEditsDescending, dropOverlappingEdits } from "#/core/source-text-edit";

describe("dropOverlappingEdits", () => {
  it("keeps disjoint edits untouched", () => {
    const edits = [
      { start: 0, end: 3, replacement: "A" },
      { start: 5, end: 8, replacement: "B" },
    ];
    expect(dropOverlappingEdits(edits)).toEqual(edits);
  });

  it("drops an edit nested inside an outer edit, keeping the outer", () => {
    const outer = { start: 0, end: 20, replacement: "OUTER" };
    const inner = { start: 5, end: 10, replacement: "inner" };
    expect(dropOverlappingEdits([inner, outer])).toEqual([outer]);
  });

  it("keeps the earlier edit on an exact-range tie (priority order preserved)", () => {
    const fold = { start: 0, end: 10, replacement: "fold" };
    const base = { start: 0, end: 10, replacement: "base" };
    expect(dropOverlappingEdits([fold, base])).toEqual([fold]);
  });

  it("keeps siblings that sit between two kept ranges", () => {
    const a = { start: 0, end: 5, replacement: "a" };
    const gap = { start: 6, end: 8, replacement: "gap" };
    const d = { start: 10, end: 15, replacement: "d" };
    expect(dropOverlappingEdits([a, d, gap])).toEqual([a, gap, d]);
  });

  it("produces a set applyEditsDescending can apply without corruption", () => {
    const source = "0123456789";
    // An outer edit spanning [2,8) and a nested edit at [4,6) — only the outer must survive.
    const resolved = dropOverlappingEdits([
      { start: 2, end: 8, replacement: "<OUT>" },
      { start: 4, end: 6, replacement: "x" },
    ]);
    expect(applyEditsDescending(source, resolved)).toBe("01<OUT>89");
  });
});
