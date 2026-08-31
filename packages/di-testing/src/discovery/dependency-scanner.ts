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

/**
 * What a sociable scan finds: the slots to mock, the exposed classes the unit actually reaches, and
 * the constrained slots those classes are injected through.
 */
export interface SociableScan {
  readonly mockSlots: ReadonlyArray<DependencySlot>;
  readonly realClasses: ReadonlySet<Constructor>;
  /** The name/tag-constrained slots each exposed class is requested through, for alias replay. */
  readonly realSlots: ReadonlyArray<DependencySlot>;
}

/**
 * Walks the unit's dependency graph across the exposed set: an exposed class dependency stays real
 * and is scanned in turn, everything else becomes a mock slot.
 *
 * @remarks Class identity is what exposure follows — a `Token`-keyed dependency is always mocked,
 * treating tokens as the declared boundary between the logic under test and the outside world.
 */
export function scanSociableDependencies(
  target: Constructor,
  exposed: ReadonlySet<Constructor>,
  reader: MetadataReader,
): SociableScan {
  const mockSlots: Array<DependencySlot> = [];
  const realClasses = new Set<Constructor>();
  const realSlots: Array<DependencySlot> = [];
  const visited = new Set<Constructor>([target]);
  const queue: Array<Constructor> = [target];

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const slot of scanDependencies(current, reader)) {
      const token = slot.token;
      if (typeof token === "function" && exposed.has(token)) {
        if (slot.name !== undefined || (slot.tags?.length ?? 0) > 0) {
          realSlots.push(slot);
        }
        if (!visited.has(token)) {
          visited.add(token);
          realClasses.add(token);
          queue.push(token);
        }
        continue;
      }
      mockSlots.push(slot);
    }
  }

  return { mockSlots, realClasses, realSlots };
}
