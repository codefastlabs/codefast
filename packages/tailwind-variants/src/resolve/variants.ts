/**
 * The flat lane: turning a plan plus one set of props into a single class string.
 */

import { toClassText, toVariantKey } from "#compile/class-values";
import type { PlanClasses } from "#compile/class-values";
import { matchesCompoundConditions } from "#compile/compound";
import { compileGroupValue } from "#compile/plan";
import type { VariantPlan } from "#compile/plan";
import type { ClassValue } from "#types";

/**
 * Joins the classes a selection declares for a configuration without slots, unmerged.
 *
 * @remarks Such a configuration compiles every class value to a string, and a group may be the
 * caller's own object, so only a string read counts — an inherited member contributes nothing.
 */
export const joinVariantClasses = (plan: VariantPlan, variantProps: Record<string, unknown>): string => {
  let text = plan.base;

  for (const entry of plan.entries) {
    const selected = variantProps[entry.name];
    let classes: PlanClasses | undefined;

    if (selected === undefined) {
      classes = entry.defaultClasses;
    } else {
      // `toVariantKey` only answers `undefined` for `undefined`, which the default branch takes.
      const key = toVariantKey(selected) as string;

      classes = entry.group[key] ?? compileGroupValue(entry, key);
    }

    if (typeof classes === "string" && classes !== "") {
      text = text === "" ? classes : text + " " + classes;
    }
  }

  for (const compound of plan.compounds) {
    if (!matchesCompoundConditions(compound.conditions, variantProps, null)) {
      continue;
    }

    const classes = compound.classes as string;

    if (classes) {
      text = text === "" ? classes : text + " " + classes;
    }
  }

  return text;
};

/**
 * Resolves classes for a configuration without slots, appending `customClasses` last so the
 * caller's `className`/`class` outranks the configuration.
 *
 * @since 0.6.0
 */
export const resolveVariantClasses = (
  plan: VariantPlan,
  variantProps: Record<string, unknown>,
  customClasses: ClassValue,
): string | undefined => {
  let text = joinVariantClasses(plan, variantProps);

  if (customClasses) {
    const classes = toClassText(customClasses);

    if (classes) {
      text = text === "" ? classes : text + " " + classes;
    }
  }

  if (text === "") {
    return undefined;
  }

  return plan.mergeClasses === null ? text : plan.mergeClasses(text);
};
