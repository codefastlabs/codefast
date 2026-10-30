/** Class values flattened into the form a compiled plan holds, and the group key a variant value selects. */

import { flattenClassValues } from "#class-names";
import type { ClassValue } from "#types";

/**
 * Classes a variant value contributes to named slots, each slot already resolved to its position
 * in the plan so that resolution distributes them by index rather than by key.
 *
 * @since 0.6.0
 */
interface SlotClassGroup {
  readonly classes: ReadonlyArray<string>;
  readonly slotIndexes: ReadonlyArray<number>;
}

/**
 * Flattened classes a compiled plan holds: one string, or one string per slot it names.
 *
 * @since 0.6.0
 */
export type PlanClasses = SlotClassGroup | string;

/**
 * The string a class value contributes.
 *
 * @remarks Flattening each value separately matches flattening them together, because flattening joins
 * each argument's contributions in order and drops the empty ones.
 *
 * @since 0.6.0
 */
export const toClassText = (value: ClassValue): string => {
  return typeof value === "string" ? value : flattenClassValues([value]);
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
 * A slot map flattened into parallel classes and slot positions.
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
 * A configuration class value flattened for a compiled plan.
 *
 * @remarks A `null` `slotIndexByName` says the configuration has no slots, so an object value is
 * conditional classes rather than slot names.
 *
 * @since 0.6.0
 */
export const toPlanClasses = (value: ClassValue, slotIndexByName: Record<string, number> | null): PlanClasses => {
  return slotIndexByName !== null && isSlotClassMap(value)
    ? toSlotClassGroup(value, slotIndexByName)
    : toClassText(value);
};

/**
 * A caller's `class` and `className` as one class value, `class` first, so neither one hides the other.
 */
export const toCallerClasses = (classValue: ClassValue, classNameValue: ClassValue): ClassValue => {
  if (!classValue) {
    return classNameValue;
  }

  return classNameValue ? [classValue, classNameValue] : classValue;
};

/**
 * The key a value a caller passed selects inside its group, or `undefined` when it selects nothing.
 *
 * @remarks Booleans and `0` are spelled as their keys, other falsy values read as `"false"`, and `null`, an
 * array or an object selects nothing; callers answer `undefined`, the one value that takes the default.
 *
 * @since 0.6.0
 */
export const toVariantKey = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    return value === "" ? "false" : value;
  }

  if (value === true) {
    return "true";
  }

  if (value === false) {
    return "false";
  }

  if (value === null || typeof value === "object") {
    return undefined;
  }

  if (value === 0) {
    return "0";
  }

  return (value || "false") as string;
};

/**
 * The key a group reads when a call omits its variant: the configured default's key, or `"false"` without one.
 */
export const toDefaultKey = (configuredDefault: unknown): string => {
  if (configuredDefault === undefined || configuredDefault === null) {
    return "false";
  }

  // An object default is looked up as written, where a caller passing the same object selects nothing.
  return toVariantKey(configuredDefault) ?? (configuredDefault as string);
};
