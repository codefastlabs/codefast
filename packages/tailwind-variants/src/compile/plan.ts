/**
 * Compiled form of a merged variant configuration.
 *
 * Everything that depends only on the configuration is resolved once: dictionary lookups become
 * monomorphic field reads, and a variant value is flattened the first time a call selects it, so
 * resolution never calls clsx.
 */

import type { PlanClasses } from "#compile/class-values";
import { toClassText, toDefaultKey, toPlanClasses } from "#compile/class-values";
import type { CompoundPlanEntry, CompoundSlotPlanEntry } from "#compile/compound";
import { compileCompoundSlots, compileCompoundVariants } from "#compile/compound";
import { hasSlotsConfig } from "#compile/configuration";
import type {
  ClassMerger,
  ClassValue,
  CompoundSlot,
  SlotSchema,
  SlotVariantConfig,
  VariantConfig,
  VariantSchema,
} from "#types";

/**
 * One variant group with the classes its default selects already resolved.
 *
 * @since 0.6.0
 */
export interface VariantPlanEntry {
  readonly defaultClasses: PlanClasses | undefined;
  /** The group key a call that omits this variant reads, so passing it explicitly can share that call's answer. */
  readonly defaultKey: string;
  /** The configured default as written, which a compound compares an omitted value against. */
  readonly defaultValue: unknown;
  /** Values compiled so far, filled as callers select them; the configuration's own group when it is read in place. */
  readonly group: Record<string, PlanClasses>;
  readonly name: string;
  /** Slot positions a value's slot map compiles against, or `null` without slots. */
  readonly slotIndexByName: Record<string, number> | null;
  /** The configuration's own group, which says what a key answers before its value is compiled. */
  readonly source: Record<string, ClassValue>;
  /** Own keys the group declares, so the selection encoder sizes its axis without walking the group again. */
  readonly valueCount: number;
}

/**
 * Compiles the value a group holds under a key the first time a caller selects it.
 *
 * @remarks A group read in place is the configuration's own object and already holds every value,
 * so it is never written to.
 */
export const compileGroupValue = (entry: VariantPlanEntry, key: string): PlanClasses | undefined => {
  const source = entry.source;

  if (entry.group === source || !Object.hasOwn(source, key)) {
    return undefined;
  }

  const value = source[key];
  const compiled = typeof value === "string" ? value : toPlanClasses(value, entry.slotIndexByName);

  entry.group[key] = compiled;

  return compiled;
};

/**
 * One slot with the classes it starts from. `base` is always position zero.
 *
 * @since 0.6.0
 */
export interface SlotPlanEntry {
  readonly classes: string;
  readonly name: string;
}

/**
 * A configuration reduced to what resolution actually reads.
 *
 * @since 0.6.0
 */
export interface VariantPlan {
  readonly base: string;
  /** Every variant name a compound tests — the only props a resolution has to remember. */
  readonly conditionNames: ReadonlyArray<string>;
  readonly compoundSlots: ReadonlyArray<CompoundSlotPlanEntry>;
  readonly compounds: ReadonlyArray<CompoundPlanEntry>;
  readonly entries: ReadonlyArray<VariantPlanEntry>;
  /** The merge every answer passes through, or `null` to keep every declared class. */
  readonly mergeClasses: ClassMerger | null;
  readonly slots: ReadonlyArray<SlotPlanEntry> | null;
}

const EMPTY_ENTRIES: ReadonlyArray<VariantPlanEntry> = [];
const EMPTY_CONDITION_NAMES: ReadonlyArray<string> = [];

const collectConditionNames = (
  compounds: ReadonlyArray<CompoundPlanEntry>,
  compoundSlots: ReadonlyArray<CompoundSlotPlanEntry>,
): ReadonlyArray<string> => {
  if (compounds.length === 0 && compoundSlots.length === 0) {
    return EMPTY_CONDITION_NAMES;
  }

  const names = new Set<string>();

  for (const compound of compounds) {
    for (const condition of compound.conditions) {
      names.add(condition.name);
    }
  }

  for (const compoundSlot of compoundSlots) {
    for (const condition of compoundSlot.conditions) {
      names.add(condition.name);
    }
  }

  return [...names];
};

/**
 * Whether a flat-lane group can be read in place: a plain object whose every value is already a string.
 *
 * @remarks The flat lane accepts only a string it reads, so an inherited member of `Object.prototype`
 * contributes nothing there; any other prototype could answer a string the group never declared.
 */
