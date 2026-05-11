/**
 * Tailwind Variants Core Implementation
 *
 * This module contains the main implementation of the Tailwind Variants system.
 * It provides functions to create variant-based styling functions with support
 * for slots, compound variants, and configuration merging.
 */

import type {
  ClassValue,
  CompoundVariant,
  SlotCompoundVariant,
  VariantConfig,
  VariantSchema,
  VariantSelection,
  SlotVariantConfig,
  ExtendedVariantConfig,
  MergedVariantSchema,
  MergedSlotSchema,
  SlotSchema,
  TailwindVariantsOptions,
  TailwindVariantsApi,
  VariantResolverResult,
  VariantResolver,
} from "#/types/api";

import { mergeVariantConfigs } from "#/core/config";
import { resolveCompoundSlotClasses, resolveCompoundVariantClasses } from "#/processing/compound";
import { createSlotResolvers } from "#/processing/slots";
import {
  createTailwindMergeFn,
  cx,
  hasExtendConfig,
  hasSlotsConfig,
  hasBooleanVariantValues,
} from "#/utilities/utils";

/**
 * Resolve classes for components without slots.
 *
 * This function processes variant configurations and resolves the appropriate
 * CSS classes based on the provided variant props and default values.
 *
 * @typeParam T - The configuration schema type
 * @param mergedBaseClasses - The base CSS classes to apply
 * @param mergedVariantGroups - The variant group configurations
 * @param mergedDefaultVariantProps - Default variant property values
 * @param mergedCompoundVariantGroups - Compound variant configurations
 * @param variantProps - The variant properties passed to the component
 * @param customClassName - Additional custom CSS classes
 * @param shouldMergeClasses - Whether to merge conflicting classes
 * @param tailwindMergeFn - The Tailwind merge function function
 * @param cachedVariantKeys - Pre-computed variant keys for performance optimization
 * @param precomputedDefaults - Pre-computed default variant values
 * @returns The resolved CSS class string or undefined
 */
const resolveVariantClasses = <T extends VariantSchema>(
  mergedBaseClasses: ClassValue,
  mergedVariantGroups: T,
  mergedDefaultVariantProps: VariantSelection<T>,
  mergedCompoundVariantGroups: ReadonlyArray<CompoundVariant<T>> | undefined,
  variantProps: VariantSelection<T>,
  customClassName: ClassValue,
  shouldMergeClasses: boolean,
  tailwindMergeFn: (classes: string) => string,
  cachedVariantKeys: Array<keyof T>,
  precomputedDefaults: Record<string, string>,
): string | undefined => {
  const estimatedSize = cachedVariantKeys.length + (mergedCompoundVariantGroups?.length ?? 0) + 2;
  const resolvedClasses: Array<ClassValue> = new Array(estimatedSize);
  let classIndex = 0;

  if (mergedBaseClasses) {
    resolvedClasses[classIndex++] = mergedBaseClasses;
  }

  for (let index = 0, length = cachedVariantKeys.length; index < length; index++) {
    const variantKey = cachedVariantKeys[index];
    if (variantKey === undefined) {
      continue;
    }
    const variantGroup = mergedVariantGroups[variantKey];
    if (variantGroup === undefined) {
      continue;
    }
    const variantValue = variantProps[variantKey];

    let resolvedValue: string | undefined;

    // Resolve the variant value based on priority:
    // 1. Explicit variant props
    // 2. Pre-computed default (includes boolean variant defaults)
    if (variantValue === undefined) {
      resolvedValue = precomputedDefaults[variantKey as string];
    } else {
      // Fast path for boolean values - avoid String() call
      resolvedValue =
        variantValue === true
          ? "true"
          : variantValue === false
            ? "false"
            : (variantValue as string);
    }

    // Add the resolved variant class if it exists
    if (resolvedValue !== undefined) {
      const variantClass = variantGroup[resolvedValue];

      if (variantClass) {
        resolvedClasses[classIndex++] = variantClass;
      }
    }
  }

  if (mergedCompoundVariantGroups) {
    const compoundVariantClasses = resolveCompoundVariantClasses(
      mergedCompoundVariantGroups,
      variantProps,
      mergedDefaultVariantProps,
    );

    for (let index = 0, length = compoundVariantClasses.length; index < length; index++) {
      const compoundClass = compoundVariantClasses[index];
      if (compoundClass !== undefined) {
        resolvedClasses[classIndex++] = compoundClass;
      }
    }
  }

  if (customClassName) {
    resolvedClasses[classIndex++] = customClassName;
  }

  if (classIndex === 0) {
    return;
  }

  resolvedClasses.length = classIndex;

  const classString = cx(...resolvedClasses);

  return shouldMergeClasses ? tailwindMergeFn(classString) : classString || undefined;
};

