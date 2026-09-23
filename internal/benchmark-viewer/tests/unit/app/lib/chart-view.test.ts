import { describe, expect, it } from "vitest";

import type { ChartScaleWindows } from "#app/lib/chart-view";
import { applyRelativeCategoryView, captureRelativeCategoryView } from "#app/lib/chart-view";

function chartWithWindow(min: number, max: number): ChartScaleWindows {
  return { scales: { x: { min, max } } };
}

describe("captureRelativeCategoryView", () => {
  it("returns undefined at the initial window so the next chart opens on its own default", () => {
    expect(captureRelativeCategoryView(chartWithWindow(50, 99), { min: 50, max: 99 }, 100)).toBeUndefined();
  });

  it("captures a zoomed window relative to the newest point", () => {
    expect(captureRelativeCategoryView(chartWithWindow(80, 90), { min: 50, max: 99 }, 100)).toEqual({
      visibleCount: 10,
      offsetFromEnd: 9,
    });
  });

  it("returns undefined for a series too short to zoom", () => {
    expect(captureRelativeCategoryView(chartWithWindow(0, 0), { min: 0, max: 0 }, 1)).toBeUndefined();
  });
});

describe("applyRelativeCategoryView", () => {
  it("keeps the window anchored to the newest point on a series of another length", () => {
    expect(applyRelativeCategoryView({ visibleCount: 10, offsetFromEnd: 9 }, 40)).toEqual({ min: 20, max: 30 });
  });

  it("returns undefined when the window covers the whole series", () => {
    expect(applyRelativeCategoryView({ visibleCount: 100, offsetFromEnd: 0 }, 20)).toBeUndefined();
  });

  it("keeps the window size when clamped at the start", () => {
    expect(applyRelativeCategoryView({ visibleCount: 10, offsetFromEnd: 50 }, 20)).toEqual({ min: 0, max: 10 });
  });
});
