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

## Suite aggregates

\`BENCH_ISOLATE=true BENCH_MODE=full\`, one subprocess per scenario, libraries **interleaved with rotating order** — every
library measures a scenario before the next scenario starts. Ratios over the 43 scenarios each competitor implements.

| Competitor | Win / parity / loss | Median | Geomean |
| ---------- | ------------------: | -----: | ------: |
| inversify  |          43 / 0 / 0 |  2.21× |   2.92× |
| Awilix 13  |           8 / 0 / 0 |  3.25× |   3.83× |
| tsyringe 4 |           7 / 0 / 1 |  5.68× |   4.88× |

## Where it loses

**\`realistic-graph-cold-resolve\` — 0.94× of tsyringe** in the interleaved run, and slower **on purpose**.

**\`dynamic-async-chain-8\` no longer belongs here.** Retired.

## Retracted

- Something withdrawn.
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
      aggregateProfile:
        "BENCH_ISOLATE=true BENCH_MODE=full, one subprocess per scenario, libraries interleaved with rotating order",
      aggregates: [
        { competitor: "inversify", wins: 43, parities: 0, losses: 0, median: 2.21, geomean: 2.92 },
        { competitor: "Awilix 13", wins: 8, parities: 0, losses: 0, median: 3.25, geomean: 3.83 },
        { competitor: "tsyringe 4", wins: 7, parities: 0, losses: 1, median: 5.68, geomean: 4.88 },
      ],
      losses: [{ scenario: "realistic-graph-cold-resolve", ratio: 0.94, competitor: "tsyringe" }],
    });
  });

  it("degrades to empty facts when the ledger states none of them", () => {
    expect(parseLedgerFacts("# Results\n\nNothing yet.\n")).toEqual({
      libraries: [],
      environment: "",
      latestEntry: null,
      lastFullRemeasure: null,
      aggregateProfile: "",
      aggregates: [],
      losses: [],
    });
  });

  it("takes the first dated heading as the latest entry", () => {
    const facts = parseLedgerFacts("## 2026-01-02 — newer\n\n## 2025-12-31 — older\n");

    expect(facts.latestEntry).toEqual({ date: "2026-01-02", title: "newer" });
  });
});
