import type {
  ClassValue,
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

import { applyCompoundSlotClasses, applyCompoundVariantClasses } from "@/compound";
import { mergeConfigurationSchemas } from "@/config";
import { createSlotFunctionFactory } from "@/slots";
import {
  createTailwindMergeService,
  cx,
  hasExtensionConfiguration,
  hasSlotConfiguration,
  isBooleanVariantType,
} from "@/utils";

const handleRegularVariantResolution = <T extends ConfigSchema>(
  mergedBaseClasses: ClassValue | undefined,
  mergedVariantGroups: T,
  mergedDefaultVariantProps: ConfigVariants<T>,
  mergedCompoundVariantGroups: readonly CompoundVariant<T>[] | undefined,
  variantProps: ConfigVariants<T>,
  customClassName: ClassValue | undefined,
  shouldMergeClasses: boolean,
  tailwindMergeService: (classes: string) => string,
): string | undefined => {
  const resolvedClasses: ClassValue[] = [];

  if (mergedBaseClasses) {
    resolvedClasses.push(mergedBaseClasses);
  }

  const variantKeys = Object.keys(mergedVariantGroups) as (keyof T)[];

  for (const variantKey of variantKeys) {
    const variantGroup = mergedVariantGroups[variantKey];
    const variantValue = variantProps[variantKey];

    let resolvedValue: string | undefined;

    if (variantValue !== undefined) {
      resolvedValue = String(variantValue);
    } else if (mergedDefaultVariantProps[variantKey] !== undefined) {
      const defaultValue = mergedDefaultVariantProps[variantKey];

      resolvedValue = String(defaultValue);
    } else if (isBooleanVariantType(variantGroup)) {
      resolvedValue = "false";
    }

    if (resolvedValue !== undefined && resolvedValue in variantGroup) {
      resolvedClasses.push(variantGroup[resolvedValue]);
    }
  }

  if (mergedCompoundVariantGroups) {
    const compoundVariantClasses = applyCompoundVariantClasses(
      mergedCompoundVariantGroups,
      variantProps,
      mergedDefaultVariantProps,
    );

    resolvedClasses.push(...compoundVariantClasses);
  }

  if (customClassName) {
    resolvedClasses.push(customClassName);
  }

  if (resolvedClasses.length === 0) return;

  const classString = cx(...resolvedClasses);

  return shouldMergeClasses ? tailwindMergeService(classString) : classString || undefined;
};

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
  configuration: Config<T> | ConfigWithSlots<T, S> | ExtendedConfig<ConfigSchema, T, SlotSchema, S>,
  tvConfiguration: TVConfig = {},
): VariantFunction<T, S> {
  const configurationWithType = configuration satisfies
    | Config<T>
    | ConfigWithSlots<T, S>
    | ExtendedConfig<ConfigSchema, T, SlotSchema, S>;

  const { twMerge: shouldMergeClasses = true, twMergeConfig } = tvConfiguration;
  const tailwindMergeService = createTailwindMergeService(twMergeConfig);

  const mergedConfiguration: Config<ConfigSchema> | ConfigWithSlots<ConfigSchema, SlotSchema> =
    hasExtensionConfiguration(configurationWithType) && configurationWithType.extend
      ? mergeConfigurationSchemas(
          configurationWithType.extend.config,
          configurationWithType as Config<ConfigSchema> | ConfigWithSlots<ConfigSchema, SlotSchema>,
        )
      : (configurationWithType as Config<ConfigSchema> | ConfigWithSlots<ConfigSchema, SlotSchema>);

  const mergedBaseClasses = mergedConfiguration.base;
  const mergedSlotDefinitions = hasSlotConfiguration(mergedConfiguration)
    ? mergedConfiguration.slots
    : undefined;
  const mergedVariantGroups = mergedConfiguration.variants ?? ({} as T);
  const mergedDefaultVariantProps =
    mergedConfiguration.defaultVariants ?? ({} as ConfigVariants<T>);
  const mergedCompoundVariantGroups = mergedConfiguration.compoundVariants;

  const variantResolverFunction = (
    variantProps: ConfigVariants<T> & { class?: ClassValue; className?: ClassValue } = {},
  ): S extends Record<string, never> ? string | undefined : TVReturnType<T, S> => {
    const { class: classProperty, className, ...resolvedVariantProps } = variantProps;

    if (
      mergedConfiguration.compoundVariants &&
      !Array.isArray(mergedConfiguration.compoundVariants)
    ) {
      throw new Error("compoundVariants must be an array");
    }

    if (mergedSlotDefinitions) {
      const compoundSlotClasses = applyCompoundSlotClasses(
        hasSlotConfiguration(mergedConfiguration) ? mergedConfiguration.compoundSlots : undefined,
        resolvedVariantProps as ConfigVariants<ConfigSchema>,
        mergedDefaultVariantProps as ConfigVariants<ConfigSchema>,
      );

      return createSlotFunctionFactory(
        mergedSlotDefinitions,
        mergedBaseClasses,
        mergedVariantGroups,
        mergedDefaultVariantProps as ConfigVariants<ConfigSchema>,
        mergedCompoundVariantGroups as
          | readonly CompoundVariantWithSlots<ConfigSchema, SlotSchema>[]
          | undefined,
        compoundSlotClasses,
        resolvedVariantProps as ConfigVariants<ConfigSchema>,
        shouldMergeClasses,
        tailwindMergeService,
      ) as unknown as S extends Record<string, never> ? string | undefined : TVReturnType<T, S>;
    } else {
      return handleRegularVariantResolution(
        mergedBaseClasses,
        mergedVariantGroups,
        mergedDefaultVariantProps as ConfigVariants<ConfigSchema>,
        mergedCompoundVariantGroups as readonly CompoundVariant<ConfigSchema>[] | undefined,
        resolvedVariantProps as ConfigVariants<ConfigSchema>,
        className ?? classProperty,
        shouldMergeClasses,
        tailwindMergeService,
      ) as unknown as S extends Record<string, never> ? string | undefined : TVReturnType<T, S>;
    }
  };

  const configuredVariantResolver = variantResolverFunction as VariantFunction<T, S>;

  Object.defineProperty(configuredVariantResolver, "config", {
    configurable: false,
    enumerable: false,
    value: mergedConfiguration,
    writable: false,
  });

  return configuredVariantResolver;
}

