/**
 * The model: configurations, variant selections, and the compiled shapes a plan holds.
 */

import type { ConfigExtension } from "tailwind-merge";

/**
 * The value a caller passes for one group key: `boolean` for a `"true"`/`"false"` key, the key itself otherwise.
 *
 * @since 0.3.16-canary.0
 */
export type VariantValue<Key> = Key extends "false" | "true" ? boolean : Key;

/**
 * Checks whether a variant group supports boolean values.
 *
 * This utility type determines whether a variant group has boolean keys
 * ("true" or "false"), indicating it supports boolean variant values.
 *
 * @since 0.3.16-canary.0
 */
export type HasBooleanVariant<Group extends Record<string, unknown>> = "true" extends keyof Group
  ? true
  : "false" extends keyof Group
    ? true
    : false;

/**
 * The variant props a resolver accepts, with `class` and `className` stripped, for a component's own props to extend.
 *
 * @remarks Read off the resolver's call signature rather than re-derived from its schema, so the
 * checker reuses the selection type it already built for the resolver instead of instantiating it again.
 *
 * @since 0.3.16-canary.0
 */
export type VariantProps<Component> = Component extends (props?: infer Props) => unknown
  ? Omit<Exclude<Props, undefined>, "class" | "className">
  : never;

/**
 * Base configuration schema for variant groups.
 *
 * This type defines the structure of variant configurations where each
 * variant group maps variant values to CSS class values.
 *
 * @since 0.3.16-canary.0
 */
export type VariantSchema = Record<string, Record<string, ClassValue>>;

/**
 * Configuration schema for component slots.
 *
 * This type defines the structure of slot configurations where each
 * slot name maps to CSS class values.
 *
 * @since 0.3.16-canary.0
 */
export type SlotSchema = Record<string, ClassValue>;

/**
 * Variant properties for a configuration schema.
 *
 * This type defines the properties that can be passed to variant functions,
 * including variant values and optional className/class properties.
 *
 * @remarks Each field admits an explicit `undefined` so a caller under `exactOptionalPropertyTypes`
 * can forward a possibly-undefined prop (`variant={variant}`) without omitting it.
 *
 * @since 0.3.16-canary.0
 */
export type VariantSelection<Variants extends VariantSchema> = {
  readonly [Variant in keyof VariantValues<Variants>]?: VariantValues<Variants>[Variant] | undefined;
} & {
  className?: ClassValue | undefined;
  class?: ClassValue | undefined;
};

/**
 * One value chosen per variant, with none of the class properties a call may also carry.
 *
 * @remarks This is what `defaultVariants` declares. Sharing the call-site type there would accept a
 * `className` the configuration has no use for.
 *
 * @since 0.6.0
 */
type VariantValues<Variants extends VariantSchema> = {
  readonly [Variant in keyof Variants]?: HasBooleanVariant<Variants[Variant]> extends true
    ? boolean | VariantValue<keyof Variants[Variant]>
    : VariantValue<keyof Variants[Variant]>;
};

/**
 * Properties for slot-based components.
 *
 * This type defines the properties that can be passed to slot functions,
 * allowing each slot to receive custom CSS classes.
 *
 * @since 0.3.16-canary.0
 */
export type SlotClassMap<Slots extends SlotSchema> = {
  readonly [Slot in keyof Slots]?: ClassValue;
};

/**
 * A class value with no bare object form, so the only object a slot configuration takes is a map.
 *
 * @since 0.6.0
 */
type PlainClassValue = ReadonlyArray<PlainClassValue> | bigint | boolean | null | number | string | undefined;

/**
 * What one variant value carries in a slot configuration: classes for the base slot, or a map
 * naming the slots it targets.
 *
 * @remarks Resolution reads any object here as slot names, never as clsx conditions, so the type
 * says the same. `base` is admitted whether or not the configuration declares it, because the plan
 * synthesises it as slot position zero either way.
 *
 * @since 0.6.0
 */
type SlotClassValue<Slots extends SlotSchema> = PlainClassValue | (SlotClassMap<Slots> & { base?: ClassValue });

/**
 * A variant schema whose object values name slots rather than clsx conditions.
 *
 * @since 0.6.0
 */
