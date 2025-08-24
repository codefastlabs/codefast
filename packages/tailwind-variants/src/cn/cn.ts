import type { ClassNameValue, Config, TWMergeConfig } from "@/types";

import { createTwMerge } from "@/cn/create-tw-merge";
import { isEqual } from "@/utils";
import clsx from "clsx";

let cachedTwMerge: ((...classes: ClassNameValue[]) => string) | null = null;
let cachedTwMergeConfig: TWMergeConfig = {};

export const cn =
  (...classes: ClassNameValue[]) =>
  (config?: Config): string | undefined => {
    const base = clsx(classes) || undefined;

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
