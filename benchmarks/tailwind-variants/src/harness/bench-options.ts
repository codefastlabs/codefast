/**
 * Merge flags passed explicitly to `tv` so behaviour does not depend on package defaults.
 *
 * @since 0.3.16-canary.0
 */
export const TV_MERGE_ENABLED = { twMerge: true } as const;
/**
 * @since 0.3.16-canary.0
 */
export const TV_MERGE_DISABLED = { twMerge: false } as const;
