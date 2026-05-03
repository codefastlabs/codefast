/**
 * Merge flags passed explicitly to `tv` so behaviour does not depend on package defaults.
 */
export const TV_MERGE_ENABLED = { twMerge: true } as const;
export const TV_MERGE_DISABLED = { twMerge: false } as const;
