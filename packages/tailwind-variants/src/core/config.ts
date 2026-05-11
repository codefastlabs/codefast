/**
 * Variant Configuration Management Module
 *
 * This module handles the merging and processing of variant configurations.
 * It provides utilities for combining base configurations with extensions,
 * merging variant groups, and handling slot configurations.
 */

import type {
  ClassValue,
  CompoundSlot,
  VariantConfig,
  VariantSchema,
  SlotVariantConfig,
  ExtendedVariantConfig,
  SlotSchema,
} from "#/types/api";

import { cx, hasExtendConfig, hasSlotsConfig, isSlotClassMap } from "#/utilities/utils";

/**
 * Merge two variant groups.
 *
 * This function combines variant groups from base and extension configurations.
 * It handles slot object merging for complex variant definitions.
 *
 * @param baseVariantGroup - The base variant group to merge into
 * @param extensionVariantGroup - The extension variant group to merge
 * @returns The merged variant group
 *
 * @since 0.3.16-canary.0
 */
export const mergeVariantClassGroup = (
  baseVariantGroup: Record<string, ClassValue>,
  extensionVariantGroup: Record<string, ClassValue>,
): Record<string, ClassValue> => {
  // Start with a copy of the base variant group
  const mergedVariantGroup = { ...baseVariantGroup };
  const extensionKeys = Object.keys(extensionVariantGroup);

  // Process each extension key
  for (const extensionKey of extensionKeys) {
    const extensionValue = extensionVariantGroup[extensionKey];
    const baseValue = mergedVariantGroup[extensionKey];

    if (baseValue === undefined) {
      // Add a new variant if it doesn't exist in base
      mergedVariantGroup[extensionKey] = extensionValue;
    } else {
      // Merge slot objects or replace with an extension value
      mergedVariantGroup[extensionKey] =
        isSlotClassMap(baseValue) && isSlotClassMap(extensionValue)
          ? { ...baseValue, ...extensionValue }
          : extensionValue;
    }
  }

  return mergedVariantGroup;
};

/**
 * Merge variant configurations.
 *
 * This function combines base and extension configurations, handling
 * recursive extension resolution, variant merging, slot merging,
 * and compound variant/slot combination.
 *
 * @param baseConfiguration - The base configuration to merge into
 * @param extensionConfiguration - The extension configuration to merge
 * @returns The merged variant configuration
 *
 * @since 0.3.16-canary.0
 */
export const mergeVariantConfigs = (
  baseConfiguration: VariantConfig<VariantSchema> | SlotVariantConfig<VariantSchema, SlotSchema>,
  extensionConfiguration:
    | VariantConfig<VariantSchema>
    | SlotVariantConfig<VariantSchema, SlotSchema>
    | ExtendedVariantConfig<VariantSchema, VariantSchema, SlotSchema, SlotSchema>,
): VariantConfig<VariantSchema> | SlotVariantConfig<VariantSchema, SlotSchema> => {
  // Resolve recursive extensions in the base configuration
  const resolvedBaseConfiguration = hasExtendConfig(baseConfiguration)
    ? mergeVariantConfigs(baseConfiguration.extend.config, baseConfiguration)
    : baseConfiguration;

  // Merge base classes from both configurations
  const mergedBaseClasses = extensionConfiguration.base
    ? resolvedBaseConfiguration.base
      ? cx(resolvedBaseConfiguration.base, extensionConfiguration.base)
      : extensionConfiguration.base
    : resolvedBaseConfiguration.base;

  // Start with base variant groups and merge extensions
  const mergedVariantGroups = { ...resolvedBaseConfiguration.variants } as VariantSchema;

  if (extensionConfiguration.variants) {
    const extensionKeys = Object.keys(extensionConfiguration.variants);

    for (const extensionKey of extensionKeys) {
      const extensionVariantGroup = extensionConfiguration.variants[extensionKey];
      if (extensionVariantGroup === undefined) {
        continue;
      }

      // Merge variant groups or add new ones
      const existingVariantGroup = mergedVariantGroups[extensionKey];
      if (existingVariantGroup !== undefined) {
        mergedVariantGroups[extensionKey] = mergeVariantClassGroup(
          existingVariantGroup,
          extensionVariantGroup,
        );
      } else {
        mergedVariantGroups[extensionKey] = extensionVariantGroup;
      }
    }
  }

  // Merge slot definitions from both configurations
  const resolvedSlotDefinitions = hasSlotsConfig(resolvedBaseConfiguration)
    ? resolvedBaseConfiguration.slots
    : {};
  const extensionSlotDefinitions = hasSlotsConfig(extensionConfiguration)
    ? extensionConfiguration.slots
    : {};
  const mergedSlotDefinitions = { ...resolvedSlotDefinitions, ...extensionSlotDefinitions };

  // Determine if the result should have slot configuration
  const hasSlotConfigurationResult = Object.keys(mergedSlotDefinitions).length > 0;

  // Handle slot-based configuration merging
  if (hasSlotConfigurationResult) {
    // Extract compound slot definitions from base configuration
    const baseCompoundSlotDefinitions: ReadonlyArray<CompoundSlot<VariantSchema, SlotSchema>> =
      hasSlotsConfig(resolvedBaseConfiguration) &&
      Array.isArray(resolvedBaseConfiguration.compoundSlots)
        ? (resolvedBaseConfiguration.compoundSlots as ReadonlyArray<
            CompoundSlot<VariantSchema, SlotSchema>
          >)
        : [];

    // Extract compound slot definitions from the extension configuration
    const extensionCompoundSlotDefinitions: ReadonlyArray<CompoundSlot<VariantSchema, SlotSchema>> =
      hasSlotsConfig(extensionConfiguration) && Array.isArray(extensionConfiguration.compoundSlots)
        ? (extensionConfiguration.compoundSlots as ReadonlyArray<
            CompoundSlot<VariantSchema, SlotSchema>
          >)
        : [];

    // Return slot-based configuration
    return {
      base: mergedBaseClasses,
      compoundSlots: [...baseCompoundSlotDefinitions, ...extensionCompoundSlotDefinitions],
      compoundVariants: [
        ...(resolvedBaseConfiguration.compoundVariants ?? []),
        ...(extensionConfiguration.compoundVariants ?? []),
      ],
      defaultVariants: {
        ...resolvedBaseConfiguration.defaultVariants,
        ...extensionConfiguration.defaultVariants,
      },
      slots: mergedSlotDefinitions,
      variants: mergedVariantGroups,
    };
  }

  // Return regular configuration without slots
  return {
    base: mergedBaseClasses,
    compoundVariants: [
      ...(resolvedBaseConfiguration.compoundVariants ?? []),
      ...(extensionConfiguration.compoundVariants ?? []),
    ],
    defaultVariants: {
      ...resolvedBaseConfiguration.defaultVariants,
      ...extensionConfiguration.defaultVariants,
    },
    variants: mergedVariantGroups,
  };
};
