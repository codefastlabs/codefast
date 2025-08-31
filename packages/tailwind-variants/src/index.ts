/**
 * `@codefast/tailwind-variants` - Advanced TypeScript tailwind variants library
 *
 * A powerful utility for creating type-safe Tailwind CSS variant configurations
 * with support for slots, compound variants, and advanced composition patterns.
 */

// Export main functions
// Default export for convenience

export { createTV } from "./create-tv";
export { tv as default, tv } from "./tv";

// Export utility functions
export {
  falsyToString,
  flat,
  flatMergeArrays,
  isEmptyObject,
  isEqual,
  isFunction,
  mergeObjects,
} from "./utils";

// Export all types
export type {
  Brand,
  ClassValue,
  CompoundSlots,
  CompoundVariant,
  ExtractVariantProps,
  SlotFunction,
  SlotsReturnType,
  SlotsSchema,
  TVComponent,
  TVConfig,
  TVOptions,
  TVProps,
  TVReturnType,
  VariantKeys,
  VariantSchema,
  VariantValue,
} from "./types";
