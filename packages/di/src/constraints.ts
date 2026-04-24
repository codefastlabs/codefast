import type { ConstraintContext } from "#/binding";
import type { Constructor } from "#/binding";
import type { Token } from "#/token";
export function whenParentIs(registryKey: Token<unknown> | Constructor<unknown>) {
  return (ctx: ConstraintContext): boolean => ctx.parent?.registryKey === registryKey;
}
export function whenAnyAncestorIs(registryKey: Token<unknown> | Constructor<unknown>) {
  return (ctx: ConstraintContext): boolean =>
    ctx.materializationStack.some((frame) => frame.registryKey === registryKey);
}
export function whenParentTagged(tag: string, tagValue: unknown) {
  return (ctx: ConstraintContext): boolean => {
    if (ctx.parent === undefined) {
      return false;
    }
    return Object.is(ctx.parent.tags.get(tag), tagValue);
  };
}
