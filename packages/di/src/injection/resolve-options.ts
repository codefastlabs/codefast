import type { BindingTag } from "#/core/tag";
import { slotName, slotNameCriterionOf } from "#/core/tag";
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
 * The lone criterion of a request that carries exactly one, whatever its spelling — the shape the
 * registry has a direct index for.
 *
 * @remarks Every spelling answers here, so the index is not something one of them silently misses;
 * a name folds to the reserved `slotName` criterion, making the name lane the tag lane.
 *
 * @since 0.5.0-canary.9
 */
export function singleCriterionOnlyOf(options: ResolveOptions | undefined): BindingTag | undefined {
  if (options === undefined) {
    return undefined;
  }
  if (options.name !== undefined) {
    return loneNameCriterionOf(options);
  }
  const listed = options.tags;
  const shorthand = options.tag;
  if (shorthand !== undefined) {
    return listed === undefined || listed.length === 0 ? shorthand : undefined;
  }
  return listed !== undefined && listed.length === 1 ? listed[0] : undefined;
}

/** The name spelling's half of the fold, kept apart so the common body stays small enough to inline. */
function loneNameCriterionOf(options: ResolveOptions): BindingTag | undefined {
  // A name next to any tag means the request carries two criteria, which no single index answers.
  if (options.tag !== undefined || (options.tags !== undefined && options.tags.length > 0)) {
    return undefined;
  }
  // Read, not minted: a request must not retain a name no binding ever declared.
  return slotNameCriterionOf(options.name as string);
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

/** Where a slot's folded lone criterion is memoized — `null` records "computed: none". */
const MEMOIZED_SINGLE_CRITERION: unique symbol = Symbol("di:single-criterion");

interface SlotWithMemoizedOptions {
  [MEMOIZED_RESOLVE_OPTIONS]?: ResolveOptions;
  [MEMOIZED_SINGLE_CRITERION]?: BindingTag | null;
}

/**
 * The options a dependency resolves with — one object per slot, since a slot's criteria are fixed
 * when it is declared.
 *
 * @remarks A slot carrying no criterion answers from its two fields, so the common shape never
 * reaches the memo.
 *
 * @since 0.6.0
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
 * The lone criterion a dependency's fixed criteria fold to, memoized on the slot like its options —
 * `null` means the fold answered "none".
 *
 * @remarks A slot's criteria never change after declaration, so the fold happens once per slot
 * rather than per hop — which is what keeps a named dependency's resolve off the intern map. A
 * lone name whose criterion is not interned yet is left unmemoized: a later `whenNamed` binding
 * mints it, and the next fold must see that.
 *
 * @since 0.8.0
 */
export function singleCriterionForSlot(injectionSlot: DependencySlot): BindingTag | null {
  const slot = injectionSlot as SlotWithMemoizedOptions;
  const memoized = slot[MEMOIZED_SINGLE_CRITERION];
  if (memoized !== undefined) {
    return memoized;
  }
  const options = resolveOptionsForSlot(injectionSlot);
  const criterion = singleCriterionOnlyOf(options);
  const folded = criterion ?? null;
  if (criterion !== undefined || !isLoneNameOptions(options)) {
    try {
      slot[MEMOIZED_SINGLE_CRITERION] = folded;
    } catch {
      // A frozen slot re-folds on every hop rather than throwing.
    }
  }
  return folded;
}

/** A slot request whose only criterion is a name — the one shape whose fold can change after a bind. */
function isLoneNameOptions(options: ResolveOptions | undefined): boolean {
  // Slot-derived options never carry the `tag` shorthand — `buildOptions` folds it into `tags`.
  return (
    options !== undefined && options.name !== undefined && (options.tags === undefined || options.tags.length === 0)
  );
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
  let name = bindingSlot.name;
  let criteria: ReadonlyArray<BindingTag> | undefined = tags !== undefined && tags.length > 0 ? tags : undefined;
  if (criteria !== undefined) {
    // A reserved criterion folds into `name` — carried in `tags` it would be said twice or, on a
    // descriptor that spells its name as a tag, not at all.
    const reserved = criteria.find((criterion) => criterion.key === slotName);
    if (reserved !== undefined) {
      name ??= reserved.value as string;
      const rest = criteria.filter((criterion) => criterion.key !== slotName);
      criteria = rest.length > 0 ? rest : undefined;
    }
  }
  return buildOptions(name, criteria);
}
