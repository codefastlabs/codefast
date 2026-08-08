/**
 * The package's public entry point: `tv` compiles a configuration into a plan, and the resolver it
 * returns runs that plan against one set of props.
 */

import { createTailwindMergeFn, cx } from "#/class-names";
import { hasExtendConfig, mergeVariantConfigs } from "#/compile/configuration";
import { compileVariantPlan } from "#/compile/plan";
import { createSlotResolvers } from "#/resolve/slots";
import { resolveVariantClasses } from "#/resolve/variants";
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
} from "#/types";

/** Shared stand-in for a call that passed no props, so the common case allocates nothing. */
const EMPTY_PROPS: Record<string, unknown> = {};

/**
 * Create a class resolver for a component without slots.
 *
 * @since 0.3.16-canary.0
 */
export function tv<T extends VariantSchema = Record<never, never>>(
  config: VariantConfig<T>,
  tvConfig?: TailwindVariantsOptions,
): VariantResolver<T, Record<string, never>>;

/**
 * Create a class resolver for a component whose slots carry all of its styling.
 *
 * @since 0.3.16-canary.0
 */
export function tv<S extends SlotSchema>(
  config: SlotVariantConfig<Record<string, never>, S>,
  tvConfig?: TailwindVariantsOptions,
): VariantResolver<Record<string, never>, S>;

/**
 * Create a class resolver for a component with both variants and slots.
 *
 * @since 0.3.16-canary.0
 */
export function tv<T extends VariantSchema, S extends SlotSchema>(
  config: SlotVariantConfig<T, S>,
  tvConfig?: TailwindVariantsOptions,
): VariantResolver<T, S>;

/**
 * Create a class resolver that extends another resolver's configuration.
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
 * Compile a configuration into a plan, and return the resolver that runs it.
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
 * Create a `tv` and a `cn` that share one set of options, so components need not repeat them.
 *
 * @since 0.3.16-canary.0
 */
export function createTV(globalConfiguration: TailwindVariantsOptions = {}): TailwindVariantsApi {
  const { twMerge: shouldMergeClasses = true, twMergeConfig } = globalConfiguration;
  const tailwindMergeFn = createTailwindMergeFn(twMergeConfig);

  /** Create a class resolver for a component without slots. */
  function tvFactory<T extends VariantSchema = Record<never, never>>(
    configuration: VariantConfig<T>,
    localConfiguration?: TailwindVariantsOptions,
  ): VariantResolver<T, Record<string, never>>;

  /** Create a class resolver for a component whose slots carry all of its styling. */
  function tvFactory<S extends SlotSchema>(
    configuration: SlotVariantConfig<Record<string, never>, S>,
    localConfiguration?: TailwindVariantsOptions,
  ): VariantResolver<Record<string, never>, S>;

  /** Create a class resolver for a component with both variants and slots. */
  function tvFactory<T extends VariantSchema, S extends SlotSchema>(
    configuration: SlotVariantConfig<T, S>,
    localConfiguration?: TailwindVariantsOptions,
  ): VariantResolver<T, S>;

  /** Create a class resolver that extends another resolver's configuration. */
  function tvFactory<
    TBase extends VariantSchema,
    TExtension extends VariantSchema,
    SBase extends SlotSchema,
    SExtension extends SlotSchema,
  >(
    configuration: ExtendedVariantConfig<TBase, TExtension, SBase, SExtension>,
    localConfiguration?: TailwindVariantsOptions,
  ): VariantResolver<MergedVariantSchema<TBase, TExtension>, MergedSlotSchema<SBase, SExtension>>;

  /** Local options win over the shared ones. */
  function tvFactory<T extends VariantSchema, S extends SlotSchema>(
    configuration: VariantConfig<T> | SlotVariantConfig<T, S> | ExtendedVariantConfig<VariantSchema, T, SlotSchema, S>,
    localConfiguration?: TailwindVariantsOptions,
  ): VariantResolver<T, S> {
    const mergedConfiguration = { ...globalConfiguration, ...localConfiguration };

    return tv(configuration, mergedConfiguration) as VariantResolver<T, S>;
  }

  const cnFunction = (...classes: Array<ClassValue>): string => {
    return shouldMergeClasses ? tailwindMergeFn(cx(...classes)) : cx(...classes);
  };

  return {
    cn: cnFunction,
    tv: tvFactory,
  };
}
