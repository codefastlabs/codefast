import { describe, expect, it, vi } from "vitest";

import type { AggregatedScenarioResult, LibraryReport } from "#/report/aggregate";
import type { ComparisonLibrary, ComparisonMarkdownReportOptions } from "#/report/comparison";
import {
  buildComparisonRows,
  renderComparisonConsoleReport,
  renderComparisonMarkdownReport,
  summarizeAgainstCompetitor,
  summarizeComparison,
} from "#/report/comparison";
import {
  NOISY_IQR_FRACTION,
  NOISY_IQR_MARKER,
  THROUGHPUT_NOISE_CEILING_HZ_PER_OP,
  UNRELIABLE_RATIO_MARKER,
  formatNoisyIqrCaveatLine,
  formatReliabilityCaveatLine,
} from "#/report/reliability";
import type { Fingerprint } from "#/shared/protocol";

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

function scenario(id: string, hzPerOp: number, group = "micro"): AggregatedScenarioResult {
  return {
    id,
    group,
    stress: false,
    excludeFromAggregates: false,
    batch: 1,
    what: id,
    trialsIncluded: 3,
    hzPerOpMedian: hzPerOp,
    hzPerOpIqrFraction: 0.02,
    meanMsMedian: 0.5,
    p75MsMedian: 0.6,
    p99MsMedian: 0.9,
    p999MsMedian: 1,
  };
}

function library(
  displayName: string,
  scenarios: ReadonlyArray<AggregatedScenarioResult>,
  sanityFailures: ReadonlyArray<string> = [],
): ComparisonLibrary {
  const report: LibraryReport = { fingerprint: FINGERPRINT, trialCount: 3, sanityFailures, scenarios };
  return { report, displayName, shortName: displayName.slice(0, 3) };
}

const BARE: ComparisonMarkdownReportOptions = {
  documentHeading: "# Report",
  sectionHeading: "Comparable scenarios",
};

const WITH_SECTIONS: ComparisonMarkdownReportOptions = {
  documentHeading: "# Report",
  sectionHeading: "Comparable scenarios",
  includeEnvironment: true,
  includeSanityFailures: true,
};

describe("buildComparisonRows", () => {
  it("aligns competitors to the pivot by id and keeps pivot order", () => {
    const rows = buildComparisonRows(library("di", [scenario("a", 200), scenario("b", 400)]), [
      library("inv", [scenario("b", 100), scenario("a", 100)]),
    ]);

    expect(rows.map((row) => row.id)).toEqual(["a", "b"]);
    expect(rows[0]!.competitors[0]!.ratio).toBe(2);
    expect(rows[1]!.competitors[0]!.ratio).toBe(4);
  });

  it("only includes scenarios the pivot measured", () => {
    const rows = buildComparisonRows(library("di", [scenario("a", 100)]), [
      library("inv", [scenario("a", 100), scenario("pivot-missing", 100)]),
    ]);

    expect(rows.map((row) => row.id)).toEqual(["a"]);
  });

  it("zeroes the whole cell for a competitor missing the scenario", () => {
    const rows = buildComparisonRows(library("di", [scenario("di-only", 100)]), [library("awi", [])]);

    expect(rows[0]!.competitors[0]).toEqual({ hzPerOp: 0, ratio: 0, iqrFraction: 0 });
  });

  it("keeps one cell per competitor in competitor order", () => {
    const rows = buildComparisonRows(library("di", [scenario("a", 300)]), [
      library("inv", [scenario("a", 100)]),
      library("awi", [scenario("a", 150)]),
    ]);

    expect(rows[0]!.competitors.map((cell) => cell.ratio)).toEqual([3, 2]);
  });
});

