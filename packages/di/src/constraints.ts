import type { ConstraintContext, Constructor } from "#/types";
import type { Token } from "#/token";
import { tokenName } from "#/token";

function tokenNameOf(t: Token<unknown> | Constructor): string {
  return tokenName(t);
}

/**
 * @since 0.3.16-canary.0
 */
export function whenParentIs(t: Token<unknown> | Constructor): (ctx: ConstraintContext) => boolean {
  const name = tokenNameOf(t);
  return (ctx) => ctx.parent !== undefined && ctx.parent.tokenName === name;
}

/**
 * @since 0.3.16-canary.0
 */
export function whenNoParentIs(
  t: Token<unknown> | Constructor,
): (ctx: ConstraintContext) => boolean {
  const name = tokenNameOf(t);
  return (ctx) => ctx.parent === undefined || ctx.parent.tokenName !== name;
}

/**
 * @since 0.3.16-canary.0
 */
export function whenAnyAncestorIs(
  t: Token<unknown> | Constructor,
): (ctx: ConstraintContext) => boolean {
  const name = tokenNameOf(t);
  return (ctx) => ctx.ancestors.some((f) => f.tokenName === name);
}

/**
 * @since 0.3.16-canary.0
 */
export function whenNoAncestorIs(
  t: Token<unknown> | Constructor,
): (ctx: ConstraintContext) => boolean {
  const name = tokenNameOf(t);
  return (ctx) => ctx.ancestors.every((f) => f.tokenName !== name);
}

/**
 * @since 0.3.16-canary.0
 */
export function whenParentNamed(name: string): (ctx: ConstraintContext) => boolean {
  return (ctx) => ctx.parent !== undefined && ctx.parent.slot.name === name;
}

/**
 * @since 0.3.16-canary.0
 */
export function whenAnyAncestorNamed(name: string): (ctx: ConstraintContext) => boolean {
  return (ctx) => ctx.ancestors.some((f) => f.slot.name === name);
}

/**
 * @since 0.3.16-canary.0
 */
export function whenParentTagged(tag: string, value: unknown): (ctx: ConstraintContext) => boolean {
  return (ctx) =>
    ctx.parent !== undefined &&
    ctx.parent.slot.tags.some(([t, v]) => t === tag && Object.is(v, value));
}

/**
 * @since 0.3.16-canary.0
 */
export function whenAnyAncestorTagged(
  tag: string,
  value: unknown,
): (ctx: ConstraintContext) => boolean {
  return (ctx) =>
    ctx.ancestors.some((f) => f.slot.tags.some(([t, v]) => t === tag && Object.is(v, value)));
}
