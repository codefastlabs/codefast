import type { Binding } from "#/binding";
import type { BindingScope } from "#/types";

/**
 * Runtime scope used for validation and introspection. Alias bindings are treated as transient
 * because they defer scope to the aliased target at resolve time.
 *
 * @since 0.3.16-canary.0
 */
export function effectiveBindingScope(binding: Binding): BindingScope {
  switch (binding.kind) {
    case "alias":
      return "transient";
    case "class":
    case "constant":
    case "dynamic":
    case "dynamic-async":
    case "resolved":
    case "resolved-async":
      return binding.scope;
    default: {
      const exhaustive: never = binding;
      return exhaustive;
    }
  }
}
