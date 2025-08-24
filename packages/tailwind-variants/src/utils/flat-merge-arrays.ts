/**
 * Merges multiple arrays into a single flattened array, filtering out null and undefined values
 *
 * @param inputArrays - Variable number of arrays to merge
 * @returns A new array containing all non-null, non-undefined elements from all input arrays
 */
export const flatMergeArrays = (...inputArrays: unknown[][]): unknown[] => {
  const mergedResult: unknown[] = [];

  // Process each input array
  for (const currentArray of inputArrays) {
    // Ensure the item is actually an array before processing
    if (Array.isArray(currentArray)) {
      // Add each non-null, non-undefined element to the result
      for (const arrayElement of currentArray) {
        if (arrayElement !== null && arrayElement !== undefined) {
          mergedResult.push(arrayElement);
        }
      }
    }
  }

  return mergedResult;
};
