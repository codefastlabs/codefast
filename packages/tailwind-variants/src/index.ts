/**
 * Tailwind Variants Package
 *
 * This package provides a powerful utility for creating variant-based component styling
 * with Tailwind CSS. It allows you to define component variants, slots, and compound
 * variants in a type-safe manner.
 */

/**
 * Export the main Tailwind Variants factory functions.
 *
 * These functions allow you to create variant-based styling functions
 * for your components with full TypeScript support.
 */
export { createTV, tv } from '@/core/tv';

/**
 * Export utility functions for class name manipulation.
 *
 * These utilities help with merging and combining CSS classes
 * in a consistent and type-safe way.
 */
export { cn, cx } from '@/utilities/utils';

/**
 * Export TypeScript type definitions.
 *
 * These types provide full type safety for variant configurations,
 * component props, and class value handling.
 */
export type {
  BooleanVariantChecker,
  ClassValue,
  CompoundSlotType,
  CompoundVariantType,
  CompoundVariantWithSlotsType,
  Configuration,
  ConfigurationSchema,
  ConfigurationVariants,
  ConfigurationWithSlots,
  ExtendedConfiguration,
  MergedSchemas,
  MergedSlotSchemas,
  SlotConfigurationSchema,
  SlotFunctionProperties,
  SlotFunctionType,
  SlotProperties,
  StringToBooleanType,
  TailwindVariantsConfiguration,
  TailwindVariantsFactory,
  TailwindVariantsFactoryResult,
  TailwindVariantsReturnType,
  VariantFunctionType,
  VariantProps,
} from '@/types/types';
