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
 */
export interface VariantPlanEntry {
  readonly defaultClasses: PlanClasses | undefined;
  readonly group: Record<string, PlanClasses>;
  readonly name: string;
}

/**
 * One slot with the classes it starts from. `base` is always position zero.
 */
export interface SlotPlanEntry {
  readonly classes: string;
  readonly name: string;
}

/**
 * A configuration reduced to what resolution actually reads.
 */
export interface VariantPlan {
  readonly base: string;
  readonly compoundSlots: ReadonlyArray<CompoundSlotPlanEntry>;
  readonly compounds: ReadonlyArray<CompoundPlanEntry>;
  readonly entries: ReadonlyArray<VariantPlanEntry>;
  readonly shouldMerge: boolean;
  readonly slots: ReadonlyArray<SlotPlanEntry> | null;
  readonly tailwindMerge: (classes: string) => string;
}

const EMPTY_ENTRIES: ReadonlyArray<VariantPlanEntry> = [];

/** Flatten a variant group's classes, reusing the source object when nothing needed flattening. */
const normalizeVariantGroup = (
  variantGroup: Record<string, ClassValue>,
  slotIndexByName: Record<string, number> | null,
): Record<string, PlanClasses> => {
  let normalized: Record<string, PlanClasses> | null = null;

  for (const value of Object.keys(variantGroup)) {
    const classes = variantGroup[value];

    // A string is already in plan form; only a clsx-shaped value costs a flattening pass.
    if (typeof classes === "string") {
      continue;
    }

    normalized ??= { ...variantGroup } as Record<string, PlanClasses>;
    normalized[value] = toPlanClasses(classes, slotIndexByName);
  }

  return normalized ?? (variantGroup as Record<string, PlanClasses>);
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
    slotIndexByName = {};

    for (const [slotIndex, slot] of slots.entries()) {
      slotIndexByName[slot.name] = slotIndex;
    }
  }

  return {
    base: toClassText(configuration.base),
    compoundSlots: compileCompoundSlots(
      (hasSlotsConfig(configuration) ? configuration.compoundSlots : undefined) as
        | ReadonlyArray<CompoundSlot<VariantSchema, never>>
        | undefined,
      defaultVariantProps,
      slotIndexByName ?? {},
    ),
    // Only the flat lane treats a boolean absent from props and defaults as false.
    compounds: compileCompoundVariants(
      configuration.compoundVariants as ReadonlyArray<SlotCompoundVariant<VariantSchema, never>> | undefined,
      defaultVariantProps,
      slotIndexByName,
      slotIndexByName === null,
    ),
    entries: compileVariantEntries(configuration.variants ?? {}, defaultVariantProps, slotIndexByName),
    shouldMerge,
    slots,
    tailwindMerge,
  };
};
