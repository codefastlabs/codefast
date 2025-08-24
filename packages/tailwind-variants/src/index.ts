// Core exports
export { tv, createTV, defaultConfig } from '@/core';
export type { TV, Config } from '@/types';

// CN exports
export { cn, cnBase, createTwMerge } from '@/cn';

// Utility exports
export {
  falsyToString,
  isEmptyObject,
  isEqual,
  isBoolean,
  flat,
  flatArray,
  flatMergeArrays,
  mergeObjects,
} from '@/utils';

// Join objects utility
export { joinObjects } from '@/cn';

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
} from '@/types';
