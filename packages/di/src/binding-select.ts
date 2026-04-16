import type { Binding, ConstraintContext, Constructor, ResolveHint } from "#lib/binding";
import type { RegistryKey } from "#lib/registry";
import type { Token } from "#lib/token";
import { DiError, NoMatchingBindingError, TokenNotBoundError } from "#lib/errors";

export function registryKeyLabel(key: Token<unknown> | Constructor<unknown>): string {
  if (typeof key === "function") {
    return key.name.length > 0 ? key.name : "(anonymous class)";
  }
  return key.name;
}

/**
 * Applies resolve hints and optional constraint predicates to a binding list.
 */
export function filterMatchingBindings(
  bindings: readonly Binding<unknown>[],
  hint: ResolveHint | undefined,
  constraintCtx: ConstraintContext | undefined,
): Binding<unknown>[] {
  let candidates = [...bindings];
  if (hint?.name !== undefined) {
    candidates = candidates.filter((binding) => binding.bindingName === hint.name);
  }
  if (hint?.tag !== undefined) {
    const [tagKey, tagValue] = hint.tag;
    candidates = candidates.filter((binding) => Object.is(binding.tags.get(tagKey), tagValue));
  }
  if (constraintCtx !== undefined) {
    candidates = candidates.filter(
      (binding) => binding.constraint === undefined || binding.constraint(constraintCtx),
    );
  }
  return candidates;
}

/**
 * Picks the binding that would be used for resolution with the given hint (same rules as {@link DependencyResolver}).
 * When `constraintCtx` is set, bindings with a {@link BindingBuilder.when} predicate must pass it.
 */
export function selectBindingForRegistry(
  bindings: readonly Binding<unknown>[],
  hint: ResolveHint | undefined,
  tokenLabel: string,
  pathLabels: readonly string[],
  constraintCtx: ConstraintContext | undefined,
): Binding<unknown> {
  if (bindings.length === 0) {
    throw new TokenNotBoundError(tokenLabel, [...pathLabels]);
  }

  const candidates = filterMatchingBindings(bindings, hint, constraintCtx);

  if (candidates.length === 1) {
    return candidates[0];
  }
  if (candidates.length === 0) {
    if (hint !== undefined && (hint.name !== undefined || hint.tag !== undefined)) {
      throw new NoMatchingBindingError(tokenLabel, hint, [...pathLabels]);
    }
    throw new TokenNotBoundError(tokenLabel, [...pathLabels]);
  }
  throw new DiError(
    `Ambiguous binding for "${tokenLabel}": ${String(candidates.length)} candidates matched after applying ResolveHint (resolution path: ${pathLabels.join(" -> ")})`,
  );
}

/**
 * Resolves the effective binding for a registry key using the default (no-hint) selection rules.
 */
export function selectDefaultBindingForKey(
  lookup: (key: RegistryKey) => readonly Binding<unknown>[] | undefined,
  key: RegistryKey,
  pathPrefix: readonly string[],
): Binding<unknown> {
  const label = registryKeyLabel(key as Token<unknown> | Constructor<unknown>);
  const nextPath = [...pathPrefix, label];
  const bindings = lookup(key);
  if (bindings === undefined || bindings.length === 0) {
    throw new TokenNotBoundError(label, nextPath);
  }
  return selectBindingForRegistry(bindings, undefined, label, nextPath, undefined);
}
