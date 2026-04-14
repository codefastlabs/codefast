/**
 * Tailwind Variants Core Implementation
 *
 * This module contains the main implementation of the Tailwind Variants system.
 * It provides functions to create variant-based styling functions with support
 * for slots, compound variants, and configuration merging.
 */

import type {
  ClassValue,
  CompoundVariantType,
  CompoundVariantWithSlotsType,
  Configuration,
  ConfigurationSchema,
  ConfigurationVariants,
  ConfigurationWithSlots,
  ExtendedConfiguration,
  MergedSchemas,
  MergedSlotSchemas,
  SlotConfigurationSchema,
  TailwindVariantsConfiguration,
  TailwindVariantsFactoryResult,
  TailwindVariantsReturnType,
  VariantFunctionType,
} from "#types/types";

import { mergeConfigurationSchemas } from "#core/config";
import { applyCompoundSlotClasses, applyCompoundVariantClasses } from "#processing/compound";
import { createSlotFunctionFactory } from "#processing/slots";
import {
  createTailwindMergeService,
  cx,
  hasExtensionConfiguration,
  hasSlotConfiguration,
} from "#utilities/utils";

/**
 * Handle regular variant resolution for components without slots.
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
 * @param tailwindMergeService - The Tailwind merge service function
 * @param cachedVariantKeys - Pre-computed variant keys for performance optimization
 * @param precomputedDefaults - Pre-computed default variant values
 * @returns The resolved CSS class string or undefined
 */
