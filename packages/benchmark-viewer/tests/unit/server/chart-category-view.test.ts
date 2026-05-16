import { describe, expect, it } from "vitest";

import {
  categoryXScaleWindow,
  computeInitialCategoryWindow,
} from "#/client/lib/chart-category-view";

describe("chart-category-view", () => {
  it("uses full index range for short series and omits explicit scale bounds", () => {
    expect(computeInitialCategoryWindow(3)).toEqual({ min: 0, max: 2 });
    expect(categoryXScaleWindow(3)).toBeUndefined();
  });

  it("windows long series and exposes same bounds for Chart options", () => {
    const w = computeInitialCategoryWindow(100);
    expect(categoryXScaleWindow(100)).toEqual(w);
    expect(w.min).toBeGreaterThanOrEqual(0);
    expect(w.max).toBe(99);
    expect(w.max - w.min).toBeGreaterThan(1);
  });

  it("handles empty series", () => {
    expect(computeInitialCategoryWindow(0)).toEqual({ min: 0, max: 0 });
    expect(categoryXScaleWindow(0)).toBeUndefined();
  });
});
