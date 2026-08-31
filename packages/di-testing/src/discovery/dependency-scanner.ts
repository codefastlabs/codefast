/** Reads the dependencies a class declares, the input every auto-mock is built from. */

import type { Constructor, DependencySlot, MetadataReader } from "@codefast/di";

import { NotInjectableError } from "#/errors/errors";

/**
 * Reads every dependency a class declares — constructor parameters first, then accessor injections.
 *
 * @remarks Mirrors di's own fallback: a class with no constructor metadata is fine as long as its
 * constructor takes no parameters, which keeps zero-arg and accessor-only classes testable without
 * `@injectable`. A parameterful constructor with no metadata is a {@link NotInjectableError}.
 */
export function scanDependencies(target: Constructor, reader: MetadataReader): ReadonlyArray<DependencySlot> {
  const constructorMetadata = reader.getConstructorMetadata(target);
  if (constructorMetadata === undefined && target.length > 0) {
    throw new NotInjectableError(target.name);
  }

  const accessors = reader.getAccessorMetadata?.(target) ?? [];

  return [...(constructorMetadata?.params ?? []), ...accessors.map((accessor) => accessor.descriptor)];
}
