// Core utilities
export { falsyToString } from "@/utils/falsy-to-string";
export { flat } from "@/utils/flat";
export { flatMergeArrays } from "@/utils/flat-merge-arrays";
export { isEmptyObject } from "@/utils/is-empty-object";
export { isEqual } from "@/utils/is-equal";
export { mergeObjects } from "@/utils/merge-objects";

// Re-export types for convenience
export type {
  CheckableObject,
  ComparableObject,
  ConversionResult,
  ConvertibleValue,
  MergeableArray,
  MergeableObject,
  MergedArray,
  MergeResult,
  NestedArray,
} from "@/utils/types";
