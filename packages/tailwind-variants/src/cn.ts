import { isEmptyObject } from "./utils";

interface TwMergeModule {
  extendTailwindMerge: (config: any) => (classes: string) => string;
  twMerge: (classes: string) => string;
}

let twMergeModule: null | TwMergeModule = null;
let loadingPromise: null | Promise<null | TwMergeModule> = null;

const loadTwMerge = async (): Promise<null | TwMergeModule> => {
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

export const createTwMerge = (cachedTwMergeConfig: any) => {
  // Return a function that will lazily load and use twMerge
  return (classes: string): string => {
    // If tailwind-merge was already loaded and failed, just return the classes
    if (loadingPromise && !twMergeModule) {
      return classes;
    }

    // Try to load synchronously if already loaded
    if (twMergeModule) {
      const { extendTailwindMerge, twMerge: twMergeBase } = twMergeModule;
      const twMergeFn = isEmptyObject(cachedTwMergeConfig)
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

      return twMergeFn(classes);
    }

    // Try to require synchronously for CommonJS environments
    try {
      const { extendTailwindMerge, twMerge: twMergeBase } = require("tailwind-merge");

      twMergeModule = { extendTailwindMerge, twMerge: twMergeBase };
      const twMergeFn = isEmptyObject(cachedTwMergeConfig)
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

      return twMergeFn(classes);
    } catch {
      // If require fails, load asynchronously and return unmerged classes for now
      loadTwMerge();

      return classes;
    }
  };
};
