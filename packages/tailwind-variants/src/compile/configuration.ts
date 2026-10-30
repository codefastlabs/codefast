/**
 * What a raw configuration is: how to ask about its shape, and how to collapse an `extend` chain
 * into the single configuration a plan is compiled from.
 */

import { cx } from "#class-names";
import { isSlotClassMap } from "#compile/class-values";
import type {
  ClassValue,
  CompoundSlot,
  VariantConfig,
  VariantSchema,
  SlotVariantConfig,
  ExtendedVariantConfig,
  SlotSchema,
  VariantResolver,
} from "#types";

type Configuration = VariantConfig<VariantSchema> | SlotVariantConfig<VariantSchema, SlotSchema>;

type ExtensionConfiguration =
  | Configuration
  | ExtendedVariantConfig<VariantSchema, VariantSchema, SlotSchema, SlotSchema>;

/**
 * Whether a configuration declares slots.
 *
 * @since 0.3.16-canary.0
 */
export const hasSlotsConfig = <Variants extends VariantSchema, Slots extends SlotSchema>(
  configuration: VariantConfig<Variants> | SlotVariantConfig<Variants, Slots>,
): configuration is SlotVariantConfig<Variants, Slots> => {
  return "slots" in configuration && configuration.slots !== undefined;
};

/**
 * Whether a configuration extends another resolver's configuration.
 *
 * @since 0.3.16-canary.0
 */
export const hasExtendConfig = <Variants extends VariantSchema, Slots extends SlotSchema>(
  configuration:
    | VariantConfig<Variants>
    | SlotVariantConfig<Variants, Slots>
    | ExtendedVariantConfig<VariantSchema, Variants, SlotSchema, Slots>,
): configuration is ExtendedVariantConfig<VariantSchema, Variants, SlotSchema, Slots> & {
  readonly extend: VariantResolver<VariantSchema>;
} => {
  return "extend" in configuration && configuration.extend !== undefined;
};

/**
 * Merges two records key by key, the leading record's keys first, combining a key both declare.
 *
 * @remarks Built through `Object.fromEntries`, so a key a configuration names `__proto__` stays an own key.
 */
const mergeRecords = <Value>(
  leading: Readonly<Record<string, Value>>,
  trailing: Readonly<Record<string, Value>>,
  combine: (leadingValue: Value, trailingValue: Value) => Value,
): Record<string, Value> => {
  const entries: Array<[string, Value]> = [];

  for (const key of Object.keys(leading)) {
    const value = leading[key] as Value;

    entries.push([key, Object.hasOwn(trailing, key) ? combine(value, trailing[key] as Value) : value]);
  }

  for (const key of Object.keys(trailing)) {
    if (!Object.hasOwn(leading, key)) {
      entries.push([key, trailing[key] as Value]);
    }
  }

  return Object.fromEntries(entries);
};

/** Classes a parent and its child both declare, the parent's first; two strings stay one string. */
const joinClassValues = (parentValue: ClassValue, childValue: ClassValue): ClassValue => {
  return typeof parentValue === "string" && typeof childValue === "string"
    ? cx(parentValue, childValue)
    : [parentValue, childValue];
};

/** A slot configuration's value as a slot map, where anything that is not a map styles `base`. */
const toSlotClassMap = (value: ClassValue): Readonly<Record<string, ClassValue>> => {
  return isSlotClassMap(value) ? value : { base: value };
};

/** Classes a parent and its child both declare for one value of a slot configuration, combined per slot. */
const joinSlotClassValues = (parentValue: ClassValue, childValue: ClassValue): ClassValue => {
  if (!isSlotClassMap(parentValue) && !isSlotClassMap(childValue)) {
    return joinClassValues(parentValue, childValue);
  }

  return mergeRecords(toSlotClassMap(childValue), toSlotClassMap(parentValue), (child, parent) =>
    joinClassValues(parent, child),
  );
};

