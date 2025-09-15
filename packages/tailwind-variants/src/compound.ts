import type {
  ClassValue,
  CompoundSlotType,
  CompoundVariantType,
  ConfigurationSchema,
  ConfigurationVariants,
  SlotConfigurationSchema,
} from "@/types";

import { isBooleanValueType } from "@/utils";

export const applyCompoundVariantClasses = <T extends ConfigurationSchema>(
  compoundVariantGroups: readonly CompoundVariantType<T>[],
  variantProps: ConfigurationVariants<T>,
  defaultVariantProps: ConfigurationVariants<T>,
): ClassValue[] => {
  const mergedProps = { ...defaultVariantProps, ...variantProps };
  const resolvedClasses: ClassValue[] = [];

  for (const compoundVariant of compoundVariantGroups) {
    let isMatching = true;

    const compoundKeys = Object.keys(compoundVariant) as (keyof typeof compoundVariant)[];

    for (const compoundKey of compoundKeys) {
      if (compoundKey === "className" || compoundKey === "class") {
        continue;
      }

      const propertyValue = mergedProps[compoundKey];
      const compoundValue = compoundVariant[compoundKey];

      if (isBooleanValueType(compoundValue)) {
        const resolvedValue = propertyValue ?? false;

        if (resolvedValue !== compoundValue) {
          isMatching = false;
          break;
        }
      } else if (propertyValue !== compoundValue) {
        isMatching = false;
        break;
      }
    }

    if (isMatching) {
      resolvedClasses.push(compoundVariant.className ?? compoundVariant.class);
    }
  }

  return resolvedClasses;
};

export const applyCompoundSlotClasses = <
  T extends ConfigurationSchema,
  S extends SlotConfigurationSchema,
>(
  compoundSlotDefinitions: readonly CompoundSlotType<T, S>[] | undefined,
  variantProps: ConfigurationVariants<T>,
  defaultVariantProps: ConfigurationVariants<T>,
): Partial<Record<keyof S, ClassValue[]>> => {
  if (!compoundSlotDefinitions?.length) {
    return {} as Partial<Record<keyof S, ClassValue[]>>;
  }

  const mergedProps = { ...defaultVariantProps, ...variantProps };
  const resolvedSlotClasses = {} as Partial<Record<keyof S, ClassValue[]>>;

  for (const compoundSlot of compoundSlotDefinitions) {
    let isMatching = true;

    const compoundEntries = Object.entries(compoundSlot).filter(
      ([key]) => key !== "className" && key !== "class" && key !== "slots",
    );

    for (const [compoundKey, compoundValue] of compoundEntries) {
      const propertyValue = mergedProps[compoundKey];

      if (isBooleanValueType(compoundValue)) {
        const resolvedValue = propertyValue ?? false;

        if (resolvedValue !== compoundValue) {
          isMatching = false;
          break;
        }
      } else if (propertyValue !== compoundValue) {
        isMatching = false;
        break;
      }
    }

    if (isMatching) {
      for (const slotKey of compoundSlot.slots) {
        (resolvedSlotClasses[slotKey] ??= []).push(compoundSlot.className ?? compoundSlot.class);
      }
    }
  }

  return resolvedSlotClasses;
};
