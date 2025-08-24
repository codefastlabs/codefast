import clsx from "clsx";

/**
 * Recursively flattens a nested array into the target array
 *
 * @param sourceArray - The source array to flatten
 * @param targetArray - The target array to append flattened elements to
 */
export function flat(sourceArray: unknown[], targetArray: unknown[]): void {
  for (const currentElement of sourceArray) {
    if (Array.isArray(currentElement)) {
      // Recursively flatten nested arrays
      flat(currentElement, targetArray);
    } else {
      // Add non-array elements directly to target
      targetArray.push(currentElement);
    }
  }
}

/**
 * Flattens a nested array and returns a new flattened array
 *
 * @param sourceArray - The array to flatten
 * @returns A new array with all nested elements flattened
 */
export function flatArray(sourceArray: unknown[]): unknown[] {
  // Use clsx to efficiently flatten arrays and handle class name merging
  const flattenedClasses = clsx(sourceArray);

  // Return empty array if clsx returns falsy value
  if (!flattenedClasses) return [];

  // Split the result back into an array for consistency with existing logic
  // Filter out empty strings to ensure clean output
  return flattenedClasses.split(" ").filter(Boolean);
}
