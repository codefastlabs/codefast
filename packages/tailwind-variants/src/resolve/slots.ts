/**
 * The slot lane: turning a plan plus one set of props into the per-slot class resolvers a
 * slot-based component destructures.
 */

import type { PlanClasses } from "#/compile/class-values";
import { toClassText, toVariantKey } from "#/compile/class-values";
import type { CompoundSlotPlanEntry } from "#/compile/compound";
import { collectMatchedCompoundSlots, matchesCompoundConditions } from "#/compile/compound";
import type { SlotPlanEntry, VariantPlan } from "#/compile/plan";
import type { ClassValue, SlotClassResolver, SlotResolverProps, VariantSchema } from "#/types";

/**
 * One resolution of the variant props, shared by every slot of that call.
 *
 * @remarks `texts` is the whole answer for a slot called without props: rather than each of N slots
 * scanning every variant, each variant distributes its classes to the slots it names. Slot maps are
 * sparse, so that is far less work than the scan it replaces.
 */
interface SlotCallContext {
  readonly compoundSlots: ReadonlyArray<CompoundSlotPlanEntry>;
  readonly conditionValues: Record<string, unknown>;
  readonly matched: ReadonlyArray<PlanClasses | undefined>;
  readonly resolved: Array<string | typeof NOT_RESOLVED | undefined>;
  readonly texts: ReadonlyArray<string>;
}

/** Distinguishes a slot nobody has asked for yet from one that resolved to nothing. */
const NOT_RESOLVED: unique symbol = Symbol("not-resolved");

const EMPTY_CONDITION_VALUES: Record<string, unknown> = {};

/**
 * Copy out the props a compound can still read once the call is over.
 *
 * @remarks A context outlives its call when a resolver is reused, and holding the caller's props
 * object would pin whatever else it carries — `children`, most of a component's tree.
 */
const toConditionValues = (
  conditionNames: ReadonlyArray<string>,
  variantProps: Record<string, unknown>,
): Record<string, unknown> => {
  if (conditionNames.length === 0) {
    return EMPTY_CONDITION_VALUES;
  }

  const values: Record<string, unknown> = {};

  for (const name of conditionNames) {
    values[name] = variantProps[name];
  }

  return values;
};

/** Distribute one compiled value across the slots it names, or to `base` when it is a plain string. */
const distribute = (classes: PlanClasses | undefined, texts: Array<string>): void => {
  if (typeof classes === "object") {
    const slotIndexes = classes.slotIndexes;
    const slotClasses = classes.classes;

    for (let index = 0, length = slotIndexes.length; index < length; index++) {
      const slotIndex = slotIndexes[index] as number;
      const text = texts[slotIndex] as string;

      texts[slotIndex] = text === "" ? (slotClasses[index] as string) : text + " " + slotClasses[index];
    }
  } else if (classes) {
    texts[0] = texts[0] === "" ? classes : texts[0] + " " + classes;
  }
};

const createSlotCallContext = (
  plan: VariantPlan,
  slots: ReadonlyArray<SlotPlanEntry>,
  variantProps: Record<string, unknown>,
): SlotCallContext => {
  const texts: Array<string> = [];
  const resolved: Array<string | typeof NOT_RESOLVED | undefined> = [];

  for (const slot of slots) {
    texts.push(slot.classes);
    resolved.push(NOT_RESOLVED);
  }

  const matched: Array<PlanClasses | undefined> = [];

  for (const entry of plan.entries) {
    const selected = variantProps[entry.name];
    let classes: PlanClasses | undefined;

    if (selected === undefined) {
      classes = entry.defaultClasses;
    } else {
      const key = toVariantKey(selected);

      classes = key ? entry.group[key] : undefined;
    }

    matched.push(classes);
    distribute(classes, texts);
  }

  for (const compound of plan.compounds) {
    if (matchesCompoundConditions(compound.conditions, variantProps, null)) {
      distribute(compound.classes, texts);
    }
  }

  const compoundSlots = collectMatchedCompoundSlots(plan.compoundSlots, variantProps);

  for (const compoundSlot of compoundSlots) {
    for (const slotIndex of compoundSlot.slotIndexes) {
      const text = texts[slotIndex] as string;

      texts[slotIndex] = text === "" ? compoundSlot.classes : text + " " + compoundSlot.classes;
    }
  }

  return {
    compoundSlots,
    conditionValues: toConditionValues(plan.conditionNames, variantProps),
    matched,
    resolved,
    texts,
  };
};

