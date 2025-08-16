export const falsyToString = <T>(value: T): string | T =>
  value === false ? "false" : value === true ? "true" : value === 0 ? "0" : value;

export const isEmptyObject = (object: unknown): boolean => {
  if (!object || typeof object !== "object") return true;

  for (const _ in object) return false;

  return true;
};

// Type guard to check if the value is a record
const isRecord = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === "object" && !Array.isArray(value);
};

export const isEqual = (object1: object, object2: object): boolean => {
  if (object1 === object2) return true;

  const keys1 = Object.keys(object1);
  const keys2 = Object.keys(object2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key)) return false;

    // Use type guard for safer access
    if (isRecord(object1) && isRecord(object2) && object1[key] !== object2[key]) {
      return false;
    }
  }

  return true;
};

export const isBoolean = (value: unknown): value is boolean => value === true || value === false;

export function flatArray<T extends readonly unknown[]>(array: T): unknown[] {
  const flattened: unknown[] = [];

  // Use proper typing for nested arrays
  const processArray = (input: readonly unknown[]): void => {
    for (const element of input) {
      if (Array.isArray(element)) {
        processArray(element);
      } else {
        flattened.push(element);
      }
    }
  };

  processArray(array);

  return flattened;
}

export const flatMergeArrays = <T extends readonly unknown[]>(...arrays: T[]): unknown[] => {
  const result: unknown[] = [];

  // Process each array without type assertions
  for (const array of arrays) {
    if (Array.isArray(array)) {
      const processArray = (input: readonly unknown[]): void => {
        for (const element of input) {
          if (Array.isArray(element)) {
            processArray(element);
          } else {
            result.push(element);
          }
        }
      };

      processArray(array);
    } else {
      result.push(array);
    }
  }

  const filtered: unknown[] = [];

  for (const element of result) {
    if (element) filtered.push(element);
  }

  return filtered;
};

export const mergeObjects = (object1: unknown, object2: unknown): unknown => {
  if (!object1 || typeof object1 !== "object" || !object2 || typeof object2 !== "object") {
    return object2;
  }

  const result: Record<string, unknown> = {};

  // Use type guards instead of type assertions
  if (!isRecord(object1) || !isRecord(object2)) {
    return object2;
  }

  for (const key in object1) {
    const value1 = object1[key];

    if (key in object2) {
      const value2 = object2[key];

      if (Array.isArray(value1) || Array.isArray(value2)) {
        result[key] = flatMergeArrays(
          Array.isArray(value2) ? value2 : [value2],
          Array.isArray(value1) ? value1 : [value1],
        );
      } else if (typeof value1 === "object" && typeof value2 === "object" && value1 && value2) {
        result[key] = mergeObjects(value1, value2);
      } else {
        // Ensure values are strings for template literal
        const stringValue1 = String(value1);
        const stringValue2 = String(value2);

        result[key] = `${stringValue2} ${stringValue1}`;
      }
    } else {
      result[key] = value1;
    }
  }

  for (const key in object2) {
    if (!(key in object1)) {
      result[key] = object2[key];
    }
  }

  return result;
};

const SPACE_REGEX = /\s+/g;

export const removeExtraSpaces = (string_: string): string => {
  if (!string_ || typeof string_ !== "string") return string_;

  return string_.replaceAll(SPACE_REGEX, " ").trim();
};
