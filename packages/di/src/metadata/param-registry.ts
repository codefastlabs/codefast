import type { Constructor } from "#/binding";
import type { ParamMetadata } from "#/metadata/metadata-types";

/**
 * WeakMap keyed by constructor → pending parameter metadata.
 * Entries are populated by legacy parameter decorators that fire *before* the
 * `@injectable()` class decorator runs, and consumed (via {@link takePendingMap})
 * by the class decorator to merge into the final {@link ConstructorMetadata}.
 */
const pendingByConstructor = new WeakMap<Constructor<unknown>, Map<number, ParamMetadata>>();

/**
 * Returns the pending `ParamMetadata` map for `implementationClass`, creating it on first access.
 * Used by legacy parameter decorators that fire before the class decorator runs.
 */
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

/**
 * Removes and returns the pending map for `implementationClass` (transfer of ownership).
 * Returns `undefined` if no pending entries exist.
 */
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
