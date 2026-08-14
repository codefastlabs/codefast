import type { Binding, BindingSlot } from "#/core/binding";
import type { BindingTag, TagKeyMask } from "#/core/tag";
import { coversTagKeys, NO_TAG_KEYS } from "#/core/tag";
import type { ConstraintContext, ResolveOptions } from "#/core/types";
import { AmbiguousBindingError } from "#/errors/errors";

/**
 * Select a single candidate from a list of bindings using slot matching + predicates.
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
  const candidates = filterBindings(bindings, options, ctx);
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
  const mostSpecific = mostSpecificByTagCount(candidates);
  if (mostSpecific !== undefined) {
    return mostSpecific;
  }
  throw new AmbiguousBindingError(
    tokenDisplayName,
    candidates.map((c) => c.id),
  );
}

/** The lone candidate declaring more tags than every other, or `undefined` when that is a tie. */
function mostSpecificByTagCount(candidates: ReadonlyArray<Binding>): Binding | undefined {
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
 * Select all candidates matching options + predicates.
 *
 * @since 0.3.16-canary.0
 */
export function selectAllBindings(
  bindings: ReadonlyArray<Binding>,
  options: ResolveOptions | undefined,
  ctx: ConstraintContext,
): Array<Binding> {
  return filterBindings(bindings, options, ctx, "all");
}

function filterBindings(
  bindings: ReadonlyArray<Binding>,
  options: ResolveOptions | undefined,
  ctx: ConstraintContext,
  selectionMode: "single" | "all" = "single",
): Array<Binding> {
  // `resolveAll` with no slot criterion takes every binding; `resolve` always matches the slot,
  // where an absent criterion means "the default slot".
  const requiresSlotMatch = selectionMode === "single" || (options !== undefined && hasSlotCriterion(options));
  const result: Array<Binding> = [];
  // Snapshot lazily, right before the first predicate runs: a predicate is user code that may
  // rebind the very token being selected, and a mid-selection splice must not skip candidates.
  let stable: ReadonlyArray<Binding> = bindings;
  for (let index = 0; index < stable.length; index += 1) {
    const binding = stable[index]!;
    if (requiresSlotMatch && !matchesSlot(binding.slot, options)) {
      continue;
    }
    if (binding.predicate !== undefined && stable === bindings) {
      stable = bindings.slice();
    }
    if (matchesPredicate(binding, ctx)) {
      result.push(binding);
    }
  }
  return result;
}

function hasSlotCriterion(options: ResolveOptions): boolean {
  return options.name !== undefined || requestedTagKeyMask(options) !== NO_TAG_KEYS;
}

/**
 * Whether a binding's slot satisfies a request: names must be equal, and every tag the slot
 * declares must be among the tags requested.
 *
 * @remarks The tag half is a key-mask subset test before any criterion is read, so a slot the
 * request cannot satisfy is rejected in one word compare. Criteria are interned, so what follows is
 * identity.
 *
 * @since 0.5.0-canary.9
 */
export function matchesSlot(slot: BindingSlot, options: ResolveOptions | undefined): boolean {
  const requestedName = options?.name;

  if (slot.name !== undefined) {
    if (slot.name !== requestedName) {
      return false;
    }
  } else if (requestedName !== undefined) {
    return false;
  }

  const slotMask = slot.keyMask;
  const requestMask = requestedTagKeyMask(options);

  if (slotMask === NO_TAG_KEYS) {
    // A request carrying tags needs a tagged slot: an untagged binding never matches.
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

/** The key set a request covers, across both spellings the shorthand folds into one. */
export function requestedTagKeyMask(options: ResolveOptions | undefined): TagKeyMask {
  if (options === undefined) {
    return NO_TAG_KEYS;
  }
  const single = options.tag;
  const listed = options.tags;
  let mask = single === undefined ? NO_TAG_KEYS : single.mask;

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

function matchesPredicate(binding: Binding, ctx: ConstraintContext): boolean {
  if (binding.predicate === undefined) {
    return true;
  }
  return binding.predicate(ctx);
}
