/**
 * Main TV Function and Factory
 *
 * This module contains the core TV (Tailwind Variants) function and the createTV
 * factory function. It handles the main variant resolution logic, configuration
 * merging, and provides the primary API for creating variant systems.
 *
 */

import type { ClassValue } from "clsx";

import type {
  CompoundVariant,
  CompoundVariantWithSlots,
  Config,
  ConfigSchema,
  ConfigVariants,
  ConfigWithSlots,
  ExtendedConfig,
  MergeSchemas,
  MergeSlotSchemas,
  SlotSchema,
  TVConfig,
  TVFactoryResult,
  TVReturnType,
  VariantFunction,
} from "@/types";

import { applyCompoundSlots, applyCompoundVariants } from "@/compound";
import { mergeConfigs } from "@/config";
import { createSlotFunctions } from "@/slots";
import { createTailwindMerge, cx, hasExtend, hasSlots, isBooleanVariant } from "@/utils";

/**
 * Handles regular variants without slots.
 *
 * This function processes variants for components that don't use slots,
 * applying base classes, variant classes, compound variants, and custom
 * className props in the correct order.
 *
 * @param mergedBase - Merged base classes
 * @param mergedVariants - Merged variant definitions
 * @param mergedDefaultVariants - Merged default variant values
 * @param mergedCompoundVariants - Merged compound variant definitions
 * @param variantProps - Current variant properties
 * @param className - Custom className to apply
 * @param shouldMerge - Whether to use tailwind-merge
 * @param tailwindMerge - Tailwind merge function
 * @returns Resolved class string or undefined
 *
 * @example
 * ```typescript
 * const classes = handleRegularVariants(
 *   'px-4 py-2',
 *   { size: { sm: 'text-sm', lg: 'text-lg' }, color: { primary: 'bg-blue-500' } },
 *   { size: 'sm', color: 'primary' },
 *   [{ size: 'lg', color: 'primary', className: 'font-bold' }],
 *   { size: 'lg' },
 *   'custom-class',
 *   true,
 *   twMerge
 * );
 * // Returns: 'px-4 py-2 text-lg bg-blue-500 font-bold custom-class'
 * ```
 */
const handleRegularVariants = <T extends ConfigSchema>(
  mergedBase: ClassValue | undefined,
  mergedVariants: T,
  mergedDefaultVariants: ConfigVariants<T>,
  mergedCompoundVariants: readonly CompoundVariant<T>[] | undefined,
  variantProps: ConfigVariants<T>,
  className: ClassValue | undefined,
  shouldMerge: boolean,
  tailwindMerge: (classes: string) => string,
): string | undefined => {
  const classes: ClassValue[] = [];

  // Add base classes
  if (mergedBase) {
    classes.push(mergedBase);
  }

  const keys = Object.keys(mergedVariants) as (keyof T)[];

  // Process each variant
  for (const key of keys) {
    const group = mergedVariants[key];
    const value = variantProps[key];

    let valueToUse: string | undefined;

    // Determine the value to use for this variant
    if (value !== undefined) {
      valueToUse = String(value);
    } else if (mergedDefaultVariants[key] !== undefined) {
      const defaultValue = mergedDefaultVariants[key];

      valueToUse = String(defaultValue);
    } else if (isBooleanVariant(group)) {
      // For boolean variants without an explicit default, use false
      valueToUse = "false";
    }

    // Apply the variant if it exists
    if (valueToUse !== undefined && valueToUse in group) {
      classes.push(group[valueToUse]);
    }
  }

  // Add compound variant classes
  if (mergedCompoundVariants) {
    const compoundClasses = applyCompoundVariants(
      mergedCompoundVariants,
      variantProps,
      mergedDefaultVariants,
    );

    classes.push(...compoundClasses);
  }

  // Add a custom className
  if (className) {
    classes.push(className);
  }

  if (classes.length === 0) return;

  const classString = cx(...classes);

  return shouldMerge ? tailwindMerge(classString) : classString || undefined;
};

// Function overloads for type-safe return values

/**
 * Creates a variant function for a configuration without slots.
 *
 * @param config - Configuration object without slots
 * @param tvConfig - Optional TV configuration
 * @returns Variant function that returns a string
 */
export function tv<T extends ConfigSchema>(
  config: Config<T>,
  tvConfig?: TVConfig,
): VariantFunction<T, Record<string, never>>;

/**
 * Creates a variant function for a configuration with slots but no variants.
 *
 * @param config - Configuration object with slots but no variants
 * @param tvConfig - Optional TV configuration
 * @returns Variant function that returns slot functions
 */
