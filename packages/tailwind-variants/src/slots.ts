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

// =============================================================================
// Slot Resolution Logic
// =============================================================================

/**
 * Resolves classes for a specific slot with optimized variant processing
 * Uses cached resolved props and for...of loops for better performance
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
  const resolvedProps = { ...defaultVariants, ...variantProps };

  // Apply variant classes with optimized iteration
  if (variants) {
    const variantKeys = Object.keys(variants) as (keyof T)[];

    for (const variantKey of variantKeys) {
      const variantGroup = variants[variantKey];
      const variantValue = resolvedProps[variantKey];

      // Enhanced value resolution with proper boolean handling
      let valueToUse: string | undefined;

      if (variantValue !== undefined) {
        valueToUse = isBooleanValue(variantValue) ? String(variantValue) : String(variantValue);
      } else if (defaultVariants[variantKey] !== undefined) {
        const defaultValue = defaultVariants[variantKey];

        valueToUse = isBooleanValue(defaultValue) ? String(defaultValue) : String(defaultValue);
      } else if (isBooleanVariant(variantGroup)) {
        // For boolean variants without explicit value, default to false
        valueToUse = "false";
      }

      if (valueToUse && valueToUse in variantGroup) {
        const variantConfig = variantGroup[valueToUse];

        if (variantConfig) {
          if (isSlotObject(variantConfig)) {
            // Handle slot-specific variant
            const slotVariant = variantConfig[slotKey as string];

            if (slotVariant !== undefined) {
              classes.push(slotVariant);
            }
          } else if (slotKey === "base") {
            // For base slot, apply non-object variants
            classes.push(variantConfig);
          }
        }
      }
    }
  }

  // Apply compound variants with optimized matching
  if (compoundVariants?.length) {
    for (const compound of compoundVariants) {
      let matches = true;

      // Cache compound keys to avoid repeated Object.entries calls
      const compoundKeys = Object.keys(compound) as (keyof typeof compound)[];

      for (const key of compoundKeys) {
        if (key === "className" || key === "class") {
          continue;
        }

        if (resolvedProps[key] !== compound[key]) {
          matches = false;
          break;
        }
      }

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

// =============================================================================
// Slot Functions Creation
// =============================================================================

/**
 * Creates slot functions with precise typing
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
  const slotFunctions = {} as Record<keyof S, SlotFunction<T>> & { base: SlotFunction<T> };

  // Create a base slot function with proper typing
  slotFunctions.base = (slotProps: SlotFunctionProps<T> = {}): string | undefined => {
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

  // Create slot functions
  const slotKeys = Object.keys(mergedSlots) as (keyof S)[];

  for (const slotKey of slotKeys) {
    if (slotKey !== "base") {
      // Type assertion for dynamic slot assignment
      (slotFunctions as Record<keyof S, SlotFunction<T>>)[slotKey] = (
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

  return slotFunctions;
};
