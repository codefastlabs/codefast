import clsx from 'clsx';

/**
 * Recursively flattens a nested array into the target array
 * 
 * @param arr - The source array to flatten
 * @param target - The target array to append flattened elements to
 */
export function flat(arr: unknown[], target: unknown[]): void {
  for (const element of arr) {
    if (Array.isArray(element)) {
      // Recursively flatten nested arrays
      flat(element, target);
    } else {
      // Add non-array elements directly to target
      target.push(element);
    }
  }
}

/**
 * Flattens a nested array and returns a new flattened array
 * 
 * @param arr - The array to flatten
 * @returns A new array with all nested elements flattened
 */
export function flatArray(arr: unknown[]): unknown[] {
  // Use clsx to efficiently flatten arrays and handle class name merging
  const flattened = clsx(arr);
  
  // Return empty array if clsx returns falsy value
  if (!flattened) return [];
  
  // Split the result back into an array for consistency with existing logic
  // Filter out empty strings to ensure clean output
  return flattened.split(' ').filter(Boolean);
}
