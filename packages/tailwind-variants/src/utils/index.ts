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
  AdvancedMergeResult,
  CheckableObject,
  ClassNamePattern,
  ClassNameString,
  // CN types (moved from cn directory)
  ClassNameValue,
  ComparableObject,
  ConversionResult,
  ConvertibleValue,
  DeepReadonly,
  FunctionReturnType,
  isArray,
  isBoolean,
  IsFunction,
  isFunction,
  isNull,
  isNumber,
  IsObject,
  isObject,
  IsPrimitive,
  isPrimitive,
  isString,
  isUndefined,
  MergeableArray,
  MergeableObject,
  MergedArray,
  MergedClassNameString,
  MergeResult,
  NestedArray,
  NoUndefined,
  ObjectMergeConfig,
  ReadonlyObject,
} from "@/utils/types";
