// Core exports
export { createTV, defaultConfig, tv } from "@/core";
export type { Config, TV } from "@/types";

// All utilities and CN functions (consolidated in utils)
export {
  cn,
  createTwMerge,
  falsyToString,
  flat,
  flatMergeArrays,
  isEmptyObject,
  isEqual,
  joinObjects,
  joinObjectsImmutable,
  mergeObjects,
} from "@/utils";

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
