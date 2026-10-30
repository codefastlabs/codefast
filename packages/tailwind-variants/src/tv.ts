/**
 * The package's public entry point: `tv` wraps a configuration in a resolver that reads it directly
 * at first, compiles it into a plan once it is called again, and runs that plan on every call after.
 */

import { twMerge } from "cn";

import { cn, createMergingCn, cx } from "#class-names";
import { toCallerClasses } from "#compile/class-values";
import { hasExtendConfig, hasSlotsConfig, mergeVariantConfigs } from "#compile/configuration";
import type { VariantPlan } from "#compile/plan";
import { compileVariantPlan } from "#compile/plan";
import { compileSelectionEncoder, UNENCODABLE } from "#compile/selection";
import type { ResolutionCache } from "#resolve/cache";
import { createResolutionCache } from "#resolve/cache";
import { createColdSlotResolvers, resolveColdVariantClasses } from "#resolve/cold";
import type { ClassDoor, FlatSelection } from "#resolve/flat-selection";
import { createClassDoor, createFlatSelection, resolveFlatSelectionWithClass } from "#resolve/flat-selection";
import { createSlotResolvers } from "#resolve/slots";
import { resolveVariantClasses } from "#resolve/variants";
import type {
  ClassMerger,
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
  VariantResolver,
} from "#types";

/** Shared stand-in for a call that passed no props, so the common case allocates nothing. */
const EMPTY_PROPS: Record<string, unknown> = {};

/** Shared answer for a configuration without variants, so defining one allocates no array. */
const NO_VARIANT_KEYS: ReadonlyArray<string> = [];

/** One resolver's selection encoder paired with the store it fills. */
interface ResolverMemo<Value> {
  readonly cache: ResolutionCache<Value>;
  readonly keyOf: (variantProps: Record<string, unknown>) => number | string;
}

/** Everything a resolver settles when it compiles: the plan, and the store for the lane it runs. */
interface CompiledResolver {
  /** Admits a caller's class string to a selection's pairs from its second sighting. */
  readonly flatDoor: ClassDoor | null;
  readonly flatMemo: ResolverMemo<FlatSelection | string> | null;
  readonly plan: VariantPlan;
  readonly slotMemo: ResolverMemo<Record<string, SlotClassResolver<VariantSchema>>> | null;
}

/** The caller classes a flat-lane entry remembers, which the store charges against its limit like entries. */
const countRememberedPairs = (entry: FlatSelection | string): number => {
  return typeof entry === "object" && entry.pairs !== null ? entry.pairs.size : 0;
};

/** The merge a `twMerge` option selects: `cn`'s by default, none for `false`, or the caller's own. */
const toClassMerger = (option: TailwindVariantsOptions["twMerge"]): ClassMerger | null => {
  if (option === false) {
    return null;
  }

  return option === undefined || option === true ? twMerge : option;
};

const compileResolver = (
  configuration: VariantConfig<VariantSchema> | SlotVariantConfig<VariantSchema, SlotSchema>,
  mergeClasses: ClassMerger | null,
  shouldCacheResolutions: boolean,
): CompiledResolver => {
  const plan = compileVariantPlan(configuration, mergeClasses);
  const encoder = shouldCacheResolutions ? compileSelectionEncoder(plan) : null;

  if (encoder === null) {
    return { flatDoor: null, flatMemo: null, plan, slotMemo: null };
  }

  return plan.slots === null
    ? {
        flatDoor: createClassDoor(),
        flatMemo: { cache: createResolutionCache(countRememberedPairs), keyOf: encoder.keyOf },
        plan,
        slotMemo: null,
      }
    : { flatDoor: null, flatMemo: null, plan, slotMemo: { cache: createResolutionCache(), keyOf: encoder.keyOf } };
};

/**
 * The caller's `class` and `className` as one key fragment, or `null` for a clsx-shaped value no key can carry.
 *
 * @remarks Tested before the selection is encoded: a call the cache can never answer should not pay
 * to find that out. Every falsy value contributes nothing, so it adds nothing to the key.
 */
