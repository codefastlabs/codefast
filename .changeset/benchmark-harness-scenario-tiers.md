---
"@internal/benchmark-harness": minor
---

Scenario tiers and a feature matrix in the listing.

- A scenario may declare `tier: "contract" | "engine"` and `requires: string[]`; a child reports both per scenario as
  `scenarioListings`, every trial result and observation row carries the tier, and rows written before tiers existed
  read as contract rows.
- `BENCH_TIER=contract|engine` narrows a run to one tier at both levels, like `BENCH_ONLY`; the comparison document
  records it as `scenarioTier`, the run card names it in the profile line, and a tier-narrowed run leaves `latest.json`
  alone. The comparison document schema is now version 3.
- A library config may declare `features`. When every library does, the inventory `bench:list` prints splits each row's
  missing libraries into `gaps` (features allow it, nobody wrote it) and `unsupported`, summarises coverage per library
  on stderr, and fails on a library implementing a row while not declaring a feature it requires. Engine rows are owed
  by nobody and count in neither list.
- `BENCH_BASELINE=<run id or directory>` pins the run the report diffs against instead of the run `latest.json` names;
  `Δ` labels then read `vs baseline <run id>`, and a pinned run that cannot be read throws rather than falling back.
  `readPreviousRun` takes the requested run and `RunDiff` carries `pinned`; `describeDiffTarget` renders the label.
