import { flat } from '@/utils/flat';

export const flatMergeArrays = (...arrays: unknown[][]): unknown[] => {
  const result: unknown[] = [];

  flat(arrays, result);
  const filtered: unknown[] = [];

  for (const element of result) {
    if (element) filtered.push(element);
  }

  return filtered;
};
