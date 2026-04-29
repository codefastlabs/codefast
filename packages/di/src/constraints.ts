import type { ConstraintContext, Constructor } from "#/types";
import type { Token } from "#/token";
import { tokenName } from "#/token";

function tokenNameOf(t: Token<unknown> | Constructor): string {
  return tokenName(t);
}

export function whenParentIs(t: Token<unknown> | Constructor): (ctx: ConstraintContext) => boolean {
  const name = tokenNameOf(t);
  return (ctx) => ctx.parent !== undefined && ctx.parent.tokenName === name;
}

export function whenNoParentIs(
  t: Token<unknown> | Constructor,
): (ctx: ConstraintContext) => boolean {
  const name = tokenNameOf(t);
  return (ctx) => ctx.parent === undefined || ctx.parent.tokenName !== name;
}

export function whenAnyAncestorIs(
  t: Token<unknown> | Constructor,
): (ctx: ConstraintContext) => boolean {
  const name = tokenNameOf(t);
  return (ctx) => ctx.ancestors.some((f) => f.tokenName === name);
}

export function whenNoAncestorIs(
  t: Token<unknown> | Constructor,
): (ctx: ConstraintContext) => boolean {
  const name = tokenNameOf(t);
  return (ctx) => ctx.ancestors.every((f) => f.tokenName !== name);
}

export function whenParentNamed(name: string): (ctx: ConstraintContext) => boolean {
  return (ctx) => ctx.parent !== undefined && ctx.parent.slot.name === name;
}

export function whenAnyAncestorNamed(name: string): (ctx: ConstraintContext) => boolean {
  return (ctx) => ctx.ancestors.some((f) => f.slot.name === name);
}

export function whenParentTagged(tag: string, value: unknown): (ctx: ConstraintContext) => boolean {
  return (ctx) =>
    ctx.parent !== undefined &&
    ctx.parent.slot.tags.some(([t, v]) => t === tag && Object.is(v, value));
}

export function whenAnyAncestorTagged(
  tag: string,
  value: unknown,
): (ctx: ConstraintContext) => boolean {
  return (ctx) =>
    ctx.ancestors.some((f) => f.slot.tags.some(([t, v]) => t === tag && Object.is(v, value)));
}
