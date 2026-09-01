import type { Binding, BindingSlot } from "#/core/binding";
import type { BindingTag, TagKeyMask } from "#/core/tag";
import { coversTagKeys, NO_TAG_KEYS, slotName, slotNameCriterionOf } from "#/core/tag";
import type { ConstraintContext, ResolveOptions } from "#/core/types";
import { AmbiguousBindingError } from "#/errors/errors";

/**
 * Selects a single candidate from a list of bindings using slot matching + predicates.
 * Returns undefined if no match, throws AmbiguousBindingError if multiple match.
 *
 * @since 0.3.16-canary.0
 */
export function selectBinding(
  bindings: ReadonlyArray<Binding>,
  options: ResolveOptions | undefined,
  ctx: ConstraintContext,
  tokenDisplayName: string,
): Binding | undefined {
  const candidates = filterBindings(bindings, options, ctx, true);
  if (candidates.length === 0) {
    return undefined;
  }
  if (candidates.length === 1) {
    return candidates[0];
  }
  // Most specific wins, predicate before tag count: a lone predicate-carrying candidate beats
  // predicate-less ones, a predicate being a deliberate specialization of the default. This order is
  // what keeps every resolution that already succeeds deciding the same way.
  let predicatedCandidate: Binding | undefined;
  for (const candidate of candidates) {
    if (candidate.predicate !== undefined) {
      if (predicatedCandidate !== undefined) {
        predicatedCandidate = undefined;
        break;
      }
      predicatedCandidate = candidate;
    }
  }
  if (predicatedCandidate !== undefined) {
    return predicatedCandidate;
  }
  // Reached only where the throw was: a slot declaring more of what the request carries is the more
  // specific match, so an over-specified request resolves instead of being ambiguous.
  const mostSpecific = mostSpecificByCriterionCount(candidates);
  if (mostSpecific !== undefined) {
    return mostSpecific;
  }
  throw new AmbiguousBindingError(
    tokenDisplayName,
    candidates.map((c) => c.id),
  );
}

/** The lone candidate declaring more criteria than every other, or `undefined` when that is a tie. */
function mostSpecificByCriterionCount(candidates: ReadonlyArray<Binding>): Binding | undefined {
  let best: Binding | undefined;
  let bestCount = -1;
  let tied = false;
  for (const candidate of candidates) {
    const count = candidate.slot.tags.length;
    if (count > bestCount) {
      best = candidate;
      bestCount = count;
      tied = false;
    } else if (count === bestCount) {
      tied = true;
    }
  }
  return tied ? undefined : best;
}

/**
 * Selects all candidates matching options + predicates.
 *
 * @since 0.3.16-canary.0
 */
export function selectAllBindings(
  bindings: ReadonlyArray<Binding>,
  options: ResolveOptions | undefined,
  ctx: ConstraintContext,
): Array<Binding> {
  // `resolveAll` matches the slot only when the request carries a criterion; with none it takes
  // every binding, where `resolve` would read an absent criterion as "the default slot".
  return filterBindings(bindings, options, ctx, options !== undefined && hasSlotCriterion(options));
}

/**
 * @param bindings - the token's candidates, in registration order
 * @param options - the request's selection criteria, if any
 * @param ctx - what the constraint predicates read
 * @param requiresSlotMatch - `resolve` always matches the slot, where an absent criterion means
 * "the default slot"; `resolveAll` matches only when the request carries one
 */
function filterBindings(
  bindings: ReadonlyArray<Binding>,
  options: ResolveOptions | undefined,
  ctx: ConstraintContext,
  requiresSlotMatch: boolean,
): Array<Binding> {
  const result: Array<Binding> = [];
  // A predicate is user code that may rebind the token mid-walk, but the registry replaces a
  // token's list on mutation instead of splicing it, so this walk keeps its own list — no copy.
  for (let index = 0; index < bindings.length; index += 1) {
    const binding = bindings[index]!;
    if (requiresSlotMatch && !matchesSlot(binding.slot, options)) {
      continue;
    }
    const predicate = binding.predicate;
    if (predicate === undefined) {
      result.push(binding);
      continue;
    }
    if (predicate(ctx)) {
      result.push(binding);
    }
  }
  return result;
}

function hasSlotCriterion(options: ResolveOptions): boolean {
  return requestedTagKeyMask(options) !== NO_TAG_KEYS;
}

/**
 * Whether a binding's slot satisfies a request: every criterion the slot declares must be among
 * the request's criteria, a name spelling either side folding to the reserved criterion.
 *
 * @remarks A key-mask subset test runs before any criterion is read, so a slot the request cannot
 * satisfy is rejected in one word compare. Criteria are interned, so what follows is identity.
 *
 * @since 0.5.0-canary.9
 */
export function matchesSlot(slot: BindingSlot, options: ResolveOptions | undefined): boolean {
  const slotMask = slot.keyMask;
  const requestMask = requestedTagKeyMask(options);

  if (slotMask === NO_TAG_KEYS) {
    // A request carrying any criterion never falls back to the default slot.
    return requestMask === NO_TAG_KEYS;
  }
  if (!coversTagKeys(requestMask, slotMask)) {
    return false;
  }

  // The mask can collide two keys onto one bit, so the exact criteria still have to be confirmed.
  const slotTags = slot.tags;

  for (let index = 0; index < slotTags.length; index += 1) {
    if (!requestCarries(options, slotTags[index]!)) {
      return false;
    }
  }

  return true;
}

/**
 * The key set a request covers, across both spellings the shorthand folds into one.
 *
 * @since 0.6.0
 */
export function requestedTagKeyMask(options: ResolveOptions | undefined): TagKeyMask {
  if (options === undefined) {
    return NO_TAG_KEYS;
  }
  const single = options.tag;
  const listed = options.tags;
  let mask = single === undefined ? NO_TAG_KEYS : single.mask;

  if (options.name !== undefined) {
    mask = (mask | slotName.mask) as TagKeyMask;
  }
  if (listed !== undefined) {
    for (let index = 0; index < listed.length; index += 1) {
      mask = (mask | listed[index]!.mask) as TagKeyMask;
    }
  }

  return mask;
}

/** Whether a request names this exact criterion — identity, because criteria are interned. */
function requestCarries(options: ResolveOptions | undefined, criterion: BindingTag): boolean {
  if (options === undefined) {
    return false;
  }
  // The `name` spelling folds through the intern read, so this too is identity — a hand-built
  // criterion matches nothing on any lane, and an unminted name retains nothing.
  if (criterion.key === slotName && options.name !== undefined && criterion === slotNameCriterionOf(options.name)) {
    return true;
  }
  if (options.tag === criterion) {
    return true;
  }
  const listed = options.tags;

  if (listed === undefined) {
    return false;
  }
  for (let index = 0; index < listed.length; index += 1) {
    if (listed[index] === criterion) {
      return true;
    }
  }

  return false;
}