describe("summarizeAgainstCompetitor", () => {
  function headToHead(pivotScenarios: ReadonlyArray<AggregatedScenarioResult>, competitor: ComparisonLibrary) {
    const rows = buildComparisonRows(library("di", pivotScenarios), [competitor]);
    return summarizeAgainstCompetitor(rows, 0, competitor.report);
  }

  it("classifies wins, parities, and losses around the ±3% band", () => {
    const summary = headToHead(
      [
        scenario("clear-win", 200),
        scenario("clear-loss", 80),
        scenario("parity-high", 102),
        scenario("parity-low", 98),
      ],
      library("inv", [
        scenario("clear-win", 100),
        scenario("clear-loss", 100),
        scenario("parity-high", 100),
        scenario("parity-low", 100),
      ]),
    );

    expect(summary.comparableCount).toBe(4);
    expect(summary.wins.map((entry) => entry.id)).toEqual(["clear-win"]);
    expect(summary.losses.map((entry) => entry.id)).toEqual(["clear-loss"]);
    expect(summary.parities.map((entry) => entry.id)).toEqual(["parity-high", "parity-low"]);
  });

  it("separates one-sided scenarios from the comparable tally", () => {
    const summary = headToHead(
      [scenario("both", 150), scenario("pivot-only", 100)],
      library("inv", [scenario("both", 100), scenario("competitor-only", 100)]),
    );

    expect(summary.comparableCount).toBe(1);
    expect(summary.pivotOnlyIds).toEqual(["pivot-only"]);
    expect(summary.competitorOnlyIds).toEqual(["competitor-only"]);
  });

  it("computes the median and geometric mean across comparable scenarios", () => {
    const summary = headToHead(
      [scenario("a", 100), scenario("b", 200), scenario("c", 400)],
      library("inv", [scenario("a", 100), scenario("b", 100), scenario("c", 100)]),
    );

    expect(summary.medianRatio).toBe(2);
    // geomean(1, 2, 4) = 2.
    expect(summary.geomeanRatio).toBeCloseTo(2, 10);
  });

  it("breaks geomean down per group in first-appearance order, isolating error-path outliers", () => {
    const summary = headToHead(
      [scenario("m1", 200), scenario("m2", 800), scenario("f1", 10_000, "failure")],
      library("inv", [scenario("m1", 100), scenario("m2", 100), scenario("f1", 100, "failure")]),
    );

    expect(summary.groupGeomeans.map((entry) => entry.group)).toEqual(["micro", "failure"]);
    expect(summary.groupGeomeans.find((entry) => entry.group === "micro")!.geomeanRatio).toBeCloseTo(4, 10);
    expect(summary.groupGeomeans.find((entry) => entry.group === "failure")!.geomeanRatio).toBeCloseTo(100, 10);
  });

  it("flags a high-throughput row that lands in the loss column", () => {
    const above = THROUGHPUT_NOISE_CEILING_HZ_PER_OP + 1;
    const summary = headToHead(
      [scenario("fast-loss", above), scenario("slow-loss", 80)],
      library("inv", [scenario("fast-loss", above * 1.2), scenario("slow-loss", 100)]),
    );

    expect(summary.unreliableCount).toBe(1);
    expect(summary.losses.find((entry) => entry.id === "fast-loss")!.unreliable).toBe(true);
    expect(summary.losses.find((entry) => entry.id === "slow-loss")!.unreliable).toBe(false);
  });

  it("returns an empty head-to-head when nothing is comparable", () => {
    const summary = headToHead([], library("inv", []));

    expect(summary.comparableCount).toBe(0);
    expect(summary.medianRatio).toBe(0);
    expect(summary.geomeanRatio).toBe(0);
    expect(summary.groupGeomeans).toEqual([]);
    expect(summary.unreliableCount).toBe(0);
  });
});

describe("summarizeComparison", () => {
  it("returns one head-to-head per competitor, in competitor order", () => {
    const summaries = summarizeComparison(library("di", [scenario("a", 200), scenario("b", 400)]), [
      library("inv", [scenario("a", 100), scenario("b", 100)]),
      library("awi", [scenario("a", 400), scenario("b", 400)]),
    ]);

    expect(summaries.map((entry) => entry.displayName)).toEqual(["inv", "awi"]);
    expect(summaries[0]!.headToHead.wins.map((entry) => entry.id)).toEqual(["a", "b"]);
    expect(summaries[1]!.headToHead.losses.map((entry) => entry.id)).toEqual(["a"]);
  });
});