const handleRegularVariantResolution = <T extends ConfigurationSchema>(
  mergedBaseClasses: ClassValue,
  mergedVariantGroups: T,
  mergedDefaultVariantProps: ConfigurationVariants<T>,
  mergedCompoundVariantGroups: readonly CompoundVariantType<T>[] | undefined,
  variantProps: ConfigurationVariants<T>,
  customClassName: ClassValue,
  shouldMergeClasses: boolean,
  tailwindMergeService: (classes: string) => string,
  cachedVariantKeys: (keyof T)[],
  precomputedDefaults: Record<string, string>,
): string | undefined => {
  // Pre-allocate array with estimated size for better performance
  const estimatedSize = cachedVariantKeys.length + (mergedCompoundVariantGroups?.length ?? 0) + 2;
  const resolvedClasses: ClassValue[] = new Array(estimatedSize);
  let classIndex = 0;

  // Add base classes if they exist
  if (mergedBaseClasses) {
    resolvedClasses[classIndex++] = mergedBaseClasses;
  }

  // Process each variant group using cached keys
  for (let index = 0, length = cachedVariantKeys.length; index < length; index++) {
    const variantKey = cachedVariantKeys[index];
    const variantGroup = mergedVariantGroups[variantKey];
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

  // Apply compound variant classes if they exist
  if (mergedCompoundVariantGroups) {
    const compoundVariantClasses = applyCompoundVariantClasses(
      mergedCompoundVariantGroups,
      variantProps,
      mergedDefaultVariantProps,
    );

    // Use for loop instead of spread for better performance
    for (let index = 0, length = compoundVariantClasses.length; index < length; index++) {
      resolvedClasses[classIndex++] = compoundVariantClasses[index];
    }
  }

  // Add custom classes if provided
  if (customClassName) {
    resolvedClasses[classIndex++] = customClassName;
  }

  // Return early if no classes to process
  if (classIndex === 0) {
    return;
  }

  // Trim array to actual size
  resolvedClasses.length = classIndex;

  // Combine all classes into a single string
  const classString = cx(...resolvedClasses);

  // Apply Tailwind merge if enabled, otherwise return the raw class string
  return shouldMergeClasses ? tailwindMergeService(classString) : classString || undefined;
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
 */
export function tv<T extends ConfigurationSchema>(
  config: Configuration<T>,
  tvConfig?: TailwindVariantsConfiguration,
): VariantFunctionType<T, Record<string, never>>;

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
 */
export function tv<S extends SlotConfigurationSchema>(
  config: ConfigurationWithSlots<Record<string, never>, S>,
  tvConfig?: TailwindVariantsConfiguration,
): VariantFunctionType<Record<string, never>, S>;

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
 */
export function tv<T extends ConfigurationSchema, S extends SlotConfigurationSchema>(
  config: ConfigurationWithSlots<T, S>,
  tvConfig?: TailwindVariantsConfiguration,
): VariantFunctionType<T, S>;

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
 */
export function tv<
  TBase extends ConfigurationSchema,
  TExtension extends ConfigurationSchema,
  SBase extends SlotConfigurationSchema,
  SExtension extends SlotConfigurationSchema,
>(
  config: ExtendedConfiguration<TBase, TExtension, SBase, SExtension>,
  tvConfig?: TailwindVariantsConfiguration,
): VariantFunctionType<MergedSchemas<TBase, TExtension>, MergedSlotSchemas<SBase, SExtension>>;

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
 */
export function tv<T extends ConfigurationSchema, S extends SlotConfigurationSchema>(
  configuration:
    | Configuration<T>
    | ConfigurationWithSlots<T, S>
    | ExtendedConfiguration<ConfigurationSchema, T, SlotConfigurationSchema, S>,
  tvConfiguration: TailwindVariantsConfiguration = {},
): VariantFunctionType<T, S> {
  // Ensure type safety for the configuration
  const configurationWithType = configuration satisfies
    | Configuration<T>
    | ConfigurationWithSlots<T, S>
    | ExtendedConfiguration<ConfigurationSchema, T, SlotConfigurationSchema, S>;

  // Extract Tailwind merge configuration
  const { twMerge: shouldMergeClasses = true, twMergeConfig } = tvConfiguration;
  const tailwindMergeService = createTailwindMergeService(twMergeConfig);

  // Merge configurations if the extension is present
  const mergedConfiguration:
    | Configuration<ConfigurationSchema>
    | ConfigurationWithSlots<ConfigurationSchema, SlotConfigurationSchema> =
    hasExtensionConfiguration(configurationWithType) && configurationWithType.extend
      ? mergeConfigurationSchemas(
          configurationWithType.extend.config,
          configurationWithType as
            | Configuration<ConfigurationSchema>
            | ConfigurationWithSlots<ConfigurationSchema, SlotConfigurationSchema>,
        )
      : (configurationWithType as
          | Configuration<ConfigurationSchema>
          | ConfigurationWithSlots<ConfigurationSchema, SlotConfigurationSchema>);

  // Extract merged configuration properties
  const mergedBaseClasses = mergedConfiguration.base;
  const mergedSlotDefinitions = hasSlotConfiguration(mergedConfiguration)
    ? mergedConfiguration.slots
    : undefined;
  const mergedVariantGroups = mergedConfiguration.variants ?? ({} as T);
  const mergedDefaultVariantProps =
    mergedConfiguration.defaultVariants ?? ({} as ConfigurationVariants<T>);
  const mergedCompoundVariantGroups = mergedConfiguration.compoundVariants;

  // Pre-compute variant keys to avoid Object.keys() on every invocation
  const cachedVariantKeys = Object.keys(mergedVariantGroups) as (keyof T)[];

  // Pre-compute default variant values including boolean defaults
  // This moves work from the hot path to initialization time
  const precomputedDefaults: Record<string, string> = {};

  for (let index = 0, length = cachedVariantKeys.length; index < length; index++) {
    const key = cachedVariantKeys[index];
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
    } else if ("true" in variantGroup || "false" in variantGroup) {
      // Boolean variant default
      precomputedDefaults[keyString] = "false";
    }
  }

  // Validate compound variants configuration once at creation time
  if (
    mergedConfiguration.compoundVariants &&
    !Array.isArray(mergedConfiguration.compoundVariants)
  ) {
    throw new Error("compoundVariants must be an array");
  }

  // Create the main variant resolver function
  const variantResolverFunction = (
    variantProps: ConfigurationVariants<T> = {},
  ): S extends Record<string, never> ? string | undefined : TailwindVariantsReturnType<T, S> => {
    // Extract class properties and variant props
    const classProperty = variantProps.class;
    const className = variantProps.className;
    const resolvedVariantProps = variantProps;

    // Handle slot-based components
    if (mergedSlotDefinitions) {
      const compoundSlotClasses = applyCompoundSlotClasses(
        hasSlotConfiguration(mergedConfiguration) ? mergedConfiguration.compoundSlots : undefined,
        resolvedVariantProps as ConfigurationVariants<ConfigurationSchema>,
        mergedDefaultVariantProps as ConfigurationVariants<ConfigurationSchema>,
      );

      return createSlotFunctionFactory(
        mergedSlotDefinitions,
        mergedBaseClasses,
        mergedVariantGroups,
        mergedDefaultVariantProps as ConfigurationVariants<ConfigurationSchema>,
        mergedCompoundVariantGroups as
          | readonly CompoundVariantWithSlotsType<ConfigurationSchema, SlotConfigurationSchema>[]
          | undefined,
        compoundSlotClasses,
        resolvedVariantProps as ConfigurationVariants<ConfigurationSchema>,
        shouldMergeClasses,
        tailwindMergeService,
      ) as unknown as S extends Record<string, never>
        ? string | undefined
        : TailwindVariantsReturnType<T, S>;
    } else {
      // Handle regular components without slots
      return handleRegularVariantResolution(
        mergedBaseClasses,
        mergedVariantGroups,
        mergedDefaultVariantProps as ConfigurationVariants<ConfigurationSchema>,
        mergedCompoundVariantGroups as
          | readonly CompoundVariantType<ConfigurationSchema>[]
          | undefined,
        resolvedVariantProps as ConfigurationVariants<ConfigurationSchema>,
        className ?? classProperty,
        shouldMergeClasses,
        tailwindMergeService,
        cachedVariantKeys as (keyof ConfigurationSchema)[],
        precomputedDefaults,
      ) as unknown as S extends Record<string, never>
        ? string | undefined
        : TailwindVariantsReturnType<T, S>;
    }
  };

  // Create the final configured variant resolver
  const configuredVariantResolver = variantResolverFunction as VariantFunctionType<T, S>;

  // Attach the configuration to the function for introspection
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
 */
export function createTV(
  globalConfiguration: TailwindVariantsConfiguration = {},
): TailwindVariantsFactoryResult {
  // Extract global configuration
  const { twMerge: shouldMergeClasses = true, twMergeConfig } = globalConfiguration;
  const tailwindMergeService = createTailwindMergeService(twMergeConfig);

  /**
   * Factory function for creating regular variant functions.
   *
   * @typeParam T - The configuration schema type
   * @param configuration - The variant configuration
   * @param localConfiguration - Optional local configuration override
   * @returns A variant function for regular components
   */
  function tvFactory<T extends ConfigurationSchema>(
    configuration: Configuration<T>,
    localConfiguration?: TailwindVariantsConfiguration,
  ): VariantFunctionType<T, Record<string, never>>;

  /**
   * Factory function for creating slot-based variant functions.
   *
   * @typeParam S - The slot configuration schema type
   * @param configuration - The slot configuration
   * @param localConfiguration - Optional local configuration override
   * @returns A variant function for slot-based components
   */
  function tvFactory<S extends SlotConfigurationSchema>(
    configuration: ConfigurationWithSlots<Record<string, never>, S>,
    localConfiguration?: TailwindVariantsConfiguration,
  ): VariantFunctionType<Record<string, never>, S>;

  /**
   * Factory function for creating variant functions with both variants and slots.
   *
   * @typeParam T - The configuration schema type
   * @typeParam S - The slot configuration schema type
   * @param configuration - The configuration with variants and slots
   * @param localConfiguration - Optional local configuration override
   * @returns A variant function with full support
   */
  function tvFactory<T extends ConfigurationSchema, S extends SlotConfigurationSchema>(
    configuration: ConfigurationWithSlots<T, S>,
    localConfiguration?: TailwindVariantsConfiguration,
  ): VariantFunctionType<T, S>;

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
    TBase extends ConfigurationSchema,
    TExtension extends ConfigurationSchema,
    SBase extends SlotConfigurationSchema,
    SExtension extends SlotConfigurationSchema,
  >(
    configuration: ExtendedConfiguration<TBase, TExtension, SBase, SExtension>,
    localConfiguration?: TailwindVariantsConfiguration,
  ): VariantFunctionType<MergedSchemas<TBase, TExtension>, MergedSlotSchemas<SBase, SExtension>>;

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
  function tvFactory<T extends ConfigurationSchema, S extends SlotConfigurationSchema>(
    configuration:
      | Configuration<T>
      | ConfigurationWithSlots<T, S>
      | ExtendedConfiguration<ConfigurationSchema, T, SlotConfigurationSchema, S>,
    localConfiguration?: TailwindVariantsConfiguration,
  ): VariantFunctionType<T, S> {
    // Merge global and local configurations
    const mergedConfiguration = { ...globalConfiguration, ...localConfiguration };

    return tv(
      configuration satisfies
        | Configuration<T>
        | ConfigurationWithSlots<T, S>
        | ExtendedConfiguration<ConfigurationSchema, T, SlotConfigurationSchema, S>,
      mergedConfiguration,
    ) as VariantFunctionType<T, S>;
  }

  /**
   * Create a class name utility function with global configuration.
   *
   * @param classes - The CSS classes to combine
   * @returns The combined and optionally merged class string
   */
  const cnFunction = (...classes: ClassValue[]): string => {
    return shouldMergeClasses ? tailwindMergeService(cx(...classes)) : cx(...classes);
  };

  // Return the factory object with `tv` and `cn` functions
  return {
    cn: cnFunction,
    tv: tvFactory,
  };
}
