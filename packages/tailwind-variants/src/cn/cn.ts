import type { ClassNameValue, Config, TWMergeConfig } from "@/types";

import { createTwMerge } from "@/cn/create-tw-merge";
import { isEqual } from "@/utils";
import clsx from "clsx";

export const cnBase = (...classes: ClassNameValue[]): string | undefined => {
  const result = clsx(classes);
  return result || undefined;
};

let cachedTwMerge: ((...classes: ClassNameValue[]) => string) | null = null;
let cachedTwMergeConfig: TWMergeConfig = {};

export const cn =
  (...classes: ClassNameValue[]) =>
  (config?: Config): string | undefined => {
    const base = cnBase(classes);

    if (!base || !config?.twMerge) {
      return base;
    }

    // Check if twMergeConfig has changed
    const hasConfigChanged = !isEqual(config.twMergeConfig || {}, cachedTwMergeConfig);

    if (!cachedTwMerge || hasConfigChanged) {
      cachedTwMergeConfig = config.twMergeConfig || {};
      cachedTwMerge = createTwMerge(cachedTwMergeConfig);
    }

    return cachedTwMerge(base) || undefined;
  };