/**
 * Create a Tailwind Variants function for regular components.
 *
 * This function creates a variant-based styling function for components
 * that don't use slots. It provides type-safe variant handling with
 * support for compound variants and configuration merging.
 *
 * @typeParam T - The configuration schema type
 * @param config - The variant configuration object
 * @param tvConfig - Optional Tailwind Variants configuration
 * @returns A variant function for the component
 *
 * @since 0.3.16-canary.0
 */
export function tv<T extends VariantSchema>(
  config: VariantConfig<T>,
  tvConfig?: TailwindVariantsOptions,
): VariantResolver<T, Record<string, never>>;

/**
 * Create a Tailwind Variants function for slot-based components.
 *
 * This overload creates a variant function for components that use slots
 * but don't have regular variants. It provides type-safe slot handling.
 *
 * @typeParam S - The slot configuration schema type
 * @param config - The slot configuration object
 * @param tvConfig - Optional Tailwind Variants configuration
 * @returns A variant function with slot support
 *
 * @since 0.3.16-canary.0
 */
export function tv<S extends SlotSchema>(
  config: SlotVariantConfig<Record<string, never>, S>,
  tvConfig?: TailwindVariantsOptions,
): VariantResolver<Record<string, never>, S>;

/**
 * Create a Tailwind Variants function for components with both variants and slots.
 *
 * This overload creates a variant function for components that have both
 * regular variants and slots. It provides full type safety for both systems.
 *
 * @typeParam T - The configuration schema type
 * @typeParam S - The slot configuration schema type
 * @param config - The configuration object with variants and slots
 * @param tvConfig - Optional Tailwind Variants configuration
 * @returns A variant function with full variant and slot support
 *
 * @since 0.3.16-canary.0
 */
export function tv<T extends VariantSchema, S extends SlotSchema>(
  config: SlotVariantConfig<T, S>,
  tvConfig?: TailwindVariantsOptions,
): VariantResolver<T, S>;

/**
 * Create a Tailwind Variants function with configuration extension.
 *
 * This overload creates a variant function that extends an existing
 * configuration with additional variants and slots. It merges the
 * base and extension configurations automatically.
 *
 * @typeParam TBase - The base configuration schema type
 * @typeParam TExtension - The extension configuration schema type
 * @typeParam SBase - The base slot configuration schema type
 * @typeParam SExtension - The extension slot configuration schema type
 * @param config - The extended configuration object
 * @param tvConfig - Optional Tailwind Variants configuration
 * @returns A variant function with merged configurations
 *
 * @since 0.3.16-canary.0
 */
export function tv<
  TBase extends VariantSchema,
  TExtension extends VariantSchema,
  SBase extends SlotSchema,
  SExtension extends SlotSchema,
>(
  config: ExtendedVariantConfig<TBase, TExtension, SBase, SExtension>,
  tvConfig?: TailwindVariantsOptions,
): VariantResolver<MergedVariantSchema<TBase, TExtension>, MergedSlotSchema<SBase, SExtension>>;

/**
 * Main Tailwind Variants function implementation.
 *
 * This is the core implementation that handles all variant function creation.
 * It processes the configuration, merges extended configurations if needed,
 * and returns a fully configured variant function.
 *
 * @typeParam T - The configuration schema type
 * @typeParam S - The slot configuration schema type
 * @param configuration - The variant configuration
 * @param tvConfiguration - Tailwind Variants configuration options
 * @returns A configured variant function
 *
 * @since 0.3.16-canary.0
 */
