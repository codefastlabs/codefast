import { describe, expect, it } from "vitest";

import type { AggregatedScenarioResult, LibraryReport } from "#/report/aggregate";
import type { NWayLibrary } from "#/report/n-way";
import {
  buildNWayComparisonRows,
  renderNWayConsoleReport,
  renderNWayMarkdownReport,
  summarizeNWayComparison,
} from "#/report/n-way";
import type { Fingerprint } from "#/shared/protocol";

function scenario(id: string, hzPerOp: number, group = "micro"): AggregatedScenarioResult {
  return {
    id,
    group,
    stress: false,
    batch: 1,
    what: id,
    trialsIncluded: 1,
    hzPerOpMedian: hzPerOp,
    hzPerOpIqrFraction: 0,
    meanMsMedian: 0,
    p75MsMedian: 0,
    p99MsMedian: 0,
    p999MsMedian: 0,
  };
}

const STUB_FINGERPRINT = {} as unknown as Fingerprint;

function library(displayName: string, scenarios: ReadonlyArray<AggregatedScenarioResult>): NWayLibrary {
  const report: LibraryReport = {
    fingerprint: STUB_FINGERPRINT,
    trialCount: 1,
    sanityFailures: [],
    scenarios,
  };
  return { report, displayName };
}

describe("buildNWayComparisonRows", () => {
  it("aligns competitors to the pivot by scenario id and keeps pivot order", () => {
    const pivot = library("di", [scenario("a", 200), scenario("b", 400)]);
    const inversify = library("inv", [scenario("a", 100), scenario("b", 100)]);

    const rows = buildNWayComparisonRows(pivot, [inversify]);

    expect(rows.map((row) => row.id)).toEqual(["a", "b"]);
    expect(rows[0]!.competitors[0]!.hzPerOp).toBe(100);
    expect(rows[0]!.competitors[0]!.ratio).toBe(2);
    expect(rows[1]!.competitors[0]!.ratio).toBe(4);
  });

  it("only includes scenarios the pivot measured", () => {
    const pivot = library("di", [scenario("a", 100)]);
    const competitor = library("inv", [scenario("a", 100), scenario("pivot-missing", 100)]);

    const rows = buildNWayComparisonRows(pivot, [competitor]);

    expect(rows.map((row) => row.id)).toEqual(["a"]);
  });

  it("zeroes the cell and ratio for a competitor missing the scenario", () => {
    const pivot = library("di", [scenario("shared", 100), scenario("di-only", 100)]);
    const awilix = library("awi", [scenario("shared", 50)]);

    const rows = buildNWayComparisonRows(pivot, [awilix]);

    const diOnly = rows.find((row) => row.id === "di-only")!;
    expect(diOnly.competitors[0]!.hzPerOp).toBe(0);
    expect(diOnly.competitors[0]!.ratio).toBe(0);
    const shared = rows.find((row) => row.id === "shared")!;
    expect(shared.competitors[0]!.ratio).toBe(2);
  });

  it("keeps one cell per competitor in competitor order", () => {
    const pivot = library("di", [scenario("a", 300)]);
    const inversify = library("inv", [scenario("a", 100)]);
    const awilix = library("awi", [scenario("a", 150)]);

    const rows = buildNWayComparisonRows(pivot, [inversify, awilix]);

    expect(rows[0]!.competitors).toHaveLength(2);
    expect(rows[0]!.competitors[0]!.ratio).toBe(3);
    expect(rows[0]!.competitors[1]!.ratio).toBe(2);
  });
});

describe("summarizeNWayComparison", () => {
  it("returns one summary per competitor in order, each pivot/competitor", () => {
    const pivot = library("di", [scenario("a", 200), scenario("b", 400), scenario("c", 100)]);
    const inversify = library("inv", [scenario("a", 100), scenario("b", 100), scenario("c", 100)]);
    const awilix = library("awi", [scenario("a", 400), scenario("b", 400)]);

    const summaries = summarizeNWayComparison(pivot, [inversify, awilix]);

    expect(summaries.map((entry) => entry.displayName)).toEqual(["inv", "awi"]);
    // vs inversify: ratios 2, 4, 1 → median 2, one parity (c), two wins.
    expect(summaries[0]!.summary.comparableCount).toBe(3);
    expect(summaries[0]!.summary.medianRatio).toBe(2);
    expect(summaries[0]!.summary.wins.map((entry) => entry.id)).toEqual(["a", "b"]);
    expect(summaries[0]!.summary.parities.map((entry) => entry.id)).toEqual(["c"]);
    // vs awilix: only a and b are comparable; c is pivot-only.
    expect(summaries[1]!.summary.comparableCount).toBe(2);
    expect(summaries[1]!.summary.losses.map((entry) => entry.id)).toEqual(["a"]);
    expect(summaries[1]!.summary.parities.map((entry) => entry.id)).toEqual(["b"]);
  });

  it("computes the geometric mean per competitor over comparable scenarios", () => {
    const pivot = library("di", [scenario("a", 100), scenario("b", 400)]);
    const competitor = library("inv", [scenario("a", 100), scenario("b", 100)]);

    const [summary] = summarizeNWayComparison(pivot, [competitor]);

    // geomean(1, 4) = 2.
    expect(summary!.summary.geomeanRatio).toBeCloseTo(2, 10);
  });
});

