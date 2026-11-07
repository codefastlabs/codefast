/**
 * Types modeling the resolvers returned by `tv` and their variant selections.
 */

import type { ClassValue } from "#types/common";
import type { SlotSchema, SlotVariantConfig, VariantConfig, VariantSchema, VariantValues } from "#types/config";

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
