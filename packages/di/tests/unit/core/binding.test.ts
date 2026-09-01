import { describe, expect, it } from "vitest";

import { bindingSlotEquals, bindingSlotToString, DEFAULT_BINDING_SLOT, generateBindingId } from "#/core/binding";
import { slotName, tag, tagKeyMaskOf } from "#/core/tag";

const A_TAG = tag("a");
const B_TAG = tag("b");
const TIER_TAG = tag("tier");

describe("bindingSlotEquals", () => {
  it("treats tag order as irrelevant and compares values with Object.is", () => {
    const left = {
      name: undefined,
      tags: [A_TAG.of(1), B_TAG.of(Number.NaN)] as const,
      keyMask: tagKeyMaskOf([A_TAG.of(1), B_TAG.of(Number.NaN)]),
    };
    const right = {
      name: undefined,
      tags: [B_TAG.of(Number.NaN), A_TAG.of(1)] as const,
      keyMask: tagKeyMaskOf([B_TAG.of(Number.NaN), A_TAG.of(1)]),
    };
    expect(bindingSlotEquals(left, right)).toBe(true);
  });

  it("differs on name, tag count, or tag value", () => {
    expect(
      bindingSlotEquals(
        { name: "x", tags: [], keyMask: tagKeyMaskOf([]) },
        { name: "y", tags: [], keyMask: tagKeyMaskOf([]) },
      ),
    ).toBe(false);
    expect(
      bindingSlotEquals(
        { name: undefined, tags: [A_TAG.of(1)], keyMask: tagKeyMaskOf([A_TAG.of(1)]) },
        DEFAULT_BINDING_SLOT,
      ),
    ).toBe(false);
    expect(
      bindingSlotEquals(
        { name: undefined, tags: [A_TAG.of(1)], keyMask: tagKeyMaskOf([A_TAG.of(1)]) },
        { name: undefined, tags: [A_TAG.of(2)], keyMask: tagKeyMaskOf([A_TAG.of(2)]) },
      ),
    ).toBe(false);
  });
});

describe("bindingSlotToString", () => {
  it("renders 'default' for the default slot and name/tags otherwise", () => {
    expect(bindingSlotToString(DEFAULT_BINDING_SLOT)).toBe("default");
    // A name is the reserved criterion, carried in tags and rendered once as the name: part.
    const nameCriterion = slotName.of("primary");
    expect(
      bindingSlotToString({ name: "primary", tags: [nameCriterion], keyMask: tagKeyMaskOf([nameCriterion]) }),
    ).toBe("name:primary");
    expect(
      bindingSlotToString({
        name: "primary",
        tags: [nameCriterion, TIER_TAG.of("gold")],
        keyMask: tagKeyMaskOf([nameCriterion, TIER_TAG.of("gold")]),
      }),
    ).toBe("name:primary,tag:tier=gold");
  });
});

describe("generateBindingId", () => {
  it("returns unique ids across calls", () => {
    const first = generateBindingId();
    const second = generateBindingId();
    expect(first).not.toBe(second);
  });
});
