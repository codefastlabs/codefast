import type { ClassNameValue, Config, TWMergeConfig } from "@/types";

import { createTwMerge } from "@/cn/create-tw-merge";
import { isEqual } from "@/utils";
import clsx from "clsx";

// Cache for the twMerge function to avoid recreating it on every call
let cachedTwMerge: ((...classes: ClassNameValue[]) => string) | null = null;
// Cache for the twMerge configuration to detect changes
let cachedTwMergeConfig: TWMergeConfig = {};

/**
 * A class name utility that combines clsx for class merging and tailwind-merge for conflict resolution
 * 
 * @param classes - Variable number of class name values to combine
 * @returns A function that accepts a config and returns the processed class names
 */
export const cn =
  (...classes: ClassNameValue[]) =>
  (config?: Config): string | undefined => {
    // Use clsx to merge all class names into a single string
    const base = clsx(classes) || undefined;

    // Early return if no classes or twMerge is disabled
    if (!base || !config?.twMerge) {
      return base;
    }

    // Check if twMergeConfig has changed to determine if we need to recreate the merge function
    const currentConfig = config.twMergeConfig || {};
    const hasConfigChanged = !isEqual(currentConfig, cachedTwMergeConfig);

    // Recreate twMerge function if config changed or function doesn't exist
    if (!cachedTwMerge || hasConfigChanged) {
      cachedTwMergeConfig = currentConfig;
      cachedTwMerge = createTwMerge(cachedTwMergeConfig);
    }

    // Apply tailwind-merge to resolve class conflicts
    return cachedTwMerge(base) || undefined;
  };
