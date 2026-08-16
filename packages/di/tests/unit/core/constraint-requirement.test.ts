/**
 * The requirement a constraint helper records on its predicate, and how composition carries it:
 * the singular reader answers the first, the plural reader answers all, and a merge of two bare
 * predicates records nothing.
 */
import { describe, expect, it } from "vitest";

import {
  constraintRequirementOf,
  constraintRequirementsOf,
  mergingConstraintRequirements,
  requiringAncestorSlotName,
} from "#/core/constraint-requirement";
import type { BindingConstraint } from "#/core/types";

function bare(): BindingConstraint {
  return () => true;
}

describe("constraint requirements", () => {
  it("a bare predicate carries none", () => {
    const predicate = bare();

    expect(constraintRequirementOf(predicate)).toBeUndefined();
    expect(constraintRequirementsOf(predicate)).toEqual([]);
  });

  it("a helper-built predicate answers both readers", () => {
    const predicate = requiringAncestorSlotName(bare(), "primary", "whenParentNamed");

    expect(constraintRequirementOf(predicate)?.name).toBe("primary");
    expect(constraintRequirementsOf(predicate)).toHaveLength(1);
  });

  it("merging two bare predicates records nothing on the composite", () => {
    const composite = mergingConstraintRequirements(bare(), bare(), bare());

    expect(constraintRequirementsOf(composite)).toEqual([]);
  });

  it("merging carries one side's requirement, and both sides' requirements in order", () => {
    const left = requiringAncestorSlotName(bare(), "first", "whenParentNamed");
    const right = requiringAncestorSlotName(bare(), "second", "whenAnyAncestorNamed");

    const oneSided = mergingConstraintRequirements(bare(), left, bare());
    expect(constraintRequirementOf(oneSided)?.name).toBe("first");
    expect(constraintRequirementsOf(oneSided)).toHaveLength(1);

    const twoSided = mergingConstraintRequirements(bare(), left, right);
    expect(constraintRequirementsOf(twoSided).map((requirement) => requirement.name)).toEqual(["first", "second"]);
    expect(constraintRequirementOf(twoSided)?.name).toBe("first");
  });

  it("a composed composite keeps merging when narrowed again", () => {
    const left = requiringAncestorSlotName(bare(), "first", "whenParentNamed");
    const right = requiringAncestorSlotName(bare(), "second", "whenAnyAncestorNamed");
    const once = mergingConstraintRequirements(bare(), left, right);

    const twice = mergingConstraintRequirements(
      bare(),
      once,
      requiringAncestorSlotName(bare(), "third", "whenParentNamed"),
    );

    expect(constraintRequirementsOf(twice).map((requirement) => requirement.name)).toEqual([
      "first",
      "second",
      "third",
    ]);
  });
});
