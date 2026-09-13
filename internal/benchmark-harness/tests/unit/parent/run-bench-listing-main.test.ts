import { describe, expect, it } from "vitest";

import { buildScenarioInventoryFromListings, formatCoverageLines } from "#/parent/run-bench-listing-main";
import type { BenchSubprocessConfig } from "#/shared/config";
import type { ScenarioListing } from "#/shared/protocol";

function config(libraryName: string, features?: ReadonlyArray<string>): BenchSubprocessConfig {
  return {
    libraryName,
    scenarioName: libraryName,
    tsconfigFileName: `tsconfig.${libraryName}.json`,
    benchEntryFileName: `${libraryName}-benches.ts`,
    ...(features === undefined ? {} : { features }),
  };
}

function listing(
  id: string,
  requires: ReadonlyArray<string> = [],
  tier: ScenarioListing["tier"] = "contract",
): ScenarioListing {
  return { id, tier, requires };
}

const SUBJECT = config("subject", ["transient", "optional", "resolve-all", "plan"]);
const FULL = config("full", ["transient", "optional", "resolve-all"]);
const LEAN = config("lean", ["transient"]);

const SUBJECT_ROWS = [
  listing("constant"),
  listing("transient-1", ["transient"]),
  listing("optional-miss", ["optional", "transient"]),
  listing("resolve-all-10", ["resolve-all"]),
  listing("plan-inlined", ["plan"], "engine"),
];

describe("buildScenarioInventoryFromListings", () => {
  it("orders rows by the subject, then appends what only a competitor lists", () => {
    const inventory = buildScenarioInventoryFromListings(
      [SUBJECT, FULL],
      new Map([
        ["subject", SUBJECT_ROWS],
        ["full", [listing("constant"), listing("competitor-only")]],
      ]),
    );
    expect(inventory.scenarioCount).toBe(6);
    expect(inventory.scenarios.map((entry) => entry.id)).toEqual([
      "constant",
      "transient-1",
      "optional-miss",
      "resolve-all-10",
      "plan-inlined",
      "competitor-only",
    ]);
  });

  it("carries each row's tier and requires from the library that lists it first", () => {
    const inventory = buildScenarioInventoryFromListings([SUBJECT], new Map([["subject", SUBJECT_ROWS]]));
    expect(inventory.scenarios.find((entry) => entry.id === "plan-inlined")).toMatchObject({
      tier: "engine",
      requires: ["plan"],
    });
    expect(inventory.scenarios.find((entry) => entry.id === "optional-miss")).toMatchObject({
      tier: "contract",
      requires: ["optional", "transient"],
    });
  });

  // A gap is a row the library's own features allow; unsupported reads `—` by construction.
  it("splits the libraries missing a row into gaps and unsupported by their declared features", () => {
    const inventory = buildScenarioInventoryFromListings(
      [SUBJECT, FULL, LEAN],
      new Map([
        ["subject", SUBJECT_ROWS],
        ["full", [listing("constant"), listing("transient-1", ["transient"])]],
        ["lean", [listing("constant")]],
      ]),
    );
    const byId = new Map(inventory.scenarios.map((entry) => [entry.id, entry]));
    expect(byId.get("constant")).toMatchObject({ libraries: ["subject", "full", "lean"], gaps: [], unsupported: [] });
    expect(byId.get("transient-1")).toMatchObject({ libraries: ["subject", "full"], gaps: ["lean"], unsupported: [] });
    expect(byId.get("optional-miss")).toMatchObject({ libraries: ["subject"], gaps: ["full"], unsupported: ["lean"] });
    // Nobody owes an engine row: it names the subject's internals, not a feature.
    expect(byId.get("plan-inlined")).toMatchObject({ libraries: ["subject"], gaps: [], unsupported: [] });
  });

  it("summarises coverage per library and names rows implemented without the feature declared", () => {
    const inventory = buildScenarioInventoryFromListings(
      [SUBJECT, FULL, LEAN],
      new Map([
        ["subject", SUBJECT_ROWS],
        ["full", [listing("constant"), listing("transient-1", ["transient"])]],
        // lean implements the resolve-all row while declaring only `transient`.
        ["lean", [listing("constant"), listing("resolve-all-10", ["resolve-all"])]],
      ]),
    );
    expect(inventory.coverage).toEqual([
      { libraryName: "subject", rows: 5, undeclared: [], gaps: [], unsupported: [] },
      {
        libraryName: "full",
        rows: 2,
        undeclared: [],
        gaps: ["optional-miss", "resolve-all-10"],
        unsupported: [],
      },
      {
        libraryName: "lean",
        rows: 2,
        undeclared: ["resolve-all-10"],
        gaps: ["transient-1"],
        unsupported: ["optional-miss"],
      },
    ]);
  });

  it("omits coverage when a library declares no features, since a gap cannot be told from unsupported", () => {
    const inventory = buildScenarioInventoryFromListings(
      [SUBJECT, config("silent")],
      new Map([
        ["subject", SUBJECT_ROWS],
        ["silent", [listing("constant")]],
      ]),
    );
    expect(inventory.coverage).toBeUndefined();
    expect(inventory.scenarios.every((entry) => entry.gaps.length === 0 && entry.unsupported.length === 0)).toBe(true);
    expect(formatCoverageLines(inventory)).toEqual([]);
  });

  // Both sides of a pair spread one descriptor, so a disagreement is a descriptor that drifted.
  it("rejects two libraries declaring one row at different tiers or requires", () => {
    expect(() =>
      buildScenarioInventoryFromListings(
        [SUBJECT, FULL],
        new Map([
          ["subject", [listing("transient-1", ["transient"])]],
          ["full", [listing("transient-1", ["transient", "optional"])]],
        ]),
      ),
    ).toThrow("transient-1 is declared contract[optional,transient] by full but contract[transient] by subject");
  });
});

describe("formatCoverageLines", () => {
  it("prints one aligned line per library, naming undeclared rows when there are any", () => {
    const inventory = buildScenarioInventoryFromListings(
      [SUBJECT, LEAN],
      new Map([
        ["subject", SUBJECT_ROWS],
        ["lean", [listing("constant"), listing("resolve-all-10", ["resolve-all"])]],
      ]),
    );
    expect(formatCoverageLines(inventory)).toEqual([
      "subject    5 rows ·   0 gaps ·   0 unsupported",
      "lean       2 rows ·   1 gaps ·   1 unsupported · 1 undeclared: resolve-all-10",
    ]);
  });
});
