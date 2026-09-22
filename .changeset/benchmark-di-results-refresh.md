---
"@benchmark/di": minor
---

`baselines/` now holds exactly the one run `RESULTS.md` transcribes, and `bench:baseline` derives it rather than naming
it: the lane passes `BENCH_BASELINE=baselines`, so a run id is never hand-edited into the script or copied into the
page's prose. The directory had accumulated three runs that were not baselines at all — the page's own transcript and
two contract-tier exhibits kept for a document that cited them — which left the baseline's identity nowhere in the data
and made any read of the directory pick up the wrong run. `RESULTS.md` is rewritten from a fresh full-profile isolated
pass (`2026-09-21T09-29-37-156Z`) as a self-contained snapshot of where the engine stands, dropping the deltas that were
carried against the retired pre-rewrite engine; the runs nothing transcribes any more are removed.
