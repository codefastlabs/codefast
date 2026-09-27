import { afterEach, describe, expect, it, vi } from "vitest";

import { parseLedgerFacts } from "#features/home/lib/benchmark-ledger-facts";
import { readLedgerFacts } from "#features/home/lib/benchmark-ledger.impl";

const [AT_COMMIT = ""] = Object.values(
  import.meta.glob<string>("./fixtures/benchmark-ledger-at-commit.md", {
    query: "?raw",
    import: "default",
    eager: true,
  }),
);

afterEach(() => {
  vi.restoreAllMocks();
});

describe("readLedgerFacts", () => {
  it("passes a well-formed ledger through untouched and logs nothing", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(readLedgerFacts(AT_COMMIT)).toEqual(parseLedgerFacts(AT_COMMIT));
    expect(log).not.toHaveBeenCalled();
  });

  it("degrades a ledger it cannot read to empty facts and logs the reason once", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(readLedgerFacts(AT_COMMIT.replace("0.11.0", "the tree"))).toEqual({
      libraries: [],
      environment: "",
      latestEntry: null,
      lastFullRemeasure: null,
      aggregateProfile: "",
      aggregates: [],
      losses: [],
      lossesAnchor: "",
    });
    expect(log).toHaveBeenCalledOnce();
    expect(log).toHaveBeenCalledWith(
      "The home page shows no benchmark scoreboard:",
      expect.stringContaining("names no `@codefast/di` version"),
    );
  });
});
