import { afterEach, describe, expect, it, vi } from "vitest";

import { EMPTY_LEDGER_FACTS, parseLedgerFacts } from "#features/home/lib/benchmark-ledger-facts";
import { readLedgerFacts } from "#features/home/lib/benchmark-ledger.impl";
import { BENCHMARK_RESULTS } from "#tests/unit/features/home/lib/fixtures/benchmark-results";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("readLedgerFacts", () => {
  it("passes well-formed facts through untouched and logs nothing", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(readLedgerFacts(BENCHMARK_RESULTS)).toEqual(parseLedgerFacts(BENCHMARK_RESULTS));
    expect(log).not.toHaveBeenCalled();
  });

  it("degrades facts it cannot read to empty facts and logs the reason once", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(readLedgerFacts({ ...BENCHMARK_RESULTS, aggregates: [] })).toEqual(EMPTY_LEDGER_FACTS);
    expect(log).toHaveBeenCalledOnce();
    expect(log).toHaveBeenCalledWith(
      "The home page shows no benchmark scoreboard:",
      expect.stringContaining("not one per competitor"),
    );
  });
});
