/**
 * Utility functions for tailwind-variants
 */

/**
 * Converts falsy values to string representation, useful for handling boolean variant keys
 */
export const falsyToString = <T>(value: T): T extends boolean ? string : T => {
  if (typeof value === "boolean") {
    return String(value) as T extends boolean ? string : T;
  }

  if (value === 0) {
    return "0" as T extends boolean ? string : T;
  }

  return value as T extends boolean ? string : T;
};

/**
 * Recursively flattens nested arrays
 */
export const flat = <T>(array: readonly (readonly T[] | T)[], target: T[]): void => {
  for (const item of array) {
    if (Array.isArray(item)) {
      flat(item as readonly (readonly T[] | T)[], target);
    } else {
      target.push(item as T);
    }
  }
};

/**
 * Merges multiple arrays, flattens them, and filters out null/undefined values
 */
export const flatMergeArrays = <T>(...arrays: readonly (null | T | undefined)[][]): T[] => {
  const result: T[] = [];

  for (const array of arrays) {
    for (const item of array) {
      if (item != null) {
        result.push(item);
      }
    }
  }

  return result;
};

/**
 * Type predicate to check if an object is empty
 */
export const isEmptyObject = (value: unknown): value is Record<string, never> => {
  return value == null || (typeof value === "object" && Object.keys(value).length === 0);
};

/**
 * Deep equality check for objects
 */
export const isEqual = <T extends Record<string, unknown>>(object1: T, object2: T): boolean => {
  const keys1 = Object.keys(object1);
  const keys2 = Object.keys(object2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    const value1 = object1[key];
    const value2 = object2[key];

    if (
      typeof value1 === "object" &&
      value1 !== null &&
      typeof value2 === "object" &&
      value2 !== null
    ) {
      if (!isEqual(value1 as Record<string, unknown>, value2 as Record<string, unknown>)) {
        return false;
      }
    } else if (value1 !== value2) {
      return false;
    }
  }

  return true;
};

/**
 * Deep merge objects
 */
export const mergeObjects = <T extends Record<string, unknown>, U extends Record<string, unknown>>(
  base: T,
  override: U,
): T & U => {
  const result = { ...base } as Record<string, unknown>;

  for (const [key, value] of Object.entries(override)) {
    if (value != null) {
      result[key] =
        typeof value === "object" &&
        !Array.isArray(value) &&
        typeof result[key] === "object" &&
        !Array.isArray(result[key])
          ? mergeObjects(result[key] as Record<string, unknown>, value as Record<string, unknown>)
          : value;
    }
  }

  return result as T & U;
};

/**
 * Checks if a value is a function
 */
export const isFunction = (value: unknown): value is (...args: unknown[]) => unknown => {
  return typeof value === "function";
};
