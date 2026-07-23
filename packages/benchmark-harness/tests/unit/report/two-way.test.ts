import { describe, expect, it } from "vitest";

import type { TwoWayScenarioComparisonRow } from "#/report/two-way";
import { summarizeTwoWayComparison } from "#/report/two-way";

function row(id: string, leftHzPerOp: number, rightHzPerOp: number, group = "micro"): TwoWayScenarioComparisonRow {
  return {
    id,
    group,
    batch: 1,
    what: id,
    stress: false,
    leftHzPerOp,
    leftIqrFraction: 0,
    leftMeanMs: 0,
    leftP99Ms: 0,
    rightHzPerOp,
    rightIqrFraction: 0,
    rightMeanMs: 0,
    rightP99Ms: 0,
  };
}

describe("summarizeTwoWayComparison", () => {
  it("classifies wins, parities, and losses around the ±3% band", () => {
    const summary = summarizeTwoWayComparison([
      row("clear-win", 200, 100),
      row("clear-loss", 80, 100),
      row("parity-high", 102, 100),
      row("parity-low", 98, 100),
    ]);

    expect(summary.comparableCount).toBe(4);
    expect(summary.wins.map((entry) => entry.id)).toEqual(["clear-win"]);
    expect(summary.losses.map((entry) => entry.id)).toEqual(["clear-loss"]);
    expect(summary.parities.map((entry) => entry.id)).toEqual(["parity-high", "parity-low"]);
  });

  it("excludes one-sided scenarios from the comparable tally", () => {
    const summary = summarizeTwoWayComparison([
      row("left-only", 100, 0),
      row("right-only", 0, 100),
      row("both", 150, 100),
    ]);

    expect(summary.comparableCount).toBe(1);
    expect(summary.leftOnlyIds).toEqual(["left-only"]);
    expect(summary.rightOnlyIds).toEqual(["right-only"]);
  });

  it("computes the median ratio across comparable scenarios", () => {
    const summary = summarizeTwoWayComparison([row("a", 100, 100), row("b", 200, 100), row("c", 400, 100)]);
    expect(summary.medianRatio).toBe(2);

    const evenSummary = summarizeTwoWayComparison([row("a", 100, 100), row("b", 300, 100)]);
    expect(evenSummary.medianRatio).toBe(2);
  });

  it("returns an empty summary when nothing is comparable", () => {
    const summary = summarizeTwoWayComparison([]);
    expect(summary.comparableCount).toBe(0);
    expect(summary.medianRatio).toBe(0);
  });
});
