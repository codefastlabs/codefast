import type { ConversionResult, ConvertibleValue } from "@/utils/types";

/**
 * Converts falsy values to their string representations while preserving other values
 * Uses advanced TypeScript features for better type safety and inference
 *
 * @param value - The value to convert
 * @returns The converted value with proper typing
 */
export const falsyToString = <T extends ConvertibleValue>(value: T): ConversionResult => {
  // Convert boolean false to string "false"
  if (value === false) return "false";

  // Convert boolean true to string "true"
  if (value === true) return "true";

  // Convert number 0 to string "0"
  if (value === 0) return "0";

  // Return the original value for all other cases
  return value;
};