export function tv<T extends VariantSchema, S extends SlotSchema>(
  configuration:
    | VariantConfig<T>
    | SlotVariantConfig<T, S>
    | ExtendedVariantConfig<VariantSchema, T, SlotSchema, S>,
  tvConfiguration: TailwindVariantsOptions = {},
): VariantResolver<T, S> {
  const { twMerge: shouldMergeClasses = true, twMergeConfig } = tvConfiguration;
  const tailwindMergeFn = createTailwindMergeFn(twMergeConfig);

  const mergedConfiguration:
    | VariantConfig<VariantSchema>
    | SlotVariantConfig<VariantSchema, SlotSchema> = hasExtendConfig(configuration)
    ? mergeVariantConfigs(
        configuration.extend.config,
        configuration as
          | VariantConfig<VariantSchema>
          | SlotVariantConfig<VariantSchema, SlotSchema>,
      )
    : (configuration as
        | VariantConfig<VariantSchema>
        | SlotVariantConfig<VariantSchema, SlotSchema>);

  const mergedBaseClasses = mergedConfiguration.base;
  const mergedSlotDefinitions = hasSlotsConfig(mergedConfiguration)
    ? mergedConfiguration.slots
    : undefined;
  const mergedVariantGroups = mergedConfiguration.variants ?? ({} as T);
  const mergedDefaultVariantProps =
    mergedConfiguration.defaultVariants ?? ({} as VariantSelection<T>);
  const mergedCompoundVariantGroups = mergedConfiguration.compoundVariants;

  const cachedVariantKeys = Object.keys(mergedVariantGroups) as Array<keyof T>;

  const precomputedDefaults: Record<string, string> = {};

  for (let index = 0, length = cachedVariantKeys.length; index < length; index++) {
    const key = cachedVariantKeys[index];
    if (key === undefined) {
      continue;
    }
    const keyString = key as string;
    const defaultValue = (mergedDefaultVariantProps as Record<string, unknown>)[keyString];
    const variantGroup = (mergedVariantGroups as Record<string, Record<string, unknown>>)[
      keyString
    ];

    if (defaultValue !== undefined) {
      precomputedDefaults[keyString] =
        defaultValue === true
          ? "true"
          : defaultValue === false
            ? "false"
            : (defaultValue as string);
    } else if (variantGroup !== undefined && hasBooleanVariantValues(variantGroup)) {
      precomputedDefaults[keyString] = "false";
    }
  }

  if (
    mergedConfiguration.compoundVariants &&
    !Array.isArray(mergedConfiguration.compoundVariants)
  ) {
    throw new Error("compoundVariants must be an array");
  }

  const variantResolverFunction = (
    variantProps: VariantSelection<T> = {},
  ): S extends Record<string, never> ? string | undefined : VariantResolverResult<T, S> => {
    const classProperty = variantProps.class;
    const className = variantProps.className;
    const resolvedVariantProps = variantProps;

    if (mergedSlotDefinitions) {
      const compoundSlotClasses = resolveCompoundSlotClasses(
        hasSlotsConfig(mergedConfiguration) ? mergedConfiguration.compoundSlots : undefined,
        resolvedVariantProps as VariantSelection<VariantSchema>,
        mergedDefaultVariantProps as VariantSelection<VariantSchema>,
      );

      return createSlotResolvers(
        mergedSlotDefinitions,
        mergedBaseClasses,
        mergedVariantGroups,
        cachedVariantKeys as Array<keyof VariantSchema>,
        mergedDefaultVariantProps as VariantSelection<VariantSchema>,
        precomputedDefaults,
        mergedCompoundVariantGroups as
          | ReadonlyArray<SlotCompoundVariant<VariantSchema, SlotSchema>>
          | undefined,
        compoundSlotClasses,
        resolvedVariantProps as VariantSelection<VariantSchema>,
        shouldMergeClasses,
        tailwindMergeFn,
      ) as unknown as S extends Record<string, never>
        ? string | undefined
        : VariantResolverResult<T, S>;
    } else {
      return resolveVariantClasses(
        mergedBaseClasses,
        mergedVariantGroups,
        mergedDefaultVariantProps as VariantSelection<VariantSchema>,
        mergedCompoundVariantGroups as ReadonlyArray<CompoundVariant<VariantSchema>> | undefined,
        resolvedVariantProps as VariantSelection<VariantSchema>,
        className ?? classProperty,
        shouldMergeClasses,
        tailwindMergeFn,
        cachedVariantKeys as Array<keyof VariantSchema>,
        precomputedDefaults,
      ) as unknown as S extends Record<string, never>
        ? string | undefined
        : VariantResolverResult<T, S>;
    }
  };

  const configuredVariantResolver = variantResolverFunction as VariantResolver<T, S>;

  Object.defineProperty(configuredVariantResolver, "config", {
    configurable: false,
    enumerable: false,
    value: mergedConfiguration,
    writable: false,
  });

  return configuredVariantResolver;
}

