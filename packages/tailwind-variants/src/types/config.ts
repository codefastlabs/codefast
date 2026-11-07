/**
 * Types modeling component variant and slot configurations.
 */

import type { ClassValue, PlainClassValue } from "#types/common";
import type { FlatVariantResolver, SlotVariantResolver } from "#types/resolver";

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
 * One value chosen per variant, with none of the class properties a call may also carry.
 *
 * @remarks This is what `defaultVariants` declares. Sharing the call-site type there would accept a
 * `className` the configuration has no use for.
 *
 * @since 0.6.0
 */
export type VariantValues<Variants extends VariantSchema> = {
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
