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
 * The options a dependency resolves with, built once per slot.
 *
 * @remarks A slot's name and tags are fixed when it is declared, so the options derived from them are
 * too — but a dependency is resolved on every hop, and building them there allocated an object per hop
 * for every named or tagged dependency. The plain case is answered from the two fields without a call
 * into the builder at all; only a slot that actually carries a criterion reaches the memo, which is
 * why the memo can be written lazily without costing the common shape a hidden-class transition.
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
 * @remarks Frozen because one object now answers every resolve of that slot, in every container, and
 * a constraint predicate is handed it as `currentResolveOptions`. Writing through that reference would
 * rewrite what the dependency asks for from then on; frozen, the attempt throws where it is made.
 *
 * Split out for the `try`: V8 declines to inline a function containing one, and this is reached from
 * the path every dependency of every resolve takes, so a `try` in there costs the early return its
 * inlining. The `catch` covers a frozen slot, which a custom {@link MetadataReader} may hand out —
 * correct either way, it just keeps rebuilding.
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
    /* frozen slot */
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
