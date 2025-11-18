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
} from '@/types/types';

import { mergeConfigurationSchemas } from '@/core/config';
import { applyCompoundSlotClasses, applyCompoundVariantClasses } from '@/processing/compound';
import { createSlotFunctionFactory } from '@/processing/slots';
import {
  createTailwindMergeService,
  cx,
  hasExtensionConfiguration,
  hasSlotConfiguration,
  isBooleanVariantType,
} from '@/utilities/utils';

/**
 * Handle regular variant resolution for components without slots.
 *
 * This function processes variant configurations and resolves the appropriate
 * CSS classes based on the provided variant props and default values.
 *
 * @param mergedBaseClasses - The base CSS classes to apply
 * @param mergedVariantGroups - The variant group configurations
 * @param mergedDefaultVariantProps - Default variant property values
 * @param mergedCompoundVariantGroups - Compound variant configurations
 * @param variantProps - The variant properties passed to the component
 * @param customClassName - Additional custom CSS classes
 * @param shouldMergeClasses - Whether to merge conflicting classes
 * @param tailwindMergeService - The Tailwind merge service function
 * @returns The resolved CSS class string or undefined
 */
const handleRegularVariantResolution = <T extends ConfigurationSchema>(
  mergedBaseClasses: ClassValue | undefined,
  mergedVariantGroups: T,
  mergedDefaultVariantProps: ConfigurationVariants<T>,
  mergedCompoundVariantGroups: readonly CompoundVariantType<T>[] | undefined,
  variantProps: ConfigurationVariants<T>,
  customClassName: ClassValue | undefined,
  shouldMergeClasses: boolean,
  tailwindMergeService: (classes: string) => string,
): string | undefined => {
  // Initialize the resolved classes array
  const resolvedClasses: ClassValue[] = [];

  // Add base classes if they exist
  if (mergedBaseClasses) {
    resolvedClasses.push(mergedBaseClasses);
  }

  // Process each variant group
  const variantKeys = Object.keys(mergedVariantGroups) as (keyof T)[];

  for (const variantKey of variantKeys) {
    const variantGroup = mergedVariantGroups[variantKey];
    const variantValue = variantProps[variantKey];

    let resolvedValue: string | undefined;

    // Resolve the variant value based on priority:
    // 1. Explicit variant props
    // 2. Default variant props
    // 3. Boolean variant defaults
    if (variantValue === undefined) {
      const defaultValue = mergedDefaultVariantProps[variantKey];

      if (defaultValue !== undefined) {
        resolvedValue = typeof defaultValue === 'string' ? defaultValue : String(defaultValue);
      } else if (isBooleanVariantType(variantGroup)) {
        resolvedValue = 'false';
      }
    } else {
      resolvedValue = typeof variantValue === 'string' ? variantValue : String(variantValue);
    }

    // Add the resolved variant class if it exists
    if (resolvedValue !== undefined && resolvedValue in variantGroup) {
      resolvedClasses.push(variantGroup[resolvedValue]);
    }
  }

  // Apply compound variant classes if they exist
  if (mergedCompoundVariantGroups) {
    const compoundVariantClasses = applyCompoundVariantClasses(
      mergedCompoundVariantGroups,
      variantProps,
      mergedDefaultVariantProps,
    );

    resolvedClasses.push(...compoundVariantClasses);
  }

  // Add custom classes if provided
  if (customClassName) {
    resolvedClasses.push(customClassName);
  }

  // Return early if no classes to process
  if (resolvedClasses.length === 0) return;

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
  const mergedSlotDefinitions = hasSlotConfiguration(mergedConfiguration) ? mergedConfiguration.slots : undefined;
  const mergedVariantGroups = mergedConfiguration.variants ?? ({} as T);
  const mergedDefaultVariantProps = mergedConfiguration.defaultVariants ?? ({} as ConfigurationVariants<T>);
  const mergedCompoundVariantGroups = mergedConfiguration.compoundVariants;

  // Configuration properties are ready for processing

  // Create the main variant resolver function
  const variantResolverFunction = (
    variantProps: ConfigurationVariants<T> & { class?: ClassValue; className?: ClassValue } = {},
  ): S extends Record<string, never> ? string | undefined : TailwindVariantsReturnType<T, S> => {
    // Extract class properties and variant props
    const classProperty = variantProps.class;
    const className = variantProps.className;
    const resolvedVariantProps = variantProps;

    // Validate compound variants configuration
    if (mergedConfiguration.compoundVariants && !Array.isArray(mergedConfiguration.compoundVariants)) {
      throw new Error('compoundVariants must be an array');
    }

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
      ) as unknown as S extends Record<string, never> ? string | undefined : TailwindVariantsReturnType<T, S>;
    } else {
      // Handle regular components without slots
      return handleRegularVariantResolution(
        mergedBaseClasses,
        mergedVariantGroups,
        mergedDefaultVariantProps as ConfigurationVariants<ConfigurationSchema>,
        mergedCompoundVariantGroups as readonly CompoundVariantType<ConfigurationSchema>[] | undefined,
        resolvedVariantProps as ConfigurationVariants<ConfigurationSchema>,
        className ?? classProperty,
        shouldMergeClasses,
        tailwindMergeService,
      ) as unknown as S extends Record<string, never> ? string | undefined : TailwindVariantsReturnType<T, S>;
    }
  };

  // Create the final configured variant resolver
  const configuredVariantResolver = variantResolverFunction as VariantFunctionType<T, S>;

  // Attach the configuration to the function for introspection
  Object.defineProperty(configuredVariantResolver, 'config', {
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
export function createTV(globalConfiguration: TailwindVariantsConfiguration = {}): TailwindVariantsFactoryResult {
  // Extract global configuration
  const { twMerge: shouldMergeClasses = true, twMergeConfig } = globalConfiguration;
  const tailwindMergeService = createTailwindMergeService(twMergeConfig);

  /**
   * Factory function for creating regular variant functions.
   *
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
