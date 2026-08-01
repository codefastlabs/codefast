# @codefast/benchmark-harness

## 0.5.0-canary.9

### Minor Changes

- [#674](https://github.com/codefastlabs/codefast/pull/674) [`15b732a`](https://github.com/codefastlabs/codefast/commit/15b732a8ade895dec5df464e9ba30f646e0bf39d) Thanks [@thevuong](https://github.com/thevuong)! - Reshape the comparison report so it stays readable as competitors are added. The per-scenario table now carries the pivot's throughput and one ratio column per competitor — the per-competitor throughput, latency and IQR columns were all derivable from those or from the JSONL, and they grew the table by two columns per library. The head-to-head prose that opened the report is now a **Summary** table with one row per competitor (comparable rows out of the suite, win/parity/loss, median, geomean, unreliable-row count) and a **Geomean by group** matrix, both of which grow downward rather than sideways.

  The IQR column becomes a `‡` cell marker driven by the same ~5% threshold the reports already told readers to apply, alongside the existing `†` marker for ratios that do not reproduce between runs. The "Biggest wins" line is gone: it cherry-picked exactly the high-throughput rows `†` exists to warn against citing.

  `markRatioReliability` is replaced by `markRatioQuality` / `markThroughputQuality`, which take a `ThroughputQuality` per side so a cell's markers and the footnote counts cannot disagree. `formatLatencyMeanMilliseconds` and `formatIqrThroughputFraction` are removed with the columns they served; ratio formatting is unified on `formatRatioMultiple`.

### Patch Changes

- [#677](https://github.com/codefastlabs/codefast/pull/677) [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842) Thanks [@thevuong](https://github.com/thevuong)! - Fairness fixes from an audit of the di-inversify suite:

  - Scenarios can declare `excludeFromAggregates`: the row still renders, but stays out of every median/geomean, and the report names it. Applied to `circular-dependency-3`, whose two sides never did comparable work per op (codefast throws on the 3rd factory entry; inversify 8.2.3 re-enters the user factory 1413 times before its own error) — it alone carried the `failure` group geomean.
  - The isolated runner's rotation now rotates over the libraries that actually implement each scenario. Rotating the full list and then filtering had left the pivot in the first slot for 3 of every 4 head-to-head rows.
  - Every inversify container now runs `{ jitless: false }`, its fastest documented configuration (codegen resolvers, off by default as a CSP-safe fallback).
  - Re-fixtured `scoped-binding-per-child` (inversify side: per-request child + own singleton bind — its idiom for the same user story; it previously failed its own sanity check and silently dropped out), equalized the `to-self-binding` graph, and hoisted the inversify options literals in `resolution-patterns` to match the codefast side.
  - New `realistic-graph-resolved-root` row binds the shared graph via `toResolved`/`toResolvedValue` — the shape both libraries compile ahead of time, comparing each library's best path.
  - The Markdown report now lists rows excluded from aggregates, pivot-only rows, and medians resting on fewer surviving trials than the run scheduled.

- [#677](https://github.com/codefastlabs/codefast/pull/677) [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842) Thanks [@thevuong](https://github.com/thevuong)! - `BENCH_FAST` now runs a single trial per scenario: it is a smoke profile — "does it run and roughly how fast" — and one trial answers that in a third of the time. The default and `BENCH_FULL` profiles keep 3 trials, and an explicit `BENCH_TRIALS` below 3 is still rejected, because those are the profiles a median is quoted from.

- [#676](https://github.com/codefastlabs/codefast/pull/676) [`641e233`](https://github.com/codefastlabs/codefast/commit/641e2338d77fb61be2ca585a5986f34cf32ec746) Thanks [@thevuong](https://github.com/thevuong)! - Collapse the `types` and `default` lanes of `package.json#imports` from fallback arrays to single strings.

  Node resolves an imports array by taking the first candidate it can parse, without checking that the file exists and without falling through — a specifier whose first candidate is missing throws `ERR_MODULE_NOT_FOUND` rather than trying the second. `./dist/*/index.js` and `./dist/*/index.d.ts` could therefore never be reached, so they read as a safety net that does not exist. The `source` lane keeps its extension candidates, which only `tsc` and Vite read and both probe.

## 0.5.0-canary.8

### Patch Changes

- [#646](https://github.com/codefastlabs/codefast/pull/646) [`3044f96`](https://github.com/codefastlabs/codefast/commit/3044f96c4ea8987e8af8583b3b90e0f5c2021105) Thanks [@thevuong](https://github.com/thevuong)! - Raise the minimum per-scenario trial count from 2 to 3 in every profile. A median of two samples is just their mean, so a two-trial run cannot separate a real change from ambient noise — which is exactly the judgement the harness exists to support. `BENCH_TRIALS` now rejects anything below 3.

## 0.5.0-canary.7

## 0.5.0-canary.6

## 1.0.0-canary.7

## 1.0.0-canary.6

## 0.5.0-canary.5

## 0.5.0-canary.4

## 0.5.0-canary.3

## 0.5.0-canary.2

## 0.5.0-canary.1

## 0.5.0-canary.0

## 0.4.0

### Patch Changes

- [`f680df9`](https://github.com/codefastlabs/codefast/commit/f680df903510b91c35f1c342d79e50c0672a4c19) Thanks [@thevuong](https://github.com/thevuong)! - Prefer immutable array methods (`toSorted`, `toReversed`) and drop redundant casts in the report quantiles, payload builder, and viewer components.

- [`2397801`](https://github.com/codefastlabs/codefast/commit/239780172d7a71c3426382ec66309ec7f39bd883) Thanks [@thevuong](https://github.com/thevuong)! - chore: align package config globs

- [`f79b333`](https://github.com/codefastlabs/codefast/commit/f79b333d0599c19028f29b9889afcbfb99db91a1) Thanks [@thevuong](https://github.com/thevuong)! - feat(dev): enable source condition for zero-rebuild HMR in apps/docs

- [`f26e846`](https://github.com/codefastlabs/codefast/commit/f26e8460e982171bfde13a7bd3fab4543e933df4) Thanks [@thevuong](https://github.com/thevuong)! - chore(benchmark-harness): export client modules

## 0.4.0-canary.6

## 0.4.0-canary.5

## 0.4.0-canary.4

### Patch Changes

- [#495](https://github.com/codefastlabs/codefast/pull/495) [`7b4e2fd`](https://github.com/codefastlabs/codefast/commit/7b4e2fde5a76fd4452e17b2aff5b94f7d669722b) Thanks [@thevuong](https://github.com/thevuong)! - Prefer immutable array methods (`toSorted`, `toReversed`) and drop redundant casts in the report quantiles, payload builder, and viewer components.

## 0.3.16-canary.3

### Patch Changes

- [`2a82188`](https://github.com/codefastlabs/codefast/commit/2a82188264c204b0b519b3324402ae962594d29b) Thanks [@thevuong](https://github.com/thevuong)! - feat(dev): enable source condition for zero-rebuild HMR in apps/docs

## 0.3.16-canary.2

### Patch Changes

- [`1ad2cb7`](https://github.com/codefastlabs/codefast/commit/1ad2cb73a3f6f8bff2b001e9df2f2492efd89aa2) Thanks [@thevuong](https://github.com/thevuong)! - chore: align package config globs

- [`3620966`](https://github.com/codefastlabs/codefast/commit/36209662115718c1d86566d36df991e98e1c36ab) Thanks [@thevuong](https://github.com/thevuong)! - chore(benchmark-harness): export client modules

## 0.3.16-canary.1

## 0.3.16-canary.0

## 0.3.15
