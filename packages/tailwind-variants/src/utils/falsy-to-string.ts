/**
 * Converts falsy values to their string representations while preserving other values
 *
 * @param value - The value to convert
 * @returns The converted value: boolean values become strings, 0 becomes "0", other values remain unchanged
 */
export const falsyToString = (value: unknown): boolean | number | string => {
  // Convert boolean false to string "false"
  if (value === false) return "false";

  // Convert boolean true to string "true"
  if (value === true) return "true";

  // Convert number 0 to string "0"
  if (value === 0) return "0";

  // Return the original value for all other cases
  return value as boolean | number | string;
};
