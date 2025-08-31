import type { ComparableObject } from "@/utils/types";

/**
 * Type predicate that checks if two objects are equal
 * Enhanced with generic types and better type safety
 *
 * @param firstObject - First object to compare
 * @param secondObject - Second object to compare
 * @returns true if objects are equal, false otherwise
 */
export const isEqual = <T>(firstObject: T, secondObject: T): boolean => {
  // Early return for identical references
  if (firstObject === secondObject) return true;

  // Early return if either object is falsy
  if (!firstObject || !secondObject) return false;

  // Early return if not objects
  if (typeof firstObject !== "object" || typeof secondObject !== "object") return false;

  // Get keys from both objects
  const firstObjectKeys = Object.keys(firstObject as ComparableObject);
  const secondObjectKeys = Object.keys(secondObject as ComparableObject);

  // Check if objects have the same number of keys
  if (firstObjectKeys.length !== secondObjectKeys.length) return false;

  // Check if all keys in firstObject exist in secondObject and have the same values
  for (const propertyKey of firstObjectKeys) {
    // Check if key exists in secondObject
    if (!secondObjectKeys.includes(propertyKey)) return false;

    // Check if values are equal
    const firstObjectValue = (firstObject as ComparableObject)[propertyKey];
    const secondObjectValue = (secondObject as ComparableObject)[propertyKey];

    if (firstObjectValue !== secondObjectValue) return false;
  }

  // All checks passed, objects are equal
  return true;
};
