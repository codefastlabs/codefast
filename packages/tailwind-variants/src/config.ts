/**
 * Configuration Merging Logic
 *
 * This module handles the merging of variant configurations, including
 * inheritance through the extend mechanism and deep merging of variant groups.
 */

import type {
  ClassValue,
  CompoundSlot,
  Config,
  ConfigSchema,
  ConfigWithSlots,
  ExtendedConfig,
  SlotSchema,
} from "@/types";

import { cx, hasExtend, hasSlots, isSlotObject } from "@/utils";

/**
 * Merge variant groups with optimized object handling.
 *
 * This function performs deep merging of variant groups, handling both
 * regular class values and slot-specific objects. When both base and
 * extension values are slot objects, they are merged recursively.
 *
 * @param baseGroup - Base variant group to merge into
 * @param extensionGroup - Extension variant group to merge from
 * @returns Merged variant group
 *
 * @example
 * ```typescript
 * const baseGroup = {
 *   sm: 'text-sm',
 *   lg: { base: 'text-lg', header: 'font-bold' }
 * };
 *
 * const extensionGroup = {
 *   lg: { base: 'text-xl', content: 'text-gray-600' },
 *   xl: 'text-2xl'
 * };
 *
 * const merged = mergeVariantGroups(baseGroup, extensionGroup);
 * // Returns: {
 * //   sm: 'text-sm',
 * //   lg: { base: 'text-xl', header: 'font-bold', content: 'text-gray-600' },
 * //   xl: 'text-2xl'
 * // }
 * ```
 */
export const mergeVariantGroups = (
  baseGroup: Record<string, ClassValue>,
  extensionGroup: Record<string, ClassValue>,
): Record<string, ClassValue> => {
  const merged = { ...baseGroup };
  const keys = Object.keys(extensionGroup);

  for (const key of keys) {
    const extensionValue = extensionGroup[key];
    const baseValue = merged[key];

    if (baseValue === undefined) {
      // New variant value - add it directly
      merged[key] = extensionValue;
    } else {
      // Merge individual variant value
      merged[key] =
        isSlotObject(baseValue) && isSlotObject(extensionValue)
          ? { ...baseValue, ...extensionValue }
          : extensionValue;
    }
  }

  return merged;
};

/**
 * Merge configurations with optimized deep merging and reduced object allocations.
 *
 * This function performs comprehensive merging of variant configurations,
 * handling inheritance, variants, slots, compound variants, and default values.
 * It supports recursive merging for extended configurations.
 *
 * @param baseConfig - Base configuration to merge into
 * @param extensionConfig - Extension configuration to merge from
 * @returns Merged configuration
 *
 * @example
 * ```typescript
 * const baseConfig = {
 *   base: 'px-4 py-2',
 *   variants: {
 *     size: { sm: 'text-sm', lg: 'text-lg' },
 *     color: { primary: 'bg-blue-500', secondary: 'bg-gray-500' }
 *   },
 *   defaultVariants: { size: 'sm', color: 'primary' }
 * };
 *
 * const extensionConfig = {
 *   base: 'rounded-md',
 *   variants: {
 *     size: { xl: 'text-xl' },
 *     variant: { solid: 'font-bold', outline: 'border-2' }
 *   },
 *   defaultVariants: { variant: 'solid' }
 * };
 *
 * const merged = mergeConfigs(baseConfig, extensionConfig);
 * // Returns merged configuration with all properties combined
 * ```
 */
export const mergeConfigs = (
  baseConfig: Config<ConfigSchema> | ConfigWithSlots<ConfigSchema, SlotSchema>,
  extensionConfig:
    | Config<ConfigSchema>
    | ConfigWithSlots<ConfigSchema, SlotSchema>
    | ExtendedConfig<ConfigSchema, ConfigSchema, SlotSchema, SlotSchema>,
): Config<ConfigSchema> | ConfigWithSlots<ConfigSchema, SlotSchema> => {
  // Recursively merge if the base has extended configuration
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
    const keys = Object.keys(extensionConfig.variants);

    for (const key of keys) {
      const extensionGroup = extensionConfig.variants[key];

      mergedVariants[key] =
        key in mergedVariants
          ? mergeVariantGroups(mergedVariants[key], extensionGroup)
          : extensionGroup;
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
      defaultVariants: {
        ...resolvedBase.defaultVariants,
        ...extensionConfig.defaultVariants,
      },
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
    defaultVariants: {
      ...resolvedBase.defaultVariants,
      ...extensionConfig.defaultVariants,
    },
    variants: mergedVariants,
  };
};