type SlotVariantSchema<Slots extends SlotSchema> = Record<string, Record<string, SlotClassValue<Slots>>>;

/**
 * Type for compound variant definitions.
 *
 * This type defines the structure of compound variants, which apply
 * additional classes when multiple variant conditions are met.
 *
 * @since 0.3.16-canary.0
 */
export type CompoundVariant<Variants extends VariantSchema> = Partial<{
  readonly [Variant in keyof Variants]: HasBooleanVariant<Variants[Variant]> extends true
    ? boolean | ReadonlyArray<boolean | VariantValue<keyof Variants[Variant]>> | VariantValue<keyof Variants[Variant]>
    : ReadonlyArray<VariantValue<keyof Variants[Variant]>> | VariantValue<keyof Variants[Variant]>;
}> & {
  className?: ClassValue;
  class?: ClassValue;
};

/**
 * Type for compound variants that support slots.
 *
 * This type extends compound variants to support slot-based class definitions,
 * allowing different classes to be applied to different slots.
 *
 * @since 0.3.16-canary.0
 */
export type SlotCompoundVariant<Variants extends VariantSchema, Slots extends SlotSchema> = Partial<{
  readonly [Variant in keyof Variants]: HasBooleanVariant<Variants[Variant]> extends true
    ? boolean | ReadonlyArray<boolean | VariantValue<keyof Variants[Variant]>> | VariantValue<keyof Variants[Variant]>
    : ReadonlyArray<VariantValue<keyof Variants[Variant]>> | VariantValue<keyof Variants[Variant]>;
}> & {
  className?: ClassValue | SlotClassMap<Slots>;
  class?: ClassValue | SlotClassMap<Slots>;
};

/**
 * Type for compound slot definitions.
 *
 * This type defines compound slots that apply classes to specific slots
 * when certain variant conditions are met.
 *
 * @since 0.3.16-canary.0
 */
export type CompoundSlot<Variants extends VariantSchema, Slots extends SlotSchema> =
  Variants extends Record<string, never>
    ? {
        readonly slots: ReadonlyArray<keyof Slots>;
        className?: ClassValue;
        class?: ClassValue;
      }
    : {
        readonly slots: ReadonlyArray<keyof Slots>;
        className?: ClassValue;
        class?: ClassValue;
      } & {
        readonly [K in keyof Variants]?: HasBooleanVariant<Variants[K]> extends true
          ? boolean | VariantValue<keyof Variants[K]>
          : VariantValue<keyof Variants[K]>;
      };

/**
 * Base configuration interface for variant functions.
 *
 * This interface defines the structure of variant configurations,
 * including base classes, variants, default values, and compound variants.
 *
 * @since 0.3.16-canary.0
 */
export interface VariantConfig<Variants extends VariantSchema> {
  /** Classes every call starts from, before any variant contributes. */
  readonly base?: ClassValue;
  /** Classes applied when a call selects every listed value at once; an array lists alternatives. */
  readonly compoundVariants?: ReadonlyArray<CompoundVariant<NoInfer<Variants>>>;
  /** The value each variant takes when a call omits it; a boolean group reads as `false` otherwise. */
  readonly defaultVariants?: VariantValues<NoInfer<Variants>>;
  /** Each variant name mapped to the values a call may pick, and the classes each value contributes. */
  readonly variants?: Variants;
}

/**
 * Configuration interface for slot-based components.
 *
 * This interface extends the base configuration to include slot definitions
 * and slot-specific compound variants.
 *
 * @since 0.3.16-canary.0
 */
export interface SlotVariantConfig<Variants extends VariantSchema, Slots extends SlotSchema> {
  /** Classes of the `base` slot when `slots` declares none of its own. */
  readonly base?: ClassValue;
  /** Classes applied to the named slots at once when a call selects every listed value. */
  readonly compoundSlots?: ReadonlyArray<CompoundSlot<NoInfer<Variants>, NoInfer<Slots>>>;
  /** Classes applied when a call selects every listed value at once; a slot map targets slots individually. */
  readonly compoundVariants?: ReadonlyArray<SlotCompoundVariant<NoInfer<Variants>, NoInfer<Slots>>>;
  /** The value each variant takes when a call omits it; a boolean group reads as `false` otherwise. */
  readonly defaultVariants?: VariantValues<NoInfer<Variants>>;
  /** Each slot name mapped to the classes it starts from; `base` is resolved whether or not it is declared. */
  readonly slots?: Slots;
  /** Each variant name mapped to its values, each contributing a plain value to `base` or a map to named slots. */
  readonly variants?: SlotVariantSchema<NoInfer<Slots>> & Variants;
}

