import { isEmptyObject } from "./utils";

type TwMergeModule = {
  extendTailwindMerge: (config: any) => (classes: string) => string;
  twMerge: (classes: string) => string;
} | null;

type TwMergeConfig = Record<string, any>;

let twMergeModule: TwMergeModule = null;
let loadingPromise: Promise<TwMergeModule> | null = null;

const loadTwMerge = async (): Promise<TwMergeModule> => {
  if (twMergeModule) return twMergeModule;

  if (loadingPromise) return loadingPromise;

  loadingPromise = import("tailwind-merge")
    .then((module) => {
      twMergeModule = module as TwMergeModule;

      return module as TwMergeModule;
    })
    .catch(() => {
      // If tailwind-merge is not installed, return null
      return null;
    });

  return loadingPromise;
};

export const createTwMerge = (cachedTwMergeConfig: TwMergeConfig): ((classes: string) => string) => {
  // Return a function that will lazily load and use twMerge
  return (classes: string): string => {
    // If tailwind-merge was already loaded and failed, just return the classes
    if (loadingPromise && !twMergeModule) {
      return classes;
    }

    // Try to load synchronously if already loaded
    if (twMergeModule) {
      const { extendTailwindMerge, twMerge: twMergeBase } = twMergeModule;
      const twMergeFunction = isEmptyObject(cachedTwMergeConfig)
        ? twMergeBase
        : extendTailwindMerge({
            ...cachedTwMergeConfig,
            extend: {
              classGroups: cachedTwMergeConfig.classGroups,
              conflictingClassGroupModifiers: cachedTwMergeConfig.conflictingClassGroupModifiers,
              conflictingClassGroups: cachedTwMergeConfig.conflictingClassGroups,
              theme: cachedTwMergeConfig.theme,
              ...cachedTwMergeConfig.extend,
            },
          });

      return twMergeFunction(classes);
    }

    try {
      const { extendTailwindMerge, twMerge: twMergeBase } = require("tailwind-merge");

      twMergeModule = { extendTailwindMerge, twMerge: twMergeBase };
      const twMergeFunction = isEmptyObject(cachedTwMergeConfig)
        ? twMergeBase
        : extendTailwindMerge({
            ...cachedTwMergeConfig,
            extend: {
              classGroups: cachedTwMergeConfig.classGroups,
              conflictingClassGroupModifiers: cachedTwMergeConfig.conflictingClassGroupModifiers,
              conflictingClassGroups: cachedTwMergeConfig.conflictingClassGroups,
              theme: cachedTwMergeConfig.theme,
              ...cachedTwMergeConfig.extend,
            },
          });

      return twMergeFunction(classes);
    } catch {
      // If require fails, load asynchronously and return unmerged classes for now
      loadTwMerge();

      return classes;
    }
  };
};
