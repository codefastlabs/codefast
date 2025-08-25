// Core utilities
export { falsyToString } from "@/utils/falsy-to-string";
export { flat } from "@/utils/flat";
export { flatMergeArrays } from "@/utils/flat-merge-arrays";
export { isEmptyObject } from "@/utils/is-empty-object";
export { isEqual } from "@/utils/is-equal";
export { mergeObjects } from "@/utils/merge-objects";

// CN utilities (moved from cn directory)
export { cn } from "@/utils/cn";
export { createTwMerge } from "@/utils/create-tw-merge";
export { joinObjects, joinObjectsImmutable } from "@/utils/join-objects";

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
  // CN types (moved from cn directory)
  ClassNameValue,
  ClassNameString,
  MergedClassNameString,
  IsFunction,
  IsObject,
  IsPrimitive,
  ReadonlyObject,
  ClassNamePattern,
  FunctionReturnType,
  DeepReadonly,
  NoUndefined,
  isString,
  isNumber,
  isBoolean,
  isNull,
  isUndefined,
  isFunction,
  isObject,
  isArray,
  isPrimitive,
  AdvancedMergeResult,
  ObjectMergeConfig,
} from "@/utils/types";
