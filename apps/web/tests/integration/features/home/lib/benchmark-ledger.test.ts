import { afterEach, describe, expect, it, vi } from "vitest";

import { readLedgerFacts } from "#features/home/lib/benchmark-ledger.impl";

describe("readLedgerFacts", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // The reader degrades a parse error to empty facts and logs why; asserting no log puts that reason in the failure.
  function readQuietly(): ReturnType<typeof readLedgerFacts> {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const facts = readLedgerFacts();

    expect(errors).not.toHaveBeenCalled();

    return facts;
  }

  it("reads the real facts: `@codefast/di` among the libraries, the machine, and a dated full re-measure", () => {
    const facts = readQuietly();

    expect(facts.libraries.map((library) => library.name)).toContain("@codefast/di");
    expect(facts.libraries.length).toBeGreaterThan(1);
    expect(facts.environment).toMatch(/^Node \d/);
    expect(facts.lastFullRemeasure).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("reads the aggregates with a line per competitor, two ratios each, and the losses anchor", () => {
    const facts = readQuietly();

    expect(facts.aggregateProfile).not.toBe("");
    expect(facts.aggregates.length).toBe(facts.libraries.length - 1);
    expect(facts.lossesAnchor).not.toBe("");

    for (const row of facts.aggregates) {
      expect(row.wins + row.parities + row.losses).toBeGreaterThan(0);
      expect(row.median).toBeGreaterThan(0);
      expect(row.geomean).toBeGreaterThan(0);
    }
  });
});
