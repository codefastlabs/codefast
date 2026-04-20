import type { ConstraintContext } from "#/binding";
import type { Constructor } from "#/binding";
import type { Token } from "#/token";

/**
 * Constraint predicate factory: matches when the direct parent on the materialization stack
 * was registered under `registryKey`. Pass the result to {@link BindingBuilder.when}.
 *
 * @param registryKey - Token or constructor that the parent binding must be registered against.
 * @returns A predicate compatible with {@link BindingBuilder.when}.
 */
export function whenParentIs(registryKey: Token<unknown> | Constructor<unknown>) {
  return (ctx: ConstraintContext): boolean => ctx.parent?.registryKey === registryKey;
}

/**
 * Constraint predicate factory: matches when *any* ancestor on the materialization stack
 * (not just the immediate parent) was registered under `registryKey`.
 * Pass the result to {@link BindingBuilder.when}.
 *
 * @param registryKey - Token or constructor to search for across the full construction chain.
 * @returns A predicate compatible with {@link BindingBuilder.when}.
 */
export function whenAnyAncestorIs(registryKey: Token<unknown> | Constructor<unknown>) {
  return (ctx: ConstraintContext): boolean =>
    ctx.materializationStack.some((frame) => frame.registryKey === registryKey);
}

/**
 * Constraint predicate factory: matches when the immediate parent binding carries a tag
 * whose key is `tag` and whose value is reference-equal to `tagValue` (`Object.is`).
 * Pass the result to {@link BindingBuilder.when}.
 *
 * @param tag - Tag key to check on the parent binding.
 * @param tagValue - Expected value; compared via `Object.is`.
 * @returns A predicate compatible with {@link BindingBuilder.when}.
 */
export function whenTargetTagged(tag: string, tagValue: unknown) {
  return (ctx: ConstraintContext): boolean => {
    if (ctx.parent === undefined) {
      return false;
    }
    return Object.is(ctx.parent.tags.get(tag), tagValue);
  };
}
