import { describe, expect, it } from "vitest";

import { parseLedgerFacts } from "#/features/home/lib/benchmark-ledger-facts";

const LEDGER = `# Results

What has actually been measured.

**Environment.** Node 26.1.0 / V8 14.6, Apple M3 Max × 14, darwin/arm64. \`@codefast/di\` 0.5.0-canary.8 · inversify 8.2.3
· awilix 13.0.5 · tsyringe 4.10.0. Isolated profile (\`BENCH_ISOLATE=true\`), 3 trials, unless a row says otherwise.

**Last full re-measure: 2026-07-31**, after the cascade-lane change landed.

## 2026-09-01 — the name lane folds into the \`tag\` lane

Body.

## 2026-08-17 — an older entry

Body.
`;

describe("parseLedgerFacts", () => {
  it("reads the libraries, the environment, the latest entry and the last full re-measure", () => {
    expect(parseLedgerFacts(LEDGER)).toEqual({
      libraries: [
        { name: "@codefast/di", version: "0.5.0-canary.8" },
        { name: "inversify", version: "8.2.3" },
        { name: "awilix", version: "13.0.5" },
        { name: "tsyringe", version: "4.10.0" },
      ],
      environment: "Node 26.1.0 / V8 14.6, Apple M3 Max × 14, darwin/arm64",
      latestEntry: { date: "2026-09-01", title: "the name lane folds into the tag lane" },
      lastFullRemeasure: "2026-07-31",
    });
  });

  it("degrades to empty facts when the ledger states none of them", () => {
    expect(parseLedgerFacts("# Results\n\nNothing yet.\n")).toEqual({
      libraries: [],
      environment: "",
      latestEntry: null,
      lastFullRemeasure: null,
    });
  });

  it("takes the first dated heading as the latest entry", () => {
    const facts = parseLedgerFacts("## 2026-01-02 — newer\n\n## 2025-12-31 — older\n");

    expect(facts.latestEntry).toEqual({ date: "2026-01-02", title: "newer" });
  });
});
