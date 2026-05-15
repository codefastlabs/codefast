/**
 * Compound Variants Processing Module
 *
 * This module handles the processing of compound variants and compound slots.
 * It provides functions to apply compound variant classes based on
 * multiple variant conditions being met simultaneously.
 */

import type {
  ClassValue,
  CompoundSlot,
  CompoundVariant,
  VariantSchema,
  VariantSelection,
  SlotSchema,
} from "#/types/api";

type CompoundDefinition = Record<string, unknown>;

type CompoundMatchOptions = {
  readonly coerceMissingBoolean?: boolean;
  readonly slotProps?: Record<string, unknown>;
  readonly skipSlots?: boolean;
};

/**
 * @since 0.3.16-canary.2
 */
export const matchesCompoundDefinition = (
  compoundDefinition: CompoundDefinition,
  variantProps: Record<string, unknown>,
  defaultVariantProps: Record<string, unknown>,
  options?: CompoundMatchOptions,
): boolean => {
  const skipSlots = options?.skipSlots ?? false;
  const slotProps = options?.slotProps;
  const coerceMissingBoolean = options?.coerceMissingBoolean ?? true;
  const compoundKeys = Object.keys(compoundDefinition);

  for (let index = 0, length = compoundKeys.length; index < length; index++) {
    const compoundKey = compoundKeys[index];
    if (compoundKey === undefined) {
      continue;
    }

    if (
      compoundKey === "className" ||
      compoundKey === "class" ||
      (skipSlots && compoundKey === "slots")
    ) {
      continue;
    }

    const slotValue = slotProps?.[compoundKey];
    const propValue = slotValue === undefined ? variantProps[compoundKey] : slotValue;
    const propertyValue = propValue === undefined ? defaultVariantProps[compoundKey] : propValue;
    const compoundValue = compoundDefinition[compoundKey];

    if (typeof compoundValue === "boolean") {
      const resolvedValue =
        propertyValue === undefined && coerceMissingBoolean ? false : propertyValue;

      if (resolvedValue !== compoundValue) {
        return false;
      }
    } else if (Array.isArray(compoundValue)) {
      if (!compoundValue.includes(propertyValue)) {
        return false;
      }
    } else if (propertyValue !== compoundValue) {
      return false;
    }
  }

  return true;
};

/**
 * @since 0.3.16-canary.2
 */
export const getCompoundClass = (compoundDefinition: {
  readonly class?: ClassValue;
  readonly className?: ClassValue;
}): ClassValue => {
  return compoundDefinition.className === undefined
    ? compoundDefinition.class
    : compoundDefinition.className;
};

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
export const resolveCompoundVariantClasses = <T extends VariantSchema>(
  compoundVariantGroups: ReadonlyArray<CompoundVariant<T>>,
  variantProps: VariantSelection<T>,
  defaultVariantProps: VariantSelection<T>,
): Array<ClassValue> => {
  const groupLength = compoundVariantGroups.length;

  if (groupLength === 0) {
    return [];
  }

  const resolvedClasses: Array<ClassValue> = [];

  for (let index = 0; index < groupLength; index++) {
    const compoundVariant = compoundVariantGroups[index];
    if (compoundVariant === undefined) {
      continue;
    }

    if (
      matchesCompoundDefinition(
        compoundVariant as CompoundDefinition,
        variantProps as Record<string, unknown>,
        defaultVariantProps as Record<string, unknown>,
      )
    ) {
      resolvedClasses.push(getCompoundClass(compoundVariant));
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
export const resolveCompoundSlotClasses = <T extends VariantSchema, S extends SlotSchema>(
  compoundSlotDefinitions: ReadonlyArray<CompoundSlot<T, S>> | undefined,
  variantProps: VariantSelection<T>,
  defaultVariantProps: VariantSelection<T>,
): Partial<Record<keyof S, Array<ClassValue>>> => {
  if (!compoundSlotDefinitions || compoundSlotDefinitions.length === 0) {
    return {} as Partial<Record<keyof S, Array<ClassValue>>>;
  }

  const resolvedSlotClasses = {} as Partial<Record<keyof S, Array<ClassValue>>>;

  for (let index = 0, length = compoundSlotDefinitions.length; index < length; index++) {
    const compoundSlot = compoundSlotDefinitions[index];
    if (compoundSlot === undefined) {
      continue;
    }

    if (
      matchesCompoundDefinition(
        compoundSlot as CompoundDefinition,
        variantProps as Record<string, unknown>,
        defaultVariantProps as Record<string, unknown>,
        { skipSlots: true },
      )
    ) {
      const compoundClass = getCompoundClass(compoundSlot);

      const slots = compoundSlot.slots;

      for (let slotIndex = 0, slotLength = slots.length; slotIndex < slotLength; slotIndex++) {
        const slotKey = slots[slotIndex];
        if (slotKey === undefined) {
          continue;
        }
        const existing = resolvedSlotClasses[slotKey];

        if (existing) {
          existing.push(compoundClass);
        } else {
          resolvedSlotClasses[slotKey] = [compoundClass];
        }
      }
    }
  }

  return resolvedSlotClasses;
};
