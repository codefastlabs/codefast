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
} from "#/types/types";

/**
 * Apply compound variant classes based on variant conditions.
 *
 * This function processes compound variants and applies their classes when
 * all specified variant conditions are met. It merges by default and provides
 * variant props to determine which compound variants should be applied.
 *
 * @typeParam T - The configuration schema type
 * @param compoundVariantGroups - Array of compound variant definitions
 * @param variantProps - Variant properties passed to the component
 * @param defaultVariantProps - Default variant properties from configuration
 * @returns Array of CSS classes from matching compound variants
 *
 * @since 0.3.16-canary.0
 */
export const applyCompoundVariantClasses = <T extends ConfigurationSchema>(
  compoundVariantGroups: readonly CompoundVariantType<T>[],
  variantProps: ConfigurationVariants<T>,
  defaultVariantProps: ConfigurationVariants<T>,
): ClassValue[] => {
  const groupLength = compoundVariantGroups.length;

  // Early return for empty or no compound variants
  if (groupLength === 0) {
    return [];
  }

  // Pre-allocate with reasonable estimate
  const resolvedClasses: ClassValue[] = [];

  // Process each compound variant
  for (let index = 0; index < groupLength; index++) {
    const compoundVariant = compoundVariantGroups[index];
    if (compoundVariant === undefined) {
      continue;
    }
    let isMatching = true;

    const compoundKeys = Object.keys(compoundVariant);

    // Check each variant condition
    for (let keyIndex = 0, keyLength = compoundKeys.length; keyIndex < keyLength; keyIndex++) {
      const rawKey = compoundKeys[keyIndex];
      if (rawKey === undefined) {
        continue;
      }
      const compoundKey = rawKey as keyof typeof compoundVariant;

      // Skip class properties
      if (compoundKey === "className" || compoundKey === "class") {
        continue;
      }

      // Get property value - use nullish coalescing (faster than ternary)
      const propertyInput = variantProps[compoundKey];
      const propertyValue = propertyInput ?? defaultVariantProps[compoundKey];

      const compoundValue = compoundVariant[compoundKey];

      // Inline boolean check - avoid function call overhead
      if (typeof compoundValue === "boolean") {
        const resolvedValue = propertyValue ?? false;

        if (resolvedValue !== compoundValue) {
          isMatching = false;
          break;
        }
      } else if (Array.isArray(compoundValue)) {
        // Handle array variant values - check if propertyValue is included in the array
        if (!compoundValue.includes(propertyValue as string)) {
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
      const cls = compoundVariant.className;

      resolvedClasses.push(cls === undefined ? compoundVariant.class : cls);
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
 * @typeParam T - The configuration schema type
 * @typeParam S - The slot configuration schema type
 * @param compoundSlotDefinitions - Array of compound slot definitions
 * @param variantProps - Variant properties passed to the component
 * @param defaultVariantProps - Default variant properties from configuration
 * @returns Object mapping slot names to arrays of CSS classes
 *
 * @since 0.3.16-canary.0
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
  if (!compoundSlotDefinitions || compoundSlotDefinitions.length === 0) {
    return {} as Partial<Record<keyof S, ClassValue[]>>;
  }

  const resolvedSlotClasses = {} as Partial<Record<keyof S, ClassValue[]>>;

  // Process each compound slot definition
  const definitionLength = compoundSlotDefinitions.length;

  for (let index = 0; index < definitionLength; index++) {
    const compoundSlot = compoundSlotDefinitions[index];
    if (compoundSlot === undefined) {
      continue;
    }
    let isMatching = true;

    const keys = Object.keys(compoundSlot);
    const keyLength = keys.length;

    // Check each variant condition
    for (let keyIndex = 0; keyIndex < keyLength; keyIndex++) {
      const compoundKey = keys[keyIndex];
      if (compoundKey === undefined) {
        continue;
      }

      // Skip class and slot properties
      if (compoundKey === "className" || compoundKey === "class" || compoundKey === "slots") {
        continue;
      }

      // Lookup without object spread - check variantProps first, then defaultVariantProps
      const propsValue = (variantProps as Record<string, unknown>)[compoundKey];
      const propertyValue =
        propsValue === undefined
          ? (defaultVariantProps as Record<string, unknown>)[compoundKey]
          : propsValue;

      const compoundValue = (compoundSlot as Record<string, unknown>)[compoundKey];

      // Inline boolean check - avoid function call overhead
      if (typeof compoundValue === "boolean") {
        const resolvedValue = propertyValue === undefined ? false : propertyValue;

        if (resolvedValue !== compoundValue) {
          isMatching = false;
          break;
        }
      } else if (Array.isArray(compoundValue)) {
        // Handle array variant values - check if propertyValue is included in the array
        if (!compoundValue.includes(propertyValue as string)) {
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
      const slots = compoundSlot.slots;
      const slotLength = slots.length;
      const cls =
        compoundSlot.className === undefined ? compoundSlot.class : compoundSlot.className;

      for (let slotIndex = 0; slotIndex < slotLength; slotIndex++) {
        const slotKey = slots[slotIndex];
        if (slotKey === undefined) {
          continue;
        }
        const existing = resolvedSlotClasses[slotKey];

        if (existing) {
          existing.push(cls);
        } else {
          resolvedSlotClasses[slotKey] = [cls];
        }
      }
    }
  }

  return resolvedSlotClasses;
};
