/** Reads the dependencies a class declares, the input every auto-mock is built from. */

import type { Constructor, DependencySlot, MetadataReader } from "@codefast/di";

import { NotInjectableError } from "#/errors/errors";

/**
 * One dependency the unit declares, normalized from a constructor parameter or an accessor injection.
 */
export interface DiscoveredDependency {
  readonly slot: DependencySlot;
  readonly source: "constructor" | "accessor";
}

/**
 * Reads every dependency a class declares, or throws when it carries no `@injectable` metadata.
 *
 * @remarks A class with no constructor metadata cannot have its collaborators discovered, so it is
 * reported as {@link NotInjectableError} rather than silently producing an empty dependency set.
 */
export function scanDependencies(target: Constructor, reader: MetadataReader): ReadonlyArray<DiscoveredDependency> {
  const constructorMetadata = reader.getConstructorMetadata(target);
  if (constructorMetadata === undefined) {
    throw new NotInjectableError(target.name);
  }

  const discovered: Array<DiscoveredDependency> = [];
  for (const param of constructorMetadata.params) {
    discovered.push({ slot: param, source: "constructor" });
  }
  for (const accessor of reader.getAccessorMetadata?.(target) ?? []) {
    discovered.push({ slot: accessor.descriptor, source: "accessor" });
  }
  return discovered;
}
