import { describe, expect, it } from "vitest";

import { resolveActiveAnchor } from "#/features/components-catalog/lib/active-anchor";

/** A section anchor whose only geometry is its distance from the viewport top. */
function anchor(id: string, top: number, parent?: Element): HTMLElement {
  const element = document.createElement("section");

  element.id = id;
  element.getBoundingClientRect = () => ({ top, bottom: top + 10 }) as DOMRect;
  (parent ?? document.body).append(element);

  return element;
}

const BAND_TOP = 100;

describe("resolveActiveAnchor", () => {
  it("reports the topmost anchor inside the band", () => {
    const targets = [anchor("a", -400), anchor("b", 150), anchor("c", 180), anchor("d", 900)];

    expect(resolveActiveAnchor(targets, new Set([targets[1]!, targets[2]!]), BAND_TOP)).toBe("b");
  });

  it("prefers a child anchor over the container that wraps it", () => {
    const examples = anchor("examples", 120);
    const nested = anchor("examples-basic", 140, examples);

    expect(resolveActiveAnchor([examples, nested], new Set([examples, nested]), BAND_TOP)).toBe("examples-basic");
  });

  it("falls back to the last anchor scrolled above the band when none is inside it", () => {
    const targets = [anchor("a", -900), anchor("b", -300), anchor("c", 600)];

    expect(resolveActiveAnchor(targets, new Set(), BAND_TOP)).toBe("b");
  });

  it("falls back to the first anchor at the top of the page, and to null without anchors", () => {
    const targets = [anchor("a", 500), anchor("b", 900)];

    expect(resolveActiveAnchor(targets, new Set(), BAND_TOP)).toBe("a");
    expect(resolveActiveAnchor([], new Set(), BAND_TOP)).toBeNull();
  });
});