export function createTV(globalConfiguration: TVConfig = {}): TVFactoryResult {
  const { twMerge: shouldMergeClasses = true, twMergeConfig } = globalConfiguration;
  const tailwindMergeService = createTailwindMergeService(twMergeConfig);

  function tvFactory<T extends ConfigSchema>(
    configuration: Config<T>,
    localConfiguration?: TVConfig,
  ): VariantFunction<T, Record<string, never>>;

  function tvFactory<S extends SlotSchema>(
    configuration: ConfigWithSlots<Record<string, never>, S>,
    localConfiguration?: TVConfig,
  ): VariantFunction<Record<string, never>, S>;

  function tvFactory<T extends ConfigSchema, S extends SlotSchema>(
    configuration: ConfigWithSlots<T, S>,
    localConfiguration?: TVConfig,
  ): VariantFunction<T, S>;

  function tvFactory<
    TBase extends ConfigSchema,
    TExtension extends ConfigSchema,
    SBase extends SlotSchema,
    SExtension extends SlotSchema,
  >(
    configuration: ExtendedConfig<TBase, TExtension, SBase, SExtension>,
    localConfiguration?: TVConfig,
  ): VariantFunction<MergeSchemas<TBase, TExtension>, MergeSlotSchemas<SBase, SExtension>>;

  function tvFactory<T extends ConfigSchema, S extends SlotSchema>(
    configuration:
      | Config<T>
      | ConfigWithSlots<T, S>
      | ExtendedConfig<ConfigSchema, T, SlotSchema, S>,
    localConfiguration?: TVConfig,
  ): VariantFunction<T, S> {
    const mergedConfiguration = { ...globalConfiguration, ...localConfiguration };

    return tv(
      configuration satisfies
        | Config<T>
        | ConfigWithSlots<T, S>
        | ExtendedConfig<ConfigSchema, T, SlotSchema, S>,
      mergedConfiguration,
    ) as VariantFunction<T, S>;
  }

  const cnFunction = (...classes: ClassValue[]): string => {
    return shouldMergeClasses ? tailwindMergeService(cx(...classes)) : cx(...classes);
  };

  return {
    cn: cnFunction,
    tv: tvFactory,
  };
}
