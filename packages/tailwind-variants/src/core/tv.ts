/**
 * Tailwind Variants Core Implementation
 *
 * This module contains the main implementation of the Tailwind Variants system.
 * It provides functions to create variant-based styling functions with support
 * for slots, compound variants, and configuration merging.
 */

import { mergeVariantConfigs } from "#/core/config";
import type { VariantPlan } from "#/core/plan";
import { compileVariantPlan } from "#/core/plan";
import { matchesCompoundConditions } from "#/processing/compound";
import { createSlotResolvers } from "#/processing/slots";
import type {
  ClassValue,
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
import { createTailwindMergeFn, cx, hasExtendConfig, toClassText, toVariantKey } from "#/utilities/utils";

/** Shared stand-in for a call that passed no props, so the common case allocates nothing. */
const EMPTY_PROPS: Record<string, unknown> = {};

/**
 * Resolve classes for a configuration without slots.
 *
 * @remarks Such a configuration compiles every class value to a string, so the plan's per-slot form
 * cannot reach here — which is what the casts below rely on.
 *
 * @param customClasses - The `className`/`class` prop, appended after everything the config contributes
 */
const resolveVariantClasses = (
  plan: VariantPlan,
  variantProps: Record<string, unknown>,
  customClasses: ClassValue,
): string | undefined => {
  let text = plan.base;

  for (const entry of plan.entries) {
    const selected = variantProps[entry.name];
    let classes: string | undefined;

    if (selected === undefined) {
      classes = entry.defaultClasses as string | undefined;
    } else {
      const key = toVariantKey(selected);

      classes = key === undefined ? undefined : (entry.group[key] as string | undefined);
    }

    if (classes) {
      text = text === "" ? classes : text + " " + classes;
    }
  }

  for (const compound of plan.compounds) {
    if (!matchesCompoundConditions(compound.conditions, variantProps, null)) {
      continue;
    }

    const classes = compound.classes as string;

    if (classes) {
      text = text === "" ? classes : text + " " + classes;
    }
  }

  if (customClasses) {
    const classes = toClassText(customClasses);

    if (classes) {
      text = text === "" ? classes : text + " " + classes;
    }
  }

  if (text === "") {
    return undefined;
  }

  return plan.shouldMerge ? plan.tailwindMerge(text) : text;
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
export function tv<T extends VariantSchema = Record<never, never>>(
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
  configuration: VariantConfig<T> | SlotVariantConfig<T, S> | ExtendedVariantConfig<VariantSchema, T, SlotSchema, S>,
  tvConfiguration: TailwindVariantsOptions = {},
): VariantResolver<T, S> {
  const { twMerge: shouldMergeClasses = true, twMergeConfig } = tvConfiguration;
  const tailwindMergeFn = createTailwindMergeFn(twMergeConfig);

  const mergedConfiguration: VariantConfig<VariantSchema> | SlotVariantConfig<VariantSchema, SlotSchema> =
    hasExtendConfig(configuration)
      ? mergeVariantConfigs(
          configuration.extend.config,
          configuration as VariantConfig<VariantSchema> | SlotVariantConfig<VariantSchema, SlotSchema>,
        )
      : (configuration as VariantConfig<VariantSchema> | SlotVariantConfig<VariantSchema, SlotSchema>);

  if (mergedConfiguration.compoundVariants && !Array.isArray(mergedConfiguration.compoundVariants)) {
    throw new Error("compoundVariants must be an array");
  }

  const plan = compileVariantPlan(mergedConfiguration, shouldMergeClasses, tailwindMergeFn);
  const slots = plan.slots;

  const variantResolverFunction = (
    variantProps?: VariantSelection<T>,
  ): S extends Record<string, never> ? string | undefined : VariantResolverResult<T, S> => {
    const props = (variantProps ?? EMPTY_PROPS) as Record<string, unknown>;

    if (slots !== null) {
      return createSlotResolvers(plan, slots, props) as unknown as S extends Record<string, never>
        ? string | undefined
        : VariantResolverResult<T, S>;
    }

    const className = props.className as ClassValue;

    return resolveVariantClasses(
      plan,
      props,
      className === undefined || className === null ? (props.class as ClassValue) : className,
    ) as unknown as S extends Record<string, never> ? string | undefined : VariantResolverResult<T, S>;
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
  function tvFactory<T extends VariantSchema = Record<never, never>>(
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
    configuration: VariantConfig<T> | SlotVariantConfig<T, S> | ExtendedVariantConfig<VariantSchema, T, SlotSchema, S>,
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
