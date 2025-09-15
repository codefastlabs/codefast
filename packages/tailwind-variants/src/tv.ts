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

import { applyCompoundSlots, applyCompoundVariants } from "@/compound";
import { mergeConfigs } from "@/config";
import { createSlotFunctions } from "@/slots";
import { createTailwindMerge, cx, hasExtend, hasSlots, isBooleanVariant } from "@/utils";

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

  if (mergedBase) {
    classes.push(mergedBase);
  }

  const keys = Object.keys(mergedVariants) as (keyof T)[];

  for (const key of keys) {
    const group = mergedVariants[key];
    const value = variantProps[key];

    let valueToUse: string | undefined;

    if (value !== undefined) {
      valueToUse = String(value);
    } else if (mergedDefaultVariants[key] !== undefined) {
      const defaultValue = mergedDefaultVariants[key];

      valueToUse = String(defaultValue);
    } else if (isBooleanVariant(group)) {
      valueToUse = "false";
    }

    if (valueToUse !== undefined && valueToUse in group) {
      classes.push(group[valueToUse]);
    }
  }

  if (mergedCompoundVariants) {
    const compoundClasses = applyCompoundVariants(
      mergedCompoundVariants,
      variantProps,
      mergedDefaultVariants,
    );

    classes.push(...compoundClasses);
  }

  if (className) {
    classes.push(className);
  }

  if (classes.length === 0) return;

  const classString = cx(...classes);

  return shouldMerge ? tailwindMerge(classString) : classString || undefined;
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
  config: Config<T> | ConfigWithSlots<T, S> | ExtendedConfig<ConfigSchema, T, SlotSchema, S>,
  tvConfig: TVConfig = {},
): VariantFunction<T, S> {
  const configWithType = config satisfies
    | Config<T>
    | ConfigWithSlots<T, S>
    | ExtendedConfig<ConfigSchema, T, SlotSchema, S>;

  const { twMerge: shouldMerge = true, twMergeConfig } = tvConfig;
  const tailwindMerge = createTailwindMerge(twMergeConfig);

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

    if (mergedConfig.compoundVariants && !Array.isArray(mergedConfig.compoundVariants)) {
      throw new Error("compoundVariants must be an array");
    }

    if (mergedSlots) {
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

  const tvFunctionWithConfig = tvFunction as VariantFunction<T, S>;

  Object.defineProperty(tvFunctionWithConfig, "config", {
    configurable: false,
    enumerable: false,
    value: mergedConfig,
    writable: false,
  });

  return tvFunctionWithConfig;
}

export function createTV(globalConfig: TVConfig = {}): TVFactoryResult {
  const { twMerge: shouldMerge = true, twMergeConfig } = globalConfig;
  const tailwindMerge = createTailwindMerge(twMergeConfig);

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

  const cnFunction = (...classes: ClassValue[]): string => {
    return shouldMerge ? tailwindMerge(cx(...classes)) : cx(...classes);
  };

  return {
    cn: cnFunction,
    tv: tvFactory,
  };
}
