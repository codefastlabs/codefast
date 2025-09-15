import type {
  ClassValue,
  CompoundVariantWithSlots,
  ConfigSchema,
  ConfigVariants,
  SlotFunction,
  SlotFunctionProps,
  SlotSchema,
} from "@/types";

import { cx, isBooleanVariant, isSlotObject } from "@/utils";

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

  if (variants) {
    const keys = Object.keys(variants) as (keyof T)[];

    for (const key of keys) {
      const group = variants[key];
      const value = props[key];

      let valueToUse: string | undefined;

      if (value !== undefined) {
        valueToUse = String(value);
      } else if (defaultVariants[key] !== undefined) {
        const defaultValue = defaultVariants[key];

        valueToUse = String(defaultValue);
      } else if (isBooleanVariant(group)) {
        valueToUse = "false";
      }

      if (valueToUse && valueToUse in group) {
        const config = group[valueToUse];

        if (config) {
          if (isSlotObject(config)) {
            const slotVariant = config[slotKey as string];

            if (slotVariant !== undefined) {
              classes.push(slotVariant);
            }
          } else if (slotKey === "base") {
            classes.push(config);
          }
        }
      }
    }
  }

  if (compoundVariants?.length) {
    for (const compound of compoundVariants) {
      let matches = true;

      const keys = Object.keys(compound) as (keyof typeof compound)[];

      for (const key of keys) {
        if (key === "className" || key === "class") {
          continue;
        }

        if (props[key] !== compound[key]) {
          matches = false;
          break;
        }
      }

      if (matches) {
        const className = compound.className ?? compound.class;

        if (isSlotObject(className)) {
          const slotClass = className[slotKey as string];

          if (slotClass !== undefined) {
            classes.push(slotClass);
          }
        } else if (slotKey === "base") {
          classes.push(className);
        }
      }
    }
  }

  classes.push(...compoundSlotClasses);

  return classes;
};

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

  const slotKeys = Object.keys(mergedSlots) as (keyof S)[];

  for (const slotKey of slotKeys) {
    if (slotKey !== "base") {
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
