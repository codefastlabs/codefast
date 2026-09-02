import { describe, expect, it, vi } from "vitest";

import { handleSkipToChartClick, skipToChartTarget } from "#/app/lib/skip-chart";

describe("skipToChartTarget", () => {
  it("scrolls and focuses the target element", () => {
    const scrollIntoView = vi.fn();
    const focus = vi.fn();
    const target = { scrollIntoView, focus } as unknown as HTMLElement;

    skipToChartTarget(target);

    expect(scrollIntoView).toHaveBeenCalledWith({ block: "start" });
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it("no-ops when the target is missing", () => {
    expect(() => skipToChartTarget(null)).not.toThrow();
  });
});

describe("handleSkipToChartClick", () => {
  it("calls preventDefault so fragment navigation does not run", () => {
    const preventDefault = vi.fn();
    handleSkipToChartClick({ preventDefault });
    expect(preventDefault).toHaveBeenCalled();
  });
});