/** A parent's variants under its child's: the child's names and values lead, and a value both declare joins. */
const mergeVariantGroups = (
  parentVariants: VariantSchema | undefined,
  childVariants: VariantSchema | undefined,
  slotMode: boolean,
): VariantSchema => {
  if (parentVariants === undefined || Object.keys(parentVariants).length === 0) {
    return childVariants ?? {};
  }

  if (childVariants === undefined) {
    return parentVariants;
  }

  const joinValues = slotMode ? joinSlotClassValues : joinClassValues;

  return mergeRecords(childVariants, parentVariants, (childGroup, parentGroup) =>
    mergeRecords(childGroup, parentGroup, (child, parent) => joinValues(parent, child)),
  );
};

/** A slot configuration's slots, with `base` taken from the top-level `base` when the slots leave it out. */
const withBaseSlot = (configuration: SlotVariantConfig<VariantSchema, SlotSchema>): SlotSchema => {
  const slots = configuration.slots ?? {};

  return slots.base === undefined ? { ...slots, base: configuration.base } : slots;
};

/**
 * The slots an extension resolves to, or `undefined` when neither side declares any.
 *
 * @remarks A slot child over a flat parent puts its own base first; over a slot parent, every slot
 * both declare joins with the parent's classes first.
 */
const mergeSlots = (
  parent: Configuration,
  child: ExtensionConfiguration,
  childSlots: SlotSchema | undefined,
): SlotSchema | undefined => {
  if (!hasSlotsConfig(parent)) {
    if (childSlots === undefined) {
      return undefined;
    }

    return childSlots.base === undefined
      ? { ...childSlots, base: parent.base ? cx(child.base, parent.base) : child.base }
      : childSlots;
  }

  const ownSlots =
    childSlots === undefined
      ? { base: child.base }
      : childSlots.base === undefined
        ? { ...childSlots, base: child.base }
        : childSlots;

  return mergeRecords(withBaseSlot(parent), ownSlots, joinClassValues);
};

const compoundSlotsOf = (
  configuration: ExtensionConfiguration,
): ReadonlyArray<CompoundSlot<VariantSchema, SlotSchema>> => {
  return "compoundSlots" in configuration && Array.isArray(configuration.compoundSlots)
    ? (configuration.compoundSlots as ReadonlyArray<CompoundSlot<VariantSchema, SlotSchema>>)
    : [];
};

/**
 * Collapse a configuration and the one it extends into a single configuration, resolving an
 * extend chain of any depth.
 *
 * @remarks Everything the child redeclares joins the parent's, parent first: the base, each variant
 * value, each slot, and the compound lists. The child's variant names lead.
 *
 * @since 0.3.16-canary.0
 */
export const mergeVariantConfigs = (
  parentConfiguration: Configuration,
  childConfiguration: ExtensionConfiguration,
): Configuration => {
  const parent = hasExtendConfig(parentConfiguration)
    ? mergeVariantConfigs(parentConfiguration.extend.config, parentConfiguration)
    : parentConfiguration;
  const childSlots = "slots" in childConfiguration ? childConfiguration.slots : undefined;
  const slots = mergeSlots(parent, childConfiguration, childSlots);
  const base = parent.base ? cx(parent.base, childConfiguration.base) : childConfiguration.base;
  const compoundVariants = [...(parent.compoundVariants ?? []), ...(childConfiguration.compoundVariants ?? [])];
  const defaultVariants = { ...parent.defaultVariants, ...childConfiguration.defaultVariants };
  const variants = mergeVariantGroups(parent.variants, childConfiguration.variants, slots !== undefined);

  if (slots === undefined) {
    return { base, compoundVariants, defaultVariants, variants };
  }

  return {
    base,
    compoundSlots: [...compoundSlotsOf(parent), ...compoundSlotsOf(childConfiguration)],
    compoundVariants,
    defaultVariants,
    slots,
    variants,
  };
};
