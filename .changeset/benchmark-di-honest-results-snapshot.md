---
"@benchmark/di": patch
"@codefast/di": patch
---

Rewrite `benchmarks/di/RESULTS.md` as a single machine-derived snapshot on `@codefast/di` 0.9.0 (full profile,
GC-exposed, interleaved) instead of an accreted dated ledger, weighting wins and losses equally so the page shows where
the engine is slower. The snapshot records that `@codefast/di` loses the aggregate to ditox (0.79× median) and the
geomean to injection-js (0.56×), and breaks down each loss as a real deficit or a by-design work difference — the
`resolve-all-strategies` collapse (0.03× at N=100) is the rivals returning a memoized collection where `@codefast/di`
re-gathers per op.

Assert the A/B method in `BENCH_GUIDE.md`: because `run.ts` rebuilds `packages/di/dist` from `src` unconditionally
before spawning, swapping the source is the one method, and swapping `dist` directly is a demoted escape hatch that must
use the child entries. Repoint the `packages/di/ARCHITECTURE.md` tag-chain-walk-memo reference from `RESULTS.md` to the
package `CHANGELOG.md`, where that A/B now lives.
