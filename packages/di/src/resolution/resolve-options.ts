import type { Token } from "#/token";
import type { BindingTag, Constructor, ResolveOptions } from "#/types";

/**
 * What one resolvable dependency declares.
 *
 * @remarks Both dependency sources — a constructor's `ParamMetadata` and a `toResolved`
 * `InjectionDescriptor` — are this shape, which is why one resolve routine serves both.
 *
 * @since 0.5.0-canary.9
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
 * @since 0.5.0-canary.9
 */
export function isNameOnlyOptions(options: ResolveOptions): options is ResolveOptions & { name: string } {
  return (
    options.name !== undefined && options.tag === undefined && (options.tags === undefined || options.tags.length === 0)
  );
}

/**
 * The lone tag of a request that asks for exactly one, written either way — the shape the registry
 * has a direct tag index for.
 *
 * @remarks Both spellings answer here, so the index is not something one of them silently misses.
 *
 * @since 0.5.0-canary.9
 */
export function singleTagOnlyOf(options: ResolveOptions): BindingTag | undefined {
  if (options.name !== undefined) {
    return undefined;
  }
  const listed = options.tags;
  const shorthand = options.tag;
  if (shorthand !== undefined) {
    // Both sources present means the request carries two tags, which no single-tag index can answer.
    return listed === undefined || listed.length === 0 ? shorthand : undefined;
  }
  return listed !== undefined && listed.length === 1 ? listed[0] : undefined;
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
 * Resolve options derived from a binding slot (tags may be empty; omits when nothing to match).
 *
 * @remarks Takes the slot structurally rather than as `BindingSlot`, so the slot on a public
 * `BindingSnapshot` — where `name` is an optional property, not a required one holding `undefined` —
 * is accepted by the same call.
 *
 * @since 0.3.16-canary.0
 */
export function bindingSlotToResolveOptions(bindingSlot: {
  readonly name?: string | undefined;
  readonly tags: ReadonlyArray<BindingTag>;
}): ResolveOptions | undefined {
  return buildOptions(bindingSlot.name, bindingSlot.tags.length > 0 ? bindingSlot.tags : undefined);
}
