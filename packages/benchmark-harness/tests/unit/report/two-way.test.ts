import { describe, expect, it } from "vitest";

import type { AggregatedScenarioResult, LibraryReport } from "#/report/aggregate";
import {
  THROUGHPUT_NOISE_CEILING_HZ_PER_OP,
  UNRELIABLE_RATIO_MARKER,
  formatReliabilityCaveatLine,
} from "#/report/reliability";
import type { TwoWayScenarioComparisonRow } from "#/report/two-way";
import { renderTwoWayMarkdownReport, summarizeTwoWayComparison } from "#/report/two-way";
import type { Fingerprint } from "#/shared/protocol";

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

  it("computes the geometric mean across comparable scenarios", () => {
    // geomean(1, 4) = 2, unlike the arithmetic mean of 2.5.
    const summary = summarizeTwoWayComparison([row("a", 100, 100), row("b", 400, 100)]);
    expect(summary.geomeanRatio).toBeCloseTo(2, 10);
  });

  it("breaks geomean down per group in first-appearance order, isolating error-path outliers", () => {
    const summary = summarizeTwoWayComparison([
      row("m1", 200, 100, "micro"),
      row("m2", 800, 100, "micro"),
      row("f1", 10_000, 100, "failure"),
    ]);

    expect(summary.groupGeomeans.map((entry) => entry.group)).toEqual(["micro", "failure"]);
    const micro = summary.groupGeomeans.find((entry) => entry.group === "micro")!;
    const failure = summary.groupGeomeans.find((entry) => entry.group === "failure")!;
    // micro geomean(2, 8) = 4 stays independent of the 100× failure-path row.
    expect(micro.geomeanRatio).toBeCloseTo(4, 10);
    expect(micro.count).toBe(2);
    expect(failure.geomeanRatio).toBeCloseTo(100, 10);
    expect(failure.count).toBe(1);
  });

  it("returns an empty summary when nothing is comparable", () => {
    const summary = summarizeTwoWayComparison([]);
    expect(summary.comparableCount).toBe(0);
    expect(summary.medianRatio).toBe(0);
    expect(summary.geomeanRatio).toBe(0);
    expect(summary.groupGeomeans).toEqual([]);
    expect(summary.unreliableCount).toBe(0);
  });

  it("flags a high-throughput row that lands in the loss column", () => {
    const above = THROUGHPUT_NOISE_CEILING_HZ_PER_OP + 1;
    const summary = summarizeTwoWayComparison([
      row("fast-loss", above, above * 1.2),
      row("slow-loss", 80, 100),
      row("slow-win", 200, 100),
    ]);

    expect(summary.unreliableCount).toBe(1);
    expect(summary.losses.find((entry) => entry.id === "fast-loss")!.unreliable).toBe(true);
    expect(summary.losses.find((entry) => entry.id === "slow-loss")!.unreliable).toBe(false);
    expect(summary.wins.find((entry) => entry.id === "slow-win")!.unreliable).toBe(false);
  });
});

describe("renderTwoWayMarkdownReport", () => {
  const FINGERPRINT: Fingerprint = {
    nodeVersion: "v26.1.0",
    v8Version: "14.6",
    platform: "darwin",
    arch: "arm64",
    cpuModel: "Test CPU",
    cpuCount: 8,
    nodeOptions: "--no-warnings",
    libraryName: "lib",
    libraryVersion: "1.0.0",
    gcExposed: false,
    timestampIso: "2026-01-01T00:00:00.000Z",
  };

  function report(scenarios: ReadonlyArray<AggregatedScenarioResult>): LibraryReport {
    return { fingerprint: FINGERPRINT, trialCount: 2, sanityFailures: [], scenarios };
  }

  function aggregated(id: string, hzPerOp: number, group: string): AggregatedScenarioResult {
    return {
      id,
      group,
      stress: false,
      batch: 1,
      what: id,
      trialsIncluded: 2,
      hzPerOpMedian: hzPerOp,
      hzPerOpIqrFraction: 0,
      meanMsMedian: 0,
      p75MsMedian: 0,
      p99MsMedian: 0,
      p999MsMedian: 0,
    };
  }

  const OPTIONS = {
    documentHeading: "# Bench",
    columnTitles: {
      leftThroughput: "left hz/op",
      rightThroughput: "right hz/op",
      ratioHeading: "left / right",
      leftMeanMs: "left mean ms",
      rightMeanMs: "right mean ms",
      leftP99Ms: "left p99 ms",
      rightP99Ms: "right p99 ms",
      iqrCombinedHeading: "IQR",
    },
    comparableScenarioIntroLines: ["Cite these rows."],
    fingerprintLibraryVersionLabels: { left: "left", right: "right" },
    sanityBulletMarkdownLabels: { left: "**left**", right: "**right**" },
  } as const;

  it("reports median, geomean, and a per-group geomean breakdown", () => {
    // micro: 2x and 8x → geomean 4x. failure: 100x, isolated in its own group.
    const left = report([
      aggregated("m1", 200, "micro"),
      aggregated("m2", 800, "micro"),
      aggregated("f1", 10_000, "failure"),
    ]);
    const right = report([
      aggregated("m1", 100, "micro"),
      aggregated("m2", 100, "micro"),
      aggregated("f1", 100, "failure"),
    ]);

    const markdown = renderTwoWayMarkdownReport(left, right, OPTIONS);

    expect(markdown).toContain("left wins 3 of 3 comparable scenarios (100%)");
    expect(markdown).toContain("geomean");
    expect(markdown).toContain("- Geomean by group: micro 4.00× (2), failure 100.0× (1).");
  });

  it("marks a high-throughput ratio in the table and prints the caveat beneath it", () => {
    const above = THROUGHPUT_NOISE_CEILING_HZ_PER_OP + 1;
    const left = report([aggregated("fast", above, "micro"), aggregated("slow", 200, "micro")]);
    const right = report([aggregated("fast", above, "micro"), aggregated("slow", 100, "micro")]);

    const markdown = renderTwoWayMarkdownReport(left, right, OPTIONS);
    const tableLines = markdown.split("\n").filter((line) => line.startsWith("| fast") || line.startsWith("| slow"));

    expect(tableLines.find((line) => line.startsWith("| fast"))).toContain(`1.00×${UNRELIABLE_RATIO_MARKER}`);
    expect(tableLines.find((line) => line.startsWith("| slow"))).toContain("2.00×");
    expect(tableLines.find((line) => line.startsWith("| slow"))).not.toContain(UNRELIABLE_RATIO_MARKER);
    expect(markdown).toContain(formatReliabilityCaveatLine(1));
  });

  it("omits the caveat entirely when every row is below the ceiling", () => {
    const left = report([aggregated("slow", 200, "micro")]);
    const right = report([aggregated("slow", 100, "micro")]);

    expect(renderTwoWayMarkdownReport(left, right, OPTIONS)).not.toContain(UNRELIABLE_RATIO_MARKER);
  });
});
