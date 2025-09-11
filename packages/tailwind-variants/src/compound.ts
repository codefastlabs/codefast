import type { ClassValue } from "clsx";

import type {
  CompoundSlot,
  CompoundVariant,
  ConfigSchema,
  ConfigVariants,
  SlotSchema,
} from "./types";

import { isBooleanValue } from "./utils";

// =============================================================================
// Compound Variants Logic
// =============================================================================

/**
 * Applies compound variants based on resolved props
 * Optimized with early returns, cached resolved props, and for...of loops
 */
export const applyCompoundVariants = <T extends ConfigSchema>(
  compoundVariants: readonly CompoundVariant<T>[],
  variantProps: ConfigVariants<T>,
  defaultVariants: ConfigVariants<T>,
): ClassValue[] => {
  const resolvedProps = { ...defaultVariants, ...variantProps };
  const result: ClassValue[] = [];

  for (const compound of compoundVariants) {
    let matches = true;

    // Cache compound keys to avoid repeated Object.entries calls
    const compoundKeys = Object.keys(compound) as (keyof typeof compound)[];

    for (const key of compoundKeys) {
      if (key === "className" || key === "class") {
        continue;
      }

      const propertyValue = resolvedProps[key];
      const compoundValue = compound[key];

      // Enhanced boolean variant handling with proper type checking
      if (isBooleanValue(compoundValue)) {
        const resolvedPropertyValue = propertyValue ?? false;

        if (resolvedPropertyValue !== compoundValue) {
          matches = false;
          break;
        }
      } else if (propertyValue !== compoundValue) {
        matches = false;
        break;
      }
    }

    if (matches) {
      result.push(compound.className ?? compound.class);
    }
  }

  return result;
};

/**
 * Applies compound slots based on resolved props
 * Optimized with early returns, cached resolved props, and for...of loops
 */
export const applyCompoundSlots = <T extends ConfigSchema, S extends SlotSchema>(
  compoundSlots: readonly CompoundSlot<T, S>[] | undefined,
  variantProps: ConfigVariants<T>,
  defaultVariants: ConfigVariants<T>,
): Partial<Record<keyof S, ClassValue[]>> => {
  if (!compoundSlots?.length) {
    return {} as Partial<Record<keyof S, ClassValue[]>>;
  }

  const resolvedProps = { ...defaultVariants, ...variantProps };
  const result = {} as Partial<Record<keyof S, ClassValue[]>>;

  for (const compound of compoundSlots) {
    let matches = true;

    // Get all variant keys from the compound, excluding special keys
    const compoundEntries = Object.entries(compound).filter(
      ([key]) => key !== "className" && key !== "class" && key !== "slots",
    ) as [keyof T, T[keyof T][keyof T[keyof T]]][];

    for (const [key, compoundValue] of compoundEntries) {
      const propertyValue = resolvedProps[key];

      // Enhanced boolean variant handling with proper type checking
      if (isBooleanValue(compoundValue)) {
        const resolvedPropertyValue = propertyValue ?? false;

        if (resolvedPropertyValue !== compoundValue) {
          matches = false;
          break;
        }
      } else if (propertyValue !== compoundValue) {
        matches = false;
        break;
      }
    }

    if (matches) {
      for (const slot of compound.slots) {
        (result[slot] ??= []).push(compound.className ?? compound.class);
      }
    }
  }

  return result;
};
