import type { ConstraintContext } from "#/binding";
import type { Constructor } from "#/binding";
import type { Token } from "#/token";

/**
 * Matches when the direct parent materialization was registered for `registryKey`.
 */
export function whenParentIs(registryKey: Token<unknown> | Constructor<unknown>) {
  return (ctx: ConstraintContext): boolean => ctx.parent?.registryKey === registryKey;
}

/**
 * Matches when any ancestor on the materialization stack was registered for `registryKey`.
 */
export function whenAnyAncestorIs(registryKey: Token<unknown> | Constructor<unknown>) {
  return (ctx: ConstraintContext): boolean =>
    ctx.materializationStack.some((frame) => frame.registryKey === registryKey);
}

/**
 * Matches when the immediate parent binding carries `tag` with `tagValue` (same metadata as {@link BindingBuilder.whenTagged} on the parent).
 */
export function whenTargetTagged(tag: string | symbol, tagValue: unknown) {
  return (ctx: ConstraintContext): boolean => {
    if (ctx.parent === undefined) {
      return false;
    }
    return Object.is(ctx.parent.tags.get(tag), tagValue);
  };
}
