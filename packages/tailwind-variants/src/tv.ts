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

export function tv<T extends ConfigurationSchema>(
  config: Configuration<T>,
  tvConfig?: TailwindVariantsConfiguration,
): VariantFunctionType<T, Record<string, never>>;

export function tv<S extends SlotConfigurationSchema>(
  config: ConfigurationWithSlots<Record<string, never>, S>,
  tvConfig?: TailwindVariantsConfiguration,
): VariantFunctionType<Record<string, never>, S>;

export function tv<T extends ConfigurationSchema, S extends SlotConfigurationSchema>(
  config: ConfigurationWithSlots<T, S>,
  tvConfig?: TailwindVariantsConfiguration,
): VariantFunctionType<T, S>;

export function tv<
  TBase extends ConfigurationSchema,
  TExtension extends ConfigurationSchema,
  SBase extends SlotConfigurationSchema,
  SExtension extends SlotConfigurationSchema,
>(
  config: ExtendedConfiguration<TBase, TExtension, SBase, SExtension>,
  tvConfig?: TailwindVariantsConfiguration,
): VariantFunctionType<MergedSchemas<TBase, TExtension>, MergedSlotSchemas<SBase, SExtension>>;

export function tv<T extends ConfigurationSchema, S extends SlotConfigurationSchema>(
  configuration:
    | Configuration<T>
    | ConfigurationWithSlots<T, S>
    | ExtendedConfiguration<ConfigurationSchema, T, SlotConfigurationSchema, S>,
  tvConfiguration: TailwindVariantsConfiguration = {},
): VariantFunctionType<T, S> {
  const configurationWithType = configuration satisfies
    | Configuration<T>
    | ConfigurationWithSlots<T, S>
    | ExtendedConfiguration<ConfigurationSchema, T, SlotConfigurationSchema, S>;

  const { twMerge: shouldMergeClasses = true, twMergeConfig } = tvConfiguration;
  const tailwindMergeService = createTailwindMergeService(twMergeConfig);

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

  const mergedBaseClasses = mergedConfiguration.base;
  const mergedSlotDefinitions = hasSlotConfiguration(mergedConfiguration)
    ? mergedConfiguration.slots
    : undefined;
  const mergedVariantGroups = mergedConfiguration.variants ?? ({} as T);
  const mergedDefaultVariantProps =
    mergedConfiguration.defaultVariants ?? ({} as ConfigurationVariants<T>);
  const mergedCompoundVariantGroups = mergedConfiguration.compoundVariants;

  const variantResolverFunction = (
    variantProps: ConfigurationVariants<T> & { class?: ClassValue; className?: ClassValue } = {},
  ): S extends Record<string, never> ? string | undefined : TailwindVariantsReturnType<T, S> => {
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
      ) as unknown as S extends Record<string, never>
        ? string | undefined
        : TailwindVariantsReturnType<T, S>;
    }
  };

  const configuredVariantResolver = variantResolverFunction as VariantFunctionType<T, S>;

  Object.defineProperty(configuredVariantResolver, "config", {
    configurable: false,
    enumerable: false,
    value: mergedConfiguration,
    writable: false,
  });

  return configuredVariantResolver;
}

export function createTV(
  globalConfiguration: TailwindVariantsConfiguration = {},
): TailwindVariantsFactoryResult {
  const { twMerge: shouldMergeClasses = true, twMergeConfig } = globalConfiguration;
  const tailwindMergeService = createTailwindMergeService(twMergeConfig);

  function tvFactory<T extends ConfigurationSchema>(
    configuration: Configuration<T>,
    localConfiguration?: TailwindVariantsConfiguration,
  ): VariantFunctionType<T, Record<string, never>>;

  function tvFactory<S extends SlotConfigurationSchema>(
    configuration: ConfigurationWithSlots<Record<string, never>, S>,
    localConfiguration?: TailwindVariantsConfiguration,
  ): VariantFunctionType<Record<string, never>, S>;

  function tvFactory<T extends ConfigurationSchema, S extends SlotConfigurationSchema>(
    configuration: ConfigurationWithSlots<T, S>,
    localConfiguration?: TailwindVariantsConfiguration,
  ): VariantFunctionType<T, S>;

  function tvFactory<
    TBase extends ConfigurationSchema,
    TExtension extends ConfigurationSchema,
    SBase extends SlotConfigurationSchema,
    SExtension extends SlotConfigurationSchema,
  >(
    configuration: ExtendedConfiguration<TBase, TExtension, SBase, SExtension>,
    localConfiguration?: TailwindVariantsConfiguration,
  ): VariantFunctionType<MergedSchemas<TBase, TExtension>, MergedSlotSchemas<SBase, SExtension>>;

  function tvFactory<T extends ConfigurationSchema, S extends SlotConfigurationSchema>(
    configuration:
      | Configuration<T>
      | ConfigurationWithSlots<T, S>
      | ExtendedConfiguration<ConfigurationSchema, T, SlotConfigurationSchema, S>,
    localConfiguration?: TailwindVariantsConfiguration,
  ): VariantFunctionType<T, S> {
    const mergedConfiguration = { ...globalConfiguration, ...localConfiguration };

    return tv(
      configuration satisfies
        | Configuration<T>
        | ConfigurationWithSlots<T, S>
        | ExtendedConfiguration<ConfigurationSchema, T, SlotConfigurationSchema, S>,
      mergedConfiguration,
    ) as VariantFunctionType<T, S>;
  }

  const cnFunction = (...classes: ClassValue[]): string => {
    return shouldMergeClasses ? tailwindMergeService(cx(...classes)) : cx(...classes);
  };

  return {
    cn: cnFunction,
    tv: tvFactory,
  };
}
