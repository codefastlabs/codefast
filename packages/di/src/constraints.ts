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
