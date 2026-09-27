# Results

Where `@codefast/di` actually stands against the field right now, wins and losses given equal weight.

**This is one full-profile pass, so read the aggregates, not the rows.** GC-exposed for one collection between trials,
one subprocess per scenario, libraries interleaved with rotating order, 3 trials each over the one closure a scenario
builds before its first trial — a single pass measures no between-run variance of its own.

**Environment.** `@codefast/di` at `92b3596a7` — 0.11.0 plus the unreleased 0.12 changes — from a `dist` built first, on
Node 26.1.0 / V8 14.6, Apple M3 Max × 14, darwin/arm64, `--expose-gc` for every library. inversify 8.2.3 · awilix 13.0.5
· tsyringe 4.10.0 · brandi 5.1.0 · ditox 3.3.0 · injection-js 2.6.1. Each library runs at its canonical decorator mode
(inversify legacy decorators + `reflect-metadata`, codefast TC39 Stage 3 + `Symbol.metadata`). Run 2026-09-27, 2m18s
wall, 0 sanity failures.

## Summary — where we stand

Ratios are `@codefast/di ÷ competitor`; above 1× means codefast is faster.

| Competitor     | Comparable | Win / parity / loss | Median | Geomean |   † |
| -------------- | ---------: | ------------------: | -----: | ------: | --: |
| InversifyJS 8  |  92 of 131 |          90 / 1 / 1 |  4.28× |   5.79× |  45 |
| Awilix 13      |  38 of 131 |          38 / 0 / 0 |  6.51× |   6.11× |  17 |
| tsyringe 4     |  43 of 131 |          38 / 0 / 5 |  4.73× |   3.97× |  20 |
| Brandi 5       |  30 of 131 |          29 / 0 / 1 |  14.2× |   11.9× |  17 |
| Ditox 3        |  45 of 131 |         33 / 2 / 10 |  1.44× |   1.68× |  21 |
| injection-js 2 |  31 of 131 |         19 / 2 / 10 |  1.47× |   1.45× |  21 |

## The losses, foregrounded — where to improve

- **Registration is the biggest deficit, and ditox is the rival it is wide against.** `bind-128-plain` runs at 0.39×
  ditox.
