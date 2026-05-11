import type { ConstraintContext, Constructor } from "#/types";
import type { Token } from "#/token";
import { tokenName } from "#/token";

function tokenNameOf(token: Token<unknown> | Constructor): string {
  return tokenName(token);
}

/**
 * @since 0.3.16-canary.0
 */
export function whenParentIs(
  token: Token<unknown> | Constructor,
): (constraintContext: ConstraintContext) => boolean {
  const tokenDisplayName = tokenNameOf(token);
  return (constraintContext) =>
    constraintContext.parent !== undefined &&
    constraintContext.parent.tokenName === tokenDisplayName;
}

/**
 * @since 0.3.16-canary.0
 */
export function whenNoParentIs(
  token: Token<unknown> | Constructor,
): (constraintContext: ConstraintContext) => boolean {
  const tokenDisplayName = tokenNameOf(token);
  return (constraintContext) =>
    constraintContext.parent === undefined ||
    constraintContext.parent.tokenName !== tokenDisplayName;
}

/**
 * @since 0.3.16-canary.0
 */
export function whenAnyAncestorIs(
  token: Token<unknown> | Constructor,
): (constraintContext: ConstraintContext) => boolean {
  const tokenDisplayName = tokenNameOf(token);
  return (constraintContext) =>
    constraintContext.ancestors.some(
      (ancestorFrame) => ancestorFrame.tokenName === tokenDisplayName,
    );
}

/**
 * @since 0.3.16-canary.0
 */
export function whenNoAncestorIs(
  token: Token<unknown> | Constructor,
): (constraintContext: ConstraintContext) => boolean {
  const tokenDisplayName = tokenNameOf(token);
  return (constraintContext) =>
    constraintContext.ancestors.every(
      (ancestorFrame) => ancestorFrame.tokenName !== tokenDisplayName,
    );
}

/**
 * @since 0.3.16-canary.0
 */
export function whenParentNamed(name: string): (constraintContext: ConstraintContext) => boolean {
  return (constraintContext) =>
    constraintContext.parent !== undefined && constraintContext.parent.slot.name === name;
}

/**
 * @since 0.3.16-canary.0
 */
export function whenAnyAncestorNamed(
  name: string,
): (constraintContext: ConstraintContext) => boolean {
  return (constraintContext) =>
    constraintContext.ancestors.some((ancestorFrame) => ancestorFrame.slot.name === name);
}

/**
 * @since 0.3.16-canary.0
 */
export function whenParentTagged(
  tag: string,
  value: unknown,
): (constraintContext: ConstraintContext) => boolean {
  return (constraintContext) =>
    constraintContext.parent !== undefined &&
    constraintContext.parent.slot.tags.some(
      ([tagKey, tagValue]) => tagKey === tag && Object.is(tagValue, value),
    );
}

/**
 * @since 0.3.16-canary.0
 */
export function whenAnyAncestorTagged(
  tag: string,
  value: unknown,
): (constraintContext: ConstraintContext) => boolean {
  return (constraintContext) =>
    constraintContext.ancestors.some((ancestorFrame) =>
      ancestorFrame.slot.tags.some(
        ([tagKey, tagValue]) => tagKey === tag && Object.is(tagValue, value),
      ),
    );
}

/**
 * Matches when the direct parent slot carries **all** of the given tag pairs.
 * Equivalent to AND-composing multiple `whenParentTagged` calls but evaluates
 * in a single predicate invocation — no intermediate closure allocations.
 */
export function whenParentTaggedAll(
  tags: ReadonlyArray<readonly [tag: string, value: unknown]>,
): (constraintContext: ConstraintContext) => boolean {
  return (constraintContext) => {
    const { parent } = constraintContext;
    if (parent === undefined) {
      return false;
    }
    const { tags: parentTags } = parent.slot;
    return tags.every(([tagKey, tagValue]) =>
      parentTags.some(([k, v]) => k === tagKey && Object.is(v, tagValue)),
    );
  };
}

/**
 * Matches when at least one ancestor slot carries **all** of the given tag pairs.
 * Equivalent to AND-composing multiple `whenAnyAncestorTagged` calls but evaluates
 * in a single predicate invocation — no intermediate closure allocations.
 */
export function whenAnyAncestorTaggedAll(
  tags: ReadonlyArray<readonly [tag: string, value: unknown]>,
): (constraintContext: ConstraintContext) => boolean {
  return (constraintContext) =>
    constraintContext.ancestors.some((frame) => {
      const { tags: frameTags } = frame.slot;
      return tags.every(([tagKey, tagValue]) =>
        frameTags.some(([k, v]) => k === tagKey && Object.is(v, tagValue)),
      );
    });
}
