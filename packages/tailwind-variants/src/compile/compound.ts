/**
 * Compound variants and compound slots, reduced to flat condition lists.
 *
 * Testing a compiled condition lives here rather than under `resolve/` because it and the encoding
 * it reads are one contract; splitting them would put the two halves out of each other's sight.
 */

import { toClassText, toPlanClasses } from "#compile/class-values";
import type { PlanClasses } from "#compile/class-values";
import { joinClassValues, joinSlotClassValues } from "#compile/configuration";
import type { ClassValue, CompoundSlot, CompoundVariant, SlotCompoundVariant, VariantSchema } from "#types";

/** Condition satisfied when the resolved value strictly equals the configured one. */
const CONDITION_EQUAL = 0;
/** Condition on `undefined`, `null` or `false`, which any of the three satisfies. */
const CONDITION_ABSENT = 1;
/** Condition satisfied when the resolved value satisfies any value of the configured list. */
const CONDITION_LIST = 2;

type ConditionKind = typeof CONDITION_ABSENT | typeof CONDITION_EQUAL | typeof CONDITION_LIST;

/**
 * One `variant: value` test from a compound definition, with the configured default it falls
 * back to already resolved.
 *
 * @since 0.6.0
 */
export interface CompoundCondition {
  /** The value to equal, or a list's values other than `undefined`, `null` and `false`. */
  readonly expected: unknown;
  readonly fallback: unknown;
  readonly kind: ConditionKind;
  /** Whether `undefined`, `null` and `false` satisfy the condition. */
  readonly matchesAbsent: boolean;
  readonly name: string;
}

/** Whether a value is one of the three a compound condition treats as the same absent value. */
const isAbsent = (value: unknown): boolean => value === undefined || value === null || value === false;

/**
 * Whether a value a call resolved satisfies one configured compound value, a list meaning any of its values.
 *
 * @remarks `undefined`, `null` and `false` satisfy one another; anything else must be strictly equal.
 */
export const matchesCompoundValue = (expected: unknown, actual: unknown): boolean => {
  if (!Array.isArray(expected)) {
    return expected === actual || (isAbsent(expected) && isAbsent(actual));
  }

  for (const value of expected) {
    if (value === actual || (isAbsent(value) && isAbsent(actual))) {
      return true;
    }
  }

  return false;
};

/**
 * The values a condition tells apart, so a selection key can keep them apart too.
 *
 * @remarks An absent value adds `null` and `false`; `undefined` is an omitted variant, which the key already separates.
 */
export const listComparedValues = (condition: CompoundCondition): ReadonlyArray<unknown> => {
  const values =
    condition.kind === CONDITION_LIST
      ? [...(condition.expected as ReadonlyArray<unknown>)]
      : condition.kind === CONDITION_EQUAL
        ? [condition.expected]
        : [];

  if (condition.matchesAbsent) {
    values.push(null, false);
  }

  return values;
};

/**
 * A compound variant reduced to the conditions to test and the classes to apply.
 *
 * @since 0.6.0
 */
export interface CompoundPlanEntry {
  readonly classes: PlanClasses;
  readonly conditions: ReadonlyArray<CompoundCondition>;
}

/**
 * A compound slot reduced to its conditions, its classes, and the slot positions they land on.
 *
 * @since 0.6.0
 */
export interface CompoundSlotPlanEntry {
  readonly classes: string;
  readonly conditions: ReadonlyArray<CompoundCondition>;
  readonly slotIndexes: ReadonlyArray<number>;
}

const EMPTY_COMPOUNDS: ReadonlyArray<CompoundPlanEntry> = [];
const EMPTY_COMPOUND_SLOTS: ReadonlyArray<CompoundSlotPlanEntry> = [];

/**
 * The classes a compound definition contributes: its `class`, then its `className`.
 *
 * @remarks `slotMode` joins two slot maps per slot, reading a value that is not a map as the `base` slot's.
 *
 * @since 0.3.16-canary.2
 */
export const getCompoundClass = (
  compoundDefinition: { readonly class?: ClassValue; readonly className?: ClassValue },
  slotMode: boolean,
): ClassValue => {
  const classValue = compoundDefinition.class;
  const classNameValue = compoundDefinition.className;

  if (classValue === undefined) {
    return classNameValue;
  }

  if (classNameValue === undefined) {
    return classValue;
  }

  return slotMode ? joinSlotClassValues(classValue, classNameValue) : joinClassValues(classValue, classNameValue);
};