/** The classes a compiled value contributes to one slot, for the lane that cannot use `texts`. */
const selectForSlot = (classes: PlanClasses | undefined, slotIndex: number): string | undefined => {
  if (typeof classes === "object") {
    const slotIndexes = classes.slotIndexes;

    for (let index = 0, length = slotIndexes.length; index < length; index++) {
      if (slotIndexes[index] === slotIndex) {
        return classes.classes[index];
      }
    }

    return undefined;
  }

  return slotIndex === 0 ? classes : undefined;
};

/**
 * Re-resolve one slot from scratch, because its own props can select different variant values and
 * flip a compound's conditions.
 */
const resolveSlotWithOverrides = (
  plan: VariantPlan,
  context: SlotCallContext,
  slot: SlotPlanEntry,
  slotIndex: number,
  overrides: Record<string, unknown>,
): string => {
  let text = slot.classes;
  let index = 0;

  for (const entry of plan.entries) {
    const override = overrides[entry.name];
    let classes: PlanClasses | undefined;

    if (override === undefined) {
      classes = context.matched[index];
    } else {
      const key = toVariantKey(override);

      classes = key ? entry.group[key] : undefined;
    }

    index++;

    const slotClasses = selectForSlot(classes, slotIndex);

    if (slotClasses) {
      text = text === "" ? slotClasses : text + " " + slotClasses;
    }
  }

  for (const compound of plan.compounds) {
    if (!matchesCompoundConditions(compound.conditions, context.conditionValues, overrides)) {
      continue;
    }

    const slotClasses = selectForSlot(compound.classes, slotIndex);

    if (slotClasses) {
      text = text === "" ? slotClasses : text + " " + slotClasses;
    }
  }

  for (const compoundSlot of context.compoundSlots) {
    if (compoundSlot.slotIndexes.includes(slotIndex)) {
      text = text === "" ? compoundSlot.classes : text + " " + compoundSlot.classes;
    }
  }

  return text;
};

const resolveSlot = (
  plan: VariantPlan,
  context: SlotCallContext,
  slot: SlotPlanEntry,
  slotIndex: number,
  slotProps: SlotResolverProps<VariantSchema> | undefined,
): string | undefined => {
  if (slotProps === undefined) {
    // A resolver shared across calls reads each slot again, and the merge is the expensive part.
    const memoised = context.resolved[slotIndex];

    if (memoised !== NOT_RESOLVED) {
      return memoised;
    }

    const slotText = context.texts[slotIndex] as string;
    const answer = slotText === "" ? undefined : plan.shouldMerge ? plan.tailwindMerge(slotText) : slotText;

    context.resolved[slotIndex] = answer;

    return answer;
  }

  const overrides = slotProps as Record<string, unknown>;

  let text = resolveSlotWithOverrides(plan, context, slot, slotIndex, overrides);

  const slotClassName = toClassText(overrides.className as ClassValue);
  const slotClass = toClassText(overrides.class as ClassValue);

  if (slotClassName) {
    text = text === "" ? slotClassName : text + " " + slotClassName;
  }

  if (slotClass) {
    text = text === "" ? slotClass : text + " " + slotClass;
  }

  if (text === "") {
    return undefined;
  }

  return plan.shouldMerge ? plan.tailwindMerge(text) : text;
};

/**
 * Creates one class resolver per slot, sharing a single resolution of the variant props.
 *
 * @since 0.3.16-canary.0
 */
export const createSlotResolvers = (
  plan: VariantPlan,
  slots: ReadonlyArray<SlotPlanEntry>,
  variantProps: Record<string, unknown>,
): Record<string, SlotClassResolver<VariantSchema>> => {
  const context = createSlotCallContext(plan, slots, variantProps);
  const resolvers: Record<string, SlotClassResolver<VariantSchema>> = {};

  for (const [slotIndex, slot] of slots.entries()) {
    resolvers[slot.name] = (props?: SlotResolverProps<VariantSchema>): string | undefined =>
      resolveSlot(plan, context, slot, slotIndex, props);
  }

  return resolvers;
};
