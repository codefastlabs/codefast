import { describe, expect, it } from "vitest";

import { readLedgerFacts } from "#/features/home/lib/benchmark-ledger.impl";

describe("readLedgerFacts", () => {
  it("reads the real ledger: the flagship among the libraries, and a dated entry", () => {
    const facts = readLedgerFacts();

    expect(facts.libraries.map((library) => library.name)).toContain("@codefast/di");
    expect(facts.libraries.length).toBeGreaterThan(1);
    expect(facts.environment).toMatch(/^Node \d/);
    expect(facts.latestEntry?.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
