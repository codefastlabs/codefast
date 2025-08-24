import clsx from "clsx";

import type { ClassNameValue, Config, TWMergeConfig } from "@/types";

import { createTwMerge } from "@/cn/create-tw-merge";
import { isEqual } from "@/utils";

// Cache for the twMerge function to avoid recreating it on every call
let cachedTwMergeFunction: ((...classes: ClassNameValue[]) => string) | null = null;
// Cache for the twMerge configuration to detect changes
let cachedTwMergeConfiguration: TWMergeConfig = {};

/**
 * A class name utility that combines clsx for class merging and tailwind-merge for conflict resolution
 *
 * @param classNames - Variable number of class name values to combine
 * @returns A function that accepts a config and returns the processed class names
 */
export const cn =
  (...classNames: ClassNameValue[]) =>
  (config?: Config): string | undefined => {
    // Use clsx to merge all class names into a single string
    const mergedClassNames = clsx(classNames) || undefined;

    // Early return if no classes or twMerge is disabled
    if (!mergedClassNames || !config?.twMerge) {
      return mergedClassNames;
    }

    // Check if twMergeConfig has changed to determine if we need to recreate the merge function
    const currentTwMergeConfig = config.twMergeConfig || {};
    const hasConfigurationChanged = !isEqual(currentTwMergeConfig, cachedTwMergeConfiguration);

    // Recreate twMerge function if config changed or function doesn't exist
    if (!cachedTwMergeFunction || hasConfigurationChanged) {
      cachedTwMergeConfiguration = currentTwMergeConfig;
      cachedTwMergeFunction = createTwMerge(cachedTwMergeConfiguration);
    }

    // Apply tailwind-merge to resolve class conflicts
    return cachedTwMergeFunction(mergedClassNames) || undefined;
  };
