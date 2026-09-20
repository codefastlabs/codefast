import { describe, expect, it } from "vitest";

import type { CurrentRun, PreviousRun, RunDiff } from "#report/run-diff";
import { buildRunDiff, describeDiffTarget, formatCompactHz, formatDeltaPercent } from "#report/run-diff";
import type { CompareHarnessSources } from "#shared/provenance";
import { fingerprint, library, scenario, trials } from "#tests/unit/report/support/fixtures";

const SHAPE = { isolated: false, mode: "fast" as const };

const sameSources: CompareHarnessSources = () => "same";

function diffWith(currentRun: CurrentRun, previous: PreviousRun): RunDiff {
  return buildRunDiff(currentRun, previous, sameSources);
}

function previousRun(overrides: Partial<PreviousRun> = {}): PreviousRun {
  return {
    runId: "prev",
    pinned: false,
    shape: SHAPE,
    trialCount: 1,
    libraries: new Map([
      [
        "cf",
        {
          fingerprint: fingerprint("cf"),
          trials: trials([
            scenario("steady", 100),
            scenario("slower", 100),
            scenario("faster", 100),
            scenario("hot", 50_000_000),
          ]),
        },
      ],
      ["inv", { fingerprint: fingerprint("inv"), trials: trials([scenario("steady", 50), scenario("slower", 50)]) }],
    ]),
    ...overrides,
  };
}

const current = {
  pivot: library("cf", [
    scenario("steady", 102),
    scenario("slower", 80),
    scenario("faster", 130),
    scenario("hot", 40_000_000),
    scenario("new", 5),
  ]),
  competitors: [library("inv", [scenario("steady", 50), scenario("slower", 50)])],
  shape: SHAPE,
  trialCount: 1,
};

describe("buildRunDiff", () => {
  it("classifies deltas against the noise floor and keeps unreliable rows out of the verdicts", () => {
    const diff = diffWith(current, previousRun());
    if (!diff.comparable) {
      throw new Error(diff.reason);
    }
    expect(diff.scenarios.map((entry) => entry.id)).toEqual(["steady", "slower", "faster", "hot"]);
    expect(diff.regressions.map((entry) => entry.id)).toEqual(["slower"]);
    expect(diff.improvements.map((entry) => entry.id)).toEqual(["faster"]);
    expect(diff.scenarios.find((entry) => entry.id === "hot")?.unreliable).toBe(true);
    expect(diff.scenarios.find((entry) => entry.id === "steady")?.delta).toBeCloseTo(0.02);
  });

  it("diffs each competitor's median and geomean against the previous run", () => {
    const diff = diffWith(current, previousRun());
    if (!diff.comparable) {
      throw new Error(diff.reason);
    }
    // Before: ratios 2.0 and 2.0 → median 2.0. Now: 2.04 and 1.6 → median 1.82.
    expect(diff.competitors[0]?.displayName).toBe("inv");
    expect(diff.competitors[0]?.medianDelta).toBeCloseTo(1.82 / 2 - 1);
  });

  it("compares aggregates over the rows both runs share, so a narrowed run is not read against the whole suite", () => {
    const narrowed = {
      ...current,
      pivot: library("cf", [scenario("steady", 100)]),
      competitors: [library("inv", [scenario("steady", 50)])],
    };
    const diff = diffWith(narrowed, previousRun());
    if (!diff.comparable) {
      throw new Error(diff.reason);
    }
    // steady was 2.0× before and is 2.0× now; the previous run's other rows do not enter the median.
    expect(diff.competitors[0]?.medianDelta).toBeCloseTo(0);
  });

  it("refuses to diff across a different config or environment, and says why", () => {
    const otherConfig = diffWith(current, previousRun({ trialCount: 3 }));
    expect(otherConfig.comparable).toBe(false);
    expect(otherConfig.comparable ? "" : otherConfig.reason).toContain("3 trials");

    const otherMachine = diffWith(
      current,
      previousRun({
        libraries: new Map([
          ["cf", { fingerprint: fingerprint("cf", { cpuModel: "Other" }), trials: trials([scenario("steady", 100)]) }],
        ]),
      }),
    );
    expect(otherMachine.comparable).toBe(false);

    const noSubject = diffWith(current, previousRun({ libraries: new Map() }));
    expect(noSubject.comparable).toBe(false);
  });
});

