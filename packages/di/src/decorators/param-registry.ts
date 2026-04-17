import type { Constructor } from "#/binding";
import type { ParamMetadata } from "#/decorators/metadata";

const pendingByConstructor = new WeakMap<Constructor<unknown>, Map<number, ParamMetadata>>();

export function getOrCreatePendingMap(ctor: Constructor<unknown>): Map<number, ParamMetadata> {
  let map = pendingByConstructor.get(ctor);
  if (map === undefined) {
    map = new Map();
    pendingByConstructor.set(ctor, map);
  }
  return map;
}

export function takePendingMap(ctor: Constructor<unknown>): Map<number, ParamMetadata> | undefined {
  const map = pendingByConstructor.get(ctor);
  if (map === undefined) {
    return undefined;
  }
  pendingByConstructor.delete(ctor);
  return map;
}
