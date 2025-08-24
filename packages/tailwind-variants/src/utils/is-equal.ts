/**
 * Performs a shallow equality check between two objects
 * 
 * @param obj1 - First object to compare
 * @param obj2 - Second object to compare
 * @returns true if objects are equal, false otherwise
 */
export const isEqual = (obj1: unknown, obj2: unknown): boolean => {
  // Early return for identical references
  if (obj1 === obj2) return true;

  // Early return if either object is falsy
  if (!obj1 || !obj2) return false;

  // Get keys from both objects
  const keys1 = Object.keys(obj1 as Record<string, unknown>);
  const keys2 = Object.keys(obj2 as Record<string, unknown>);

  // Check if objects have the same number of keys
  if (keys1.length !== keys2.length) return false;

  // Check if all keys in obj1 exist in obj2 and have the same values
  for (const key of keys1) {
    // Check if key exists in obj2
    if (!keys2.includes(key)) return false;

    // Check if values are equal
    const value1 = (obj1 as Record<string, unknown>)[key];
    const value2 = (obj2 as Record<string, unknown>)[key];
    if (value1 !== value2) return false;
  }

  // All checks passed, objects are equal
  return true;
};
