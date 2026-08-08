/**
 * Compound variants and compound slots, reduced to flat condition lists.
 *
 * Testing a compiled condition lives here rather than under `resolve/` because it and the encoding
 * it reads are one contract; splitting them would put the two halves out of each other's sight.
 */

import { toClassText, toPlanClasses } from "#/compile/class-values";
import type { PlanClasses } from "#/compile/class-values";
import type { ClassValue, CompoundSlot, CompoundVariant, SlotCompoundVariant, VariantSchema } from "#/types";

/** Condition satisfied when the resolved value strictly equals the configured one. */
const CONDITION_STRICT = 0;
/** Condition on a boolean where a value absent from both props and defaults counts as `false`. */
const CONDITION_BOOLEAN = 1;
/** Condition satisfied when the resolved value appears in the configured list. */
const CONDITION_LIST = 2;

type ConditionKind = typeof CONDITION_BOOLEAN | typeof CONDITION_LIST | typeof CONDITION_STRICT;

/**
 * One `variant: value` test from a compound definition, with the configured default it falls
 * back to already resolved.
 */
export interface CompoundCondition {
  readonly expected: unknown;
  readonly fallback: unknown;
  readonly kind: ConditionKind;
  readonly name: string;
}

/**
 * A compound variant reduced to the conditions to test and the classes to apply.
 */
export interface CompoundPlanEntry {
  readonly classes: PlanClasses;
  readonly conditions: ReadonlyArray<CompoundCondition>;
}

/**
 * A compound slot reduced to its conditions, its classes, and the slot positions they land on.
 */
export interface CompoundSlotPlanEntry {
  readonly classes: string;
  readonly conditions: ReadonlyArray<CompoundCondition>;
  readonly slotIndexes: ReadonlyArray<number>;
}

const EMPTY_COMPOUNDS: ReadonlyArray<CompoundPlanEntry> = [];
const EMPTY_COMPOUND_SLOTS: ReadonlyArray<CompoundSlotPlanEntry> = [];

/**
 * The classes a compound definition contributes, preferring `className` over `class`.
 *
 * @since 0.3.16-canary.2
 */
const getCompoundClass = (compoundDefinition: {
  readonly class?: ClassValue;
  readonly className?: ClassValue;
}): ClassValue => {
  return compoundDefinition.className === undefined ? compoundDefinition.class : compoundDefinition.className;
};

const compileConditions = (
  definition: Record<string, unknown>,
  defaultVariantProps: Record<string, unknown>,
  coerceMissingBoolean: boolean,
  skipSlots: boolean,
): ReadonlyArray<CompoundCondition> => {
  const conditions: Array<CompoundCondition> = [];

  for (const name of Object.keys(definition)) {
    if (name === "class" || name === "className" || (skipSlots && name === "slots")) {
      continue;
    }

    const expected = definition[name];
    // Without coercion a boolean condition is an ordinary strict comparison.
    const kind: ConditionKind = Array.isArray(expected)
      ? CONDITION_LIST
      : typeof expected === "boolean" && coerceMissingBoolean
        ? CONDITION_BOOLEAN
        : CONDITION_STRICT;

    conditions.push({ expected, fallback: defaultVariantProps[name], kind, name });
  }

  return conditions;
};

/**
 * Compile compound variants into condition lists.
 *
 * @remarks A `null` `slotIndexByName` says the configuration has no slots. `coerceMissingBoolean`
 * decides whether a boolean condition reads a value absent from both props and defaults as `false`.
 */
export const compileCompoundVariants = <T extends VariantSchema>(
  compoundVariants: ReadonlyArray<CompoundVariant<T> | SlotCompoundVariant<T, never>> | undefined,
  defaultVariantProps: Record<string, unknown>,
  slotIndexByName: Record<string, number> | null,
  coerceMissingBoolean: boolean,
): ReadonlyArray<CompoundPlanEntry> => {
  if (compoundVariants === undefined || compoundVariants.length === 0) {
    return EMPTY_COMPOUNDS;
  }

  const entries: Array<CompoundPlanEntry> = [];

  for (const compoundVariant of compoundVariants) {
    entries.push({
      classes: toPlanClasses(getCompoundClass(compoundVariant) as ClassValue, slotIndexByName),
      conditions: compileConditions(
        compoundVariant as Record<string, unknown>,
        defaultVariantProps,
        coerceMissingBoolean,
        false,
      ),
    });
  }

  return entries;
};

/**
 * Compile compound slots into condition lists paired with the slots they target.
 */
export const compileCompoundSlots = <T extends VariantSchema>(
  compoundSlots: ReadonlyArray<CompoundSlot<T, never>> | undefined,
  defaultVariantProps: Record<string, unknown>,
  slotIndexByName: Record<string, number>,
): ReadonlyArray<CompoundSlotPlanEntry> => {
  if (compoundSlots === undefined || compoundSlots.length === 0) {
    return EMPTY_COMPOUND_SLOTS;
  }

  const entries: Array<CompoundSlotPlanEntry> = [];

  for (const compoundSlot of compoundSlots) {
    const slotIndexes: Array<number> = [];

    for (const slotKey of compoundSlot.slots as ReadonlyArray<string>) {
      const slotIndex = slotIndexByName[slotKey];

      if (slotIndex !== undefined) {
        slotIndexes.push(slotIndex);
      }
    }

    entries.push({
      classes: toClassText(getCompoundClass(compoundSlot)),
      conditions: compileConditions(
        compoundSlot as unknown as Record<string, unknown>,
        defaultVariantProps,
        true,
        true,
      ),
      slotIndexes,
    });
  }

  return entries;
};

/**
 * Whether every condition holds, reading slot props first, then variant props, then the default.
 *
 * @remarks `slotProps` is `null` when the slot was called without props of its own.
 */
export const matchesCompoundConditions = (
  conditions: ReadonlyArray<CompoundCondition>,
  variantProps: Record<string, unknown>,
  slotProps: Record<string, unknown> | null,
): boolean => {
  for (const condition of conditions) {
    let value = slotProps === null ? undefined : slotProps[condition.name];

    if (value === undefined) {
      value = variantProps[condition.name];
    }

    if (value === undefined) {
      value = condition.fallback;
    }

    const kind = condition.kind;

    if (kind === CONDITION_STRICT) {
      if (value !== condition.expected) {
        return false;
      }
    } else if (kind === CONDITION_BOOLEAN) {
      if ((value === undefined ? false : value) !== condition.expected) {
        return false;
      }
    } else if (!(condition.expected as Array<unknown>).includes(value)) {
      return false;
    }
  }

  return true;
};

/**
 * The compound slots whose conditions hold for these props.
 *
 * @remarks Compound slots never read per-slot props, so one match pass serves every slot.
 *
 * @since 0.3.16-canary.0
 */
export const collectMatchedCompoundSlots = (
  compoundSlots: ReadonlyArray<CompoundSlotPlanEntry>,
  variantProps: Record<string, unknown>,
): ReadonlyArray<CompoundSlotPlanEntry> => {
  if (compoundSlots.length === 0) {
    return EMPTY_COMPOUND_SLOTS;
  }

  const matched: Array<CompoundSlotPlanEntry> = [];

  for (const compoundSlot of compoundSlots) {
    if (matchesCompoundConditions(compoundSlot.conditions, variantProps, null)) {
      matched.push(compoundSlot);
    }
  }

  return matched;
};
