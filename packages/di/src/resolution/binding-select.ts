import type { Binding } from "#/binding";
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
  // Most specific wins: a single matching predicate-carrying candidate beats
  // predicate-less ones (a predicate is a deliberate specialization of the
  // default). Two matching predicates are genuinely ambiguous.
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
  throw new AmbiguousBindingError(
    tokenDisplayName,
    candidates.map((c) => c.id),
  );
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
  if (options === undefined) {
    const resultWithoutOptions: Array<Binding> = [];
    if (selectionMode === "all") {
      for (const binding of bindings) {
        if (matchesPredicate(binding, ctx)) {
          resultWithoutOptions.push(binding);
        }
      }
    } else {
      for (const binding of bindings) {
        const slot = binding.slot;
        if (slot.name === undefined && slot.tags.length === 0 && matchesPredicate(binding, ctx)) {
          resultWithoutOptions.push(binding);
        }
      }
    }
    return resultWithoutOptions;
  }

  const result: Array<Binding> = [];
  for (const binding of bindings) {
    const slotMatched =
      selectionMode === "all" ? matchesSlotForResolveAll(binding, options) : matchesSlot(binding, options);
    if (slotMatched && matchesPredicate(binding, ctx)) {
      result.push(binding);
    }
  }
  return result;
}

function matchesSlotForResolveAll(binding: Binding, options: ResolveOptions | undefined): boolean {
  const hasExplicitSlotFilter =
    options !== undefined &&
    (options.name !== undefined ||
      (options.tags !== undefined && options.tags.length > 0) ||
      options.tag !== undefined);
  if (!hasExplicitSlotFilter) {
    return true;
  }
  return matchesSlot(binding, options);
}

function matchesSlot(binding: Binding, options: ResolveOptions | undefined): boolean {
  const slot = binding.slot;
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
    // Binding has no tags but options requires tags — no match for tagged slots
    // But: default slot (no tags, no name) can match when options has tags if there are no tag-slotted bindings
    // Actually per spec: resolveAll with tags only returns bindings that have those tags
    // and resolve with tags requires exact match
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
