import type { BindingSlot } from "#/binding";
import type { BindingTag, ResolveOptions } from "#/types";

/** Shared core: build a ResolveOptions from already-normalised name + tags. */
function buildOptions(
  name: string | undefined,
  tags: ReadonlyArray<BindingTag> | undefined,
): ResolveOptions | undefined {
  if (name === undefined && tags === undefined) {
    return undefined;
  }
  const options: ResolveOptions = {};
  if (name !== undefined) {
    options.name = name;
  }
  if (tags !== undefined) {
    options.tags = tags;
  }
  return options;
}

/**
 * Builds a {@link ResolveOptions} safe for `exactOptionalPropertyTypes`:
 * omits keys instead of assigning `undefined`.
 *
 * @since 0.3.16-canary.0
 */
export function injectionSlotToResolveOptions(injectionSlot: {
  readonly name?: string;
  readonly tags?: ReadonlyArray<BindingTag>;
}): ResolveOptions | undefined {
  return buildOptions(injectionSlot.name, injectionSlot.tags);
}

/**
 * Resolve options derived from a binding {@link BindingSlot} (tags may be empty; omits when nothing to match).
 *
 * @since 0.3.16-canary.0
 */
export function bindingSlotToResolveOptions(bindingSlot: BindingSlot): ResolveOptions | undefined {
  return buildOptions(bindingSlot.name, bindingSlot.tags.length > 0 ? bindingSlot.tags : undefined);
}
