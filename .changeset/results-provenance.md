---
"@benchmark/di": patch
---

Make `RESULTS.md` self-contained: commit the run it is transcribed from under `baselines/` and cite both ends of every
`Δ` by their committed path.

The page previously named its source run by a `bench-results/` id that is gitignored, so the reference resolved only on
the author's machine. Its `observations.jsonl` now lives under `baselines/` beside the pinned pre-rewrite baseline, the
version label is corrected to the current `0.10.0` (the pass ran on a runtime byte-identical to it), and the re-running
notes state the `baselines/` policy: it holds exactly the committed runs the page and `bench:baseline` cite, and a run
nothing references any more is deleted when the ledger is re-anchored.
