/**
 * Flattening configuration class values into the form a compiled plan holds.
 *
 * Every class value passes through here once, when a plan is compiled, so resolution only ever
 * concatenates strings and never reaches clsx.
 */

import { clsx } from "clsx";

import type { ClassValue, PlanClasses, SlotClassGroup } from "#/types";

/**
 * Flatten a class value to the string it contributes.
 *
 * @remarks Flattening each value separately matches flattening them together, because clsx joins
 * its arguments' contributions in order and drops the empty ones.
 */
export const toClassText = (value: ClassValue): string => {
  return typeof value === "string" ? value : clsx(value);
};

/**
 * Whether a class value is an object naming slots rather than a clsx condition set.
 *
 * @since 0.3.16-canary.0
 */
export const isSlotClassMap = (value: ClassValue): value is Record<string, ClassValue> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

/**
 * Flatten a slot map into parallel classes and slot positions.
 *
 * @remarks A slot the plan does not declare, and one whose classes flatten to nothing, are both
 * dropped here — no resolver could ever ask for them.
 */
const toSlotClassGroup = (
  slotClassMap: Record<string, ClassValue>,
  slotIndexByName: Record<string, number>,
): SlotClassGroup => {
  const classes: Array<string> = [];
  const slotIndexes: Array<number> = [];

  for (const slotKey of Object.keys(slotClassMap)) {
    const slotIndex = slotIndexByName[slotKey];

    if (slotIndex === undefined) {
      continue;
    }

    const text = toClassText(slotClassMap[slotKey]);

    if (text !== "") {
      classes.push(text);
      slotIndexes.push(slotIndex);
    }
  }

  return { classes, slotIndexes };
};

/**
 * Flatten a configuration class value for a compiled plan.
 *
 * @param slotIndexByName - Slot positions when the configuration has slots, `null` when it does not
 * and an object value is therefore clsx conditions rather than slot names
 */
export const toPlanClasses = (value: ClassValue, slotIndexByName: Record<string, number> | null): PlanClasses => {
  return slotIndexByName !== null && isSlotClassMap(value)
    ? toSlotClassGroup(value, slotIndexByName)
    : toClassText(value);
};

/**
 * The key a variant value selects inside its group, with booleans spelled as their group keys.
 */
export const toVariantKey = (value: unknown): string | undefined => {
  if (value === true) {
    return "true";
  }

  if (value === false) {
    return "false";
  }

  return value as string | undefined;
};
