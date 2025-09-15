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
      merged[key] = extensionValue;
    } else {
      merged[key] =
        isSlotObject(baseValue) && isSlotObject(extensionValue)
          ? { ...baseValue, ...extensionValue }
          : extensionValue;
    }
  }

  return merged;
};

export const mergeConfigs = (
  baseConfig: Config<ConfigSchema> | ConfigWithSlots<ConfigSchema, SlotSchema>,
  extensionConfig:
    | Config<ConfigSchema>
    | ConfigWithSlots<ConfigSchema, SlotSchema>
    | ExtendedConfig<ConfigSchema, ConfigSchema, SlotSchema, SlotSchema>,
): Config<ConfigSchema> | ConfigWithSlots<ConfigSchema, SlotSchema> => {
  const resolvedBase =
    hasExtend(baseConfig) && baseConfig.extend
      ? mergeConfigs(baseConfig.extend.config, baseConfig)
      : baseConfig;

  const mergedBase = extensionConfig.base
    ? resolvedBase.base
      ? cx(resolvedBase.base, extensionConfig.base)
      : extensionConfig.base
    : resolvedBase.base;

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

  const resolvedSlots = hasSlots(resolvedBase) ? resolvedBase.slots : {};
  const extensionSlots = hasSlots(extensionConfig) ? extensionConfig.slots : {};
  const mergedSlots = { ...resolvedSlots, ...extensionSlots };

  const hasSlotsResult = Object.keys(mergedSlots).length > 0;

  if (hasSlotsResult) {
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
