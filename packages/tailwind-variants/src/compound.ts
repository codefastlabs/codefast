/**
 * Compound Variants Logic
 *
 * This module handles the application of compound variants, which are variants
 * that are applied when multiple conditions are met simultaneously.
 */

import type {
  ClassValue,
  CompoundSlot,
  CompoundVariant,
  ConfigSchema,
  ConfigVariants,
  SlotSchema,
} from "@/types";

import { isBooleanValue } from "@/utils";

/**
 * Apply compound variants based on resolved props.
 *
 * This function evaluates each compound variant against the current props
 * and returns the class names for variants that match all conditions.
 *
 * @param compoundVariants - Array of compound variant definitions
 * @param variantProps - Current variant properties from component props
 * @param defaultVariants - Default variant values from configuration
 * @returns Array of class names that should be applied
 *
 * @example
 * ```typescript
 * const compoundVariants = [
 *   { size: 'lg', color: 'primary', className: 'text-lg font-bold text-blue-600' },
 *   { size: 'sm', color: 'secondary', className: 'text-sm text-gray-500' }
 * ];
 *
 * const classes = applyCompoundVariants(
 *   compoundVariants,
 *   { size: 'lg', color: 'primary' },
 *   { size: 'md', color: 'default' }
 * );
 * // Returns: ['text-lg font-bold text-blue-600']
 * ```
 */
export const applyCompoundVariants = <T extends ConfigSchema>(
  compoundVariants: readonly CompoundVariant<T>[],
  variantProps: ConfigVariants<T>,
  defaultVariants: ConfigVariants<T>,
): ClassValue[] => {
  // Merge default variants with current props (props take precedence)
  const props = { ...defaultVariants, ...variantProps };
  const classes: ClassValue[] = [];

  // Iterate through each compound variant definition
  for (const compound of compoundVariants) {
    let matches = true;

    // Get all keys from the compound variant (excluding className/class)
    const keys = Object.keys(compound) as (keyof typeof compound)[];

    // Check if all conditions in the compound variant are met
    for (const key of keys) {
      // Skip className and class properties as they're not conditions
      if (key === "className" || key === "class") {
        continue;
      }

      const propertyValue = props[key];
      const compoundValue = compound[key];

      // Handle boolean variants specially
      if (isBooleanValue(compoundValue)) {
        const resolvedValue = propertyValue ?? false;

        if (resolvedValue !== compoundValue) {
          matches = false;
          break;
        }
      } else if (propertyValue !== compoundValue) {
        matches = false;
        break;
      }
    }

    // If all conditions match, add the compound variant's class
    if (matches) {
      classes.push(compound.className ?? compound.class);
    }
  }

  return classes;
};

/**
 * Apply compound slots based on resolved props.
 *
 * This function evaluates compound slot variants and applies classes to specific
 * slots when all conditions are met. Unlike regular compound variants, this
 * function targets specific slots within a component.
 *
 * @param compoundSlots - Array of compound slot definitions
 * @param variantProps - Current variant properties from component props
 * @param defaultVariants - Default variant values from configuration
 * @returns Object mapping slot names to their class arrays
 *
 * @example
 * ```typescript
 * const compoundSlots = [
 *   {
 *     size: 'lg',
 *     color: 'primary',
 *     slots: ['header', 'content'],
 *     className: 'text-lg font-bold text-blue-600'
 *   }
 * ];
 *
 * const slotClasses = applyCompoundSlots(
 *   compoundSlots,
 *   { size: 'lg', color: 'primary' },
 *   { size: 'md', color: 'default' }
 * );
 * // Returns: { header: ['text-lg font-bold text-blue-600'], content: ['text-lg font-bold text-blue-600'] }
 * ```
 */
export const applyCompoundSlots = <T extends ConfigSchema, S extends SlotSchema>(
  compoundSlots: readonly CompoundSlot<T, S>[] | undefined,
  variantProps: ConfigVariants<T>,
  defaultVariants: ConfigVariants<T>,
): Partial<Record<keyof S, ClassValue[]>> => {
  // Early return if no compound slots are defined
  if (!compoundSlots?.length) {
    return {} as Partial<Record<keyof S, ClassValue[]>>;
  }

  // Merge default variants with current props (props take precedence)
  const props = { ...defaultVariants, ...variantProps };
  const result = {} as Partial<Record<keyof S, ClassValue[]>>;

  // Iterate through each compound slot definition
  for (const compound of compoundSlots) {
    let matches = true;

    // Filter out special properties (className, class, slots) to get only condition keys
    const entries = Object.entries(compound).filter(
      ([key]) => key !== "className" && key !== "class" && key !== "slots",
    ) as [keyof T, T[keyof T][keyof T[keyof T]]][];

    // Check if all conditions in the compound slot are met
    for (const [key, compoundValue] of entries) {
      const propertyValue = props[key];

      // Handle boolean variants specially
      if (isBooleanValue(compoundValue)) {
        const resolvedValue = propertyValue ?? false;

        if (resolvedValue !== compoundValue) {
          matches = false;
          break;
        }
      } else if (propertyValue !== compoundValue) {
        matches = false;
        break;
      }
    }

    // If all conditions match, apply the class to all specified slots
    if (matches) {
      for (const slot of compound.slots) {
        (result[slot] ??= []).push(compound.className ?? compound.class);
      }
    }
  }

  return result;
};
