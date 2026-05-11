/**
 * Tailwind Variants Package
 *
 * This package provides a powerful utility for creating variant-based component styling
 * with Tailwind CSS. It allows you to define component variants, slots, and compound
 * variants in a type-safe manner.
 */

export { createTV, tv } from "#/core/tv";

export { cn, cx } from "#/utilities/utils";

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
} from "#/types/types";
