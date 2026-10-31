/**
 * The model: configurations, variant selections, and the compiled shapes a plan holds.
 */

/**
 * The value a caller passes for one group key: `boolean` for a `"true"`/`"false"` key, the key itself otherwise.
 *
 * @remarks A numeric key is admitted in both spellings, `1` and `"1"`, because resolution reads both as the same
 * property name.
 *
 * @since 0.3.16-canary.0
 */
export type VariantValue<Key> = Key extends "false" | "true"
  ? boolean
  : Key extends number
    ? Key | `${Key}`
    : Key extends `${infer Numeric extends number}`
      ? Key | Numeric
      : Key;

/**
 * The variant props a resolver accepts, with `class` and `className` stripped, for a component's own props to extend.
 *
 * @remarks Read off the resolver's call signature rather than re-derived from its schema, so the
 * checker reuses the selection type it already built for the resolver instead of instantiating it again.
 *
 * @since 0.3.16-canary.0
 */
export type VariantProps<Resolver> = Resolver extends (props?: infer Props) => unknown
  ? Omit<Exclude<Props, undefined>, "class" | "className">
  : never;

/**
 * Each variant name mapped to its values, and each value to the classes it contributes.
 *
 * @since 0.3.16-canary.0
 */
export type VariantSchema = Record<string, Record<string, ClassValue>>;

/**
 * Each slot name mapped to the classes it starts from.
 *
 * @since 0.3.16-canary.0
 */
export type SlotSchema = Record<string, ClassValue>;

/**
 * The props a resolver call takes: one value per variant, plus the caller's own classes.
 *
 * @remarks Each field admits an explicit `undefined` so a caller under `exactOptionalPropertyTypes`
 * can forward a possibly-undefined prop (`variant={variant}`) without omitting it.
 *
 * @since 0.3.16-canary.0
 */
export type VariantSelection<Variants extends VariantSchema> = VariantValues<Variants> & {
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
  readonly [Variant in keyof Variants]?: VariantValue<keyof Variants[Variant]> | undefined;
};

/**
 * The classes a call may add to each slot, keyed by slot name.
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
 * What one variant value carries in a slot configuration: classes for the base slot, or a map naming its slots.
 *
 * @remarks Resolution reads any object here as slot names, never as conditional classes, and admits `base`
 * whether or not the configuration declares it, because the plan synthesises it as slot position zero.
 *
 * @since 0.6.0
 */
type SlotClassValue<Slots extends SlotSchema> = PlainClassValue | (SlotClassMap<Slots> & { base?: ClassValue });

/**
 * A variant schema whose object values name slots rather than conditional classes.
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
 * The configuration of a component without slots.
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
 * The configuration of a component whose classes are split across named slots.
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
 * The options that decide how a resolver merges and caches classes.
 *
 * @since 0.3.16-canary.0
 */
export interface TailwindVariantsOptions {
  /**
   * Answers a repeated variant selection from what the resolver already produced.
   *
   * @remarks Off suits a component whose selections are unique per call, which fill the store for nothing.
   *
   * @defaultValue true
   */
  readonly cacheResolutions?: boolean | undefined;
  /**
   * How every answer resolves Tailwind conflicts: the `cn` engine's `twMerge`, none for `false`, or the given merge.
   *
   * @remarks A function is an `extendTailwindMerge` result from `cn/config` for custom class groups, or another engine.
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
export type SlotClassResolver<Variants extends VariantSchema> = (props?: VariantSelection<Variants>) => string;

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
> = keyof Slots extends never ? FlatVariantResolver<Variants> : SlotVariantResolver<Variants, Slots>;

/**
 * The resolver of a component without slots, which answers a call with one class string.
 */
export interface FlatVariantResolver<Variants extends VariantSchema> {
  /** The configuration this resolver runs, with any `extend` chain already merged in; what `extend` reads. */
  readonly config: VariantConfig<Variants>;
  /** The variant names in declaration order, an extending configuration's own first, for splitting props by hand. */
  readonly variantKeys: ReadonlyArray<Extract<keyof Variants, string>>;

  /** Resolves the classes of one variant selection. */
  (props?: VariantSelection<Variants>): string;
}

/**
 * The resolver of a component with slots, which answers a call with one class resolver per slot.
 */
export interface SlotVariantResolver<Variants extends VariantSchema, Slots extends SlotSchema> {
  /** The configuration this resolver runs, with any `extend` chain already merged in; what `extend` reads. */
  readonly config: SlotVariantConfig<Variants, Slots>;
  /** The variant names in declaration order, an extending configuration's own first, for splitting props by hand. */
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
 * The variant schema of an extended resolver: the base's groups and the extension's, merged.
 *
 * @since 0.3.16-canary.0
 */
export type MergedVariantSchema<
  BaseVariants extends VariantSchema,
  ExtensionVariants extends VariantSchema,
> = BaseVariants & ExtensionVariants;

/**
 * The slot schema of an extended resolver: the base's slots and the extension's, merged.
 *
 * @since 0.3.16-canary.0
 */
export type MergedSlotSchema<BaseSlots extends SlotSchema, ExtensionSlots extends SlotSchema> = BaseSlots &
  ExtensionSlots;

/**
 * The variant schema an extension may add: slot maps when the merged component has slots, any class values otherwise.
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
export interface ExtensionVariantConfig<
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
  readonly extend: FlatVariantResolver<BaseVariants> | SlotVariantResolver<BaseVariants, BaseSlots>;
  /** Slots added to the extended resolver's; a slot both declare joins, the extended resolver's classes first. */
  readonly slots?: ExtensionSlots;
  /** Variants added to the extended resolver's; a value both declare joins, the extended resolver's classes first. */
  readonly variants?: ExtensionVariantSchema<NoInfer<MergedSlotSchema<BaseSlots, ExtensionSlots>>> & ExtensionVariants;
}

/**
 * Anything accepted where classes are expected.
 *
 * @remarks Declared here so the package carries no runtime dependency of its own; the shape is the one
 * consumers already pass, `bigint` included, though a `bigint` contributes nothing.
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
