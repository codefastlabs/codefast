import type { BindingSlot } from "#/binding";
import type { Token } from "#/token";
import type { BindingTag, Constructor, ResolveOptions } from "#/types";

/**
 * What one resolvable dependency declares.
 *
 * @remarks Both dependency sources — a constructor's `ParamMetadata` and a `toResolved`
 * `InjectionDescriptor` — are this shape, which is why one resolve routine serves both.
 *
 * @since 0.5.0-canary.8
 */
export interface DependencySlot {
  readonly token: Token<unknown> | Constructor;
  readonly optional: boolean;
  readonly multi: boolean;
  readonly name?: string;
  readonly tags?: ReadonlyArray<BindingTag>;
}

/**
 * A request whose only criterion is a name — the shape the registry has a direct index for.
 *
 * @since 0.5.0-canary.8
 */
export function isNameOnlyOptions(options: ResolveOptions): options is ResolveOptions & { name: string } {
  return (
    options.name !== undefined && options.tag === undefined && (options.tags === undefined || options.tags.length === 0)
  );
}

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
