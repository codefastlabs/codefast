import { describe, expect, it } from "vitest";

import { bindingSlotEquals, bindingSlotToString, DEFAULT_BINDING_SLOT, generateBindingId } from "#/binding";

describe("bindingSlotEquals", () => {
  it("treats tag order as irrelevant and compares values with Object.is", () => {
    const left = {
      name: undefined,
      tags: [
        ["a", 1],
        ["b", Number.NaN],
      ] as const,
    };
    const right = {
      name: undefined,
      tags: [
        ["b", Number.NaN],
        ["a", 1],
      ] as const,
    };
    expect(bindingSlotEquals(left, right)).toBe(true);
  });

  it("differs on name, tag count, or tag value", () => {
    expect(bindingSlotEquals({ name: "x", tags: [] }, { name: "y", tags: [] })).toBe(false);
    expect(bindingSlotEquals({ name: undefined, tags: [["a", 1]] }, DEFAULT_BINDING_SLOT)).toBe(false);
    expect(bindingSlotEquals({ name: undefined, tags: [["a", 1]] }, { name: undefined, tags: [["a", 2]] })).toBe(false);
  });
});

describe("bindingSlotToString", () => {
  it("renders 'default' for the default slot and name/tags otherwise", () => {
    expect(bindingSlotToString(DEFAULT_BINDING_SLOT)).toBe("default");
    expect(bindingSlotToString({ name: "primary", tags: [] })).toBe("name:primary");
    expect(bindingSlotToString({ name: "primary", tags: [["tier", "gold"]] })).toBe("name:primary,tag:tier=gold");
  });
});

describe("generateBindingId", () => {
  it("returns unique ids across calls", () => {
    const first = generateBindingId();
    const second = generateBindingId();
    expect(first).not.toBe(second);
  });
});
