---
"@benchmark/di": patch
---

Make `benchmarks/di/baselines/` mean what its name says: one thing, the pinned anchor every `RESULTS.md` `Δ` reads
against. Two kinds of run had accreted there. The cold-path decision record's before/after runs move beside their own
document, under `docs/decisions/di-cold-path-redesign/`. The page's own source run — the other end of the `Δ`, which is
not a baseline — moves to `results-source/`. Both stay committed so every `Δ` is still verifiable from the repository;
the decision record and the page's citations and policy note are updated, and `baselines/` now holds only the anchor.
