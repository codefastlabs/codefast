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
  ClassValue,
  CompoundSlot,
  CompoundVariant,
  ExtendedVariantConfig,
  HasBooleanVariant,
  MergedSlotSchema,
  MergedVariantSchema,
  SlotCompoundVariant,
  SlotClassMap,
  SlotClassResolver,
  SlotResolverProps,
  SlotSchema,
  SlotVariantConfig,
  TailwindVariantsApi,
  TailwindVariantsFactory,
  TailwindVariantsOptions,
  VariantConfig,
  VariantProps,
  VariantResolver,
  VariantResolverResult,
  VariantSchema,
  VariantSelection,
  VariantValue,
} from "#/types/api";
