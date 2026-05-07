import { describe, expect, it } from "vitest";

import { quantile, sortAscending } from "#/report/quantiles";

describe("sortAscending", () => {
  it("returns values sorted in ascending order", () => {
    expect(sortAscending([3, 1, 2])).toEqual([1, 2, 3]);
  });
});

describe("quantile", () => {
  it("returns linear interpolation quantiles", () => {
    const sorted = sortAscending([40, 10, 30, 20]);
    expect(quantile(sorted, 0.25)).toBe(17.5);
    expect(quantile(sorted, 0.5)).toBe(25);
    expect(quantile(sorted, 0.75)).toBe(32.5);
  });

  it("returns zero for empty input", () => {
    expect(quantile([], 0.5)).toBe(0);
  });
});
