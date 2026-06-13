const EDITABLE_SELECTOR = 'input, textarea, select, [contenteditable=""], [contenteditable="true"]' as const;

export type CommandPaletteKeyboardAction = "open" | "toggle";

function hasPrimaryModifier(event: KeyboardEvent): boolean {
  return event.metaKey || event.ctrlKey;
}

/** Skip `/` when focus is inside an editable field or the palette is already open. */
export function isEditableTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(EDITABLE_SELECTOR) !== null;
}

/**
 * Maps a keydown to a palette action:
 * - `/` opens when closed (not while typing in an input)
 * - ⌘/ / Ctrl+/ and ⌘K / Ctrl+K toggle from anywhere
 */
export function getCommandPaletteKeyboardAction(
  event: KeyboardEvent,
  open: boolean,
): CommandPaletteKeyboardAction | null {
  if (hasPrimaryModifier(event) && !event.shiftKey && !event.altKey) {
    if (event.key === "/") {
      return "toggle";
    }

    if (event.key.toLowerCase() === "k") {
      return "toggle";
    }

    return null;
  }

  if (event.key !== "/" || event.shiftKey || event.altKey || hasPrimaryModifier(event)) {
    return null;
  }

  if (open || isEditableTarget(event.target)) {
    return null;
  }

  return "open";
}

export function getIsMacPlatform(): boolean {
  return /Mac|iPhone|iPod|iPad/i.test(navigator.platform);
}

/** ARIA tokens only — slash is universal; modifier shortcuts match the user's OS. */
export function getCommandPaletteAriaKeyshortcuts(isMac: boolean): string {
  return isMac ? "/ Meta+Slash Meta+K" : "/ Control+Slash Control+K";
}
