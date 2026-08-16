/**
 * What a raw configuration is: how to ask about its shape, and how to collapse an `extend` chain
 * into the single configuration a plan is compiled from.
 */

import { cx } from "#/class-names";
import { isSlotClassMap } from "#/compile/class-values";
import type {
  ClassValue,
  CompoundSlot,
  VariantConfig,
  VariantSchema,
  SlotVariantConfig,
  ExtendedVariantConfig,
  SlotSchema,
  VariantResolver,
} from "#/types";

/**
 * Whether a configuration declares slots.
 *
 * @since 0.3.16-canary.0
 */
export const hasSlotsConfig = <Variants extends VariantSchema, Slots extends SlotSchema>(
  configuration: VariantConfig<Variants> | SlotVariantConfig<Variants, Slots>,
): configuration is SlotVariantConfig<Variants, Slots> => {
  return "slots" in configuration && configuration.slots !== undefined;
};

/**
 * Whether a configuration extends another resolver's configuration.
 *
 * @since 0.3.16-canary.0
 */
export const hasExtendConfig = <Variants extends VariantSchema, Slots extends SlotSchema>(
  configuration:
    | VariantConfig<Variants>
    | SlotVariantConfig<Variants, Slots>
    | ExtendedVariantConfig<VariantSchema, Variants, SlotSchema, Slots>,
): configuration is ExtendedVariantConfig<VariantSchema, Variants, SlotSchema, Slots> & {
  readonly extend: VariantResolver<VariantSchema>;
} => {
  return "extend" in configuration && configuration.extend !== undefined;
};

/**
 * Merges one variant group over another, where two slot maps for the same value combine per slot
 * and anything else is replaced outright.
 *
 * @since 0.3.16-canary.0
 */
const mergeVariantClassGroup = (
  baseVariantGroup: Record<string, ClassValue>,
  extensionVariantGroup: Record<string, ClassValue>,
): Record<string, ClassValue> => {
  const mergedVariantGroup = { ...baseVariantGroup };

  for (const extensionKey of Object.keys(extensionVariantGroup)) {
    const extensionValue = extensionVariantGroup[extensionKey];
    const baseValue = mergedVariantGroup[extensionKey];

    if (baseValue === undefined) {
      mergedVariantGroup[extensionKey] = extensionValue;
    } else {
      mergedVariantGroup[extensionKey] =
        isSlotClassMap(baseValue) && isSlotClassMap(extensionValue)
          ? { ...baseValue, ...extensionValue }
          : extensionValue;
    }
  }

  return mergedVariantGroup;
};

/**
 * Collapse a configuration and the one it extends into a single configuration, resolving an
 * extend chain of any depth.
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
  const resolvedBaseConfiguration = hasExtendConfig(baseConfiguration)
    ? mergeVariantConfigs(baseConfiguration.extend.config, baseConfiguration)
    : baseConfiguration;

  const mergedBaseClasses = extensionConfiguration.base
    ? resolvedBaseConfiguration.base
      ? cx(resolvedBaseConfiguration.base, extensionConfiguration.base)
      : extensionConfiguration.base
    : resolvedBaseConfiguration.base;

  const mergedVariantGroups = { ...resolvedBaseConfiguration.variants } as VariantSchema;

  if (extensionConfiguration.variants) {
    const extensionKeys = Object.keys(extensionConfiguration.variants);

    for (const extensionKey of extensionKeys) {
      const extensionVariantGroup = extensionConfiguration.variants[extensionKey];
      if (extensionVariantGroup === undefined) {
        continue;
      }

      const existingVariantGroup = mergedVariantGroups[extensionKey];
      if (existingVariantGroup !== undefined) {
        mergedVariantGroups[extensionKey] = mergeVariantClassGroup(existingVariantGroup, extensionVariantGroup);
      } else {
        mergedVariantGroups[extensionKey] = extensionVariantGroup;
      }
    }
  }

  const resolvedSlotDefinitions = hasSlotsConfig(resolvedBaseConfiguration) ? resolvedBaseConfiguration.slots : {};
  const extensionSlotDefinitions = hasSlotsConfig(extensionConfiguration) ? extensionConfiguration.slots : {};
  const mergedSlotDefinitions = { ...resolvedSlotDefinitions, ...extensionSlotDefinitions };

  const hasSlotConfigurationResult = Object.keys(mergedSlotDefinitions).length > 0;

  if (hasSlotConfigurationResult) {
    const baseCompoundSlotDefinitions: ReadonlyArray<CompoundSlot<VariantSchema, SlotSchema>> =
      hasSlotsConfig(resolvedBaseConfiguration) && Array.isArray(resolvedBaseConfiguration.compoundSlots)
        ? (resolvedBaseConfiguration.compoundSlots as ReadonlyArray<CompoundSlot<VariantSchema, SlotSchema>>)
        : [];

    const extensionCompoundSlotDefinitions: ReadonlyArray<CompoundSlot<VariantSchema, SlotSchema>> =
      hasSlotsConfig(extensionConfiguration) && Array.isArray(extensionConfiguration.compoundSlots)
        ? (extensionConfiguration.compoundSlots as ReadonlyArray<CompoundSlot<VariantSchema, SlotSchema>>)
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
