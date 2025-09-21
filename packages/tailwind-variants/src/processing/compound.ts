/**
 * Compound Variants Processing Module
 *
 * This module handles the processing of compound variants and compound slots.
 * It provides functions to apply compound variant classes based on
 * multiple variant conditions being met simultaneously.
 */

import type {
  ClassValue,
  CompoundSlotType,
  CompoundVariantType,
  ConfigurationSchema,
  ConfigurationVariants,
  SlotConfigurationSchema,
} from "@/types/types";

import { isBooleanValueType } from "@/utilities/utils";

/**
 * Apply compound variant classes based on variant conditions.
 *
 * This function processes compound variants and applies their classes when
 * all specified variant conditions are met. It merges by default and provides
 * variant props to determine which compound variants should be applied.
 *
 * @param compoundVariantGroups - Array of compound variant definitions
 * @param variantProps - Variant properties passed to the component
 * @param defaultVariantProps - Default variant properties from configuration
 * @returns Array of CSS classes from matching compound variants
 */
export const applyCompoundVariantClasses = <T extends ConfigurationSchema>(
  compoundVariantGroups: readonly CompoundVariantType<T>[],
  variantProps: ConfigurationVariants<T>,
  defaultVariantProps: ConfigurationVariants<T>,
): ClassValue[] => {
  // Check if we have default or variant props to avoid unnecessary object operations
  const hasDefaultProps = Object.keys(defaultVariantProps).length > 0;
  const hasVariantProps = Object.keys(variantProps).length > 0;

  const resolvedClasses: ClassValue[] = [];

  // Process each compound variant
  for (const compoundVariant of compoundVariantGroups) {
    let isMatching = true;

    const compoundKeys = Object.keys(compoundVariant) as (keyof typeof compoundVariant)[];

    // Check each variant condition
    for (const compoundKey of compoundKeys) {
      // Skip class properties
      if (compoundKey === "className" || compoundKey === "class") {
        continue;
      }

      // Get property value with an efficient lookup
      let propertyValue: unknown;

      if (hasVariantProps && variantProps[compoundKey] !== undefined) {
        propertyValue = variantProps[compoundKey];
      } else if (hasDefaultProps && defaultVariantProps[compoundKey] !== undefined) {
        propertyValue = defaultVariantProps[compoundKey];
      } else {
        propertyValue = undefined;
      }

      const compoundValue = compoundVariant[compoundKey];

      // Handle boolean variant values
      if (isBooleanValueType(compoundValue)) {
        const resolvedValue = propertyValue ?? false;

        if (resolvedValue !== compoundValue) {
          isMatching = false;
          break;
        }
      } else if (propertyValue !== compoundValue) {
        // Handle string/number variant values
        isMatching = false;
        break;
      }
    }

    // Add classes if all conditions are met
    if (isMatching) {
      resolvedClasses.push(compoundVariant.className ?? compoundVariant.class);
    }
  }

  return resolvedClasses;
};

/**
 * Apply compound slot classes based on variant conditions.
 *
 * This function processes compound slots and applies their classes to
 * specific slots when all specified variant conditions are met.
 * It returns a mapping of slot names to their applied classes.
 *
 * @param compoundSlotDefinitions - Array of compound slot definitions
 * @param variantProps - Variant properties passed to the component
 * @param defaultVariantProps - Default variant properties from configuration
 * @returns Object mapping slot names to arrays of CSS classes
 */
export const applyCompoundSlotClasses = <
  T extends ConfigurationSchema,
  S extends SlotConfigurationSchema,
>(
  compoundSlotDefinitions: readonly CompoundSlotType<T, S>[] | undefined,
  variantProps: ConfigurationVariants<T>,
  defaultVariantProps: ConfigurationVariants<T>,
): Partial<Record<keyof S, ClassValue[]>> => {
  // Return an empty object if no compound slot definitions
  if (!compoundSlotDefinitions?.length) {
    return {} as Partial<Record<keyof S, ClassValue[]>>;
  }

  // Merge default and provided variant props
  const mergedProps = { ...defaultVariantProps, ...variantProps };
  const resolvedSlotClasses = {} as Partial<Record<keyof S, ClassValue[]>>;

  // Process each compound slot definition
  for (const compoundSlot of compoundSlotDefinitions) {
    let isMatching = true;

    // Filter out class and slot properties
    const compoundEntries = Object.entries(compoundSlot).filter(
      ([key]) => key !== "className" && key !== "class" && key !== "slots",
    );

    // Check each variant condition
    for (const [compoundKey, compoundValue] of compoundEntries) {
      const propertyValue = mergedProps[compoundKey];

      // Handle boolean variant values
      if (isBooleanValueType(compoundValue)) {
        const resolvedValue = propertyValue ?? false;

        if (resolvedValue !== compoundValue) {
          isMatching = false;
          break;
        }
      } else if (propertyValue !== compoundValue) {
        // Handle string/number variant values
        isMatching = false;
        break;
      }
    }

    // Apply classes to specified slots if all conditions are met
    if (isMatching) {
      for (const slotKey of compoundSlot.slots) {
        (resolvedSlotClasses[slotKey] ??= []).push(compoundSlot.className ?? compoundSlot.class);
      }
    }
  }

  return resolvedSlotClasses;
};
