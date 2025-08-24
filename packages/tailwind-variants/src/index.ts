// Core exports
export { createTV, defaultConfig, tv } from "@/core";
export type { Config, TV } from "@/types";

// CN exports
export { cn, createTwMerge } from "@/cn";

// Utility exports
export {
  falsyToString,
  flat,
  flatMergeArrays,
  isEmptyObject,
  isEqual,
  mergeObjects,
} from "@/utils";

// Join objects utility
export { joinObjects } from "@/cn";

// Type exports
export type {
  ClassNameProp,
  ClassNameValue,
  CompoundSlots,
  CompoundVariants,
  DefaultVariants,
  IsTrueOrArray,
  OmitUndefined,
  Props,
  ReturnProps,
  ReturnType,
  StringToBoolean,
  VariantKeys,
  VariantProps,
  Variants,
} from "@/types";
