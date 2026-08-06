import type { Binding, BindingSlot } from "#/binding";
import { AmbiguousBindingError } from "#/errors";
import type { BindingTag, ConstraintContext, ResolveOptions } from "#/types";

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
  // what keeps every resolution that already succeeds deciding the same way — see SPEC §5.11.
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
  // specific match, so an over-specified request resolves instead of being ambiguous (SPEC §5.11).
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
  for (const binding of bindings) {
    if ((!requiresSlotMatch || matchesSlot(binding.slot, options)) && matchesPredicate(binding, ctx)) {
      result.push(binding);
    }
  }
  return result;
}

function hasSlotCriterion(options: ResolveOptions): boolean {
  return options.name !== undefined || options.tag !== undefined || (options.tags?.length ?? 0) > 0;
}

/**
 * Whether a binding's slot satisfies a request: names must be equal, and every tag the slot
 * declares must be among the tags requested (SPEC §5.11).
 *
 * @since 0.5.0-canary.9
 */
export function matchesSlot(slot: BindingSlot, options: ResolveOptions | undefined): boolean {
  const requestedName = options?.name;
  const requestedTags = options?.tags;
  const singleRequestedTag = options?.tag;
  const hasRequestedTags = (requestedTags?.length ?? 0) > 0 || singleRequestedTag !== undefined;

  // Match by name
  if (slot.name !== undefined) {
    if (requestedName === undefined) {
      return false;
    }
    if (slot.name !== requestedName) {
      return false;
    }
  } else if (requestedName !== undefined) {
    // Binding has no name but options requests a specific name — no match
    return false;
  }

  // Match by tags — binding's tags must all be present in options
  if (slot.tags.length > 0) {
    if (!hasRequestedTags) {
      return false;
    }
    for (const [tagKey, tagValue] of slot.tags) {
      if (!matchesRequestedTag(tagKey, tagValue, requestedTags, singleRequestedTag)) {
        return false;
      }
    }
  } else if (hasRequestedTags) {
    // Requested tags require a tagged slot: an untagged binding never matches (SPEC §5.11).
    return false;
  }

  return true;
}

function matchesRequestedTag(
  tagKey: string,
  tagValue: unknown,
  requestedTags: ReadonlyArray<BindingTag> | undefined,
  singleRequestedTag: BindingTag | undefined,
): boolean {
  if (
    singleRequestedTag !== undefined &&
    singleRequestedTag[0] === tagKey &&
    Object.is(singleRequestedTag[1], tagValue)
  ) {
    return true;
  }
  if (requestedTags === undefined || requestedTags.length === 0) {
    return false;
  }
  for (let index = 0; index < requestedTags.length; index += 1) {
    const requestedTag = requestedTags[index]!;
    if (requestedTag[0] === tagKey && Object.is(requestedTag[1], tagValue)) {
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