describe("pinned baselines", () => {
  it("carries the pin through to the diff and names it in the target label", () => {
    const pinned = diffWith(current, previousRun({ pinned: true }));
    expect(pinned.pinned).toBe(true);
    expect(describeDiffTarget(pinned)).toBe("baseline prev");
    expect(describeDiffTarget(diffWith(current, previousRun()))).toBe("prev");
  });

  it("keeps the pin on a diff that is not comparable, so the refusal names the baseline", () => {
    const refused = diffWith(current, previousRun({ pinned: true, trialCount: 3 }));
    expect(refused.comparable).toBe(false);
    expect(describeDiffTarget(refused)).toBe("baseline prev");
  });
});

describe("formatting", () => {
  it("signs a delta and shortens a throughput", () => {
    expect(formatDeltaPercent(-0.184)).toBe("−18.4%");
    expect(formatDeltaPercent(0.02)).toBe("+2.0%");
    expect(formatDeltaPercent(0)).toBe("±0.0%");
    expect(formatDeltaPercent(-0.0002)).toBe("±0.0%");
    expect(formatCompactHz(22_344_016)).toBe("22.3M");
    expect(formatCompactHz(146_925)).toBe("146.9K");
    expect(formatCompactHz(830.4)).toBe("830");
  });
});

describe("harness provenance", () => {
  const otherCommit = "fedcba9876543210fedcba9876543210fedcba98";

  function previousMeasuredBy(overrides: { harnessCommit?: string | undefined; harnessDirty?: boolean | undefined }) {
    return previousRun({
      libraries: new Map([
        ["cf", { fingerprint: fingerprint("cf", overrides), trials: trials([scenario("steady", 100)]) }],
      ]),
    });
  }

  function reasonOf(diff: RunDiff): string {
    return diff.comparable ? "" : diff.reason;
  }

  it("refuses a previous run that recorded no harness commit, and says to re-measure it", () => {
    const refused = diffWith(current, previousMeasuredBy({ harnessCommit: undefined, harnessDirty: undefined }));
    expect(refused.comparable).toBe(false);
    expect(reasonOf(refused)).toContain("no harness commit");
  });

  it("refuses a side the harness measured from uncommitted measuring sources", () => {
    expect(reasonOf(diffWith(current, previousMeasuredBy({ harnessDirty: true })))).toContain("uncommitted");
    const dirtyNow = {
      ...current,
      pivot: library("cf", [scenario("steady", 100)], { fingerprint: fingerprint("cf", { harnessDirty: true }) }),
    };
    expect(reasonOf(diffWith(dirtyNow, previousRun()))).toContain("uncommitted");
  });

  it("never asks the comparer when both sides ran from the same commit", () => {
    const neverAsked: CompareHarnessSources = () => {
      throw new Error("asked");
    };
    expect(buildRunDiff(current, previousRun(), neverAsked).comparable).toBe(true);
  });

  it("refuses when the measuring sources changed between the two commits, naming both", () => {
    const changed: CompareHarnessSources = () => "changed";
    const refused = buildRunDiff(current, previousMeasuredBy({ harnessCommit: otherCommit }), changed);
    expect(refused.comparable).toBe(false);
    expect(reasonOf(refused)).toContain(otherCommit.slice(0, 9));
    expect(reasonOf(refused)).toContain("changed between");
  });

  it("refuses when the previous commit is not in the checkout, rather than assuming the sources match", () => {
    const unknown: CompareHarnessSources = () => "unknown";
    const refused = buildRunDiff(current, previousMeasuredBy({ harnessCommit: otherCommit }), unknown);
    expect(refused.comparable).toBe(false);
    expect(reasonOf(refused)).toContain("not in this checkout");
  });

  it("compares two commits whose measuring sources the comparer reads as the same", () => {
    const same: CompareHarnessSources = (fromCommit, toCommit) => {
      expect(fromCommit).toBe(otherCommit);
      expect(toCommit).toBe(fingerprint("cf").harnessCommit);
      return "same";
    };
    expect(buildRunDiff(current, previousMeasuredBy({ harnessCommit: otherCommit }), same).comparable).toBe(true);
  });
});