export function tv<S extends SlotSchema>(
  config: ConfigWithSlots<Record<string, never>, S>,
  tvConfig?: TVConfig,
): VariantFunction<Record<string, never>, S>;

/**
 * Creates a variant function for a configuration with both variants and slots.
 *
 * @param config - Configuration object with variants and slots
 * @param tvConfig - Optional TV configuration
 * @returns Variant function that returns slot functions
 */
export function tv<T extends ConfigSchema, S extends SlotSchema>(
  config: ConfigWithSlots<T, S>,
  tvConfig?: TVConfig,
): VariantFunction<T, S>;

/**
 * Creates a variant function for an extended configuration.
 *
 * @param config - Extended configuration object
 * @param tvConfig - Optional TV configuration
 * @returns Variant function with merged types
 */
export function tv<
  TBase extends ConfigSchema,
  TExtension extends ConfigSchema,
  SBase extends SlotSchema,
  SExtension extends SlotSchema,
>(
  config: ExtendedConfig<TBase, TExtension, SBase, SExtension>,
  tvConfig?: TVConfig,
): VariantFunction<MergeSchemas<TBase, TExtension>, MergeSlotSchemas<SBase, SExtension>>;

/**
 * Main TV function implementation.
 *
 * This is the core function that creates variant systems. It handles configuration
 * merging, variant resolution, and returns either a string (for non-slot configs)
 * or slot functions (for slot configs).
 *
 * @param config - Configuration object
 * @param tvConfig - TV configuration options
 * @returns Variant function
 *
 * @example
 * ```typescript
 * const button = tv({
 *   base: 'px-4 py-2 rounded',
 *   variants: {
 *     size: { sm: 'text-sm', lg: 'text-lg' },
 *     color: { primary: 'bg-blue-500', secondary: 'bg-gray-500' }
 *   },
 *   defaultVariants: { size: 'sm', color: 'primary' }
 * });
 *
 * const classes = button({ size: 'lg', color: 'secondary' });
 * // Returns: 'px-4 py-2 rounded text-lg bg-gray-500'
 * ```
 */
export function tv<T extends ConfigSchema, S extends SlotSchema>(
  config: Config<T> | ConfigWithSlots<T, S> | ExtendedConfig<ConfigSchema, T, SlotSchema, S>,
  tvConfig: TVConfig = {},
): VariantFunction<T, S> {
  // Use satisfies operator for type safety
  const configWithType = config satisfies
    | Config<T>
    | ConfigWithSlots<T, S>
    | ExtendedConfig<ConfigSchema, T, SlotSchema, S>;

  const { twMerge: shouldMerge = true, twMergeConfig } = tvConfig;
  const tailwindMerge = createTailwindMerge(twMergeConfig);

  // Merge with extended config if present
  const mergedConfig: Config<ConfigSchema> | ConfigWithSlots<ConfigSchema, SlotSchema> =
    hasExtend(configWithType) && configWithType.extend
      ? mergeConfigs(
          configWithType.extend.config,
          configWithType as Config<ConfigSchema> | ConfigWithSlots<ConfigSchema, SlotSchema>,
        )
      : (configWithType as Config<ConfigSchema> | ConfigWithSlots<ConfigSchema, SlotSchema>);

  const mergedBase = mergedConfig.base;
  const mergedSlots = hasSlots(mergedConfig) ? mergedConfig.slots : undefined;
  const mergedVariants = mergedConfig.variants ?? ({} as T);
  const mergedDefaultVariants = mergedConfig.defaultVariants ?? ({} as ConfigVariants<T>);
  const mergedCompoundVariants = mergedConfig.compoundVariants;

  const tvFunction = (
    props: ConfigVariants<T> & { class?: ClassValue; className?: ClassValue } = {},
  ): S extends Record<string, never> ? string | undefined : TVReturnType<T, S> => {
    const { class: classProperty, className, ...variantProps } = props;

    // Validate compoundVariants is an array
    if (mergedConfig.compoundVariants && !Array.isArray(mergedConfig.compoundVariants)) {
      throw new Error("compoundVariants must be an array");
    }

    if (mergedSlots) {
      // Handle slots with proper typing
      const compoundSlotClasses = applyCompoundSlots(
        hasSlots(mergedConfig) ? mergedConfig.compoundSlots : undefined,
        variantProps as ConfigVariants<ConfigSchema>,
        mergedDefaultVariants as ConfigVariants<ConfigSchema>,
      );

      return createSlotFunctions(
        mergedSlots,
        mergedBase,
        mergedVariants,
        mergedDefaultVariants as ConfigVariants<ConfigSchema>,
        mergedCompoundVariants as
          | readonly CompoundVariantWithSlots<ConfigSchema, SlotSchema>[]
          | undefined,
        compoundSlotClasses,
        variantProps as ConfigVariants<ConfigSchema>,
        shouldMerge,
        tailwindMerge,
      ) as unknown as S extends Record<string, never> ? string | undefined : TVReturnType<T, S>;
    } else {
      // Handle regular variants with proper typing
      return handleRegularVariants(
        mergedBase,
        mergedVariants,
        mergedDefaultVariants as ConfigVariants<ConfigSchema>,
        mergedCompoundVariants as readonly CompoundVariant<ConfigSchema>[] | undefined,
        variantProps as ConfigVariants<ConfigSchema>,
        className ?? classProperty,
        shouldMerge,
        tailwindMerge,
      ) as unknown as S extends Record<string, never> ? string | undefined : TVReturnType<T, S>;
    }
  };

  // Store config for extending with proper typing
  const tvFunctionWithConfig = tvFunction as VariantFunction<T, S>;

  // Use Object.defineProperty for type-safe config assignment
  Object.defineProperty(tvFunctionWithConfig, "config", {
    configurable: false,
    enumerable: false,
    value: mergedConfig,
    writable: false,
  });

  return tvFunctionWithConfig;
}

