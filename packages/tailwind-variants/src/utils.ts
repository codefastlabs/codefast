export const falsyToString = <T>(value: T): string | T =>
  value === false ? "false" : value === true ? "true" : value === 0 ? "0" : value;

export const isEmptyObject = (obj: unknown): boolean => {
  if (!obj || typeof obj !== "object") return true;

  for (const _ in obj) return false;

  return true;
};

export const isEqual = (obj1: object, obj2: object): boolean => {
  if (obj1 === obj2) return true;

  if (!obj1 || !obj2) return false;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key)) return false;

    if ((obj1 as any)[key] !== (obj2 as any)[key]) return false;
  }

  return true;
};

export const isBoolean = (value: unknown): value is boolean => value === true || value === false;

function flat<T>(arr: T[], target: T[]): void {
  for (const el of arr) {
    if (Array.isArray(el)) flat(el, target);
    else target.push(el);
  }
}

export function flatArray<T extends unknown[]>(arr: T): T {
  const flattened: any[] = [];

  flat(arr as any[], flattened);

  return flattened as T;
}

export const flatMergeArrays = <T extends unknown[]>(...arrays: T[]): T => {
  const result: any[] = [];

  flat(arrays as any[], result);
  const filtered: any[] = [];

  for (const element of result) {
    if (element) filtered.push(element);
  }

  return filtered as T;
};

export const mergeObjects = (obj1: unknown, obj2: unknown): unknown => {
  if (!obj1 || typeof obj1 !== "object" || !obj2 || typeof obj2 !== "object") {
    return obj2;
  }

  const result: Record<string, any> = {};
  const o1 = obj1 as Record<string, any>;
  const o2 = obj2 as Record<string, any>;

  for (const key in o1) {
    const val1 = o1[key];

    if (key in o2) {
      const val2 = o2[key];

      if (Array.isArray(val1) || Array.isArray(val2)) {
        result[key] = flatMergeArrays(val2, val1);
      } else if (typeof val1 === "object" && typeof val2 === "object" && val1 && val2) {
        result[key] = mergeObjects(val1, val2);
      } else {
        result[key] = `${val2} ${val1}`;
      }
    } else {
      result[key] = val1;
    }
  }

  for (const key in o2) {
    if (!(key in o1)) {
      result[key] = o2[key];
    }
  }

  return result;
};

const SPACE_REGEX = /\s+/g;

export const removeExtraSpaces = (str: string): string => {
  if (!str || typeof str !== "string") return str;

  return str.replaceAll(SPACE_REGEX, " ").trim();
};