describe("renderComparisonMarkdownReport", () => {
  it("carries one throughput column and one ratio column per competitor, nothing derivable", () => {
    const markdown = renderComparisonMarkdownReport(
      library("di", [scenario("a", 300)]),
      [library("inv", [scenario("a", 100)]), library("awi", [scenario("a", 150)])],
      WITH_SECTIONS,
    );
    const header = markdown.split("\n").find((line) => line.startsWith("| Scenario"))!;

    expect(header).toContain("di hz/op");
    expect(header).toContain("vs inv");
    expect(header).toContain("vs awi");
    // Competitor throughput, latency and IQR are all recoverable from the ratio or the JSONL.
    expect(header).not.toContain("inv hz/op");
    expect(header).not.toContain("mean ms");
    expect(header).not.toContain("IQR");
    expect(markdown.split("\n").find((line) => line.startsWith("| a |"))).toContain("3.00×");
  });

  it("renders one row per pivot scenario, whatever each competitor covers", () => {
    const markdown = renderComparisonMarkdownReport(
      library("di", [scenario("shared", 300), scenario("di-only", 200)]),
      [library("inv", [scenario("shared", 100), scenario("di-only", 100)]), library("awi", [scenario("shared", 150)])],
      BARE,
    );
    const rows = markdown.split("\n").filter((line) => /^\| (?:shared|di-only) \|/.test(line));

    expect(rows).toHaveLength(2);
    // awilix covers only `shared`, so its cell on the other row is an em-dash rather than a missing row.
    expect(rows.find((line) => line.startsWith("| di-only |"))).toContain("—");
  });

  it("emits environment and sanity sections only when asked", () => {
    const pivot = library("di", [scenario("a", 200)], ["skipped-scenario"]);
    const competitor = library("inv", [scenario("a", 100)]);

    const withSections = renderComparisonMarkdownReport(pivot, [competitor], WITH_SECTIONS);
    expect(withSections).toContain("## Environment");
    expect(withSections).toContain("Node v26.1.0 / V8 14.6");
    expect(withSections).toContain("## Sanity failures");
    expect(withSections).toContain("**di**: `skipped-scenario`");

    const withoutSections = renderComparisonMarkdownReport(pivot, [competitor], BARE);
    expect(withoutSections).not.toContain("## Environment");
    expect(withoutSections).not.toContain("## Sanity failures");
  });

  it("summarizes each competitor on one row, so the summary does not grow with the table", () => {
    const markdown = renderComparisonMarkdownReport(
      library("di", [scenario("a", 200), scenario("b", 800)]),
      [library("inv", [scenario("a", 100), scenario("b", 100)]), library("awi", [scenario("a", 400)])],
      WITH_SECTIONS,
    );

    expect(markdown).toContain("| Competitor | Comparable | Win / parity / loss | Median | Geomean |");
    expect(markdown).toContain("| inv | 2 of 2 | 2 / 0 / 0 | 5.00× | 4.00× |");
    // awilix measured one of the two rows, and the coverage column is where that shows.
    expect(markdown).toContain("| awi | 1 of 2 | 0 / 0 / 1 | 0.50× | 0.50× |");
  });

  it("lays geomean by group out as a group × competitor matrix", () => {
    const markdown = renderComparisonMarkdownReport(
      library("di", [scenario("m1", 200), scenario("m2", 800), scenario("f1", 10_000, "failure")]),
      [
        library("inv", [scenario("m1", 100), scenario("m2", 100), scenario("f1", 100, "failure")]),
        library("awi", [scenario("m1", 100), scenario("m2", 100)]),
      ],
      WITH_SECTIONS,
    );

    expect(markdown).toContain("| Group | inv | awi |");
    expect(markdown).toContain("| micro | 4.00× (2) | 4.00× (2) |");
    // awilix never runs the error path, so its cell is an em-dash rather than a missing group row.
    expect(markdown).toContain("| failure | 100.0× (1) | — |");
  });

  it("lists losses and parity per competitor, and never a cherry-picked best row", () => {
    const markdown = renderComparisonMarkdownReport(
      library("di", [scenario("won", 800), scenario("lost", 50), scenario("drew", 100)]),
      [library("inv", [scenario("won", 100), scenario("lost", 100), scenario("drew", 100)])],
      WITH_SECTIONS,
    );

    expect(markdown).toContain("- **inv** — losses: `lost` (0.50×)");
    expect(markdown).toContain("- **inv** — parity: `drew` (1.00×)");
    expect(markdown).not.toContain("Biggest wins");
  });

  it("marks a high-throughput ratio and prints the caveat beneath the table", () => {
    const above = THROUGHPUT_NOISE_CEILING_HZ_PER_OP + 1;
    const markdown = renderComparisonMarkdownReport(
      library("di", [scenario("fast", above), scenario("slow", 200)]),
      [library("inv", [scenario("fast", above), scenario("slow", 100)])],
      WITH_SECTIONS,
    );
    const lines = markdown.split("\n");

    expect(lines.find((line) => line.startsWith("| fast |"))).toContain(`1.00×${UNRELIABLE_RATIO_MARKER}`);
    expect(lines.find((line) => line.startsWith("| slow |"))).not.toContain(UNRELIABLE_RATIO_MARKER);
    expect(markdown).toContain(formatReliabilityCaveatLine(1));
  });

  it("counts one marked cell per competitor column, not one per row", () => {
    const above = THROUGHPUT_NOISE_CEILING_HZ_PER_OP + 1;
    const markdown = renderComparisonMarkdownReport(
      library("di", [scenario("fast", above)]),
      [library("inv", [scenario("fast", above)]), library("awi", [scenario("fast", above)])],
      BARE,
    );

    expect(markdown).toContain(formatReliabilityCaveatLine(2));
  });

  it("does not mark a competitor cell that has no measurement to be unreliable about", () => {
    const above = THROUGHPUT_NOISE_CEILING_HZ_PER_OP + 1;
    const markdown = renderComparisonMarkdownReport(
      library("di", [scenario("only-pivot", above)]),
      [library("inv", [])],
      BARE,
    );

    const row = markdown.split("\n").find((line) => line.startsWith("| only-pivot |"))!;

    expect(row).toContain("—");
    expect(row).not.toContain(UNRELIABLE_RATIO_MARKER);
  });

  it("marks a wide-IQR median on both its throughput and its ratio, and counts every marked cell", () => {
    const noisy = { ...scenario("noisy", 200), hzPerOpIqrFraction: NOISY_IQR_FRACTION * 2 };
    const markdown = renderComparisonMarkdownReport(
      library("di", [noisy, scenario("tight", 200)]),
      [library("inv", [scenario("noisy", 100), scenario("tight", 100)])],
      BARE,
    );
    const lines = markdown.split("\n");

    expect(lines.find((line) => line.startsWith("| noisy |"))).toContain(`200${NOISY_IQR_MARKER}`);
    expect(lines.find((line) => line.startsWith("| noisy |"))).toContain(`2.00×${NOISY_IQR_MARKER}`);
    expect(lines.find((line) => line.startsWith("| tight |"))).not.toContain(NOISY_IQR_MARKER);
    expect(markdown).toContain(formatNoisyIqrCaveatLine(2));
  });

  it("omits the intro block when no intro lines are given", () => {
    const markdown = renderComparisonMarkdownReport(
      library("di", [scenario("a", 100)]),
      [library("inv", [scenario("a", 100)])],
      {
        ...BARE,
        introLines: ["Intro line."],
      },
    );

    expect(markdown).toContain("Intro line.");
    expect(
      renderComparisonMarkdownReport(library("di", [scenario("a", 100)]), [library("inv", [scenario("a", 100)])], BARE),
    ).not.toContain("Intro line.");
  });
});

