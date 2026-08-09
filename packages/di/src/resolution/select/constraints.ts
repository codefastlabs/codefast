import { requiringAncestorSlotName } from "#/core/constraint-requirement";
import type { BindingTag } from "#/core/tag";
import { coversTagKeys, tagKeyMaskOf } from "#/core/tag";
import type { Token } from "#/core/token";
import { tokenName } from "#/core/token";
import type { BindingConstraint, Constructor } from "#/core/types";
import { EmptyTagCriteriaError } from "#/errors/errors";

/**
 * @since 0.3.16-canary.0
 */
export function whenParentIs(token: Token<unknown> | Constructor): BindingConstraint {
  const tokenDisplayName = tokenName(token);
  return (constraintContext) =>
    constraintContext.parent !== undefined && constraintContext.parent.tokenName === tokenDisplayName;
}

/**
 * @since 0.3.16-canary.0
 */
export function whenNoParentIs(token: Token<unknown> | Constructor): BindingConstraint {
  const tokenDisplayName = tokenName(token);
  return (constraintContext) =>
    constraintContext.parent === undefined || constraintContext.parent.tokenName !== tokenDisplayName;
}

/**
 * @since 0.3.16-canary.0
 */
export function whenAnyAncestorIs(token: Token<unknown> | Constructor): BindingConstraint {
  const tokenDisplayName = tokenName(token);
  return (constraintContext) =>
    constraintContext.ancestors.some((ancestorFrame) => ancestorFrame.tokenName === tokenDisplayName);
}

/**
 * @since 0.3.16-canary.0
 */
export function whenNoAncestorIs(token: Token<unknown> | Constructor): BindingConstraint {
  const tokenDisplayName = tokenName(token);
  return (constraintContext) =>
    constraintContext.ancestors.every((ancestorFrame) => ancestorFrame.tokenName !== tokenDisplayName);
}

/**
 * @since 0.3.16-canary.0
 */
export function whenParentNamed(name: string): BindingConstraint {
  return requiringAncestorSlotName(
    (constraintContext) => constraintContext.parent !== undefined && constraintContext.parent.slot.name === name,
    name,
    "whenParentNamed",
  );
}

/**
 * @since 0.3.16-canary.0
 */
export function whenAnyAncestorNamed(name: string): BindingConstraint {
  return requiringAncestorSlotName(
    (constraintContext) => constraintContext.ancestors.some((ancestorFrame) => ancestorFrame.slot.name === name),
    name,
    "whenAnyAncestorNamed",
  );
}

/**
 * @since 0.3.16-canary.0
 */
export function whenParentTagged(criterion: BindingTag): BindingConstraint {
  return (constraintContext) =>
    constraintContext.parent !== undefined && constraintContext.parent.slot.tags.includes(criterion);
}

/**
 * @since 0.3.16-canary.0
 */
export function whenAnyAncestorTagged(criterion: BindingTag): BindingConstraint {
  return (constraintContext) =>
    constraintContext.ancestors.some((ancestorFrame) => ancestorFrame.slot.tags.includes(criterion));
}

/**
 * Matches when the direct parent slot carries **all** of the given tag pairs.
 * Equivalent to AND-composing multiple `whenParentTagged` calls but evaluates
 * in a single predicate invocation — no intermediate closure allocations.
 *
 * @since 0.3.16-canary.1
 */
export function whenParentTaggedAll(tags: ReadonlyArray<BindingTag>): BindingConstraint {
  assertHasCriteria(tags, "whenParentTaggedAll");
  const wanted = tagKeyMaskOf(tags);
  return (constraintContext) => {
    const { parent } = constraintContext;
    if (parent === undefined || !coversTagKeys(parent.slot.keyMask, wanted)) {
      return false;
    }
    return tags.every((criterion) => parent.slot.tags.includes(criterion));
  };
}

/**
 * Matches when at least one ancestor slot carries **all** of the given tag pairs.
 * Equivalent to AND-composing multiple `whenAnyAncestorTagged` calls but evaluates
 * in a single predicate invocation — no intermediate closure allocations.
 *
 * @since 0.3.16-canary.1
 */
export function whenAnyAncestorTaggedAll(tags: ReadonlyArray<BindingTag>): BindingConstraint {
  assertHasCriteria(tags, "whenAnyAncestorTaggedAll");
  const wanted = tagKeyMaskOf(tags);
  return (constraintContext) =>
    constraintContext.ancestors.some(
      (frame) =>
        coversTagKeys(frame.slot.keyMask, wanted) && tags.every((criterion) => frame.slot.tags.includes(criterion)),
    );
}

/**
 * Refuses a criteria list with nothing in it.
 *
 * @remarks "carries all of no criteria" is vacuously true, so an empty list quietly turns the
 * constraint into "has an ancestor at all" — a weaker predicate than the caller wrote, and one that
 * still wins specificity over an unconstrained binding.
 */
function assertHasCriteria(tags: ReadonlyArray<BindingTag>, helperName: string): void {
  if (tags.length === 0) {
    throw new EmptyTagCriteriaError(helperName);
  }
}
