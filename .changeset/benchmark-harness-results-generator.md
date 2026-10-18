---
"@internal/benchmark-harness": minor
---

The results generator every suite shares lives here now, under `results/`: `runResultsMain` builds a suite's
`RESULTS.md` and `results.json` from the one run under its `baselines/` (or with `--check` fails when either committed
file differs), from a `ResultsSuite` that names the subject and competitors, the comparison the suite already assembles,
figure-free notes typed by its competitors' names, and the few sentences that describe the suite. Validation refuses a
figure in a note's prose, a loss note naming a row that no longer loses, and a loss below the throughput ceiling no note
names. `runFootprintMain` is the matching `bench:footprint` entry — each library's smallest program bundled with
Rolldown, minified and gzipped, the subject held to its `footprint-budget.json` — and `rebuildSubjectPackage` the
rebuild both entries and `bench` run first.
