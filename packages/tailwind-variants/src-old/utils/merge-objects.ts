import type { MergeResult } from "@/utils/types";

import { flatMergeArrays } from "@/utils/flat-merge-arrays";

/**
 * Deep merges two objects, handling arrays, nested objects, and primitive values
 * Enhanced with generic types and better type safety
 *
 * @param baseObject - The base object to merge into
 * @param overrideObject - The object to merge from (takes precedence)
 * @returns A new merged object
 */
export const mergeObjects = <T, U>(baseObject: T, overrideObject: U): MergeResult<T, U> => {
  const mergedResult = {} as MergeResult<T, U>;

  // Early return if not objects
  if (
    typeof baseObject !== "object" ||
    typeof overrideObject !== "object" ||
    !baseObject ||
    !overrideObject
  ) {
    return mergedResult;
  }

  // Process all keys from the base object
  for (const propertyKey in baseObject) {
    const baseValue = (baseObject as Record<string, unknown>)[propertyKey];

    if (propertyKey in overrideObject) {
      const overrideValue = (overrideObject as Record<string, unknown>)[propertyKey];

      if (Array.isArray(baseValue) || Array.isArray(overrideValue)) {
        // Handle arrays by merging them using flatMergeArrays
        // Override value takes precedence and comes first
        mergedResult[propertyKey as keyof MergeResult<T, U>] = flatMergeArrays(
          overrideValue as unknown[],
          baseValue as unknown[],
        ) as MergeResult<T, U>[keyof MergeResult<T, U>];
      } else if (
        typeof baseValue === "object" &&
        typeof overrideValue === "object" &&
        baseValue &&
        overrideValue
      ) {
        // Recursively merge nested objects
        mergedResult[propertyKey as keyof MergeResult<T, U>] = mergeObjects(
          baseValue as Record<string, unknown>,
          overrideValue as Record<string, unknown>,
        ) as MergeResult<T, U>[keyof MergeResult<T, U>];
      } else {
        // For primitive values, concatenate them as strings with space separator
        // Override value takes precedence and comes first
        mergedResult[propertyKey as keyof MergeResult<T, U>] = (String(overrideValue) +
          " " +
          String(baseValue)) as MergeResult<T, U>[keyof MergeResult<T, U>];
      }
    } else {
      // Key only exists in base object, copy it directly
      mergedResult[propertyKey as keyof MergeResult<T, U>] = baseValue as MergeResult<
        T,
        U
      >[keyof MergeResult<T, U>];
    }
  }

  // Add keys that only exist in override object
  for (const propertyKey in overrideObject) {
    if (!(propertyKey in baseObject)) {
      mergedResult[propertyKey as keyof MergeResult<T, U>] = (
        overrideObject as Record<string, unknown>
      )[propertyKey] as MergeResult<T, U>[keyof MergeResult<T, U>];
    }
  }

  return mergedResult;
};
