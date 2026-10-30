/**
 * The model: configurations, variant selections, and the compiled shapes a plan holds.
 */

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
  readonly [Variant in keyof Variants]?: VariantValue<keyof Variants[Variant]>;
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
 * The variant values a compound matches, each a single value or an array of alternatives.
 */
type CompoundCondition<Variants extends VariantSchema> = {
  readonly [Variant in keyof Variants]?:
    | ReadonlyArray<VariantValue<keyof Variants[Variant]>>
    | VariantValue<keyof Variants[Variant]>;
};

/**
 * Classes applied when a call selects every listed value at once.
 *
 * @since 0.3.16-canary.0
 */
export type CompoundVariant<Variants extends VariantSchema> = CompoundCondition<Variants> & {
  className?: ClassValue;
  class?: ClassValue;
};

/**
 * Classes applied when a call selects every listed value at once, either to the base slot or to the slots a map names.
 *
 * @since 0.3.16-canary.0
 */
export type SlotCompoundVariant<
  Variants extends VariantSchema,
  Slots extends SlotSchema,
> = CompoundCondition<Variants> & {
  className?: SlotClassValue<Slots>;
  class?: SlotClassValue<Slots>;
};

/**
 * Classes applied to each of the listed slots when a call selects every listed value at once.
 *
 * @since 0.3.16-canary.0
 */
export type CompoundSlot<Variants extends VariantSchema, Slots extends SlotSchema> = CompoundCondition<Variants> & {
  readonly slots: ReadonlyArray<keyof Slots>;
  className?: ClassValue;
  class?: ClassValue;
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
 * The configuration keys a `tv` overload declares absent, so a configuration held in a variable selects it only
 * when it leaves them out, exactly as a fresh literal would.
 */
export type AbsentKeys<Key extends PropertyKey> = { readonly [Name in Key]?: undefined };

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
   * Resolves Tailwind conflicts in every answer, so a later class wins over an earlier one.
   *
   * @remarks `true` merges with the `cn` engine's `twMerge`, `false` keeps every declared class, and a function
   * replaces the merge — an `extendTailwindMerge` result from `cn/config` for custom class groups, or another engine.
   *
   * @defaultValue true
   */
  readonly twMerge?: boolean | ClassMerger | undefined;
}

/**
 * A function that resolves Tailwind conflicts in one space-separated class string.
 */
export type ClassMerger = (classes: string) => string;

/**
 * The function that resolves one slot's classes, optionally for its own variant selection.
 *
 * @since 0.3.16-canary.0
 */
export type SlotClassResolver<Variants extends VariantSchema> = (props?: SlotResolverProps<Variants>) => string;

/**
 * The props a slot resolver takes: the same selection the component call does.
 *
 * @since 0.3.16-canary.0
 */
export type SlotResolverProps<Variants extends VariantSchema> = VariantSelection<Variants>;

/**
 * What a resolver call returns: a class string without slots, or one resolver per slot, `base` included.
 *
 * @since 0.3.16-canary.0
 */
export type VariantResolverResult<Variants extends VariantSchema, Slots extends SlotSchema> = keyof Slots extends never
  ? string
  : SlotClassResolvers<Variants, Slots>;

/**
 * One class resolver per slot, `base` included.
 */
type SlotClassResolvers<Variants extends VariantSchema, Slots extends SlotSchema> = {
  readonly [Slot in keyof Slots]: SlotClassResolver<Variants>;
} & {
  readonly base: SlotClassResolver<Variants>;
};

/**
 * The resolver `tv` returns: a function from a variant selection to classes, carrying the configuration it runs.
 *
 * @remarks Empty `Slots` select the shape without slots. A conditional over two shapes rather than one generic
 * interface, so the two are compared by what a call returns, never assumed assignable from their slot schemas.
 *
 * @since 0.3.16-canary.0
 */
export type VariantResolver<
  Variants extends VariantSchema,
  Slots extends SlotSchema = Record<never, never>,
