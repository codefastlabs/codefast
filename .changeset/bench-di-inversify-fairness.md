---
"@codefast/benchmark-harness": patch
"@codefast/benchmark-di-inversify": patch
---

Fairness fixes from an audit of the di-inversify suite:

- Scenarios can declare `excludeFromAggregates`: the row still renders, but stays out of every median/geomean, and the report names it. Applied to `circular-dependency-3`, whose two sides never did comparable work per op (codefast throws on the 3rd factory entry; inversify 8.2.3 re-enters the user factory 1413 times before its own error) — it alone carried the `failure` group geomean.
- The isolated runner's rotation now rotates over the libraries that actually implement each scenario. Rotating the full list and then filtering had left the pivot in the first slot for 3 of every 4 head-to-head rows.
- Every inversify container now runs `{ jitless: false }`, its fastest documented configuration (codegen resolvers, off by default as a CSP-safe fallback).
- Re-fixtured `scoped-binding-per-child` (inversify side: per-request child + own singleton bind — its idiom for the same user story; it previously failed its own sanity check and silently dropped out), equalized the `to-self-binding` graph, and hoisted the inversify options literals in `resolution-patterns` to match the codefast side.
- New `realistic-graph-resolved-root` row binds the shared graph via `toResolved`/`toResolvedValue` — the shape both libraries compile ahead of time, comparing each library's best path.
- The Markdown report now lists rows excluded from aggregates, pivot-only rows, and medians resting on fewer surviving trials than the run scheduled.
