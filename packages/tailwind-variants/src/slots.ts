/**
 * Slot Resolution Logic
 *
 * This module handles the resolution of classes for specific slots within
 * a component, including variant processing and compound variant application.
 *
 */

import type { ClassValue } from "clsx";

import type {
  CompoundVariantWithSlots,
  ConfigSchema,
  ConfigVariants,
  SlotFunction,
  SlotFunctionProps,
  SlotSchema,
} from "@/types";

import { cx, isBooleanValue, isBooleanVariant, isSlotObject } from "@/utils";

/**
 * Resolves classes for a specific slot with optimized variant processing.
 *
 * This function processes all variants and compound variants to determine
 * which classes should be applied to a specific slot. It handles both
 * regular variants and slot-specific variants.
 *
 * @param slotKey - The slot name to resolve classes for
 * @param baseSlotClasses - Base classes for this slot
 * @param variants - Variant definitions
 * @param variantProps - Current variant properties
 * @param defaultVariants - Default variant values
 * @param compoundVariants - Compound variant definitions
 * @param compoundSlotClasses - Pre-computed compound slot classes
 * @returns Array of classes to apply to the slot
 *
 * @example
 * ```typescript
 * const classes = resolveSlotClasses(
 *   'header',
 *   'px-4 py-2',
 *   { size: { sm: { base: 'text-sm', header: 'font-normal' }, lg: { base: 'text-lg', header: 'font-bold' } } },
 *   { size: 'lg' },
 *   { size: 'sm' },
 *   [],
 *   []
 * );
 * // Returns: ['px-4 py-2', 'font-bold']
 * ```
 */
export const resolveSlotClasses = <T extends ConfigSchema, S extends SlotSchema>(
  slotKey: keyof S,
  baseSlotClasses: ClassValue,
  variants: T | undefined,
  variantProps: ConfigVariants<T>,
  defaultVariants: ConfigVariants<T>,
  compoundVariants: readonly CompoundVariantWithSlots<T, S>[] | undefined,
  compoundSlotClasses: ClassValue[],
): ClassValue[] => {
  const classes: ClassValue[] = [baseSlotClasses];
  const props = { ...defaultVariants, ...variantProps };

  // Process regular variants
  if (variants) {
    const keys = Object.keys(variants) as (keyof T)[];

    for (const key of keys) {
      const group = variants[key];
      const value = props[key];

      let valueToUse: string | undefined;

      // Determine the value to use for this variant
      if (value !== undefined) {
        valueToUse = isBooleanValue(value) ? String(value) : String(value);
      } else if (defaultVariants[key] !== undefined) {
        const defaultValue = defaultVariants[key];

        valueToUse = isBooleanValue(defaultValue) ? String(defaultValue) : String(defaultValue);
      } else if (isBooleanVariant(group)) {
        // For boolean variants without explicit value, default to false
        valueToUse = "false";
      }

      // Apply the variant if it exists
      if (valueToUse && valueToUse in group) {
        const config = group[valueToUse];

        if (config) {
          if (isSlotObject(config)) {
            // Handle slot-specific variant
            const slotVariant = config[slotKey as string];

            if (slotVariant !== undefined) {
              classes.push(slotVariant);
            }
          } else if (slotKey === "base") {
            // For base slot, apply non-object variants
            classes.push(config);
          }
        }
      }
    }
  }

  // Process compound variants
  if (compoundVariants?.length) {
    for (const compound of compoundVariants) {
      let matches = true;

      const keys = Object.keys(compound) as (keyof typeof compound)[];

      // Check if all compound conditions are met
      for (const key of keys) {
        if (key === "className" || key === "class") {
          continue;
        }

        if (props[key] !== compound[key]) {
          matches = false;
          break;
        }
      }

      // Apply compound variant if conditions match
      if (matches) {
        const className = compound.className ?? compound.class;

        if (isSlotObject(className)) {
          // Slot-specific compound variant
          const slotClass = className[slotKey as string];

          if (slotClass !== undefined) {
            classes.push(slotClass);
          }
        } else if (slotKey === "base") {
          // Base compound variant
          classes.push(className);
        }
      }
    }
  }

  // Add compound slot classes
  classes.push(...compoundSlotClasses);

  return classes;
};

