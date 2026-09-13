import { describe, expect, it } from "vitest";

import { buildComparisonRows } from "#/report/comparison";
import { renderScoreboardLines } from "#/report/console-scoreboard";
import { PLAIN_PALETTE } from "#/shared/palette";

const squeeze = (line: string): string => line.replaceAll(/ {2,}/g, " ").trimEnd();
import { library, scenario } from "#/tests/unit/report/support/fixtures";

describe("renderScoreboardLines", () => {
  const pivot = library("cf", [
    scenario("a", 200, "micro"),
    scenario("b", 50, "micro"),
    scenario("c", 100, "scope"),
    scenario("d", 40_000_000, "micro"),
    scenario("only", 10, "resolution"),
  ]);
  const inv = library("inv", [
    scenario("a", 100, "micro"),
    scenario("b", 100, "micro"),
    scenario("c", 100, "scope"),
    scenario("d", 80_000_000, "micro"),
  ]);
  const awi = library("awi", [scenario("a", 50, "micro")]);
  const rows = buildComparisonRows(pivot, [inv, awi]);

  it("puts one scoreboard row per competitor with counts, aggregates and the worst loss", () => {
    const lines = renderScoreboardLines(pivot, [inv, awi], rows, { palette: PLAIN_PALETTE });
    expect(lines[0]).toBe("Scoreboard  (cf ÷ competitor · win >1.03× · parity ±3% · † not citable)");
    expect(lines.slice(1, 4).map(squeeze)).toEqual([
      "vs W · P · L of median geomean worst",
      "inv 1 · 1 · 2 4 0.75× 0.84× b 0.50×",
      "awi 1 · 0 · 0 1 4.00× 4.00× —",
    ]);
  });

  it("tables the geomean per group with a dash where a competitor has no rows, and skips subject-only groups", () => {
    const lines = renderScoreboardLines(pivot, [inv, awi], rows, { palette: PLAIN_PALETTE });
    const start = lines.findIndex((line) => line.startsWith("Geomean by group"));
    expect(start).toBeGreaterThan(0);
    expect(lines.slice(start, start + 3).map(squeeze)).toEqual([
      "Geomean by group inv awi",
      "micro 0.79× 4.00×",
      "scope 1.00× —",
    ]);
    expect(lines.some((line) => line.startsWith("resolution"))).toBe(false);
  });

  it("lists reliable losses one per line and counts the unreliable ones it hides", () => {
    const lines = renderScoreboardLines(pivot, [inv, awi], rows, { palette: PLAIN_PALETTE });
    const start = lines.findIndex((line) => line.startsWith("Losses"));
    expect(lines[start]).toBe("Losses  (reliable only; 1 marked † hidden)");
    expect(lines.slice(start + 1, start + 3).map(squeeze)).toEqual(["vs scenario ratio group", "inv b 0.50× micro"]);
  });

  it("adds Δ columns only when a comparable diff is given", () => {
    const withDiff = renderScoreboardLines(pivot, [inv, awi], rows, {
      palette: PLAIN_PALETTE,
      diff: {
        comparable: true,
        previousRunId: "prev",
        pinned: false,
        scenarios: [],
        regressions: [],
        improvements: [],
        competitors: [{ displayName: "inv", medianDelta: -0.031, geomeanDelta: 0.02 }],
      },
    });
    expect(withDiff[0]).toContain("Δ vs prev");
    expect(withDiff.slice(1, 4).map(squeeze)).toEqual([
      "vs W · P · L of median Δ prev geomean Δ prev worst",
      "inv 1 · 1 · 2 4 0.75× −3.1% 0.84× +2.0% b 0.50×",
      "awi 1 · 0 · 0 1 4.00× — 4.00× — —",
    ]);
  });
});
