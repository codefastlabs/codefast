/**
 * Checks if a value is an empty object or not an object at all
 *
 * @param obj - The value to check
 * @returns true if the value is null, undefined, not an object, or an empty object
 */
export const isEmptyObject = (obj: unknown): boolean => {
  // Early return for falsy values or non-objects
  if (!obj || typeof obj !== "object") return true;

  // Check if the object has any enumerable properties
  // If we find at least one property, the object is not empty
  for (const _ in obj as Record<string, unknown>) {
    return false;
  }

  // No properties found, object is empty
  return true;
};
