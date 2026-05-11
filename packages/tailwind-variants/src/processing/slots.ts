/**
 * Slot Functions Module
 *
 * This module handles the creation and processing of slot-based component functions.
 * It provides utilities for resolving slot classes, creating slot function factories,
 * and handling slot-specific variant processing.
 */

import type {
  ClassValue,
  SlotCompoundVariant,
  VariantSchema,
  VariantSelection,
  SlotSchema,
  SlotResolverProps,
  SlotClassResolver,
} from "#/types/api";

import { cx, isSlotClassMap } from "#/utilities/utils";

import { getCompoundClass, matchesCompoundDefinition } from "./compound";

const composeSlotClassName = <T extends VariantSchema>(
  classes: Array<ClassValue>,
  slotProps: SlotResolverProps<T>,
  shouldMergeClasses: boolean,
  tailwindMergeFn: (classes: string) => string,
): string | undefined => {
  const slotClassName = slotProps.className;
  const slotClass = slotProps.class;
  const extraCount = (slotClassName ? 1 : 0) + (slotClass ? 1 : 0);
  const totalLength = classes.length + extraCount;

  if (totalLength === 0) {
    return;
  }

  if (extraCount === 0) {
    const classString = cx(...classes);

    return shouldMergeClasses ? tailwindMergeFn(classString) : classString || undefined;
  }

  const allClasses: Array<ClassValue> = new Array(totalLength);
  let classIndex = 0;

  for (let index = 0, length = classes.length; index < length; index++) {
    allClasses[classIndex++] = classes[index];
  }

  if (slotClassName) {
    allClasses[classIndex++] = slotClassName;
  }

  if (slotClass) {
    allClasses[classIndex++] = slotClass;
  }

  allClasses.length = classIndex;

  const classString = cx(...allClasses);

  return shouldMergeClasses ? tailwindMergeFn(classString) : classString || undefined;
};

/**
 * Resolve CSS classes for a specific slot.
 *
 * This function processes variant configurations and resolves the appropriate
 * CSS classes for a specific slot, including base classes, variant classes,
 * compound variant classes, and compound slot classes.
 *
 * @typeParam T - The configuration schema type
 * @typeParam S - The slot configuration schema type
 * @param targetSlotKey - The slot key to resolve classes for
 * @param baseSlotClasses - Base CSS classes for the slot
 * @param variantGroups - Variant group configurations
 * @param variantKeys - Cached variant keys from the variant configuration
 * @param slotProps - The slot properties passed to the component
 * @param variantProps - Variant properties passed to the component
 * @param defaultVariantProps - Default variant properties from configuration
 * @param precomputedDefaults - Pre-computed default variant values
 * @param compoundVariantGroups - Compound variant configurations with slots
 * @param compoundSlotClasses - Pre-computed compound slot classes
 * @returns Array of resolved CSS classes for the slot
 *
 * @since 0.3.16-canary.0
 */
export const resolveSlotClasses = <T extends VariantSchema, S extends SlotSchema>(
  targetSlotKey: keyof S,
  baseSlotClasses: ClassValue,
  variantGroups: T | undefined,
  variantKeys: Array<keyof T>,
  slotProps: VariantSelection<T>,
  variantProps: VariantSelection<T>,
  defaultVariantProps: VariantSelection<T>,
  precomputedDefaults: Record<string, string>,
  compoundVariantGroups: ReadonlyArray<SlotCompoundVariant<T, S>> | undefined,
  compoundSlotClasses: Array<ClassValue>,
): Array<ClassValue> => {
  const estimatedSize =
    variantKeys.length + compoundSlotClasses.length + (compoundVariantGroups?.length ?? 0) + 5;
  const resolvedClasses: Array<ClassValue> = new Array(estimatedSize);
  let classIndex = 0;

  if (baseSlotClasses) {
    resolvedClasses[classIndex++] = baseSlotClasses;
  }

  if (variantGroups && variantKeys.length > 0) {
    const slotPropsRecord = slotProps as Record<string, unknown>;
    const variantPropsRecord = variantProps as Record<string, unknown>;

    for (let index = 0, length = variantKeys.length; index < length; index++) {
      const variantKey = variantKeys[index];
      if (variantKey === undefined) {
        continue;
      }
      const variantGroup = variantGroups[variantKey] as Record<string, ClassValue> | undefined;
      if (variantGroup === undefined) {
        continue;
      }

      const variantKeyString = variantKey as string;
      const slotValue = slotPropsRecord[variantKeyString];
      const variantValue = variantPropsRecord[variantKeyString];
      const resolvedValue =
        slotValue !== undefined
          ? slotValue === true
            ? "true"
            : slotValue === false
              ? "false"
              : (slotValue as string)
          : variantValue === undefined
            ? precomputedDefaults[variantKeyString]
            : variantValue === true
              ? "true"
              : variantValue === false
                ? "false"
                : (variantValue as string);

      if (resolvedValue && resolvedValue in variantGroup) {
        const variantConfiguration = variantGroup[resolvedValue];

        if (variantConfiguration) {
          if (isSlotClassMap(variantConfiguration)) {
            const slotVariantClass = variantConfiguration[targetSlotKey as string];

            if (slotVariantClass !== undefined) {
              resolvedClasses[classIndex++] = slotVariantClass;
            }
          } else if (targetSlotKey === "base") {
            resolvedClasses[classIndex++] = variantConfiguration;
          }
        }
      }
    }
  }

  if (compoundVariantGroups && compoundVariantGroups.length > 0) {
    const compoundMatchOptions = {
      coerceMissingBoolean: false,
      slotProps: slotProps as Record<string, unknown>,
    };

    for (let index = 0, length = compoundVariantGroups.length; index < length; index++) {
      const compoundVariant = compoundVariantGroups[index];
      if (compoundVariant === undefined) {
        continue;
      }

      if (
        matchesCompoundDefinition(
          compoundVariant as Record<string, unknown>,
          variantProps as Record<string, unknown>,
          defaultVariantProps as Record<string, unknown>,
          compoundMatchOptions,
        )
      ) {
        const compoundClassName = getCompoundClass(compoundVariant);

        if (isSlotClassMap(compoundClassName)) {
          const slotClass = compoundClassName[targetSlotKey as string];

          if (slotClass !== undefined) {
            resolvedClasses[classIndex++] = slotClass;
          }
        } else if (targetSlotKey === "base") {
          resolvedClasses[classIndex++] = compoundClassName;
        }
      }
    }
  }

  for (let index = 0, length = compoundSlotClasses.length; index < length; index++) {
    const slotClass = compoundSlotClasses[index];
    if (slotClass !== undefined) {
      resolvedClasses[classIndex++] = slotClass;
    }
  }

  resolvedClasses.length = classIndex;

  return resolvedClasses;
};

