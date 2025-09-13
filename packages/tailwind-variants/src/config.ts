import type { ClassValue } from "clsx";

import type {
  CompoundSlot,
  Config,
  ConfigSchema,
  ConfigWithSlots,
  ExtendedConfig,
  SlotSchema,
} from "@/types";

import { cx, hasExtend, hasSlots, isSlotObject } from "@/utils";

// =============================================================================
// Configuration Merging
// =============================================================================

/**
 * Deep merges variant groups with optimized object handling
 * Uses for...of loops and cached keys for better performance
 */
export const mergeVariantGroups = (
  baseGroup: Record<string, ClassValue>,
  extensionGroup: Record<string, ClassValue>,
): Record<string, ClassValue> => {
  const mergedGroup = { ...baseGroup };
  const extensionKeys = Object.keys(extensionGroup);

  for (const variantValue of extensionKeys) {
    const extensionValue = extensionGroup[variantValue];
    const baseValue = mergedGroup[variantValue];

    if (baseValue === undefined) {
      // New variant value
      mergedGroup[variantValue] = extensionValue;
    } else {
      // Merge individual variant value
      mergedGroup[variantValue] =
        isSlotObject(baseValue) && isSlotObject(extensionValue)
          ? { ...baseValue, ...extensionValue }
          : extensionValue;
    }
  }

  return mergedGroup;
};

/**
 * Merges configurations with optimized deep merging and reduced object allocations
 */
export const mergeConfigs = (
  baseConfig: Config<ConfigSchema> | ConfigWithSlots<ConfigSchema, SlotSchema>,
  extensionConfig:
    | Config<ConfigSchema>
    | ConfigWithSlots<ConfigSchema, SlotSchema>
    | ExtendedConfig<ConfigSchema, ConfigSchema, SlotSchema, SlotSchema>,
): Config<ConfigSchema> | ConfigWithSlots<ConfigSchema, SlotSchema> => {
  // Recursively merge if the base has extended
  const resolvedBase =
    hasExtend(baseConfig) && baseConfig.extend
      ? mergeConfigs(baseConfig.extend.config, baseConfig)
      : baseConfig;

  // Merge base classes efficiently
  const mergedBase = extensionConfig.base
    ? resolvedBase.base
      ? cx(resolvedBase.base, extensionConfig.base)
      : extensionConfig.base
    : resolvedBase.base;

  // Deep merge variants with optimized iteration
  const mergedVariants = { ...resolvedBase.variants } as ConfigSchema;

  if (extensionConfig.variants) {
    const extensionVariantKeys = Object.keys(extensionConfig.variants);

    for (const variantKey of extensionVariantKeys) {
      const extensionVariantGroup = extensionConfig.variants[variantKey];

      mergedVariants[variantKey] =
        variantKey in mergedVariants
          ? mergeVariantGroups(mergedVariants[variantKey], extensionVariantGroup)
          : extensionVariantGroup;
    }
  }

  // Merge slots efficiently
  const resolvedSlots = hasSlots(resolvedBase) ? resolvedBase.slots : {};
  const extensionSlots = hasSlots(extensionConfig) ? extensionConfig.slots : {};
  const mergedSlots = { ...resolvedSlots, ...extensionSlots };

  const hasSlotsResult = Object.keys(mergedSlots).length > 0;

  if (hasSlotsResult) {
    // Prepare compoundSlots arrays with safe, explicit typing
    const baseCompoundSlots: readonly CompoundSlot<ConfigSchema, SlotSchema>[] =
      hasSlots(resolvedBase) && Array.isArray(resolvedBase.compoundSlots)
        ? (resolvedBase.compoundSlots as readonly CompoundSlot<ConfigSchema, SlotSchema>[])
        : [];

    const extensionCompoundSlots: readonly CompoundSlot<ConfigSchema, SlotSchema>[] =
      hasSlots(extensionConfig) && Array.isArray(extensionConfig.compoundSlots)
        ? (extensionConfig.compoundSlots as readonly CompoundSlot<ConfigSchema, SlotSchema>[])
        : [];

    return {
      base: mergedBase,
      compoundSlots: [...baseCompoundSlots, ...extensionCompoundSlots],
      compoundVariants: [
        ...(resolvedBase.compoundVariants ?? []),
        ...(extensionConfig.compoundVariants ?? []),
      ],
      defaultVariants: { ...resolvedBase.defaultVariants, ...extensionConfig.defaultVariants },
      slots: mergedSlots,
      variants: mergedVariants,
    };
  }

  return {
    base: mergedBase,
    compoundVariants: [
      ...(resolvedBase.compoundVariants ?? []),
      ...(extensionConfig.compoundVariants ?? []),
    ],
    defaultVariants: { ...resolvedBase.defaultVariants, ...extensionConfig.defaultVariants },
    variants: mergedVariants,
  };
};
