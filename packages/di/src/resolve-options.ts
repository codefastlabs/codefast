import type { SlotKey } from "#/binding";
import type { ResolveOptions } from "#/types";

/**
 * Builds a {@link ResolveOptions} safe for `exactOptionalPropertyTypes`:
 * omits keys instead of assigning `undefined`.
 *
 * @since 0.3.16-canary.0
 */
export function injectableSlotToResolveOptions(slot: {
  readonly name?: string;
  readonly tags?: ReadonlyArray<readonly [string, unknown]>;
}): ResolveOptions | undefined {
  const options: ResolveOptions = {};
  if (slot.name !== undefined) {
    options.name = slot.name;
  }
  if (slot.tags !== undefined) {
    options.tags = slot.tags;
  }
  return options.name !== undefined || options.tags !== undefined ? options : undefined;
}

/**
 * Hint from a binding {@link SlotKey} (tags may be empty; omits when nothing to match).
 *
 * @since 0.3.16-canary.0
 */
export function slotKeyToResolveOptions(slot: SlotKey): ResolveOptions | undefined {
  const options: ResolveOptions = {};
  if (slot.name !== undefined) {
    options.name = slot.name;
  }
  if (slot.tags.length > 0) {
    options.tags = slot.tags;
  }
  return options.name !== undefined || options.tags !== undefined ? options : undefined;
}
