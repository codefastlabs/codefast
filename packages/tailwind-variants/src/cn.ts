import { extendTailwindMerge, twMerge } from "tailwind-merge";

import type { MergeConfig } from "./index";

import { isEmptyObject } from "@/utils";

export const createTwMerge = (cachedTwMergeConfig: MergeConfig) => {
  return (classes: string): string => {
    const twMergeFn = isEmptyObject(cachedTwMergeConfig)
      ? twMerge
      : extendTailwindMerge(cachedTwMergeConfig);

    return twMergeFn(classes);
  };
};
