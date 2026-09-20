---
"@internal/benchmark-harness": minor
---

Every observation records the commit the harness ran from and whether its measuring sources (`src/child`, `src/shared`)
were clean, and the report's Environment names it. A diff between two runs is refused, as a diff across a different
profile already is, when those sources differ between the two commits, when either side ran from uncommitted harness
sources, or when either recorded no commit: a `Δ` read across a harness change credits the harness's fix to the engine,
so the anchor is re-measured with the harness that reads against it. `buildRunDiff` takes the comparer that answers
whether two commits share the measuring sources; `prepareRunDiff` builds it from the checkout.