/**
 * Create a Tailwind Variants factory with global configuration.
 *
 * This function creates a factory that can be used to create variant functions
 * with a shared global configuration. It's useful for setting up consistent
 * behavior across multiple components.
 *
 * @param globalConfiguration - The global configuration to apply
 * @returns A factory object with `tv` and `cn` functions
 *
 * @since 0.3.16-canary.0
 */
export function createTV(globalConfiguration: TailwindVariantsOptions = {}): TailwindVariantsApi {
  const { twMerge: shouldMergeClasses = true, twMergeConfig } = globalConfiguration;
  const tailwindMergeFn = createTailwindMergeFn(twMergeConfig);

  /**
   * Factory function for creating regular variant functions.
   *
   * @typeParam T - The configuration schema type
   * @param configuration - The variant configuration
   * @param localConfiguration - Optional local configuration override
   * @returns A variant function for regular components
   */
  function tvFactory<T extends VariantSchema>(
    configuration: VariantConfig<T>,
    localConfiguration?: TailwindVariantsOptions,
  ): VariantResolver<T, Record<string, never>>;

  /**
   * Factory function for creating slot-based variant functions.
   *
   * @typeParam S - The slot configuration schema type
   * @param configuration - The slot configuration
   * @param localConfiguration - Optional local configuration override
   * @returns A variant function for slot-based components
   */
  function tvFactory<S extends SlotSchema>(
    configuration: SlotVariantConfig<Record<string, never>, S>,
    localConfiguration?: TailwindVariantsOptions,
  ): VariantResolver<Record<string, never>, S>;

  /**
   * Factory function for creating variant functions with both variants and slots.
   *
   * @typeParam T - The configuration schema type
   * @typeParam S - The slot configuration schema type
   * @param configuration - The configuration with variants and slots
   * @param localConfiguration - Optional local configuration override
   * @returns A variant function with full support
   */
  function tvFactory<T extends VariantSchema, S extends SlotSchema>(
    configuration: SlotVariantConfig<T, S>,
    localConfiguration?: TailwindVariantsOptions,
  ): VariantResolver<T, S>;

  /**
   * Factory function for creating extended variant functions.
   *
   * @typeParam TBase - The base configuration schema type
   * @typeParam TExtension - The extension configuration schema type
   * @typeParam SBase - The base slot configuration schema type
   * @typeParam SExtension - The extension slot configuration schema type
   * @param configuration - The extended configuration
   * @param localConfiguration - Optional local configuration override
   * @returns A variant function with merged configurations
   */
  function tvFactory<
    TBase extends VariantSchema,
    TExtension extends VariantSchema,
    SBase extends SlotSchema,
    SExtension extends SlotSchema,
  >(
    configuration: ExtendedVariantConfig<TBase, TExtension, SBase, SExtension>,
    localConfiguration?: TailwindVariantsOptions,
  ): VariantResolver<MergedVariantSchema<TBase, TExtension>, MergedSlotSchema<SBase, SExtension>>;

  /**
   * Main factory implementation.
   *
   * This function merges global and local configurations and creates
   * the appropriate variant function using the main `tv` function.
   *
   * @typeParam T - The configuration schema type
   * @typeParam S - The slot configuration schema type
   * @param configuration - The variant configuration
   * @param localConfiguration - Optional local configuration override
   * @returns A configured variant function
   */
  function tvFactory<T extends VariantSchema, S extends SlotSchema>(
    configuration:
      | VariantConfig<T>
      | SlotVariantConfig<T, S>
      | ExtendedVariantConfig<VariantSchema, T, SlotSchema, S>,
    localConfiguration?: TailwindVariantsOptions,
  ): VariantResolver<T, S> {
    const mergedConfiguration = { ...globalConfiguration, ...localConfiguration };

    return tv(configuration, mergedConfiguration) as VariantResolver<T, S>;
  }

  /**
   * Create a class name utility function with global configuration.
   *
   * @param classes - The CSS classes to combine
   * @returns The combined and optionally merged class string
   */
  const cnFunction = (...classes: Array<ClassValue>): string => {
    return shouldMergeClasses ? tailwindMergeFn(cx(...classes)) : cx(...classes);
  };

  return {
    cn: cnFunction,
    tv: tvFactory,
  };
}