/**
 * Runtime options for Tailwind Variants.
 *
 * This interface defines global configuration options that affect
 * how Tailwind Variants processes and merges CSS classes.
 *
 * @since 0.3.16-canary.0
 */
export interface TailwindVariantsOptions {
  /**
   * Answers a repeated variant selection from what the resolver already produced.
   *
   * @remarks Turn this off for a component whose selections are effectively unique per call, where
   * the store would fill with entries nothing reads again.
   *
   * @defaultValue true
   */
  readonly cacheResolutions?: boolean;
  /**
   * Resolves Tailwind conflicts in every answer with `tailwind-merge`, so a later class wins over an earlier one.
   *
   * @defaultValue true
   */
  readonly twMerge?: boolean;
  /** A `tailwind-merge` extension for custom class groups; one merge function is built per configuration object. */
  readonly twMergeConfig?: ConfigExtension<string, string>;
}

/**
 * Type for individual slot functions.
 *
 * This type defines the signature of functions that generate CSS classes
 * for individual component slots.
 *
 * @since 0.3.16-canary.0
 */
export type SlotClassResolver<Variants extends VariantSchema> = (
  props?: SlotResolverProps<Variants>,
) => string | undefined;

/**
 * Properties that can be passed to slot functions.
 *
 * This type defines the properties that can be passed to individual
 * slot functions, including variant props and class properties.
 *
 * @since 0.3.16-canary.0
 */
export type SlotResolverProps<Variants extends VariantSchema> =
  Variants extends Record<string, never>
    ? {
        className?: ClassValue;
        class?: ClassValue;
      }
    : {
        readonly [K in keyof VariantSelection<Variants>]?: VariantSelection<Variants>[K];
      };

/**
 * Return type for variant functions.
 *
 * This type defines the return type of variant functions, which can be
 * either a single function (for non-slot components) or an object with
 * slot functions (for slot-based components).
 *
 * @since 0.3.16-canary.0
 */
export type VariantResolverResult<Variants extends VariantSchema, Slots extends SlotSchema> = keyof Slots extends never
  ? SlotClassResolver<Variants>
  : {
      readonly [K in keyof Slots]: SlotClassResolver<Variants>;
    } & {
      readonly base: SlotClassResolver<Variants>;
    };

/**
 * Main variant function type.
 *
 * This interface defines the structure of variant functions created by the tv function.
 * It includes the configuration and the function signature for generating CSS classes.
 *
 * @since 0.3.16-canary.0
 */
export interface VariantResolver<Variants extends VariantSchema, Slots extends SlotSchema = SlotSchema> {
  /** The configuration this resolver runs, with any `extend` chain already merged in; what `extend` reads. */
  config: VariantConfig<Variants> | SlotVariantConfig<Variants, Slots>;

  (
    props?: VariantSelection<Variants>,
  ): Slots extends Record<string, never> ? string | undefined : VariantResolverResult<Variants, Slots>;
}

/**
 * Factory function interface for creating variant functions.
 *
 * This interface defines the overloaded factory function that can create
 * variant functions with different configuration types and options.
 *
 * @since 0.3.16-canary.0
 */
export interface TailwindVariantsFactory {
  <Variants extends VariantSchema>(
    config: VariantConfig<Variants>,
    localConfig?: TailwindVariantsOptions,
  ): VariantResolver<Variants, Record<string, never>>;

  <Slots extends SlotSchema>(
    config: SlotVariantConfig<Record<string, never>, Slots>,
    localConfig?: TailwindVariantsOptions,
  ): VariantResolver<Record<string, never>, Slots>;

  <Variants extends VariantSchema, Slots extends SlotSchema>(
    config: SlotVariantConfig<Variants, Slots>,
    localConfig?: TailwindVariantsOptions,
  ): VariantResolver<Variants, Slots>;