/**
 * Create slot class resolvers.
 *
 * This function creates individual slot functions that can generate CSS classes
 * for each slot in a component. It handles base slots and named slots,
 * processing variants, compound variants, and compound slots.
 *
 * @typeParam T - The configuration schema type
 * @typeParam S - The slot configuration schema type
 * @param mergedSlotDefinitions - The merged slot definitions
 * @param mergedBaseClasses - Base CSS classes for the component
 * @param mergedVariantGroups - Merged variant group configurations
 * @param mergedDefaultVariantProps - Merged default variant properties
 * @param mergedCompoundVariantGroups - Merged compound variant configurations
 * @param compoundSlotClasses - Pre-computed compound slot classes
 * @param variantProps - Variant properties passed to the component
 * @param shouldMergeClasses - Whether to merge conflicting classes
 * @param tailwindMergeFn - The Tailwind merge function function
 * @returns Object containing slot functions for each slot
 *
 * @since 0.3.16-canary.0
 */
export const createSlotResolvers = <T extends VariantSchema, S extends SlotSchema>(
  mergedSlotDefinitions: S,
  mergedBaseClasses: ClassValue,
  mergedVariantGroups: T,
  cachedVariantKeys: Array<keyof T>,
  mergedDefaultVariantProps: VariantSelection<T>,
  precomputedDefaults: Record<string, string>,
  mergedCompoundVariantGroups: ReadonlyArray<SlotCompoundVariant<T, S>> | undefined,
  compoundSlotClasses: Partial<Record<keyof S, Array<ClassValue>>>,
  variantProps: VariantSelection<T>,
  shouldMergeClasses: boolean,
  tailwindMergeFn: (classes: string) => string,
): Record<keyof S, SlotClassResolver<T>> & { base: SlotClassResolver<T> } => {
  const slotFunctions = {} as Record<keyof S, SlotClassResolver<T>> & {
    base: SlotClassResolver<T>;
  };
  const baseCompoundSlotClasses = compoundSlotClasses.base ?? [];

  slotFunctions.base = (
    slotProps: SlotResolverProps<T> = {} as SlotResolverProps<T>,
  ): string | undefined => {
    const baseSlotClass =
      mergedSlotDefinitions.base === undefined ? mergedBaseClasses : mergedSlotDefinitions.base;

    const baseClasses = resolveSlotClasses(
      "base",
      baseSlotClass,
      mergedVariantGroups,
      cachedVariantKeys,
      slotProps as VariantSelection<T>,
      variantProps,
      mergedDefaultVariantProps,
      precomputedDefaults,
      mergedCompoundVariantGroups,
      baseCompoundSlotClasses,
    );

    return composeSlotClassName(baseClasses, slotProps, shouldMergeClasses, tailwindMergeFn);
  };

  const slotKeys = Object.keys(mergedSlotDefinitions);

  for (let index = 0, length = slotKeys.length; index < length; index++) {
    const rawSlotKey = slotKeys[index];
    if (rawSlotKey === undefined) {
      continue;
    }
    const slotKey = rawSlotKey as keyof S;

    if (slotKey !== "base") {
      const slotDefinition = mergedSlotDefinitions[slotKey];
      const slotCompoundClasses = compoundSlotClasses[slotKey] ?? [];

      (slotFunctions as Record<keyof S, SlotClassResolver<T>>)[slotKey] = (
        slotProps: SlotResolverProps<T> = {} as SlotResolverProps<T>,
      ): string | undefined => {
        const slotClasses = resolveSlotClasses(
          slotKey,
          slotDefinition,
          mergedVariantGroups,
          cachedVariantKeys,
          slotProps as VariantSelection<T>,
          variantProps,
          mergedDefaultVariantProps,
          precomputedDefaults,
          mergedCompoundVariantGroups,
          slotCompoundClasses,
        );

        return composeSlotClassName(slotClasses, slotProps, shouldMergeClasses, tailwindMergeFn);
      };
    }
  }

  return slotFunctions;
};
