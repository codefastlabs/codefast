/**
 * Merge flags passed explicitly to `tv`, so behaviour does not depend on package defaults.
 *
 * @since 0.3.16-canary.0
 */
export const TV_MERGE_ENABLED = { twMerge: true } as const;
/**
 * @since 0.3.16-canary.0
 */
export const TV_MERGE_DISABLED = { twMerge: false } as const;

/**
 * Forces the plan walk and a real merge on every call: no resolution memo and no tailwind-merge cache.
 *
 * @since 0.6.0
 */
export const TV_CACHE_DISABLED = { cacheResolutions: false, twMerge: true, twMergeConfig: { cacheSize: 0 } } as const;

/**
 * The without-merge counterpart of `TV_CACHE_DISABLED`, so a paired control isolates the merge step.
 */
export const TV_CACHE_AND_MERGE_DISABLED = { cacheResolutions: false, twMerge: false } as const;