describe("renderComparisonConsoleReport", () => {
  function captureConsole(run: () => void): string {
    const logged: Array<string> = [];
    const spy = vi.spyOn(console, "log").mockImplementation((line: unknown) => {
      logged.push(String(line));
    });
    try {
      run();
    } finally {
      spy.mockRestore();
    }
    return logged.join("\n");
  }

  it("uses short names in headers and prints one line per scenario", () => {
    const output = captureConsole(() => {
      renderComparisonConsoleReport(
        library("codefast", [scenario("alpha", 200), scenario("beta", 300)]),
        [library("inversify", [scenario("alpha", 100), scenario("beta", 100)])],
        {
          sectionHeading: "Comparable scenarios",
        },
      );
    });

    expect(output).toContain("Comparable scenarios");
    // shortName is the first three characters of displayName in this fixture.
    expect(output).toContain("cod hz/op");
    expect(output).not.toContain("inv hz/op");
    expect(output).toContain("vs inv");
    expect(output).toContain("alpha");
    expect(output).toContain("beta");
    expect(output).toContain("2.00×");
  });

  it("prints the footer hint only when one is given", () => {
    const withHint = captureConsole(() => {
      renderComparisonConsoleReport(library("di", [scenario("a", 200)]), [library("inv", [scenario("a", 100)])], {
        sectionHeading: "Section",
        footerHintLine: "Cite the table.",
      });
    });
    expect(withHint).toContain("Cite the table.");

    const withoutHint = captureConsole(() => {
      renderComparisonConsoleReport(library("di", [scenario("a", 200)]), [library("inv", [scenario("a", 100)])], {
        sectionHeading: "Section",
      });
    });
    expect(withoutHint).not.toContain("Cite the table.");
  });
});
