import { flatMergeArrays } from '@/utils/flat-merge-arrays';

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
