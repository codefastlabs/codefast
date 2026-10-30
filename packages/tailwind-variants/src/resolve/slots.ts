/**
 * The slot lane: turning a plan plus one set of props into the per-slot class resolvers a
 * slot-based component destructures.
 */

import type { PlanClasses } from "#compile/class-values";
import { toClassText, toVariantKey } from "#compile/class-values";
import { matchesCompoundConditions } from "#compile/compound";
import { compileGroupValue } from "#compile/plan";
import type { SlotPlanEntry, VariantPlan } from "#compile/plan";
import type { ClassValue, SlotClassResolver, SlotResolverProps, VariantSchema } from "#types";

/**
 * One resolution of the variant props, shared by every slot of that call.
 *
 * @remarks `texts` is the whole answer for a slot called without props: rather than each of N slots
 * scanning every variant, each variant distributes its classes to the slots it names. Slot maps are
 * sparse, so that is far less work than the scan it replaces.
 */
interface SlotCallContext {
  readonly conditionValues: Record<string, unknown>;
  readonly matched: ReadonlyArray<PlanClasses | undefined>;
  readonly resolved: Array<string | typeof NOT_RESOLVED>;
  readonly texts: ReadonlyArray<string>;
}

/** Marks a slot nobody has asked for yet. */
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
  const resolved: Array<string | typeof NOT_RESOLVED> = [];

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

      classes = key === undefined ? undefined : (entry.group[key] ?? compileGroupValue(entry, key));
    }

    matched.push(classes);
    distribute(classes, texts);
  }

  for (const compound of plan.compounds) {
    if (matchesCompoundConditions(compound.conditions, variantProps, null)) {
      distribute(compound.classes, texts);
    }
  }

  for (const compoundSlot of plan.compoundSlots) {
    if (!matchesCompoundConditions(compoundSlot.conditions, variantProps, null)) {
      continue;
    }

    for (const slotIndex of compoundSlot.slotIndexes) {
      const text = texts[slotIndex] as string;

      texts[slotIndex] = text === "" ? compoundSlot.classes : text + " " + compoundSlot.classes;
    }
  }

  return {
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

    // A slot prop left null or undefined keeps the call's selection.
    if (override === undefined || override === null) {
      classes = context.matched[index];
    } else {
      const key = toVariantKey(override);

      classes = key === undefined ? undefined : (entry.group[key] ?? compileGroupValue(entry, key));
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

  for (const compoundSlot of plan.compoundSlots) {
    if (!matchesCompoundConditions(compoundSlot.conditions, context.conditionValues, overrides)) {
      continue;
    }

    // A slot listed twice takes the classes twice, as it does on the bare path.
    for (const targetIndex of compoundSlot.slotIndexes) {
      if (targetIndex === slotIndex) {
        text = text === "" ? compoundSlot.classes : text + " " + compoundSlot.classes;
      }
    }
  }

  return text;
};

/** Whether a slot's own props select anything, as opposed to carrying only the caller's classes. */
const hasVariantOverride = (overrides: Record<string, unknown>): boolean => {
  for (const key in overrides) {
    if (key !== "class" && key !== "className" && overrides[key] !== undefined) {
      return true;
    }
  }

  return false;
};

/** A slot called without props: the call's shared text, merged once and remembered. */
const resolveBareSlot = (plan: VariantPlan, context: SlotCallContext, slotIndex: number): string => {
  // A resolver shared across calls reads each slot again, and the merge is the expensive part.
  const memoised = context.resolved[slotIndex] as string | typeof NOT_RESOLVED;

  if (memoised !== NOT_RESOLVED) {
    return memoised;
  }

  const slotText = context.texts[slotIndex] as string;
  const answer = slotText === "" ? slotText : plan.mergeClasses === null ? slotText : plan.mergeClasses(slotText);

  context.resolved[slotIndex] = answer;

  return answer;
};

const resolveSlot = (
  plan: VariantPlan,
  context: SlotCallContext,
  slot: SlotPlanEntry,
  slotIndex: number,
  // Null is what a JavaScript caller passes for no props.
  slotProps: SlotResolverProps<VariantSchema> | null | undefined,
): string => {
  if (slotProps === undefined || slotProps === null) {
    return resolveBareSlot(plan, context, slotIndex);
  }

  const overrides = slotProps as Record<string, unknown>;
  const slotClass = toClassText(overrides.class as ClassValue);
  const slotClassName = toClassText(overrides.className as ClassValue);
  let text: string;

  // A sub-component passes the `className` it was given, usually absent, so a class-only call is the common one.
  if (hasVariantOverride(overrides)) {
    text = resolveSlotWithOverrides(plan, context, slot, slotIndex, overrides);
  } else if (!slotClassName && !slotClass) {
    return resolveBareSlot(plan, context, slotIndex);
  } else {
    text = context.texts[slotIndex] as string;
  }

  if (slotClass) {
    text = text === "" ? slotClass : text + " " + slotClass;
  }

  if (slotClassName) {
    text = text === "" ? slotClassName : text + " " + slotClassName;
  }

  if (text === "") {
    return text;
  }

  return plan.mergeClasses === null ? text : plan.mergeClasses(text);
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
    resolvers[slot.name] = (props?: SlotResolverProps<VariantSchema>): string =>
      resolveSlot(plan, context, slot, slotIndex, props);
  }

  return resolvers;
};
