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
} from "./types";

import { applyCompoundSlots, applyCompoundVariants } from "./compound";
import { mergeConfigs } from "./config";
import { createSlotFunctions } from "./slots";
import {
  createTailwindMerge,
  cx,
  hasExtend,
  hasSlots,
  isBooleanValue,
  isBooleanVariant,
} from "./utils";

// =============================================================================
// Helper Functions for TV
// =============================================================================

/**
 * Handles regular variants without slots
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

  // Add variant classes with optimized iteration
  const variantKeys = Object.keys(mergedVariants) as (keyof T)[];

  for (const variantKey of variantKeys) {
    const variantGroup = mergedVariants[variantKey];
    const variantValue = variantProps[variantKey];

    // Enhanced value resolution with proper boolean handling
    let valueToUse: string | undefined;

    if (variantValue !== undefined) {
      valueToUse = isBooleanValue(variantValue) ? String(variantValue) : String(variantValue);
    } else if (mergedDefaultVariants[variantKey] !== undefined) {
      const defaultValue = mergedDefaultVariants[variantKey];

      valueToUse = isBooleanValue(defaultValue) ? String(defaultValue) : String(defaultValue);
    } else if (isBooleanVariant(variantGroup)) {
      // For boolean variants without an explicit default, use false
      valueToUse = "false";
    }

    if (valueToUse !== undefined && valueToUse in variantGroup) {
      classes.push(variantGroup[valueToUse]);
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

// =============================================================================
// Main TV Function
// =============================================================================

// Function overloads for type-safe return values
export function tv<T extends ConfigSchema>(
  config: Config<T>,
  tvConfig?: TVConfig,
): VariantFunction<T, Record<string, never>>;

export function tv<S extends SlotSchema>(
  config: ConfigWithSlots<Record<string, never>, S>,
  tvConfig?: TVConfig,
): VariantFunction<Record<string, never>, S>;

export function tv<T extends ConfigSchema, S extends SlotSchema>(
  config: ConfigWithSlots<T, S>,
  tvConfig?: TVConfig,
): VariantFunction<T, S>;

export function tv<
  TBase extends ConfigSchema,
  TExtension extends ConfigSchema,
  SBase extends SlotSchema,
  SExtension extends SlotSchema,
>(
  config: ExtendedConfig<TBase, TExtension, SBase, SExtension>,
  tvConfig?: TVConfig,
): VariantFunction<MergeSchemas<TBase, TExtension>, MergeSlotSchemas<SBase, SExtension>>;

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

// =============================================================================
// CreateTV Factory Function
// =============================================================================

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
