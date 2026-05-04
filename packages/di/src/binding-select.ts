import type { Binding } from "#/binding";
import type { ConstraintContext, ResolveOptions } from "#/types";
import { AmbiguousBindingError } from "#/errors";

/**
 * Select a single candidate from a list of bindings using slot matching + predicates.
 * Returns undefined if no match, throws AmbiguousBindingError if multiple match.
 *
 * @since 0.3.16-canary.0
 */
export function selectBinding(
  bindings: readonly Binding[],
  hint: ResolveOptions | undefined,
  ctx: ConstraintContext,
  tName: string,
): Binding | undefined {
  const candidates = filterBindings(bindings, hint, ctx);
  if (candidates.length === 0) {
    return undefined;
  }
  if (candidates.length === 1) {
    return candidates[0];
  }
  // Multiple candidates — check if any is unambiguous (slot-based selection)
  // Slot-based bindings already have last-wins applied in registry, so
  // multiple candidates here means ambiguous predicate-only bindings
  throw new AmbiguousBindingError(
    tName,
    candidates.map((c) => c.id),
  );
}

/**
 * Select all candidates matching hint + predicates.
 *
 * @since 0.3.16-canary.0
 */
export function selectAllBindings(
  bindings: readonly Binding[],
  hint: ResolveOptions | undefined,
  ctx: ConstraintContext,
): Binding[] {
  return filterBindings(bindings, hint, ctx, "all");
}

function filterBindings(
  bindings: readonly Binding[],
  hint: ResolveOptions | undefined,
  ctx: ConstraintContext,
  mode: "single" | "all" = "single",
): Binding[] {
  if (hint === undefined) {
    const resultWithoutHint: Binding[] = [];
    if (mode === "all") {
      for (const binding of bindings) {
        if (matchesPredicate(binding, ctx)) {
          resultWithoutHint.push(binding);
        }
      }
    } else {
      for (const binding of bindings) {
        const slot = binding.slot;
        if (slot.name === undefined && slot.tags.length === 0 && matchesPredicate(binding, ctx)) {
          resultWithoutHint.push(binding);
        }
      }
    }
    return resultWithoutHint;
  }

  const result: Binding[] = [];
  for (const binding of bindings) {
    const slotMatched =
      mode === "all" ? matchesSlotForResolveAll(binding, hint) : matchesSlot(binding, hint);
    if (slotMatched && matchesPredicate(binding, ctx)) {
      result.push(binding);
    }
  }
  return result;
}

function matchesSlotForResolveAll(binding: Binding, hint: ResolveOptions | undefined): boolean {
  const hasExplicitSlotFilter =
    hint !== undefined &&
    (hint.name !== undefined ||
      (hint.tags !== undefined && hint.tags.length > 0) ||
      hint.tag !== undefined);
  if (!hasExplicitSlotFilter) {
    return true;
  }
  return matchesSlot(binding, hint);
}

function matchesSlot(binding: Binding, hint: ResolveOptions | undefined): boolean {
  const slot = binding.slot;
  const hintName = hint?.name;
  const hintTags = hint?.tags;
  const singleHintTag = hint?.tag;
  const hasHintTags = (hintTags?.length ?? 0) > 0 || singleHintTag !== undefined;

  // Match by name
  if (slot.name !== undefined) {
    if (hintName === undefined) {
      return false;
    }
    if (slot.name !== hintName) {
      return false;
    }
  } else if (hintName !== undefined) {
    // Binding has no name but hint requests a specific name — no match
    return false;
  }

  // Match by tags — binding's tags must all be present in hint
  if (slot.tags.length > 0) {
    if (!hasHintTags) {
      return false;
    }
    for (const [tagKey, tagValue] of slot.tags) {
      if (!matchHintTag(tagKey, tagValue, hintTags, singleHintTag)) {
        return false;
      }
    }
  } else if (hasHintTags) {
    // Binding has no tags but hint requires tags — no match for tagged slots
    // But: default slot (no tags, no name) can match when hint has tags if there are no tag-slotted bindings
    // Actually per spec: resolveAll with tags only returns bindings that have those tags
    // and resolve with tags requires exact match
    return false;
  }

  return true;
}

function matchHintTag(
  tagKey: string,
  tagValue: unknown,
  hintTags: ReadonlyArray<readonly [string, unknown]> | undefined,
  singleHintTag: readonly [string, unknown] | undefined,
): boolean {
  if (
    singleHintTag !== undefined &&
    singleHintTag[0] === tagKey &&
    Object.is(singleHintTag[1], tagValue)
  ) {
    return true;
  }
  if (hintTags === undefined || hintTags.length === 0) {
    return false;
  }
  for (let index = 0; index < hintTags.length; index += 1) {
    const hintTag = hintTags[index]!;
    if (hintTag[0] === tagKey && Object.is(hintTag[1], tagValue)) {
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