/**
 * CreateTV Factory Function
 *
 * This function creates a TV factory with global configuration that can be
 * reused across multiple components. It provides both a configured tv function
 * and a cn utility function.
 *
 * @param globalConfig - Global TV configuration
 * @returns Object containing tv factory and cn function
 *
 * @example
 * ```typescript
 * const { tv, cn } = createTV({
 *   twMerge: true,
 *   twMergeConfig: {
 *     extend: {
 *       classGroups: {
 *         'font-size': ['text-custom']
 *       }
 *     }
 *   }
 * });
 *
 * const button = tv({
 *   base: 'px-4 py-2',
 *   variants: { size: { sm: 'text-sm', lg: 'text-lg' } }
 * });
 *
 * const classes = cn(button({ size: 'lg' }), 'custom-class');
 * ```
 */
export function createTV(globalConfig: TVConfig = {}): TVFactoryResult {
  const { twMerge: shouldMerge = true, twMergeConfig } = globalConfig;
  const tailwindMerge = createTailwindMerge(twMergeConfig);

  // Function overloads to ensure proper type inference
  function tvFactory<T extends ConfigSchema>(
    config: Config<T>,
    localConfig?: TVConfig,
  ): VariantFunction<T, Record<string, never>>;

  function tvFactory<S extends SlotSchema>(
    config: ConfigWithSlots<Record<string, never>, S>,
    localConfig?: TVConfig,
  ): VariantFunction<Record<string, never>, S>;

  function tvFactory<T extends ConfigSchema, S extends SlotSchema>(
    config: ConfigWithSlots<T, S>,
    localConfig?: TVConfig,
  ): VariantFunction<T, S>;

  function tvFactory<
    TBase extends ConfigSchema,
    TExtension extends ConfigSchema,
    SBase extends SlotSchema,
    SExtension extends SlotSchema,
  >(
    config: ExtendedConfig<TBase, TExtension, SBase, SExtension>,
    localConfig?: TVConfig,
  ): VariantFunction<MergeSchemas<TBase, TExtension>, MergeSlotSchemas<SBase, SExtension>>;

  function tvFactory<T extends ConfigSchema, S extends SlotSchema>(
    config: Config<T> | ConfigWithSlots<T, S> | ExtendedConfig<ConfigSchema, T, SlotSchema, S>,
    localConfig?: TVConfig,
  ): VariantFunction<T, S> {
    const mergedConfig = { ...globalConfig, ...localConfig };

    return tv(
      config satisfies
        | Config<T>
        | ConfigWithSlots<T, S>
        | ExtendedConfig<ConfigSchema, T, SlotSchema, S>,
      mergedConfig,
    ) as VariantFunction<T, S>;
  }

  // Create cn function with global config
  const cnFunction = (...classes: ClassValue[]): string => {
    return shouldMerge ? tailwindMerge(cx(...classes)) : cx(...classes);
  };

  return {
    cn: cnFunction,
    tv: tvFactory,
  };
}
