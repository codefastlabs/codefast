import { describe, expect, it } from "vitest";

import type { PreviousRun } from "#/report/run-diff";
import { buildRunDiff, formatCompactHz, formatDeltaPercent } from "#/report/run-diff";
import { fingerprint, library, scenario, trials } from "#/tests/unit/report/support/fixtures";

const SHAPE = { isolated: false, mode: "fast" as const };

function previousRun(overrides: Partial<PreviousRun> = {}): PreviousRun {
  return {
    runId: "prev",
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
    const diff = buildRunDiff(current, previousRun());
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
    const diff = buildRunDiff(current, previousRun());
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
    const diff = buildRunDiff(narrowed, previousRun());
    if (!diff.comparable) {
      throw new Error(diff.reason);
    }
    // steady was 2.0× before and is 2.0× now; the previous run's other rows do not enter the median.
    expect(diff.competitors[0]?.medianDelta).toBeCloseTo(0);
  });

  it("refuses to diff across a different config or environment, and says why", () => {
    const otherConfig = buildRunDiff(current, previousRun({ trialCount: 3 }));
    expect(otherConfig.comparable).toBe(false);
    expect(otherConfig.comparable ? "" : otherConfig.reason).toContain("3 trials");

    const otherMachine = buildRunDiff(
      current,
      previousRun({
        libraries: new Map([
          ["cf", { fingerprint: fingerprint("cf", { cpuModel: "Other" }), trials: trials([scenario("steady", 100)]) }],
        ]),
      }),
    );
    expect(otherMachine.comparable).toBe(false);

    const noSubject = buildRunDiff(current, previousRun({ libraries: new Map() }));
    expect(noSubject.comparable).toBe(false);
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
