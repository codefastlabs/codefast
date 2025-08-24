/**
 * Performs a shallow equality check between two objects
 *
 * @param firstObject - First object to compare
 * @param secondObject - Second object to compare
 * @returns true if objects are equal, false otherwise
 */
export const isEqual = (firstObject: unknown, secondObject: unknown): boolean => {
  // Early return for identical references
  if (firstObject === secondObject) return true;

  // Early return if either object is falsy
  if (!firstObject || !secondObject) return false;

  // Get keys from both objects
  const firstObjectKeys = Object.keys(firstObject as Record<string, unknown>);
  const secondObjectKeys = Object.keys(secondObject as Record<string, unknown>);

  // Check if objects have the same number of keys
  if (firstObjectKeys.length !== secondObjectKeys.length) return false;

  // Check if all keys in firstObject exist in secondObject and have the same values
  for (const propertyKey of firstObjectKeys) {
    // Check if key exists in secondObject
    if (!secondObjectKeys.includes(propertyKey)) return false;

    // Check if values are equal
    const firstObjectValue = (firstObject as Record<string, unknown>)[propertyKey];
    const secondObjectValue = (secondObject as Record<string, unknown>)[propertyKey];

    if (firstObjectValue !== secondObjectValue) return false;
  }

  // All checks passed, objects are equal
  return true;
};
