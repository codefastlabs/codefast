import type { Constructor } from "#/binding";
import type { ParamMetadata } from "#/decorators/metadata";

const pendingByConstructor = new WeakMap<Constructor<unknown>, Map<number, ParamMetadata>>();

export function getOrCreatePendingMap(
  implementationClass: Constructor<unknown>,
): Map<number, ParamMetadata> {
  let map = pendingByConstructor.get(implementationClass);
  if (!map) {
    map = new Map();
    pendingByConstructor.set(implementationClass, map);
  }
  return map;
}

export function takePendingMap(
  implementationClass: Constructor<unknown>,
): Map<number, ParamMetadata> | undefined {
  const map = pendingByConstructor.get(implementationClass);
  if (map) {
    // transfer ownership, no longer pending
    pendingByConstructor.delete(implementationClass);
  }
  return map;
}
