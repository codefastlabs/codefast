/**
 * Slot Functions Module
 *
 * This module handles the creation and processing of slot-based component functions.
 * It provides utilities for resolving slot classes, creating slot function factories,
 * and handling slot-specific variant processing.
 */

import type {
  ClassValue,
  CompoundVariantWithSlotsType,
  ConfigurationSchema,
  ConfigurationVariants,
  SlotConfigurationSchema,
  SlotFunctionProperties,
  SlotFunctionType,
} from "@/types/types";

import { cx, isSlotObjectType } from "@/utilities/utils";

/**
 * Resolve CSS classes for a specific slot.
 *
 * This function processes variant configurations and resolves the appropriate
 * CSS classes for a specific slot, including base classes, variant classes,
 * compound variant classes, and compound slot classes.
 *
 * @typeParam T - The configuration schema type
 * @typeParam S - The slot configuration schema type
 * @param targetSlotKey - The slot key to resolve classes for
 * @param baseSlotClasses - Base CSS classes for the slot
 * @param variantGroups - Variant group configurations
 * @param slotProps - The slot properties passed to the component
 * @param variantProps - Variant properties passed to the component
 * @param defaultVariantProps - Default variant properties from configuration
 * @param compoundVariantGroups - Compound variant configurations with slots
 * @param compoundSlotClasses - Pre-computed compound slot classes
 * @returns Array of resolved CSS classes for the slot
 */
export const resolveSlotClasses = <
  T extends ConfigurationSchema,
  S extends SlotConfigurationSchema,
>(
  targetSlotKey: keyof S,
  baseSlotClasses: ClassValue,
  variantGroups: T | undefined,
  slotProps: ConfigurationVariants<T>,
  variantProps: ConfigurationVariants<T>,
  defaultVariantProps: ConfigurationVariants<T>,
  compoundVariantGroups: readonly CompoundVariantWithSlotsType<T, S>[] | undefined,
  compoundSlotClasses: ClassValue[],
): ClassValue[] => {
  // Pre-allocate with estimated size
  const estimatedSize =
    (variantGroups ? Object.keys(variantGroups).length : 0) + compoundSlotClasses.length + 5;
  const resolvedClasses: ClassValue[] = new Array(estimatedSize);
  let classIndex = 0;

  // Start with base slot classes (only if truthy)
  if (baseSlotClasses) {
    resolvedClasses[classIndex++] = baseSlotClasses;
  }

  // Process variant groups if they exist
  if (variantGroups) {
    const variantKeys = Object.keys(variantGroups);

    for (let index = 0, length = variantKeys.length; index < length; index++) {
      const variantKey = variantKeys[index];
      const variantGroup = (variantGroups as Record<string, Record<string, ClassValue>>)[
        variantKey
      ];

      // Priority: slotProps > variantProps > defaultVariantProps (no object spread needed)
      const slotValue = (slotProps as Record<string, unknown>)[variantKey];
      const variantPropertyValue = (variantProps as Record<string, unknown>)[variantKey];
      const defaultValue = (defaultVariantProps as Record<string, unknown>)[variantKey];
      const variantValue =
        slotValue === undefined
          ? variantPropertyValue === undefined
            ? defaultValue
            : variantPropertyValue
          : slotValue;

      let resolvedValue: string | undefined;

      // Resolve variant value with priority
      if (variantValue !== undefined) {
        resolvedValue =
          variantValue === true
            ? "true"
            : variantValue === false
              ? "false"
              : (variantValue as string);
      } else if ("true" in variantGroup || "false" in variantGroup) {
        // Boolean variant default
        resolvedValue = "false";
      }

      // Apply variant classes if resolved
      if (resolvedValue && resolvedValue in variantGroup) {
        const variantConfiguration = variantGroup[resolvedValue];

        if (variantConfiguration) {
          if (isSlotObjectType(variantConfiguration)) {
            // Handle slot-specific variant classes
            const slotVariantClass = variantConfiguration[targetSlotKey as string];

            if (slotVariantClass !== undefined) {
              resolvedClasses[classIndex++] = slotVariantClass;
            }
          } else if (targetSlotKey === "base") {
            // Handle base slot with non-object variant classes
            resolvedClasses[classIndex++] = variantConfiguration;
          }
        }
      }
    }
  }

  // Process compound variants with slots if they exist
  if (compoundVariantGroups && compoundVariantGroups.length > 0) {
    for (let index = 0, length = compoundVariantGroups.length; index < length; index++) {
      const compoundVariant = compoundVariantGroups[index];
      let isMatching = true;

      const compoundKeys = Object.keys(compoundVariant);

      // Check each compound variant condition
      for (let keyIndex = 0, keyLength = compoundKeys.length; keyIndex < keyLength; keyIndex++) {
        const compoundKey = compoundKeys[keyIndex];

        // Skip class properties
        if (compoundKey === "className" || compoundKey === "class") {
          continue;
        }

        // Priority: slotProps > variantProps > defaultVariantProps (no object spread needed)
        const slotValue = (slotProps as Record<string, unknown>)[compoundKey];
        const variantPropertyValue = (variantProps as Record<string, unknown>)[compoundKey];
        const defaultValue = (defaultVariantProps as Record<string, unknown>)[compoundKey];
        const mergedPropertyValue =
          slotValue === undefined
            ? variantPropertyValue === undefined
              ? defaultValue
              : variantPropertyValue
            : slotValue;

        if (mergedPropertyValue !== (compoundVariant as Record<string, unknown>)[compoundKey]) {
          isMatching = false;
          break;
        }
      }

      // Apply compound variant classes if all conditions are met
      if (isMatching) {
        const compoundClassName =
          compoundVariant.className === undefined
            ? compoundVariant.class
            : compoundVariant.className;

        if (isSlotObjectType(compoundClassName)) {
          // Handle slot-specific compound variant classes
          const slotClass = compoundClassName[targetSlotKey as string];

          if (slotClass !== undefined) {
            resolvedClasses[classIndex++] = slotClass;
          }
        } else if (targetSlotKey === "base") {
          // Handle base slot with non-object compound variant classes
          resolvedClasses[classIndex++] = compoundClassName;
        }
      }
    }
  }

  // Add pre-computed compound slot classes using for loop
  for (let index = 0, length = compoundSlotClasses.length; index < length; index++) {
    resolvedClasses[classIndex++] = compoundSlotClasses[index];
  }

  // Trim array to actual size
  resolvedClasses.length = classIndex;

  return resolvedClasses;
};

