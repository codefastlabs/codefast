import { flatMergeArrays } from "@/utils/flat-merge-arrays";

/**
 * Deep merges two objects, handling arrays, nested objects, and primitive values
 *
 * @param baseObject - The base object to merge into
 * @param overrideObject - The object to merge from (takes precedence)
 * @returns A new merged object
 */
export const mergeObjects = <T extends object>(baseObject: T, overrideObject: T): T => {
  const mergedResult = {} as T;

  // Process all keys from the base object
  for (const propertyKey in baseObject) {
    const baseValue = baseObject[propertyKey];

    if (propertyKey in overrideObject) {
      const overrideValue = overrideObject[propertyKey];

      if (Array.isArray(baseValue) || Array.isArray(overrideValue)) {
        // Handle arrays by merging them using flatMergeArrays
        // Override value takes precedence and comes first
        mergedResult[propertyKey] = flatMergeArrays(
          overrideValue as unknown[],
          baseValue as unknown[],
        ) as T[typeof propertyKey];
      } else if (
        typeof baseValue === "object" &&
        typeof overrideValue === "object" &&
        baseValue &&
        overrideValue
      ) {
        // Recursively merge nested objects
        mergedResult[propertyKey] = mergeObjects(
          baseValue as Record<string, unknown>,
          overrideValue as Record<string, unknown>,
        ) as T[typeof propertyKey];
      } else {
        // For primitive values, concatenate them as strings with space separator
        // Override value takes precedence and comes first
        mergedResult[propertyKey] = (String(overrideValue) +
          " " +
          String(baseValue)) as T[typeof propertyKey];
      }
    } else {
      // Key only exists in base object, copy it directly
      mergedResult[propertyKey] = baseValue;
    }
  }

  // Add keys that only exist in override object
  for (const propertyKey in overrideObject) {
    if (!(propertyKey in baseObject)) {
      mergedResult[propertyKey] = overrideObject[propertyKey];
    }
  }

  return mergedResult;
};
