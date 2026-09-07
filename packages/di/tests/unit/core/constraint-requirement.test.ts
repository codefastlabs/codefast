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
  requiringAncestorSlotNames,
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
    const predicate = requiringAncestorSlotName(bare(), {
      tokenName: "Database",
      name: "primary",
      helperName: "whenParentNamed",
    });

    expect(constraintRequirementOf(predicate)).toEqual({
      requires: "ancestorSlotName",
      tokenName: "Database",
      name: "primary",
      helperName: "whenParentNamed",
    });
    expect(constraintRequirementsOf(predicate)).toHaveLength(1);
  });

  it("a list records one requirement per waited-for name", () => {
    const predicate = requiringAncestorSlotNames(bare(), [
      { tokenName: undefined, name: "first", helperName: "whenParentTaggedAll" },
      { tokenName: undefined, name: "second", helperName: "whenParentTaggedAll" },
    ]);

    expect(constraintRequirementsOf(predicate).map((requirement) => requirement.name)).toEqual(["first", "second"]);
  });

  it("merging two bare predicates records nothing on the composite", () => {
    const composite = mergingConstraintRequirements(bare(), bare(), bare());

    expect(constraintRequirementsOf(composite)).toEqual([]);
  });

  it("merging carries one side's requirement, and both sides' requirements in order", () => {
    const left = requiringAncestorSlotName(bare(), {
      tokenName: undefined,
      name: "first",
      helperName: "whenParentNamed",
    });
    const right = requiringAncestorSlotName(bare(), {
      tokenName: undefined,
      name: "second",
      helperName: "whenAnyAncestorNamed",
    });

    const oneSided = mergingConstraintRequirements(bare(), left, bare());
    expect(constraintRequirementOf(oneSided)?.name).toBe("first");
    expect(constraintRequirementsOf(oneSided)).toHaveLength(1);

    const twoSided = mergingConstraintRequirements(bare(), left, right);
    expect(constraintRequirementsOf(twoSided).map((requirement) => requirement.name)).toEqual(["first", "second"]);
    expect(constraintRequirementOf(twoSided)?.name).toBe("first");
  });

  it("a composed composite keeps merging when narrowed again", () => {
    const left = requiringAncestorSlotName(bare(), {
      tokenName: undefined,
      name: "first",
      helperName: "whenParentNamed",
    });
    const right = requiringAncestorSlotName(bare(), {
      tokenName: undefined,
      name: "second",
      helperName: "whenAnyAncestorNamed",
    });
    const once = mergingConstraintRequirements(bare(), left, right);

    const twice = mergingConstraintRequirements(
      bare(),
      once,
      requiringAncestorSlotName(bare(), { tokenName: undefined, name: "third", helperName: "whenParentNamed" }),
    );

    expect(constraintRequirementsOf(twice).map((requirement) => requirement.name)).toEqual([
      "first",
      "second",
      "third",
    ]);
  });
});
