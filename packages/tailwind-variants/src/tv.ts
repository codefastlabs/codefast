/**
 * The package's public entry point: `tv` wraps a configuration in a resolver that reads it directly
 * once, compiles it into a plan on its second call, and runs that plan on every call after.
 */

import { createTailwindMergeFn, cx } from "#/class-names";
import { hasExtendConfig, hasSlotsConfig, mergeVariantConfigs } from "#/compile/configuration";
import type { VariantPlan } from "#/compile/plan";
import { compileVariantPlan } from "#/compile/plan";
import { compileSelectionEncoder, UNENCODABLE } from "#/compile/selection";
import type { ResolutionCache } from "#/resolve/cache";
import { createResolutionCache } from "#/resolve/cache";
import { createColdSlotResolvers, resolveColdVariantClasses } from "#/resolve/cold";
import { createSlotResolvers } from "#/resolve/slots";
import { resolveVariantClasses } from "#/resolve/variants";
import type {
  ClassValue,
  SlotClassResolver,
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

/** Stored for a selection that resolves to no classes, so a miss stays distinguishable from it. */
const NO_CLASSES = null;

/** One resolver's selection encoder paired with the store it fills. */
interface ResolverMemo<Value> {
  readonly cache: ResolutionCache<Value>;
  readonly keyOf: (variantProps: Record<string, unknown>) => number;
}

/** Everything a resolver settles on its second call: the plan, and the store for the lane it runs. */
interface CompiledResolver {
  readonly flatMemo: ResolverMemo<string | typeof NO_CLASSES> | null;
  readonly plan: VariantPlan;
  readonly slotMemo: ResolverMemo<Record<string, SlotClassResolver<VariantSchema>>> | null;
}

const compileResolver = (
  configuration: VariantConfig<VariantSchema> | SlotVariantConfig<VariantSchema, SlotSchema>,
  shouldMerge: boolean,
  tailwindMerge: (classes: string) => string,
  shouldCacheResolutions: boolean,
): CompiledResolver => {
  const plan = compileVariantPlan(configuration, shouldMerge, tailwindMerge);
  const encoder = shouldCacheResolutions ? compileSelectionEncoder(plan, plan.slots !== null) : null;

  if (encoder === null) {
    return { flatMemo: null, plan, slotMemo: null };
  }

  return plan.slots === null
    ? { flatMemo: { cache: createResolutionCache(), keyOf: encoder.keyOf }, plan, slotMemo: null }
    : { flatMemo: null, plan, slotMemo: { cache: createResolutionCache(), keyOf: encoder.keyOf } };
};

/**
 * The caller's own classes as a key fragment, or `null` for a clsx-shaped value no key can carry.
 *
 * @remarks Tested before the selection is encoded: a call the cache can never answer should not pay
 * to find that out.
 */
const toCustomClassKey = (customClasses: ClassValue): string | null => {
  // Every falsy value contributes nothing, so they all share the selection's own key.
  if (!customClasses) {
    return "";
  }

  return typeof customClasses === "string" ? customClasses : null;
};

/**
 * Creates a class resolver for a component without slots.
 *
 * @since 0.3.16-canary.0
 */
export function tv<Variants extends VariantSchema = Record<never, never>>(
  config: VariantConfig<Variants>,
  tvConfig?: TailwindVariantsOptions,
): VariantResolver<Variants, Record<string, never>>;

/**
 * Creates a class resolver for a component whose slots carry all of its styling.
 *
 * @since 0.3.16-canary.0
 */
export function tv<Slots extends SlotSchema>(
  config: SlotVariantConfig<Record<string, never>, Slots>,
  tvConfig?: TailwindVariantsOptions,
): VariantResolver<Record<string, never>, Slots>;

/**
 * Creates a class resolver for a component with both variants and slots.
 *
 * @since 0.3.16-canary.0
 */
export function tv<Variants extends VariantSchema, Slots extends SlotSchema>(
  config: SlotVariantConfig<Variants, Slots>,
  tvConfig?: TailwindVariantsOptions,
): VariantResolver<Variants, Slots>;

/**
 * Creates a class resolver that extends another resolver's configuration.
 *
 * @since 0.3.16-canary.0
 */
export function tv<
  BaseVariants extends VariantSchema,
  ExtensionVariants extends VariantSchema,
  BaseSlots extends SlotSchema,
  ExtensionSlots extends SlotSchema,
>(
  config: ExtendedVariantConfig<BaseVariants, ExtensionVariants, BaseSlots, ExtensionSlots>,
  tvConfig?: TailwindVariantsOptions,
): VariantResolver<MergedVariantSchema<BaseVariants, ExtensionVariants>, MergedSlotSchema<BaseSlots, ExtensionSlots>>;

/**
 * Wraps a configuration in a resolver that reads it directly once, then compiles it into a plan.
 *
 * @remarks The first call resolves straight from the configuration, so a component defined and
 * rendered once never pays for a plan; the second call compiles, and every call after runs the plan.
 *
 * @since 0.3.16-canary.0
 */
export function tv<Variants extends VariantSchema, Slots extends SlotSchema>(
  configuration:
    | VariantConfig<Variants>
    | SlotVariantConfig<Variants, Slots>
    | ExtendedVariantConfig<VariantSchema, Variants, SlotSchema, Slots>,
  tvConfiguration: TailwindVariantsOptions = {},
): VariantResolver<Variants, Slots> {
  const {
    cacheResolutions: shouldCacheResolutions = true,
    twMerge: shouldMergeClasses = true,
    twMergeConfig,
  } = tvConfiguration;
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

  const slotConfiguration = hasSlotsConfig(mergedConfiguration) ? mergedConfiguration : null;

  // Compiled on the second call, so a component defined and rendered once pays for neither.
  let compiled: CompiledResolver | null = null;
  let isColdCall = true;

  const variantResolverFunction = (
    variantProps?: VariantSelection<Variants>,
  ): Slots extends Record<string, never> ? string | undefined : VariantResolverResult<Variants, Slots> => {
    const props = (variantProps ?? EMPTY_PROPS) as Record<string, unknown>;

    type Result = Slots extends Record<string, never> ? string | undefined : VariantResolverResult<Variants, Slots>;

    if (compiled === null) {
      if (isColdCall) {
        isColdCall = false;

        return (slotConfiguration === null
          ? resolveColdVariantClasses(mergedConfiguration, shouldMergeClasses, tailwindMergeFn, props)
          : createColdSlotResolvers(
              slotConfiguration,
              shouldMergeClasses,
              tailwindMergeFn,
              props,
            )) as unknown as Result;
      }

      compiled = compileResolver(mergedConfiguration, shouldMergeClasses, tailwindMergeFn, shouldCacheResolutions);
    }

    const plan = compiled.plan;
    const slots = plan.slots;

    if (slots !== null) {
      const memo = compiled.slotMemo;

      if (memo !== null) {
        const selectionKey = memo.keyOf(props);

        if (selectionKey !== UNENCODABLE) {
          const hit = memo.cache.get(selectionKey);

          if (hit !== undefined) {
            return hit as unknown as Result;
          }

          const resolvers = createSlotResolvers(plan, slots, props);

          memo.cache.set(selectionKey, resolvers);

          return resolvers as unknown as Result;
        }
      }

      return createSlotResolvers(plan, slots, props) as unknown as Result;
    }

    const className = props.className as ClassValue;
    const customClasses = className === undefined || className === null ? (props.class as ClassValue) : className;
    const memo = compiled.flatMemo;
    const customClassKey = memo === null ? null : toCustomClassKey(customClasses);

    if (memo !== null && customClassKey !== null) {
      const selectionKey = memo.keyOf(props);

      if (selectionKey !== UNENCODABLE) {
        const cacheKey = customClassKey === "" ? selectionKey : `${String(selectionKey)} ${customClassKey}`;
        const hit = memo.cache.get(cacheKey);

        if (hit !== undefined) {
          return (hit === NO_CLASSES ? undefined : hit) as unknown as Result;
        }

        const resolved = resolveVariantClasses(plan, props, customClasses);

        memo.cache.set(cacheKey, resolved ?? NO_CLASSES);

        return resolved as unknown as Result;
      }
    }

    return resolveVariantClasses(plan, props, customClasses) as unknown as Result;
  };

  const configuredVariantResolver = variantResolverFunction as VariantResolver<Variants, Slots>;

  // A plain store: defining the property with attributes costs more than the rest of this call.
  (configuredVariantResolver as { config: unknown }).config = mergedConfiguration;

  return configuredVariantResolver;
}

/**
 * Creates a `tv` and a `cn` that share one set of options, so components need not repeat them.
 *
 * @since 0.3.16-canary.0
 */
export function createTV(globalConfiguration: TailwindVariantsOptions = {}): TailwindVariantsApi {
  const { twMerge: shouldMergeClasses = true, twMergeConfig } = globalConfiguration;
  const tailwindMergeFn = createTailwindMergeFn(twMergeConfig);

  /** Creates a class resolver for a component without slots. */
  function tvFactory<Variants extends VariantSchema = Record<never, never>>(
    configuration: VariantConfig<Variants>,
    localConfiguration?: TailwindVariantsOptions,
  ): VariantResolver<Variants, Record<string, never>>;

  /** Creates a class resolver for a component whose slots carry all of its styling. */
  function tvFactory<Slots extends SlotSchema>(
    configuration: SlotVariantConfig<Record<string, never>, Slots>,
    localConfiguration?: TailwindVariantsOptions,
  ): VariantResolver<Record<string, never>, Slots>;

  /** Creates a class resolver for a component with both variants and slots. */
  function tvFactory<Variants extends VariantSchema, Slots extends SlotSchema>(
    configuration: SlotVariantConfig<Variants, Slots>,
    localConfiguration?: TailwindVariantsOptions,
  ): VariantResolver<Variants, Slots>;

  /** Creates a class resolver that extends another resolver's configuration. */
  function tvFactory<
    BaseVariants extends VariantSchema,
    ExtensionVariants extends VariantSchema,
    BaseSlots extends SlotSchema,
    ExtensionSlots extends SlotSchema,
  >(
    configuration: ExtendedVariantConfig<BaseVariants, ExtensionVariants, BaseSlots, ExtensionSlots>,
    localConfiguration?: TailwindVariantsOptions,
  ): VariantResolver<MergedVariantSchema<BaseVariants, ExtensionVariants>, MergedSlotSchema<BaseSlots, ExtensionSlots>>;

  /** Local options win over the shared ones. */
  function tvFactory<Variants extends VariantSchema, Slots extends SlotSchema>(
    configuration:
      | VariantConfig<Variants>
      | SlotVariantConfig<Variants, Slots>
      | ExtendedVariantConfig<VariantSchema, Variants, SlotSchema, Slots>,
    localConfiguration?: TailwindVariantsOptions,
  ): VariantResolver<Variants, Slots> {
    const mergedConfiguration = { ...globalConfiguration, ...localConfiguration };

    return tv(configuration, mergedConfiguration) as VariantResolver<Variants, Slots>;
  }

  const cnFunction = (...classes: Array<ClassValue>): string => {
    return shouldMergeClasses ? tailwindMergeFn(cx(...classes)) : cx(...classes);
  };

  return {
    cn: cnFunction,
    tv: tvFactory,
  };
}
