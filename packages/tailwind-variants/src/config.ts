import type {
  ClassValue,
  CompoundSlotType,
  Configuration,
  ConfigurationSchema,
  ConfigurationWithSlots,
  ExtendedConfiguration,
  SlotConfigurationSchema,
} from "@/types";

import { cx, hasExtensionConfiguration, hasSlotConfiguration, isSlotObjectType } from "@/utils";

export const mergeVariantGroups = (
  baseVariantGroup: Record<string, ClassValue>,
  extensionVariantGroup: Record<string, ClassValue>,
): Record<string, ClassValue> => {
  const mergedVariantGroup = { ...baseVariantGroup };
  const extensionKeys = Object.keys(extensionVariantGroup);

  for (const extensionKey of extensionKeys) {
    const extensionValue = extensionVariantGroup[extensionKey];
    const baseValue = mergedVariantGroup[extensionKey];

    if (baseValue === undefined) {
      mergedVariantGroup[extensionKey] = extensionValue;
    } else {
      mergedVariantGroup[extensionKey] =
        isSlotObjectType(baseValue) && isSlotObjectType(extensionValue)
          ? { ...baseValue, ...extensionValue }
          : extensionValue;
    }
  }

  return mergedVariantGroup;
};

export const mergeConfigurationSchemas = (
  baseConfiguration:
    | Configuration<ConfigurationSchema>
    | ConfigurationWithSlots<ConfigurationSchema, SlotConfigurationSchema>,
  extensionConfiguration:
    | Configuration<ConfigurationSchema>
    | ConfigurationWithSlots<ConfigurationSchema, SlotConfigurationSchema>
    | ExtendedConfiguration<
        ConfigurationSchema,
        ConfigurationSchema,
        SlotConfigurationSchema,
        SlotConfigurationSchema
      >,
):
  | Configuration<ConfigurationSchema>
  | ConfigurationWithSlots<ConfigurationSchema, SlotConfigurationSchema> => {
  const resolvedBaseConfiguration =
    hasExtensionConfiguration(baseConfiguration) && baseConfiguration.extend
      ? mergeConfigurationSchemas(baseConfiguration.extend.config, baseConfiguration)
      : baseConfiguration;

  const mergedBaseClasses = extensionConfiguration.base
    ? resolvedBaseConfiguration.base
      ? cx(resolvedBaseConfiguration.base, extensionConfiguration.base)
      : extensionConfiguration.base
    : resolvedBaseConfiguration.base;

  const mergedVariantGroups = { ...resolvedBaseConfiguration.variants } as ConfigurationSchema;

  if (extensionConfiguration.variants) {
    const extensionKeys = Object.keys(extensionConfiguration.variants);

    for (const extensionKey of extensionKeys) {
      const extensionVariantGroup = extensionConfiguration.variants[extensionKey];

      mergedVariantGroups[extensionKey] =
        extensionKey in mergedVariantGroups
          ? mergeVariantGroups(mergedVariantGroups[extensionKey], extensionVariantGroup)
          : extensionVariantGroup;
    }
  }

  const resolvedSlotDefinitions = hasSlotConfiguration(resolvedBaseConfiguration)
    ? resolvedBaseConfiguration.slots
    : {};
  const extensionSlotDefinitions = hasSlotConfiguration(extensionConfiguration)
    ? extensionConfiguration.slots
    : {};
  const mergedSlotDefinitions = { ...resolvedSlotDefinitions, ...extensionSlotDefinitions };

  const hasSlotConfigurationResult = Object.keys(mergedSlotDefinitions).length > 0;

  if (hasSlotConfigurationResult) {
    const baseCompoundSlotDefinitions: readonly CompoundSlotType<
      ConfigurationSchema,
      SlotConfigurationSchema
    >[] =
      hasSlotConfiguration(resolvedBaseConfiguration) &&
      Array.isArray(resolvedBaseConfiguration.compoundSlots)
        ? (resolvedBaseConfiguration.compoundSlots as readonly CompoundSlotType<
            ConfigurationSchema,
            SlotConfigurationSchema
          >[])
        : [];

    const extensionCompoundSlotDefinitions: readonly CompoundSlotType<
      ConfigurationSchema,
      SlotConfigurationSchema
    >[] =
      hasSlotConfiguration(extensionConfiguration) &&
      Array.isArray(extensionConfiguration.compoundSlots)
        ? (extensionConfiguration.compoundSlots as readonly CompoundSlotType<
            ConfigurationSchema,
            SlotConfigurationSchema
          >[])
        : [];

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
