import type { NestedArray } from "@/utils/types";

/**
 * Type guard to check if a value is an array
 */
const isArray = <T>(value: unknown): value is T[] => Array.isArray(value);

/**
 * Type guard to check if a value is a nested array
 */
const isNestedArray = <T>(value: unknown): value is NestedArray<T> =>
  isArray<NestedArray<T> | T>(value);

/**
 * Recursively flattens a nested array into the target array
 * Uses generic types for better type safety
 *
 * @param sourceArray - The source array to flatten
 * @param targetArray - The target array to append flattened elements to
 */
export function flat<T>(sourceArray: NestedArray<T>, targetArray: T[]): void {
  for (const currentElement of sourceArray) {
    if (isNestedArray<T>(currentElement)) {
      // Recursively flatten nested arrays
      flat(currentElement, targetArray);
    } else {
      // Add non-array elements directly to target
      targetArray.push(currentElement);
    }
  }
}
