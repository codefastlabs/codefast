export const falsyToString = (value: unknown): boolean | number | string => {
  if (value === false) return "false";

  if (value === true) return "true";

  if (value === 0) return "0";

  return value as boolean | number | string;
};

export const isEmptyObject = (obj: unknown): boolean => {
  if (!obj || typeof obj !== "object") return true;

  for (const _ in obj as Record<string, unknown>) return false;

  return true;
};

export const isEqual = (obj1: unknown, obj2: unknown): boolean => {
  if (obj1 === obj2) return true;

  if (!obj1 || !obj2) return false;

  const keys1 = Object.keys(obj1 as Record<string, unknown>);
  const keys2 = Object.keys(obj2 as Record<string, unknown>);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key)) return false;

    if ((obj1 as Record<string, unknown>)[key] !== (obj2 as Record<string, unknown>)[key])
      return false;
  }

  return true;
};

export const isBoolean = (value: unknown): boolean => value === true || value === false;

export function flat(arr: unknown[], target: unknown[]): void {
  for (const el of arr) {
    if (Array.isArray(el)) flat(el, target);
    else target.push(el);
  }
}

export function flatArray(arr: unknown[]): unknown[] {
  const flattened: unknown[] = [];

  flat(arr, flattened);

  return flattened;
}

export const flatMergeArrays = (...arrays: unknown[][]): unknown[] => {
  const result: unknown[] = [];

  flat(arrays, result);
  const filtered: unknown[] = [];

  for (const element of result) {
    if (element) filtered.push(element);
  }

  return filtered;
};

export const mergeObjects = <T extends object>(obj1: T, obj2: T): T => {
  const result = {} as T;

  for (const key in obj1) {
    const val1 = obj1[key];

    if (key in obj2) {
      const val2 = obj2[key];

      if (Array.isArray(val1) || Array.isArray(val2)) {
        result[key] = flatMergeArrays(val2 as unknown[], val1 as unknown[]) as T[typeof key];
      } else if (typeof val1 === "object" && typeof val2 === "object" && val1 && val2) {
        result[key] = mergeObjects(
          val1 as Record<string, unknown>,
          val2 as Record<string, unknown>,
        ) as T[typeof key];
      } else {
        result[key] = (String(val2) + " " + String(val1)) as T[typeof key];
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

export const removeExtraSpaces = (str: unknown): unknown => {
  if (!str || typeof str !== "string") return str;

  return str.replaceAll(SPACE_REGEX, " ").trim();
};
