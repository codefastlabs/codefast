/** What a constraint needs to exist before it can ever match, so `validate()` can check for it. */
import type { BindingConstraint } from "#/core/types";

/**
 * Key the requirement is attached under.
 *
 * @remarks A symbol on the predicate rather than a field in the binding: resolution never reads it,
 * so carrying it costs a resolve nothing.
 */
export const CONSTRAINT_REQUIREMENT: unique symbol = Symbol("di:constraint-requirement");

/**
 * The slot name a constraint waits for on an ancestor.
 *
 * @remarks Only names are described. A tag criterion is interned, so a typo cannot produce one that
 * looks valid, while a name is a bare string that nothing checks.
 */
export interface ConstraintRequirement {
  readonly requires: "ancestorSlotName";
  readonly name: string;
  /** The helper that built the predicate, so a report can name what the caller wrote. */
  readonly helperName: string;
}

/** Records what a predicate waits for. Called once, where the predicate is built. */
export function requiringAncestorSlotName(
  predicate: BindingConstraint,
  name: string,
  helperName: string,
): BindingConstraint {
  const requirement: ConstraintRequirement = { requires: "ancestorSlotName", name, helperName };
  Object.defineProperty(predicate, CONSTRAINT_REQUIREMENT, { value: requirement, enumerable: false });
  return predicate;
}

/** The requirement a predicate carries, if it was built by a helper that records one. */
export function constraintRequirementOf(predicate: BindingConstraint): ConstraintRequirement | undefined {
  return (predicate as { [CONSTRAINT_REQUIREMENT]?: ConstraintRequirement })[CONSTRAINT_REQUIREMENT];
}
