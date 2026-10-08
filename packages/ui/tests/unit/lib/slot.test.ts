import { behaviorSlot } from "#lib/slot";

describe("behaviorSlot", () => {
  test("stamps the part's slot when it renders its own element", () => {
    expect(behaviorSlot("popover-trigger", undefined)).toStrictEqual({ "data-slot": "popover-trigger" });
    expect(behaviorSlot("popover-trigger", false)).toStrictEqual({ "data-slot": "popover-trigger" });
  });

  test("omits the key under asChild, so Slot forwards nothing over the child's slot", () => {
    expect(behaviorSlot("popover-trigger", true)).not.toHaveProperty("data-slot");
  });
});