/**
 * Creates slot functions with precise typing.
 *
 * This function creates individual functions for each slot in the component,
 * allowing users to apply classes to specific parts of the component.
 * Each slot function can accept additional props and will resolve the
 * appropriate classes for that slot.
 *
 * @param mergedSlots - Merged slot definitions
 * @param mergedBase - Merged base classes
 * @param mergedVariants - Merged variant definitions
 * @param mergedDefaultVariants - Merged default variant values
 * @param mergedCompoundVariants - Merged compound variant definitions
 * @param compoundSlotClasses - Pre-computed compound slot classes
 * @param variantProps - Current variant properties
 * @param shouldMerge - Whether to use tailwind-merge for class optimization
 * @param tailwindMerge - Tailwind merge function
 * @returns Object containing slot functions
 *
 * @example
 * ```typescript
 * const slotFunctions = createSlotFunctions(
 *   { base: 'px-4', header: 'font-bold', content: 'text-gray-600' },
 *   'py-2',
 *   { size: { sm: 'text-sm', lg: 'text-lg' } },
 *   { size: 'sm' },
 *   [],
 *   {},
 *   { size: 'lg' },
 *   true,
 *   twMerge
 * );
 *
 * const headerClasses = slotFunctions.header({ className: 'custom-header' });
 * // Returns: 'font-bold text-lg custom-header'
 * ```
 */
export const createSlotFunctions = <T extends ConfigSchema, S extends SlotSchema>(
  mergedSlots: S,
  mergedBase: ClassValue | undefined,
  mergedVariants: T,
  mergedDefaultVariants: ConfigVariants<T>,
  mergedCompoundVariants: readonly CompoundVariantWithSlots<T, S>[] | undefined,
  compoundSlotClasses: Partial<Record<keyof S, ClassValue[]>>,
  variantProps: ConfigVariants<T>,
  shouldMerge: boolean,
  tailwindMerge: (classes: string) => string,
): Record<keyof S, SlotFunction<T>> & { base: SlotFunction<T> } => {
  const functions = {} as Record<keyof S, SlotFunction<T>> & { base: SlotFunction<T> };

  // Create a base slot function with proper typing
  functions.base = (slotProps: SlotFunctionProps<T> = {}): string | undefined => {
    const baseSlotClass = mergedSlots.base ?? mergedBase;
    const baseClasses = resolveSlotClasses(
      "base",
      baseSlotClass,
      mergedVariants,
      { ...variantProps, ...slotProps },
      mergedDefaultVariants,
      mergedCompoundVariants,
      compoundSlotClasses.base ?? [],
    );

    const allClasses = [...baseClasses, slotProps.className, slotProps.class].filter(Boolean);

    if (allClasses.length === 0) return;

    const classString = cx(...allClasses);

    return shouldMerge ? tailwindMerge(classString) : classString || undefined;
  };

  // Create slot functions for each slot
  const slotKeys = Object.keys(mergedSlots) as (keyof S)[];

  for (const slotKey of slotKeys) {
    if (slotKey !== "base") {
      // Type assertion for dynamic slot assignment
      (functions as Record<keyof S, SlotFunction<T>>)[slotKey] = (
        slotProps: SlotFunctionProps<T> = {},
      ): string | undefined => {
        const slotClasses = resolveSlotClasses(
          slotKey,
          mergedSlots[slotKey],
          mergedVariants,
          { ...variantProps, ...slotProps },
          mergedDefaultVariants,
          mergedCompoundVariants,
          compoundSlotClasses[slotKey] ?? [],
        );

        const allClasses = [...slotClasses, slotProps.className, slotProps.class].filter(Boolean);

        if (allClasses.length === 0) return;

        const classString = cx(...allClasses);

        return shouldMerge ? tailwindMerge(classString) : classString || undefined;
      };
    }
  }

  return functions;
};