  <
    BaseVariants extends VariantSchema,
    ExtensionVariants extends VariantSchema,
    BaseSlots extends SlotSchema,
    ExtensionSlots extends SlotSchema,
  >(
    config: ExtendedVariantConfig<BaseVariants, ExtensionVariants, BaseSlots, ExtensionSlots>,
    localConfig?: TailwindVariantsOptions,
  ): VariantResolver<MergedVariantSchema<BaseVariants, ExtensionVariants>, MergedSlotSchema<BaseSlots, ExtensionSlots>>;
}

/**
 * Result interface for the createTV factory function.
 *
 * This interface defines the object returned by createTV, which includes
 * both the tv factory function and the cn utility function.
 *
 * @since 0.3.16-canary.0
 */
export interface TailwindVariantsApi {
  cn: (...classes: Array<ClassValue>) => string;
  tv: TailwindVariantsFactory;
}

/**
 * Type for merged configuration schemas.
 *
 * This utility type merges two configuration schemas into a single type,
 * combining all variant groups from both schemas.
 *
 * @since 0.3.16-canary.0
 */
export type MergedVariantSchema<
  BaseVariants extends VariantSchema,
  ExtensionVariants extends VariantSchema,
> = BaseVariants & ExtensionVariants;

/**
 * Type for merged slot configuration schemas.
 *
 * This utility type merges two slot configuration schemas into a single type,
 * combining all slot definitions from both schemas.
 *
 * @since 0.3.16-canary.0
 */
export type MergedSlotSchema<BaseSlots extends SlotSchema, ExtensionSlots extends SlotSchema> = BaseSlots &
  ExtensionSlots;

/**
 * Configuration interface for extending existing variant resolvers.
 *
 * This interface allows extending an existing variant configuration with
 * additional variants and slots, while maintaining type safety.
 *
 * @since 0.3.16-canary.0
 */
export interface ExtendedVariantConfig<
  BaseVariants extends VariantSchema,
  ExtensionVariants extends VariantSchema,
  BaseSlots extends SlotSchema,
  ExtensionSlots extends SlotSchema,
> {
  /** Classes appended after the extended resolver's own base classes. */
  readonly base?: ClassValue;
  /** Compound slots added after the extended resolver's, over the merged variants and slots. */
  readonly compoundSlots?: ReadonlyArray<
    CompoundSlot<MergedVariantSchema<BaseVariants, ExtensionVariants>, MergedSlotSchema<BaseSlots, ExtensionSlots>>
  >;
  /** Compound variants added after the extended resolver's, over the merged variants and slots. */
  readonly compoundVariants?: ReadonlyArray<
    SlotCompoundVariant<
      MergedVariantSchema<BaseVariants, ExtensionVariants>,
      MergedSlotSchema<BaseSlots, ExtensionSlots>
    >
  >;
  /** Defaults that override the extended resolver's, over the merged variants. */
  readonly defaultVariants?: VariantValues<MergedVariantSchema<BaseVariants, ExtensionVariants>>;
  /**
   * The resolver whose configuration this one inherits. Required: made optional, this overload
   * would catch every configuration the earlier ones reject and widen every variant name to `string`.
   */
  readonly extend: VariantResolver<BaseVariants, BaseSlots>;
  /** Slots added to, or replacing, the extended resolver's. */
  readonly slots?: ExtensionSlots;
  /** Variants added to the extended resolver's; a group declared by both merges value by value. */
  readonly variants?: ExtensionVariants;
}

/**
 * Anything accepted where classes are expected.
 *
 * @remarks Declared here rather than re-exported, so the package carries no runtime dependency of
 * its own. The shape is the one consumers already pass — `bigint` included, though nothing
 * contributes it.
 *
 * @since 0.3.16-canary.0
 */
export type ClassValue = ClassArray | ClassDictionary | bigint | boolean | null | number | string | undefined;

/**
 * Class names keyed by the condition that includes them.
 *
 * @since 0.6.0
 */
type ClassDictionary = Record<string, unknown>;

/**
 * Class values nested to any depth.
 *
 * @since 0.6.0
 */
type ClassArray = Array<ClassValue>;
