import type { Binding } from "#/core/binding";
import type { BindingScope } from "#/core/types";

/**
 * The scope a binding resolves under.
 *
 * @remarks Every kind declares one — an alias declares `transient`, since it defers scoping to the
 * binding it points at — so this is a field read, kept as a named function because it is the
 * vocabulary validation and introspection speak.
 *
 * @since 0.3.16-canary.0
 */
export function effectiveBindingScope(binding: Binding): BindingScope {
  return binding.scope;
}
