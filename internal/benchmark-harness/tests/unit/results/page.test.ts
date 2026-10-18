import { describe, expect, it } from "vitest";

import { LOSSES_HEADING, renderResultsPage } from "#results/page";
import type { ResultsPageInput } from "#results/page";
import { COVERING_NOTES, fixtureDocument, fixtureSuite } from "#tests/unit/results/support/suite";

function input(overrides: Partial<ResultsPageInput> = {}): ResultsPageInput {
  return {
    suite: fixtureSuite(),
    runId: "2026-10-18T00-00-00-000Z",
    document: fixtureDocument(),
    footprint: {
      bundler: "Rolldown 1.0.0",
      footprints: [
        { label: "@codefast/subject", minifiedBytes: 4000, gzippedBytes: 1500 },
        { label: "Rival 1", minifiedBytes: 2000, gzippedBytes: 900 },
        { label: "`shared` alone", minifiedBytes: 1000, gzippedBytes: 500 },
      ],
    },
    budgetBytes: 1600,
    passNotes: "Measured at `abc1234`.\n",
    ...overrides,
  };
}

describe("renderResultsPage", () => {
  it("names the subject and the suite's copy where the page describes the suite", () => {
    const page = renderResultsPage(input());

    expect(page).toContain("Where `@codefast/subject` actually stands against the field");
    expect(page).toContain("[`BENCH_GUIDE.md`](../di/BENCH_GUIDE.md)");
    expect(page).toContain("Every library runs its default entry.");
    expect(page).toContain("pnpm bench:baseline            # from benchmarks/subject —");
    expect(page).toContain("| Scenario | Group | batch | @codefast/subject hz/op | vs Rival 1 |");
  });

  it("renders the pass notes, the bundle ranking and the budget", () => {
    const page = renderResultsPage(input());

    expect(page).toContain("## This pass\n\nMeasured at `abc1234`.");
    expect(page).toContain("**Bundle.** Bundled with Rolldown 1.0.0.");
    expect(page).toContain(
      "`@codefast/subject` ships 1.5 KB gzipped, the largest of 2 libraries, against a checked-in budget of 1,600 B.",
    );
  });

  it("separates a time from its unit with a plain space, never a non-breaking one", () => {
    const page = renderResultsPage(input());

    expect(page).toMatch(/about \d+(?:\.\d+)? (?:ns|µs|ms) each/);
    expect(page).not.toContain(" ");
  });

  it("quotes each loss note with its rows' figures", () => {
    const page = renderResultsPage(input());

    expect(page).toContain(`## ${LOSSES_HEADING}`);
    expect(page).toContain(
      "- **The slow row** — real deficit. `slow-row` 0.50× rival. The subject does more per call.",
    );
    expect(page).toContain(
      "No competitor is swept outright. Every loss is named, with its reason, in the section after next.",
    );
  });

  it("says so when no competitor takes a row", () => {
    const document = fixtureDocument();
    const winsOnly = {
      ...document,
      headToHead: document.headToHead.map((entry) => ({
        ...entry,
        headToHead: { ...entry.headToHead, losses: [], medianRatio: 2, geomeanRatio: 2 },
      })),
    };
    const page = renderResultsPage(
      input({ document: winsOnly, suite: fixtureSuite({ ...COVERING_NOTES, lossNotes: [] }) }),
    );

    expect(page).toContain("None: no competitor takes a comparable row from codefast in this pass");
    expect(page).toContain("**Ahead of every competitor on both aggregates.** Rival 1 takes no row at all.\n");
  });
});
