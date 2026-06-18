import { describe, expect, it } from "vitest";

import {
  getCommandPaletteAriaKeyshortcuts,
  getCommandPaletteKeyboardAction,
  isEditableTarget,
} from "#/lib/command-palette-keyboard";

function createKeyboardEvent(init: KeyboardEventInit & { target?: EventTarget | null }): KeyboardEvent {
  const { target = document.body, ...eventInit } = init;
  const event = new KeyboardEvent("keydown", eventInit);
  Object.defineProperty(event, "target", { value: target });
  return event;
}

describe("getCommandPaletteKeyboardAction", () => {
  it("opens on / when the palette is closed and focus is not editable", () => {
    const event = createKeyboardEvent({ key: "/" });

    expect(getCommandPaletteKeyboardAction(event, false)).toBe("open");
  });

  it("ignores / when the palette is already open", () => {
    const event = createKeyboardEvent({ key: "/" });

    expect(getCommandPaletteKeyboardAction(event, true)).toBeNull();
  });

  it("ignores / while typing in an input", () => {
    const input = document.createElement("input");
    const event = createKeyboardEvent({ key: "/", target: input });

    expect(getCommandPaletteKeyboardAction(event, false)).toBeNull();
  });

  it("toggles on modifier+/ and modifier+k", () => {
    expect(getCommandPaletteKeyboardAction(createKeyboardEvent({ key: "/", metaKey: true }), false)).toBe("toggle");
    expect(getCommandPaletteKeyboardAction(createKeyboardEvent({ key: "k", ctrlKey: true }), true)).toBe("toggle");
  });
});

describe("isEditableTarget", () => {
  it("detects editable elements", () => {
    expect(isEditableTarget(document.createElement("input"))).toBe(true);
    expect(isEditableTarget(document.createElement("div"))).toBe(false);
  });
});

describe("getCommandPaletteAriaKeyshortcuts", () => {
  it("lists only platform-relevant modifier shortcuts", () => {
    expect(getCommandPaletteAriaKeyshortcuts(true)).toBe("/ Meta+Slash Meta+K");
    expect(getCommandPaletteAriaKeyshortcuts(false)).toBe("/ Control+Slash Control+K");
  });
});