> = keyof Slots extends never ? FlatVariantResolver<Variants> : SlottedVariantResolver<Variants, Slots>;

/**
 * The resolver of a component without slots, which answers a call with one class string.
 */
export interface FlatVariantResolver<Variants extends VariantSchema> {
  /** The configuration this resolver runs, with any `extend` chain already merged in; what `extend` reads. */
  readonly config: VariantConfig<Variants>;
  /** The variant names in declaration order, an extended resolver's first, for splitting props by hand. */
  readonly variantKeys: ReadonlyArray<Extract<keyof Variants, string>>;

  /** Resolves the classes of one variant selection. */
  (props?: VariantSelection<Variants>): string;
}

/**
 * The resolver of a component with slots, which answers a call with one class resolver per slot.
 */
export interface SlottedVariantResolver<Variants extends VariantSchema, Slots extends SlotSchema> {
  /** The configuration this resolver runs, with any `extend` chain already merged in; what `extend` reads. */
  readonly config: SlotVariantConfig<Variants, Slots>;
  /** The variant names in declaration order, an extended resolver's first, for splitting props by hand. */
  readonly variantKeys: ReadonlyArray<Extract<keyof Variants, string>>;

  /**
   * Resolves one variant selection to a class resolver per slot, each of which may refine it.
   *
   * @remarks `NoInfer` stops a resolver without slots, matched against this shape when `extend` is inferred, from
   * having its class string read as a slot map.
   */
  (props?: VariantSelection<Variants>): SlotClassResolvers<Variants, NoInfer<Slots>>;
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
 * The variant schema an extension may add: slot maps when the merged component has slots, clsx values otherwise.
 */
type ExtensionVariantSchema<Slots extends SlotSchema> = keyof Slots extends never ? unknown : SlotVariantSchema<Slots>;

/**
 * The compound variant an extension may add: slot-aware when the merged component has slots.
 */
type ExtensionCompoundVariant<Variants extends VariantSchema, Slots extends SlotSchema> = keyof Slots extends never
  ? CompoundVariant<Variants>
  : SlotCompoundVariant<Variants, Slots>;

/**
 * The configuration of a component that extends another resolver's.
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
  /*
   * The compounds and defaults read the merged schema but never define it: `NoInfer` keeps them from
   * becoming an inference site, which would widen the extension's schema to a string index.
   */
  /** Compound slots added after the extended resolver's, over the merged variants and slots. */
  readonly compoundSlots?: ReadonlyArray<
    CompoundSlot<
      NoInfer<MergedVariantSchema<BaseVariants, ExtensionVariants>>,
      NoInfer<MergedSlotSchema<BaseSlots, ExtensionSlots>>
    >
  >;
  /** Compound variants added after the extended resolver's, over the merged variants and slots. */
  readonly compoundVariants?: ReadonlyArray<
    ExtensionCompoundVariant<
      NoInfer<MergedVariantSchema<BaseVariants, ExtensionVariants>>,
      NoInfer<MergedSlotSchema<BaseSlots, ExtensionSlots>>
    >
  >;
  /** Defaults that override the extended resolver's, over the merged variants. */
  readonly defaultVariants?: VariantValues<NoInfer<MergedVariantSchema<BaseVariants, ExtensionVariants>>>;
  /**
   * The resolver whose configuration this one inherits. Required: made optional, this overload
   * would catch every configuration the earlier ones reject and widen every variant name to `string`.
   */
  readonly extend: FlatVariantResolver<BaseVariants> | SlottedVariantResolver<BaseVariants, BaseSlots>;
  /** Slots added to, or replacing, the extended resolver's. */
  readonly slots?: ExtensionSlots;
  /** Variants added to the extended resolver's; a group declared by both merges value by value. */
  readonly variants?: ExtensionVariantSchema<NoInfer<MergedSlotSchema<BaseSlots, ExtensionSlots>>> & ExtensionVariants;
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
type ClassArray = ReadonlyArray<ClassValue>;
