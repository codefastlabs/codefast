export const flatMergeArrays = (...arrays: unknown[][]): unknown[] => {
  const result: unknown[] = [];

  for (const array of arrays) {
    if (Array.isArray(array)) {
      for (const item of array) {
        if (item !== null && item !== undefined) {
          result.push(item);
        }
      }
    }
  }

  return result;
};