const isReadableInPlace = (variantGroup: Record<string, ClassValue>): boolean => {
  if (Object.getPrototypeOf(variantGroup) !== Object.prototype) {
    return false;
  }

  for (const key in variantGroup) {
    if (typeof variantGroup[key] !== "string") {
      return false;
    }
  }

  return true;
};

const compileVariantEntries = (
  variantGroups: VariantSchema,
  defaultVariantProps: Record<string, unknown>,
  slotIndexByName: Record<string, number> | null,
): ReadonlyArray<VariantPlanEntry> => {
  const names = Object.keys(variantGroups);

  if (names.length === 0) {
    return EMPTY_ENTRIES;
  }

  const entries: Array<VariantPlanEntry> = [];

  for (const name of names) {
    const variantGroup = variantGroups[name];

    if (variantGroup === undefined) {
      continue;
    }

    // The flat lane guards each read with a type check, so a string-only group needs no copy. Any
    // other group starts empty on an object with no prototype: a caller chooses the key, and on a
    // plain object `group["toString"]` answers with a function, `"__proto__"` with `Object.prototype`.
    const group =
      slotIndexByName === null && isReadableInPlace(variantGroup)
        ? (variantGroup as Record<string, string>)
        : (Object.create(null) as Record<string, PlanClasses>);
    const configuredDefault = defaultVariantProps[name];
    const defaultKey = toDefaultKey(configuredDefault);
    let defaultClasses: PlanClasses | undefined;

    // The default is the one value every call without a selection reads, so it compiles now.
    if (Object.hasOwn(variantGroup, defaultKey)) {
      const value = variantGroup[defaultKey];

      defaultClasses = typeof value === "string" ? value : toPlanClasses(value, slotIndexByName);

      if (group !== variantGroup) {
        group[defaultKey] = defaultClasses;
      }
    }

    entries.push({
      defaultClasses,
      defaultKey,
      defaultValue: configuredDefault,
      group,
      name,
      slotIndexByName,
      source: variantGroup,
      valueCount: Object.keys(variantGroup).length,
    });
  }

  return entries;
};

const compileSlotEntries = (slotDefinitions: SlotSchema, baseClasses: ClassValue): ReadonlyArray<SlotPlanEntry> => {
  // `base` always resolves, whether or not the slots declare it.
  const entries: Array<SlotPlanEntry> = [
    {
      classes: toClassText(slotDefinitions.base === undefined ? baseClasses : slotDefinitions.base),
      name: "base",
    },
  ];

  for (const name of Object.keys(slotDefinitions)) {
    if (name !== "base") {
      entries.push({ classes: toClassText(slotDefinitions[name]), name });
    }
  }

  return entries;
};

/**
 * Compile a merged configuration into the plan resolution runs against.
 *
 * @since 0.6.0
 */
export const compileVariantPlan = (
  configuration: SlotVariantConfig<VariantSchema, SlotSchema> | VariantConfig<VariantSchema>,
  mergeClasses: ClassMerger | null,
): VariantPlan => {
  const slotDefinitions = hasSlotsConfig(configuration) ? configuration.slots : undefined;
  const defaultVariantProps = (configuration.defaultVariants ?? {}) as Record<string, unknown>;

  // Slots compile first: their positions are what every class value is keyed by afterwards.
  const slots = slotDefinitions === undefined ? null : compileSlotEntries(slotDefinitions, configuration.base);
  let slotIndexByName: Record<string, number> | null = null;

  if (slots !== null) {
    // Indexed by slot names a configuration supplies, so the same prototype hazard applies.
    slotIndexByName = Object.create(null) as Record<string, number>;

    for (const [slotIndex, slot] of slots.entries()) {
      slotIndexByName[slot.name] = slotIndex;
    }
  }

  const compoundSlots = compileCompoundSlots(
    (hasSlotsConfig(configuration) ? configuration.compoundSlots : undefined) as
      | ReadonlyArray<CompoundSlot<VariantSchema, never>>
      | undefined,
    defaultVariantProps,
    slotIndexByName ?? {},
  );
  const compounds = compileCompoundVariants(configuration.compoundVariants, defaultVariantProps, slotIndexByName);

  return {
    base: toClassText(configuration.base),
    compoundSlots,
    compounds,
    conditionNames: collectConditionNames(compounds, compoundSlots),
    entries: compileVariantEntries(configuration.variants ?? {}, defaultVariantProps, slotIndexByName),
    mergeClasses,
    slots,
  };
};
