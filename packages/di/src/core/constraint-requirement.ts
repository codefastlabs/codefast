/** What a constraint needs to exist before it can ever match, so `validate()` can check for it. */
import type { BindingConstraint } from "#/core/types";

/**
 * Key the requirement is attached under.
 *
 * @remarks A symbol on the predicate rather than a field in the binding: resolution never reads it,
 * so carrying it costs a resolve nothing.
 *
 * @since 0.6.0
 */
export const CONSTRAINT_REQUIREMENT: unique symbol = Symbol("di:constraint-requirement");

/**
 * The slot name a constraint waits for on an ancestor.
 *
 * @remarks Only names are described. A tag criterion is interned, so a typo cannot produce one that
 * looks valid, while a name is a bare string that nothing checks.
 *
 * @since 0.6.0
 */
export interface ConstraintRequirement {
  readonly requires: "ancestorSlotName";
  readonly name: string;
  /** The helper that built the predicate, so a report can name what the caller wrote. */
  readonly helperName: string;
}

/**
 * Records what a predicate waits for. Called once, where the predicate is built.
 *
 * @since 0.6.0
 */
export function requiringAncestorSlotName(
  predicate: BindingConstraint,
  name: string,
  helperName: string,
): BindingConstraint {
  const requirement: ConstraintRequirement = { requires: "ancestorSlotName", name, helperName };
  Object.defineProperty(predicate, CONSTRAINT_REQUIREMENT, { value: requirement, enumerable: false });
  return predicate;
}

/**
 * The requirement a predicate carries, if it was built by a helper that records one.
 *
 * @remarks A composed predicate may carry several; this answers the first. `validate()` reads
 * {@link constraintRequirementsOf} so no recorded requirement is skipped.
 *
 * @since 0.6.0
 */
export function constraintRequirementOf(predicate: BindingConstraint): ConstraintRequirement | undefined {
  return constraintRequirementsOf(predicate)[0];
}

const NO_REQUIREMENTS: ReadonlyArray<ConstraintRequirement> = [];

/**
 * Every requirement a predicate carries — one from a helper, several from a composed chain.
 *
 * @since 0.6.1
 */
export function constraintRequirementsOf(predicate: BindingConstraint): ReadonlyArray<ConstraintRequirement> {
  const payload = (
    predicate as { [CONSTRAINT_REQUIREMENT]?: ConstraintRequirement | ReadonlyArray<ConstraintRequirement> }
  )[CONSTRAINT_REQUIREMENT];
  if (payload === undefined) {
    return NO_REQUIREMENTS;
  }
  return Array.isArray(payload)
    ? (payload as ReadonlyArray<ConstraintRequirement>)
    : [payload as ConstraintRequirement];
}

/**
 * Carries both sides' requirements onto a composed predicate, so chaining does not lose them.
 *
 * @since 0.6.1
 */
export function mergingConstraintRequirements(
  composite: BindingConstraint,
  left: BindingConstraint,
  right: BindingConstraint,
): BindingConstraint {
  const merged = [...constraintRequirementsOf(left), ...constraintRequirementsOf(right)];
  if (merged.length === 0) {
    return composite;
  }
  Object.defineProperty(composite, CONSTRAINT_REQUIREMENT, {
    value: merged.length === 1 ? merged[0] : merged,
    enumerable: false,
  });
  return composite;
}