const toCustomClassKey = (classValue: ClassValue, classNameValue: ClassValue): string | null => {
  if (!classValue) {
    return !classNameValue ? "" : typeof classNameValue === "string" ? classNameValue : null;
  }

  if (typeof classValue !== "string") {
    return null;
  }

  return !classNameValue ? classValue : typeof classNameValue === "string" ? classValue + " " + classNameValue : null;
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
  // Defaults, not the constraints, for an extension that omits `variants` or `slots`: with no
  // inference candidate a parameter falls back to its constraint, a string index that widens every
  // merged key. `BaseSlots` is always inferred from `extend`; it has a default only because the
  // parameter after it does.
  ExtensionVariants extends VariantSchema = Record<never, never>,
  BaseSlots extends SlotSchema = Record<never, never>,
  ExtensionSlots extends SlotSchema = Record<never, never>,
>(
  config: ExtendedVariantConfig<BaseVariants, ExtensionVariants, BaseSlots, ExtensionSlots>,
  tvConfig?: TailwindVariantsOptions,
): VariantResolver<MergedVariantSchema<BaseVariants, ExtensionVariants>, MergedSlotSchema<BaseSlots, ExtensionSlots>>;

/**
 * Wraps a configuration in a resolver that reads it directly once, then compiles it into a plan.
 *
 * @remarks The first calls resolve straight from the configuration — two without slots, one with them — so
 * a component rendered no more often never pays for a plan; the next call compiles, and every call after runs it.
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
  const { cacheResolutions: shouldCacheResolutions = true } = tvConfiguration;
  const mergeClasses = toClassMerger(tvConfiguration.twMerge);

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

  // Compiled on the third call without slots and the second with them, so a component rendered once or twice pays
  // for no plan it would not use; a cold slot call costs more than a compile.
  let compiled: CompiledResolver | null = null;
  let coldCallsLeft = slotConfiguration === null ? 2 : 1;

  // Typed as what the engine builds; the public, per-config result type is applied once, below.
  const variantResolverFunction = (
    variantProps?: VariantSelection<Variants>,
  ): string | Record<string, SlotClassResolver<VariantSchema>> => {
    const props = variantProps ?? EMPTY_PROPS;

    if (compiled === null) {
      if (coldCallsLeft > 0) {
        coldCallsLeft--;

        return slotConfiguration === null
          ? resolveColdVariantClasses(mergedConfiguration, mergeClasses, props)
          : createColdSlotResolvers(slotConfiguration, mergeClasses, props);
      }

      compiled = compileResolver(mergedConfiguration, mergeClasses, shouldCacheResolutions);
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
            return hit;
          }

          const resolvers = createSlotResolvers(plan, slots, props);

          memo.cache.set(selectionKey, resolvers);

          return resolvers;
        }
      }

      return createSlotResolvers(plan, slots, props);
    }

    const classValue = props.class as ClassValue;
    const classNameValue = props.className as ClassValue;
    const memo = compiled.flatMemo;
    const customClassKey = memo === null ? null : toCustomClassKey(classValue, classNameValue);

    if (memo !== null && customClassKey !== null) {
      const selectionKey = memo.keyOf(props);

      if (selectionKey !== UNENCODABLE) {
        // Keyed by the selection alone: its answer is stored as is, and becomes a record of the caller
        // classes it meets only once one arrives, so a hit builds no key and most selections hold a string.
        const hit = memo.cache.get(selectionKey);

        if (customClassKey === "") {
          if (hit === undefined) {
            const resolved = resolveVariantClasses(plan, props, undefined);

            memo.cache.set(selectionKey, resolved);

            return resolved;
          }

          return typeof hit === "string" ? hit : hit.merged;
        }

        let selection: FlatSelection;

        if (typeof hit === "object") {
          selection = hit;
        } else {
          selection = createFlatSelection(plan, props, hit);
          memo.cache.set(selectionKey, selection);
        }

        return resolveFlatSelectionWithClass(
          plan,
          memo.cache,
          compiled.flatDoor as ClassDoor,
          selection,
          customClassKey,
        );
      }
    }

    return resolveVariantClasses(plan, props, toCallerClasses(classValue, classNameValue));
  };

  const configuredVariantResolver = variantResolverFunction as VariantResolver<Variants, Slots>;
  const metadata = configuredVariantResolver as { config: unknown; variantKeys: unknown };

  // Plain stores: defining a property with attributes costs more than the rest of this call.
  metadata.config = mergedConfiguration;
  metadata.variantKeys =
    mergedConfiguration.variants === undefined ? NO_VARIANT_KEYS : Object.keys(mergedConfiguration.variants);

  return configuredVariantResolver;
}

/**
 * Creates a `tv` and a `cn` that share one set of options, so components need not repeat them.
 *
 * @since 0.3.16-canary.0
 */
export function createTV(globalConfiguration: TailwindVariantsOptions = {}): TailwindVariantsApi {
  const mergeClasses = toClassMerger(globalConfiguration.twMerge);

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
    // Defaults, not the constraints, for an extension that omits `variants` or `slots`: with no
    // inference candidate a parameter falls back to its constraint, a string index that widens every
    // merged key. `BaseSlots` is always inferred from `extend`; it has a default only because the
    // parameter after it does.
    ExtensionVariants extends VariantSchema = Record<never, never>,
    BaseSlots extends SlotSchema = Record<never, never>,
    ExtensionSlots extends SlotSchema = Record<never, never>,
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

  return {
    // The default engine's own `cn` already caches whole calls, so only a supplied merge needs our memo.
    cn: mergeClasses === null ? cx : mergeClasses === twMerge ? cn : createMergingCn(mergeClasses),
    tv: tvFactory,
  };
}
