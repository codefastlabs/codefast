import type {
  ClassValue,
  CompoundSlot,
  CompoundVariant,
  ConfigSchema,
  ConfigVariants,
  SlotSchema,
} from "@/types";

import { isBooleanValue } from "@/utils";

export const applyCompoundVariants = <T extends ConfigSchema>(
  compoundVariants: readonly CompoundVariant<T>[],
  variantProps: ConfigVariants<T>,
  defaultVariants: ConfigVariants<T>,
): ClassValue[] => {
  const props = { ...defaultVariants, ...variantProps };
  const classes: ClassValue[] = [];

  for (const compound of compoundVariants) {
    let matches = true;

    const keys = Object.keys(compound) as (keyof typeof compound)[];

    for (const key of keys) {
      if (key === "className" || key === "class") {
        continue;
      }

      const propertyValue = props[key];
      const compoundValue = compound[key];

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

    if (matches) {
      classes.push(compound.className ?? compound.class);
    }
  }

  return classes;
};

export const applyCompoundSlots = <T extends ConfigSchema, S extends SlotSchema>(
  compoundSlots: readonly CompoundSlot<T, S>[] | undefined,
  variantProps: ConfigVariants<T>,
  defaultVariants: ConfigVariants<T>,
): Partial<Record<keyof S, ClassValue[]>> => {
  if (!compoundSlots?.length) {
    return {} as Partial<Record<keyof S, ClassValue[]>>;
  }

  const props = { ...defaultVariants, ...variantProps };
  const result = {} as Partial<Record<keyof S, ClassValue[]>>;

  for (const compound of compoundSlots) {
    let matches = true;

    const entries = Object.entries(compound).filter(
      ([key]) => key !== "className" && key !== "class" && key !== "slots",
    ) as [keyof T, T[keyof T][keyof T[keyof T]]][];

    for (const [key, compoundValue] of entries) {
      const propertyValue = props[key];

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

    if (matches) {
      for (const slot of compound.slots) {
        (result[slot] ??= []).push(compound.className ?? compound.class);
      }
    }
  }

  return result;
};
