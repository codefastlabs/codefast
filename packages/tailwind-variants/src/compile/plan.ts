/**
 * Compiled form of a merged variant configuration.
 *
 * Everything that depends only on the configuration is resolved once, when `tv` runs: dictionary
 * lookups become monomorphic field reads, and every class value is flattened to a string so that
 * resolution never calls clsx.
 */

import type { PlanClasses } from "#/compile/class-values";
import { toClassText, toPlanClasses, toVariantKey } from "#/compile/class-values";
import type { CompoundPlanEntry, CompoundSlotPlanEntry } from "#/compile/compound";
import { compileCompoundSlots, compileCompoundVariants } from "#/compile/compound";
import { hasSlotsConfig } from "#/compile/configuration";
import type {
  ClassValue,
  CompoundSlot,
  SlotCompoundVariant,
  SlotSchema,
  SlotVariantConfig,
  VariantConfig,
  VariantSchema,
} from "#/types";

/** A group keyed by "true"/"false" accepts boolean variant values. */
const hasBooleanVariantValues = (variantGroup: Record<string, unknown>): boolean => {
  return "true" in variantGroup || "false" in variantGroup;
};

/**
 * One variant group with the classes its default selects already resolved.
 *
 * @since 0.6.0
 */
export interface VariantPlanEntry {
  readonly defaultClasses: PlanClasses | undefined;
  readonly group: Record<string, PlanClasses>;
  readonly name: string;
}

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
  readonly shouldMerge: boolean;
  readonly slots: ReadonlyArray<SlotPlanEntry> | null;
  readonly tailwindMerge: (classes: string) => string;
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
 * Flatten a variant group's classes onto an object with no prototype.
 *
 * @remarks The group is indexed by whatever value a caller passes, and on a plain object
 * `group["toString"]` answers with a function rather than `undefined` — which resolution then
 * concatenates, and `"__proto__"` makes it read slot positions off `Object.prototype`.
 */
const normalizeVariantGroup = (
  variantGroup: Record<string, ClassValue>,
  slotIndexByName: Record<string, number> | null,
): Record<string, PlanClasses> => {
  // Copied a key at a time on purpose: both bulk forms onto a prototype-less object — a spread with
  // `__proto__: null`, and `Object.assign` onto `Object.create(null)` — measured about four times
  // this, because neither keeps V8 on its fast copy path once the prototype is gone.
  const normalized = Object.create(null) as Record<string, PlanClasses>;

  for (const value of Object.keys(variantGroup)) {
    const classes = variantGroup[value];

    // A string is already in plan form; only a clsx-shaped value costs a flattening pass.
    normalized[value] = typeof classes === "string" ? classes : toPlanClasses(classes, slotIndexByName);
  }

  return normalized;
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

    const group = normalizeVariantGroup(variantGroup, slotIndexByName);
    const configuredDefault = defaultVariantProps[name];
    // A group keyed by "true"/"false" reads as false unless the configuration says otherwise.
    const defaultKey =
      configuredDefault === undefined
        ? hasBooleanVariantValues(variantGroup)
          ? "false"
          : undefined
        : toVariantKey(configuredDefault);

    entries.push({
      defaultClasses: defaultKey === undefined ? undefined : group[defaultKey],
      group,
      name,
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
  shouldMerge: boolean,
  tailwindMerge: (classes: string) => string,
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
  // Only the flat lane treats a boolean absent from props and defaults as false.
  const compounds = compileCompoundVariants(
    configuration.compoundVariants as ReadonlyArray<SlotCompoundVariant<VariantSchema, never>> | undefined,
    defaultVariantProps,
    slotIndexByName,
    slotIndexByName === null,
  );

  return {
    base: toClassText(configuration.base),
    compoundSlots,
    compounds,
    conditionNames: collectConditionNames(compounds, compoundSlots),
    entries: compileVariantEntries(configuration.variants ?? {}, defaultVariantProps, slotIndexByName),
    shouldMerge,
    slots,
    tailwindMerge,
  };
};
