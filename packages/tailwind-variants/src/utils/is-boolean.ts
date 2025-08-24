/**
 * Checks if a value is a boolean (true or false)
 * 
 * @param value - The value to check
 * @returns true if the value is boolean, false otherwise
 */
export const isBoolean = (value: unknown): boolean => {
  // Check if value is exactly true or false
  return value === true || value === false;
};
