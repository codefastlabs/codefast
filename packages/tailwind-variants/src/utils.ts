export const falsyToString = <T>(value: T): string | T =>
  value === false ? "false" : value === true ? "true" : value === 0 ? "0" : value;

export const isEmptyObject = (obj: unknown): boolean => {
  if (!obj || typeof obj !== "object") return true;

  for (const _ in obj) return false;

  return true;
};

// Type guard to check if value is a record
const isRecord = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === "object" && !Array.isArray(value);
};

export const isEqual = (obj1: object, obj2: object): boolean => {
  if (obj1 === obj2) return true;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key)) return false;

    // Use type guard for safer access
    if (isRecord(obj1) && isRecord(obj2) && obj1[key] !== obj2[key]) {
      return false;
    }
  }

  return true;
};

export const isBoolean = (value: unknown): value is boolean => value === true || value === false;

export function flatArray<T extends readonly unknown[]>(arr: T): unknown[] {
  const flattened: unknown[] = [];

  // Use proper typing for nested arrays
  const processArray = (input: readonly unknown[]): void => {
    for (const el of input) {
      if (Array.isArray(el)) {
        processArray(el);
      } else {
        flattened.push(el);
      }
    }
  };

  processArray(arr);

  return flattened;
}

export const flatMergeArrays = <T extends readonly unknown[]>(...arrays: T[]): unknown[] => {
  const result: unknown[] = [];

  // Process each array without type assertions
  for (const arr of arrays) {
    if (Array.isArray(arr)) {
      const processArray = (input: readonly unknown[]): void => {
        for (const el of input) {
          if (Array.isArray(el)) {
            processArray(el);
          } else {
            result.push(el);
          }
        }
      };

      processArray(arr);
    } else {
      result.push(arr);
    }
  }

  const filtered: unknown[] = [];

  for (const element of result) {
    if (element) filtered.push(element);
  }

  return filtered;
};

export const mergeObjects = (obj1: unknown, obj2: unknown): unknown => {
  if (!obj1 || typeof obj1 !== "object" || !obj2 || typeof obj2 !== "object") {
    return obj2;
  }

  const result: Record<string, unknown> = {};

  // Use type guards instead of type assertions
  if (!isRecord(obj1) || !isRecord(obj2)) {
    return obj2;
  }

  for (const key in obj1) {
    const val1 = obj1[key];

    if (key in obj2) {
      const val2 = obj2[key];

      if (Array.isArray(val1) || Array.isArray(val2)) {
        result[key] = flatMergeArrays(
          Array.isArray(val2) ? val2 : [val2],
          Array.isArray(val1) ? val1 : [val1]
        );
      } else if (typeof val1 === "object" && typeof val2 === "object" && val1 && val2) {
        result[key] = mergeObjects(val1, val2);
      } else {
        // Ensure values are strings for template literal
        const strVal1 = String(val1);
        const strVal2 = String(val2);

        result[key] = `${strVal2} ${strVal1}`;
      }
    } else {
      result[key] = val1;
    }
  }

  for (const key in obj2) {
    if (!(key in obj1)) {
      result[key] = obj2[key];
    }
  }

  return result;
};

const SPACE_REGEX = /\s+/g;

export const removeExtraSpaces = (str: string): string => {
  if (!str || typeof str !== "string") return str;

  return str.replaceAll(SPACE_REGEX, " ").trim();
};
