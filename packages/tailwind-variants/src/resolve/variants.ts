/**
 * The flat lane: turning a plan plus one set of props into a single class string.
 */

import { toClassText, toVariantKey } from "#/compile/class-values";
import { matchesCompoundConditions } from "#/compile/compound";
import type { VariantPlan } from "#/compile/plan";
import type { ClassValue } from "#/types";

/**
 * Resolves classes for a configuration without slots, appending `customClasses` last so the
 * caller's `className`/`class` outranks the configuration.
 *
 * @remarks Such a configuration compiles every class value to a string, so the plan's per-slot form
 * cannot reach here — which is what the casts below rely on.
 *
 * @since 0.6.0
 */
export const resolveVariantClasses = (
  plan: VariantPlan,
  variantProps: Record<string, unknown>,
  customClasses: ClassValue,
): string | undefined => {
  let text = plan.base;

  for (const entry of plan.entries) {
    const selected = variantProps[entry.name];
    let classes: string | undefined;

    if (selected === undefined) {
      classes = entry.defaultClasses as string | undefined;
    } else {
      // `toVariantKey` only answers `undefined` for `undefined`, which the branch above took.
      classes = entry.group[toVariantKey(selected) as string] as string | undefined;
    }

    if (classes) {
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

  if (customClasses) {
    const classes = toClassText(customClasses);

    if (classes) {
      text = text === "" ? classes : text + " " + classes;
    }
  }

  if (text === "") {
    return undefined;
  }

  return plan.shouldMerge ? plan.tailwindMerge(text) : text;
};
