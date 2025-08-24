import type { CheckableObject } from "@/utils/types";

/**
 * Type predicate that checks if a value is an empty object or not an object at all
 * Enhanced with better type inference and safety
 *
 * @param value - The value to check
 * @returns true if the value is null, undefined, not an object, or an empty object
 */
export const isEmptyObject = (value: unknown): value is Record<string, never> => {
  // Early return for falsy values or non-objects
  if (!value || typeof value !== "object") return true;

  // Check if the object has any enumerable properties
  // If we find at least one property, the object is not empty
  for (const _propertyKey in value as CheckableObject) {
    return false;
  }

  // No properties found, object is empty
  return true;
};
