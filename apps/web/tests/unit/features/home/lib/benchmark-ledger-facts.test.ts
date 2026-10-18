import { describe, expect, it } from "vitest";
import * as z from "zod";

import { parseLedgerFacts } from "#features/home/lib/benchmark-ledger-facts";
import { BENCHMARK_RESULTS } from "#tests/unit/features/home/lib/fixtures/benchmark-results";

describe("parseLedgerFacts", () => {
  it("reads the cast, the machine, the profile, the aggregates and the losses anchor", () => {
    expect(parseLedgerFacts(BENCHMARK_RESULTS)).toEqual({
      libraries: [
        { name: "@codefast/di", version: "0.13.0" },
        { name: "inversify", version: "8.2.3" },
        { name: "ditox", version: "3.3.0" },
      ],
      environment: "Node 26.1.0 / V8 14.6.202.34-node.19, Apple M3 Max × 14, darwin/arm64",
      lastFullRemeasure: "2026-10-18",
      aggregateProfile: "full profile · 3 trials · one subprocess per scenario",
      aggregates: [
        {
          competitor: "inversify",
          wins: 91,
          parities: 1,
          losses: 1,
          median: 4.307953369966096,
          geomean: 5.80329438669165,
        },
        { competitor: "ditox", wins: 33, parities: 3, losses: 10, median: 1.4, geomean: 1.68 },
      ],
      lossesAnchor: "the-losses-foregrounded--where-to-improve",
    });
  });

  it("dates no full re-measure for a pass outside the full profile", () => {
    const facts = parseLedgerFacts({ ...BENCHMARK_RESULTS, profile: { mode: "fast", isolated: false, trialCount: 1 } });

    expect(facts.lastFullRemeasure).toBeNull();
    expect(facts.aggregateProfile).toBe("fast profile · 1 trial · one process for every scenario");
  });

  it("links to the ledger itself when it names no losses heading", () => {
    expect(parseLedgerFacts({ ...BENCHMARK_RESULTS, lossesHeading: "" }).lossesAnchor).toBe("");
  });

  it("throws on a file that does not match the schema", () => {
    expect(() => parseLedgerFacts({ ...BENCHMARK_RESULTS, runDate: "October 18" })).toThrow(z.ZodError);
    expect(() => parseLedgerFacts({ ...BENCHMARK_RESULTS, libraries: [] })).toThrow(z.ZodError);
    expect(() => parseLedgerFacts("# Results")).toThrow(z.ZodError);
  });

  it("throws when the aggregates are not one line per competitor", () => {
    expect(() => parseLedgerFacts({ ...BENCHMARK_RESULTS, aggregates: BENCHMARK_RESULTS.aggregates.slice(1) })).toThrow(
      "names 3 libraries but has 1 aggregate lines",
    );
  });
});
