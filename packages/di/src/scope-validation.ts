import type { Binding } from "#/binding";
import { registryKeyLabel } from "#/binding-select";
import type { MetadataReader } from "#/metadata/metadata-types";
import { ScopeViolationError } from "#/errors";
import { listResolvedDependencies } from "#/dependency-graph";
import type { RegistryKey } from "#/registry";

/**
 * Walks every binding in the registry and throws {@link ScopeViolationError} on the first
 * captive-dependency violation found: a singleton that directly or transitively depends on a
 * scoped or transient binding. Constant bindings are exempt (no stateful instance to capture).
 *
 * Called by {@link Container.validate} and automatically after each `load()` in non-production
 * environments.
 */
export function validateScopeRules(context: {
  collectAllRegistryKeys(): readonly RegistryKey[];
  lookupBindings(key: RegistryKey): readonly Binding<unknown>[] | undefined;
  getMetadataReader(): MetadataReader | undefined;
}): void {
  const reader = context.getMetadataReader();
  const lookupBindings = (key: RegistryKey) => context.lookupBindings(key);
  for (const registryKey of context.collectAllRegistryKeys()) {
    const bindings = lookupBindings(registryKey);
    if (bindings === undefined || bindings.length === 0) {
      continue;
    }
    for (const consumer of bindings) {
      const pathStart = [registryKeyLabel(registryKey)];
      const deps = listResolvedDependencies(consumer, lookupBindings, reader, pathStart);
      for (const dep of deps) {
        if (
          consumer.scope === "singleton" &&
          dep.binding.kind !== "constant" &&
          (dep.binding.scope === "transient" || dep.binding.scope === "scoped")
        ) {
          throw new ScopeViolationError({
            consumerBindingId: consumer.id,
            consumerKind: consumer.kind,
            consumerScope: consumer.scope,
            dependencyBindingId: dep.binding.id,
            dependencyKind: dep.binding.kind,
            dependencyScope: dep.binding.scope,
            resolutionPath: dep.path,
          });
        }
      }
    }
  }
}