const compileCondition = (name: string, expected: unknown, fallback: unknown): CompoundCondition => {
  if (Array.isArray(expected)) {
    const present = expected.filter((value) => !isAbsent(value));

    return {
      expected: present,
      fallback,
      kind: CONDITION_LIST,
      matchesAbsent: present.length < expected.length,
      name,
    };
  }

  return isAbsent(expected)
    ? { expected, fallback, kind: CONDITION_ABSENT, matchesAbsent: true, name }
    : { expected, fallback, kind: CONDITION_EQUAL, matchesAbsent: false, name };
};

const compileConditions = (
  definition: Record<string, unknown>,
  defaultVariantProps: Record<string, unknown>,
  skipSlots: boolean,
): ReadonlyArray<CompoundCondition> => {
  const conditions: Array<CompoundCondition> = [];

  for (const name of Object.keys(definition)) {
    if (name === "class" || name === "className" || (skipSlots && name === "slots")) {
      continue;
    }

    conditions.push(compileCondition(name, definition[name], defaultVariantProps[name]));
  }

  return conditions;
};

/**
 * Compile compound variants into condition lists.
 *
 * @remarks A `null` `slotIndexByName` says the configuration has no slots.
 *
 * @since 0.6.0
 */
export const compileCompoundVariants = <Variants extends VariantSchema>(
  compoundVariants: ReadonlyArray<CompoundVariant<Variants> | SlotCompoundVariant<Variants, never>> | undefined,
  defaultVariantProps: Record<string, unknown>,
  slotIndexByName: Record<string, number> | null,
): ReadonlyArray<CompoundPlanEntry> => {
  if (compoundVariants === undefined || compoundVariants.length === 0) {
    return EMPTY_COMPOUNDS;
  }

  const entries: Array<CompoundPlanEntry> = [];

  for (const compoundVariant of compoundVariants) {
    entries.push({
      classes: toPlanClasses(getCompoundClass(compoundVariant, slotIndexByName !== null), slotIndexByName),
      conditions: compileConditions(compoundVariant, defaultVariantProps, false),
    });
  }

  return entries;
};

/**
 * Compile compound slots into condition lists paired with the slots they target.
 *
 * @since 0.6.0
 */
export const compileCompoundSlots = <Variants extends VariantSchema>(
  compoundSlots: ReadonlyArray<CompoundSlot<Variants, never>> | undefined,
  defaultVariantProps: Record<string, unknown>,
  slotIndexByName: Record<string, number>,
): ReadonlyArray<CompoundSlotPlanEntry> => {
  if (compoundSlots === undefined || compoundSlots.length === 0) {
    return EMPTY_COMPOUND_SLOTS;
  }

  const entries: Array<CompoundSlotPlanEntry> = [];

  for (const compoundSlot of compoundSlots) {
    const classes = toClassText(getCompoundClass(compoundSlot, false));
    const slotIndexes: Array<number> = [];

    // A slot is listed once per mention, so a repeated one takes the classes twice; empty classes target nothing.
    for (const slotKey of classes === "" ? [] : (compoundSlot.slots as ReadonlyArray<string>)) {
      const slotIndex = slotIndexByName[slotKey];

      if (slotIndex !== undefined) {
        slotIndexes.push(slotIndex);
      }
    }

    entries.push({
      classes,
      conditions: compileConditions(compoundSlot, defaultVariantProps, true),
      slotIndexes,
    });
  }

  return entries;
};

/**
 * Whether every condition holds, reading slot props first, then variant props, then the default.
 *
 * @remarks `slotProps` is `null` when the slot was called without props of its own.
 *
 * @since 0.6.0
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

    if (condition.kind === CONDITION_EQUAL) {
      if (value !== condition.expected) {
        return false;
      }
    } else if (value === undefined || value === null || value === false) {
      if (!condition.matchesAbsent) {
        return false;
      }
    } else if (
      condition.kind === CONDITION_ABSENT ||
      (condition.expected as ReadonlyArray<unknown>).indexOf(value) === -1
    ) {
      return false;
    }
  }

  return true;
};
