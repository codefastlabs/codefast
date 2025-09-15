import type {
  ClassValue,
  CompoundVariantWithSlotsType,
  ConfigurationSchema,
  ConfigurationVariants,
  SlotConfigurationSchema,
  SlotFunctionProperties,
  SlotFunctionType,
} from "@/types";

import { cx, isBooleanVariantType, isSlotObjectType } from "@/utils";

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
  const resolvedClasses: ClassValue[] = [baseSlotClasses];
  const mergedProps = { ...defaultVariantProps, ...variantProps };

  if (variantGroups) {
    const variantKeys = Object.keys(variantGroups) as (keyof T)[];

    for (const variantKey of variantKeys) {
      const variantGroup = variantGroups[variantKey];
      const variantValue = mergedProps[variantKey];

      let resolvedValue: string | undefined;

      if (variantValue !== undefined) {
        resolvedValue = String(variantValue);
      } else if (defaultVariantProps[variantKey] !== undefined) {
        const defaultValue = defaultVariantProps[variantKey];

        resolvedValue = String(defaultValue);
      } else if (isBooleanVariantType(variantGroup)) {
        resolvedValue = "false";
      }

      if (resolvedValue && resolvedValue in variantGroup) {
        const variantConfiguration = variantGroup[resolvedValue];

        if (variantConfiguration) {
          if (isSlotObjectType(variantConfiguration)) {
            const slotVariantClass = variantConfiguration[targetSlotKey as string];

            if (slotVariantClass !== undefined) {
              resolvedClasses.push(slotVariantClass);
            }
          } else if (targetSlotKey === "base") {
            resolvedClasses.push(variantConfiguration);
          }
        }
      }
    }
  }

  if (compoundVariantGroups?.length) {
    for (const compoundVariant of compoundVariantGroups) {
      let isMatching = true;

      const compoundKeys = Object.keys(compoundVariant) as (keyof typeof compoundVariant)[];

      for (const compoundKey of compoundKeys) {
        if (compoundKey === "className" || compoundKey === "class") {
          continue;
        }

        if (mergedProps[compoundKey] !== compoundVariant[compoundKey]) {
          isMatching = false;
          break;
        }
      }

      if (isMatching) {
        const compoundClassName = compoundVariant.className ?? compoundVariant.class;

        if (isSlotObjectType(compoundClassName)) {
          const slotClass = compoundClassName[targetSlotKey as string];

          if (slotClass !== undefined) {
            resolvedClasses.push(slotClass);
          }
        } else if (targetSlotKey === "base") {
          resolvedClasses.push(compoundClassName);
        }
      }
    }
  }

  resolvedClasses.push(...compoundSlotClasses);

  return resolvedClasses;
};

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
  const slotFunctions = {} as Record<keyof S, SlotFunctionType<T>> & { base: SlotFunctionType<T> };

  slotFunctions.base = (slotProps: SlotFunctionProperties<T> = {}): string | undefined => {
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

    const allClasses = [...baseClasses, slotProps.className, slotProps.class].filter(Boolean);

    if (allClasses.length === 0) return;

    const classString = cx(...allClasses);

    return shouldMergeClasses ? tailwindMergeService(classString) : classString || undefined;
  };

  const slotKeys = Object.keys(mergedSlotDefinitions) as (keyof S)[];

  for (const slotKey of slotKeys) {
    if (slotKey !== "base") {
      (slotFunctions as Record<keyof S, SlotFunctionType<T>>)[slotKey] = (
        slotProps: SlotFunctionProperties<T> = {},
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

        const allClasses = [...slotClasses, slotProps.className, slotProps.class].filter(Boolean);

        if (allClasses.length === 0) return;

        const classString = cx(...allClasses);

        return shouldMergeClasses ? tailwindMergeService(classString) : classString || undefined;
      };
    }
  }

  return slotFunctions;
};
