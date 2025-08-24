/**
 * Merges multiple arrays into a single flattened array, filtering out null and undefined values
 * 
 * @param arrays - Variable number of arrays to merge
 * @returns A new array containing all non-null, non-undefined elements from all input arrays
 */
export const flatMergeArrays = (...arrays: unknown[][]): unknown[] => {
  const result: unknown[] = [];

  // Process each input array
  for (const array of arrays) {
    // Ensure the item is actually an array before processing
    if (Array.isArray(array)) {
      // Add each non-null, non-undefined element to the result
      for (const item of array) {
        if (item !== null && item !== undefined) {
          result.push(item);
        }
      }
    }
  }

  return result;
};
