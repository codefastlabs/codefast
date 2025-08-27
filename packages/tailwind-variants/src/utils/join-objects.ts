import clsx from "clsx";

import type {
  AdvancedMergeResult,
  ClassNameValue,
  MergeableObject,
  ObjectMergeConfig,
} from "@/utils/types";

import { isObject } from "@/utils/types";

/**
 * Type-safe object merger that combines values using clsx for class name merging
 *
 * @typeParam T - The type of the target object
 * @typeParam U - The type of the source object
 * @param targetObject - The target object to merge into (must be mergeable)
 * @param sourceObject - The source object to merge from (must be mergeable)
 * @param mergeConfig - Optional configuration for the merge operation
 * @returns The merged object with combined values
 */
export const joinObjects = <T extends MergeableObject, U extends MergeableObject>(
  targetObject: T,
  sourceObject: U,
  mergeConfig: ObjectMergeConfig = {},
): AdvancedMergeResult<T, U> => {
  // Early return if source object is empty or invalid
  if (!isObject(sourceObject) || Object.keys(sourceObject).length === 0) {
    return targetObject as AdvancedMergeResult<T, U>;
  }

  // Create a mutable copy if immutable mode is enabled
  const mutableTarget = mergeConfig.immutable ? { ...targetObject } : targetObject;

  // Iterate through all keys in the source object
  for (const propertyKey in sourceObject) {
    if (Object.prototype.hasOwnProperty.call(sourceObject, propertyKey)) {
      const sourceValue = sourceObject[propertyKey];
      const targetValue = mutableTarget[propertyKey as keyof T];

      if (Object.prototype.hasOwnProperty.call(mutableTarget, propertyKey)) {
        // If key exists in both objects, merge the values using clsx
        const mergedValue = clsx(targetValue as ClassNameValue, sourceValue as ClassNameValue);

        (mutableTarget as Record<string, unknown>)[propertyKey] = mergedValue || undefined;
      } else {
        // If key only exists in source object, copy it directly
        (mutableTarget as Record<string, unknown>)[propertyKey] = sourceValue;
      }
    }
  }

  return mutableTarget as AdvancedMergeResult<T, U>;
};

/**
 * Immutable version of joinObjects that always returns a new object
 *
 * @typeParam T - The type of the target object
 * @typeParam U - The type of the source object
 * @param targetObject - The target object to merge into
 * @param sourceObject - The source object to merge from
 * @returns A new merged object without modifying the original
 */
export const joinObjectsImmutable = <T extends MergeableObject, U extends MergeableObject>(
  targetObject: T,
  sourceObject: U,
): AdvancedMergeResult<T, U> => {
  return joinObjects(targetObject, sourceObject, { immutable: true });
};
