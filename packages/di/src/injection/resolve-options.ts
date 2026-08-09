import type { BindingTag } from "#/core/tag";
import type { Token } from "#/core/token";
import type { Constructor, ResolveOptions } from "#/core/types";

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
  readonly name?: string | undefined;
  readonly tags?: ReadonlyArray<BindingTag> | undefined;
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
export function injectionSlotToResolveOptions(
  injectionSlot: Pick<DependencySlot, "name" | "tags">,
): ResolveOptions | undefined {
  return buildOptions(injectionSlot.name, injectionSlot.tags);
}

/** Where a slot's derived options are memoized, so the same object is handed out every resolve. */
const MEMOIZED_RESOLVE_OPTIONS: unique symbol = Symbol("di:resolve-options");

interface SlotWithMemoizedOptions {
  [MEMOIZED_RESOLVE_OPTIONS]?: ResolveOptions;
}

/**
 * The options a dependency resolves with — one object per slot, since a slot's criteria are fixed
 * when it is declared.
 *
 * @remarks A slot carrying no criterion answers from its two fields, so the common shape never
 * reaches the memo.
 */
export function resolveOptionsForSlot(injectionSlot: DependencySlot): ResolveOptions | undefined {
  const { name, tags } = injectionSlot;
  if (name === undefined && tags === undefined) {
    return undefined;
  }
  const slot = injectionSlot as SlotWithMemoizedOptions;
  const memoized = slot[MEMOIZED_RESOLVE_OPTIONS];
  return memoized ?? memoizeResolveOptions(slot, name, tags);
}

/**
 * Builds, freezes and stores a slot's options on first use.
 *
 * @remarks Frozen because one object answers every resolve of the slot and a constraint predicate is
 * handed it. Split out for the `try`: in the caller it would cost the early return its inlining.
 */
function memoizeResolveOptions(
  slot: SlotWithMemoizedOptions,
  name: string | undefined,
  tags: ReadonlyArray<BindingTag> | undefined,
): ResolveOptions {
  const built = Object.freeze(buildOptions(name, tags) as ResolveOptions);
  try {
    slot[MEMOIZED_RESOLVE_OPTIONS] = built;
  } catch {
    // A frozen slot rebuilds on every hop rather than throwing.
  }
  return built;
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
  readonly tags?: ReadonlyArray<BindingTag> | undefined;
}): ResolveOptions | undefined {
  const tags = bindingSlot.tags;
  return buildOptions(bindingSlot.name, tags !== undefined && tags.length > 0 ? tags : undefined);
}