const RENDER_OPTIONS = {
  documentHeading: "# Report",
  sectionHeading: "N-way core subset",
  introLines: ["Intro line."],
} as const;

describe("renderNWayMarkdownReport", () => {
  it("renders heading, intro, per-competitor summary, and one column set per library", () => {
    const pivot = library("di", [scenario("a", 200), scenario("b", 400)]);
    const inversify = library("inv", [scenario("a", 100), scenario("b", 200)]);
    const awilix = library("awi", [scenario("a", 50), scenario("b", 100)]);

    const markdown = renderNWayMarkdownReport(pivot, [inversify, awilix], RENDER_OPTIONS);
    const lines = markdown.split("\n");

    expect(lines[0]).toBe("# Report");
    expect(markdown).toContain("## N-way core subset");
    expect(markdown).toContain("Intro line.");
    expect(markdown).toContain("**di vs inv**: 2 win / 0 parity / 0 loss of 2 comparable");
    expect(markdown).toContain("**di vs awi**: 2 win / 0 parity / 0 loss of 2 comparable");

    const headerLine = lines.find((line) => line.startsWith("| Scenario"))!;
    expect(headerLine).toContain("di hz/op");
    expect(headerLine).toContain("inv hz/op");
    expect(headerLine).toContain("awi hz/op");
    expect(headerLine).toContain("di / inv");
    expect(headerLine).toContain("di / awi");

    const rowA = lines.find((line) => line.startsWith("| a |"))!;
    // 200 vs 100 → 2.00x; 200 vs 50 → 4.00x
    expect(rowA).toContain("2.00×");
    expect(rowA).toContain("4.00×");
  });

  it("renders an em-dash for a competitor that never measured the scenario", () => {
    const pivot = library("di", [scenario("only-pivot", 100)]);
    const competitor = library("inv", []);

    const markdown = renderNWayMarkdownReport(pivot, [competitor], RENDER_OPTIONS);
    const row = markdown.split("\n").find((line) => line.startsWith("| only-pivot |"))!;

    expect(row).toContain("—");
  });

  it("omits the intro block when no intro lines are given", () => {
    const pivot = library("di", [scenario("a", 100)]);
    const competitor = library("inv", [scenario("a", 100)]);

    const markdown = renderNWayMarkdownReport(pivot, [competitor], {
      documentHeading: "# Report",
      sectionHeading: "Section",
    });

    expect(markdown).not.toContain("Intro line.");
    expect(markdown).toContain("## Section");
  });
});

describe("renderNWayConsoleReport", () => {
  it("prints the section heading, a header row per library, and one line per scenario", () => {
    const pivot = library("di", [scenario("alpha", 200), scenario("beta", 300)]);
    const competitor = library("inv", [scenario("alpha", 100), scenario("beta", 100)]);

    const logged: Array<string> = [];
    const originalLog = console.log;
    console.log = (message?: unknown): void => {
      logged.push(String(message));
    };
    try {
      renderNWayConsoleReport(pivot, [competitor], RENDER_OPTIONS);
    } finally {
      console.log = originalLog;
    }

    const output = logged.join("\n");
    expect(output).toContain("N-way core subset");
    expect(output).toContain("di hz/op");
    expect(output).toContain("inv hz/op");
    expect(output).toContain("di/inv");
    expect(logged.some((line) => line.startsWith("alpha"))).toBe(true);
    expect(logged.some((line) => line.startsWith("beta"))).toBe(true);
    expect(output).toContain("2.00×");
    expect(output).toContain("3.00×");
  });
});
