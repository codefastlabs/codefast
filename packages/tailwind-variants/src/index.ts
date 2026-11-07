/** The public surface of `@codefast/tailwind-variants`: `tv`, `createTV`, the class utilities, and their types. */

export { createTV, tv } from "#tv";

export type { TailwindVariantsApi, TailwindVariantsFactory } from "#tv";

export { cn, cx } from "#class-names";

export type { ClassMerger, ClassValue, TailwindVariantsOptions } from "#types/common";

export type {
  CompoundSlot,
  CompoundVariant,
  ExtensionVariantConfig,
  MergedSlotSchema,
  MergedVariantSchema,
  SlotClassMap,
  SlotCompoundVariant,
  SlotSchema,
  SlotVariantConfig,
  VariantConfig,
  VariantSchema,
  VariantValue,
} from "#types/config";

export type {
  FlatVariantResolver,
  SlotClassResolver,
  SlotVariantResolver,
  VariantProps,
  VariantResolver,
  VariantSelection,
} from "#types/resolver";
