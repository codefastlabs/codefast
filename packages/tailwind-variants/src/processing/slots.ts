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

import { cx, isBooleanVariantType, isSlotObjectType } from "@/utilities/utils";

/**
 * Resolve CSS classes for a specific slot.
 *
 * This function processes variant configurations and resolves the appropriate
 * CSS classes for a specific slot, including base classes, variant classes,
 * compound variant classes, and compound slot classes.
 *
 * @param targetSlotKey - The slot key to resolve classes for
 * @param baseSlotClasses - Base CSS classes for the slot
 * @param variantGroups - Variant group configurations
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
  variantProps: ConfigurationVariants<T>,
  defaultVariantProps: ConfigurationVariants<T>,
  compoundVariantGroups: readonly CompoundVariantWithSlotsType<T, S>[] | undefined,
  compoundSlotClasses: ClassValue[],
): ClassValue[] => {
  // Start with base slot classes
  const resolvedClasses: ClassValue[] = [baseSlotClasses];
  const mergedProps = { ...defaultVariantProps, ...variantProps };

  // Process variant groups if they exist
  if (variantGroups) {
    const variantKeys = Object.keys(variantGroups) as (keyof T)[];

    for (const variantKey of variantKeys) {
      const variantGroup = variantGroups[variantKey];
      const variantValue = mergedProps[variantKey];

      let resolvedValue: string | undefined;

      // Resolve variant value with priority:
      // 1. Explicit variant props
      // 2. Default variant props
      // 3. Boolean variant defaults
      if (variantValue !== undefined) {
        resolvedValue = String(variantValue);
      } else if (defaultVariantProps[variantKey] !== undefined) {
        const defaultValue = defaultVariantProps[variantKey];

        resolvedValue = String(defaultValue);
      } else if (isBooleanVariantType(variantGroup)) {
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
              resolvedClasses.push(slotVariantClass);
            }
          } else if (targetSlotKey === "base") {
            // Handle base slot with non-object variant classes
            resolvedClasses.push(variantConfiguration);
          }
        }
      }
    }
  }

  // Process compound variants with slots if they exist
  if (compoundVariantGroups?.length) {
    for (const compoundVariant of compoundVariantGroups) {
      let isMatching = true;

      const compoundKeys = Object.keys(compoundVariant) as (keyof typeof compoundVariant)[];

      // Check each compound variant condition
      for (const compoundKey of compoundKeys) {
        // Skip class properties
        if (compoundKey === "className" || compoundKey === "class") {
          continue;
        }

        if (mergedProps[compoundKey] !== compoundVariant[compoundKey]) {
          isMatching = false;
          break;
        }
      }

      // Apply compound variant classes if all conditions are met
      if (isMatching) {
        const compoundClassName = compoundVariant.className ?? compoundVariant.class;

        if (isSlotObjectType(compoundClassName)) {
          // Handle slot-specific compound variant classes
          const slotClass = compoundClassName[targetSlotKey as string];

          if (slotClass !== undefined) {
            resolvedClasses.push(slotClass);
          }
        } else if (targetSlotKey === "base") {
          // Handle base slot with non-object compound variant classes
          resolvedClasses.push(compoundClassName);
        }
      }
    }
  }

  // Add pre-computed compound slot classes
  resolvedClasses.push(...compoundSlotClasses);

  return resolvedClasses;
};

/**
 * Create a factory for slot functions.
 *
 * This function creates individual slot functions that can generate CSS classes
 * for each slot in a component. It handles base slots and named slots,
 * processing variants, compound variants, and compound slots.
 *
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
  mergedBaseClasses: ClassValue | undefined,
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

  // Create the base slot function
  slotFunctions.base = (
    slotProps: SlotFunctionProperties<T> = {} as SlotFunctionProperties<T>,
  ): string | undefined => {
    const baseSlotClass = mergedSlotDefinitions.base ?? mergedBaseClasses;
    const baseClasses = resolveSlotClasses(
      "base",
      baseSlotClass,
      mergedVariantGroups,
      { ...variantProps, ...slotProps },
      mergedDefaultVariantProps,
      mergedCompoundVariantGroups,
      compoundSlotClasses.base ?? [],
    );

    // Combine all classes including slot-specific props
    const allClasses = [...baseClasses, slotProps.className, slotProps.class].filter(Boolean);

    if (allClasses.length === 0) return;

    const classString = cx(...allClasses);

    return shouldMergeClasses ? tailwindMergeService(classString) : classString || undefined;
  };

  // Create functions for named slots
  const slotKeys = Object.keys(mergedSlotDefinitions) as (keyof S)[];

  for (const slotKey of slotKeys) {
    if (slotKey !== "base") {
      (slotFunctions as Record<keyof S, SlotFunctionType<T>>)[slotKey] = (
        slotProps: SlotFunctionProperties<T> = {} as SlotFunctionProperties<T>,
      ): string | undefined => {
        const slotClasses = resolveSlotClasses(
          slotKey,
          mergedSlotDefinitions[slotKey],
          mergedVariantGroups,
          { ...variantProps, ...slotProps },
          mergedDefaultVariantProps,
          mergedCompoundVariantGroups,
          compoundSlotClasses[slotKey] ?? [],
        );

        // Combine all classes including slot-specific props
        const allClasses = [...slotClasses, slotProps.className, slotProps.class].filter(Boolean);

        if (allClasses.length === 0) return;

        const classString = cx(...allClasses);

        return shouldMergeClasses ? tailwindMergeService(classString) : classString || undefined;
      };
    }
  }

  return slotFunctions;
};
