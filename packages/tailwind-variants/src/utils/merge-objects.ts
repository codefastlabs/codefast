import { flatMergeArrays } from '@/utils/flat-merge-arrays';

/**
 * Deep merges two objects, handling arrays, nested objects, and primitive values
 * 
 * @param obj1 - The base object to merge into
 * @param obj2 - The object to merge from
 * @returns A new merged object
 */
export const mergeObjects = <T extends object>(obj1: T, obj2: T): T => {
  const result = {} as T;

  // Process all keys from the first object
  for (const key in obj1) {
    const value1 = obj1[key];

    if (key in obj2) {
      const value2 = obj2[key];

      if (Array.isArray(value1) || Array.isArray(value2)) {
        // Handle arrays by merging them using flatMergeArrays
        result[key] = flatMergeArrays(value2 as unknown[], value1 as unknown[]) as T[typeof key];
      } else if (typeof value1 === "object" && typeof value2 === "object" && value1 && value2) {
        // Recursively merge nested objects
        result[key] = mergeObjects(
          value1 as Record<string, unknown>,
          value2 as Record<string, unknown>,
        ) as T[typeof key];
      } else {
        // For primitive values, concatenate them as strings with space separator
        // obj2 value takes precedence and comes first
        result[key] = (String(value2) + " " + String(value1)) as T[typeof key];
      }
    } else {
      // Key only exists in obj1, copy it directly
      result[key] = value1;
    }
  }

  // Add keys that only exist in obj2
  for (const key in obj2) {
    if (!(key in obj1)) {
      result[key] = obj2[key];
    }
  }

  return result;
};
