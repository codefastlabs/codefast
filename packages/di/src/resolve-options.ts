import type { BindingSlot } from "#/binding";
import type { ResolveOptions } from "#/types";

/**
 * Builds a {@link ResolveOptions} safe for `exactOptionalPropertyTypes`:
 * omits keys instead of assigning `undefined`.
 *
 * @since 0.3.16-canary.0
 */
export function injectionSlotToResolveOptions(injectionSlot: {
  readonly name?: string;
  readonly tags?: ReadonlyArray<readonly [string, unknown]>;
}): ResolveOptions | undefined {
  const options: ResolveOptions = {};
  if (injectionSlot.name !== undefined) {
    options.name = injectionSlot.name;
  }
  if (injectionSlot.tags !== undefined) {
    options.tags = injectionSlot.tags;
  }
  return options.name !== undefined || options.tags !== undefined ? options : undefined;
}

/**
 * Hint from a binding {@link BindingSlot} (tags may be empty; omits when nothing to match).
 *
 * @since 0.3.16-canary.0
 */
export function bindingSlotToResolveOptions(bindingSlot: BindingSlot): ResolveOptions | undefined {
  const options: ResolveOptions = {};
  if (bindingSlot.name !== undefined) {
    options.name = bindingSlot.name;
  }
  if (bindingSlot.tags.length > 0) {
    options.tags = bindingSlot.tags;
  }
  return options.name !== undefined || options.tags !== undefined ? options : undefined;
}