/**
 * Create a factory for slot functions.
 *
 * This function creates individual slot functions that can generate CSS classes
 * for each slot in a component. It handles base slots and named slots,
 * processing variants, compound variants, and compound slots.
 *
 * @typeParam T - The configuration schema type
 * @typeParam S - The slot configuration schema type
 * @param mergedSlotDefinitions - The merged slot definitions
 * @param mergedBaseClasses - Base CSS classes for the component
 * @param mergedVariantGroups - Merged variant group configurations
 * @param mergedDefaultVariantProps - Merged default variant properties
 * @param mergedCompoundVariantGroups - Merged compound variant configurations
 * @param compoundSlotClasses - Pre-computed compound slot classes
 * @param variantProps - Variant properties passed to the component
 * @param shouldMergeClasses - Whether to merge conflicting classes
 * @param tailwindMergeService - The Tailwind merge service function
 * @returns Object containing slot functions for each slot
 */
export const createSlotFunctionFactory = <
  T extends ConfigurationSchema,
  S extends SlotConfigurationSchema,
>(
  mergedSlotDefinitions: S,
  mergedBaseClasses: ClassValue,
  mergedVariantGroups: T,
  mergedDefaultVariantProps: ConfigurationVariants<T>,
  mergedCompoundVariantGroups: readonly CompoundVariantWithSlotsType<T, S>[] | undefined,
  compoundSlotClasses: Partial<Record<keyof S, ClassValue[]>>,
  variantProps: ConfigurationVariants<T>,
  shouldMergeClasses: boolean,
  tailwindMergeService: (classes: string) => string,
): Record<keyof S, SlotFunctionType<T>> & { base: SlotFunctionType<T> } => {
  // Initialize the slot functions object
  const slotFunctions = {} as Record<keyof S, SlotFunctionType<T>> & { base: SlotFunctionType<T> };

  // Pre-cache compound slot classes for base
  const baseCompoundSlotClasses = compoundSlotClasses.base ?? [];

  // Create the base slot function
  slotFunctions.base = (
    slotProps: SlotFunctionProperties<T> = {} as SlotFunctionProperties<T>,
  ): string | undefined => {
    const baseSlotClass =
      mergedSlotDefinitions.base === undefined ? mergedBaseClasses : mergedSlotDefinitions.base;

    // Pass variantProps and slotProps separately to avoid object spread
    const baseClasses = resolveSlotClasses(
      "base",
      baseSlotClass,
      mergedVariantGroups,
      slotProps as ConfigurationVariants<T>,
      variantProps,
      mergedDefaultVariantProps,
      mergedCompoundVariantGroups,
      baseCompoundSlotClasses,
    );

    // Build classes array without filter(Boolean)
    const slotClassName = slotProps.className;
    const slotClass = slotProps.class;
    const extraCount = (slotClassName ? 1 : 0) + (slotClass ? 1 : 0);
    const totalLength = baseClasses.length + extraCount;

    if (totalLength === 0) return;

    // Combine classes directly
    if (extraCount === 0) {
      const classString = cx(...baseClasses);

      return shouldMergeClasses ? tailwindMergeService(classString) : classString || undefined;
    }

    // Pre-allocate array with exact size
    const allClasses: ClassValue[] = new Array(totalLength);
    let classIndex = 0;

    for (let index = 0, length = baseClasses.length; index < length; index++) {
      allClasses[classIndex++] = baseClasses[index];
    }

    if (slotClassName) allClasses[classIndex++] = slotClassName;

    if (slotClass) allClasses[classIndex++] = slotClass;

    const classString = cx(...allClasses);

    return shouldMergeClasses ? tailwindMergeService(classString) : classString || undefined;
  };

  // Pre-cache slot keys and create functions for named slots
  const slotKeys = Object.keys(mergedSlotDefinitions);

  for (let index = 0, length = slotKeys.length; index < length; index++) {
    const slotKey = slotKeys[index] as keyof S;

    if (slotKey !== "base") {
      // Pre-cache slot-specific values
      const slotDefinition = mergedSlotDefinitions[slotKey];
      const slotCompoundClasses = compoundSlotClasses[slotKey] ?? [];

      (slotFunctions as Record<keyof S, SlotFunctionType<T>>)[slotKey] = (
        slotProps: SlotFunctionProperties<T> = {} as SlotFunctionProperties<T>,
      ): string | undefined => {
        const slotClasses = resolveSlotClasses(
          slotKey,
          slotDefinition,
          mergedVariantGroups,
          slotProps as ConfigurationVariants<T>,
          variantProps,
          mergedDefaultVariantProps,
          mergedCompoundVariantGroups,
          slotCompoundClasses,
        );

        // Build classes array without filter(Boolean)
        const slotClassName = slotProps.className;
        const slotClass = slotProps.class;
        const extraCount = (slotClassName ? 1 : 0) + (slotClass ? 1 : 0);
        const totalLength = slotClasses.length + extraCount;

        if (totalLength === 0) return;

        // Combine classes directly
        if (extraCount === 0) {
          const classString = cx(...slotClasses);

          return shouldMergeClasses ? tailwindMergeService(classString) : classString || undefined;
        }

        // Pre-allocate array with exact size
        const allClasses: ClassValue[] = new Array(totalLength);
        let classIndex = 0;

        for (
          let slotIndex = 0, slotLength = slotClasses.length;
          slotIndex < slotLength;
          slotIndex++
        ) {
          allClasses[classIndex++] = slotClasses[slotIndex];
        }

        if (slotClassName) allClasses[classIndex++] = slotClassName;

        if (slotClass) allClasses[classIndex++] = slotClass;

        const classString = cx(...allClasses);

        return shouldMergeClasses ? tailwindMergeService(classString) : classString || undefined;
      };
    }
  }

  return slotFunctions;
};
