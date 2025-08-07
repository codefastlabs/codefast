export const falsyToString = <T>(value: T): string | T =>
  value === false ? "false" : value === true ? "true" : value === 0 ? "0" : value;

export const isEmptyObject = (object: unknown): boolean => {
  if (!object || typeof object !== "object") return true;

  for (const _ in object) return false;

  return true;
};

export const isEqual = (object1: unknown, object2: unknown): boolean => {
  if (object1 === object2) return true;

  if (!object1 || !object2) return false;

  if (typeof object1 !== "object" || typeof object2 !== "object") return false;

  const keys1 = Object.keys(object1);
  const keys2 = Object.keys(object2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key)) return false;

    if ((object1 as Record<string, unknown>)[key] !== (object2 as Record<string, unknown>)[key]) return false;
  }

  return true;
};

export const isBoolean = (value: unknown): value is boolean => value === true || value === false;

function flat<T>(array: T[], target: T[]): void {
  for (const element of array) {
    if (Array.isArray(element)) flat(element, target);
    else target.push(element);
  }
}

export function flatArray<T>(array: T[]): T[] {
  const flattened: T[] = [];

  flat(array, flattened);

  return flattened;
}

export const flatMergeArrays = <T>(...arrays: T[][]): T[] => {
  const result: (T | T[])[] = [];

  flat(arrays, result);
  const filtered: T[] = [];

  for (const element of result) {
    if (element) {
      if (Array.isArray(element)) {
        filtered.push(...element);
      } else {
        filtered.push(element);
      }
    }
  }

  return filtered;
};

type MergeableValue = string | string[] | Record<string, any> | null | undefined;
type MergeableObject = Record<string, MergeableValue>;

export const mergeObjects = (object1: MergeableObject, object2: MergeableObject): MergeableObject => {
  const result: MergeableObject = {};

  for (const key in object1) {
    const value1 = object1[key];

    if (key in object2) {
      const value2 = object2[key];

      if (Array.isArray(value1) || Array.isArray(value2)) {
        result[key] = flatMergeArrays(
          Array.isArray(value2) ? value2 : [value2].filter(Boolean),
          Array.isArray(value1) ? value1 : [value1].filter(Boolean)
        );
      } else if (typeof value1 === "object" && typeof value2 === "object" && value1 && value2) {
        result[key] = mergeObjects(value1 as MergeableObject, value2 as MergeableObject);
      } else {
        result[key] = String(value2) + " " + String(value1);
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

export const removeExtraSpaces = (string_: string | null | undefined): string | null | undefined => {
  if (!string_ || typeof string_ !== "string") return string_;

  return string_.replaceAll(SPACE_REGEX, " ").trim();
};
