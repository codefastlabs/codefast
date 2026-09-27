---
"@benchmark/di": patch
---

`RESULTS.md` is rewritten from a pass over the tree with the async-lane and disposed-container fixes. Every library
reads level with the previous pass, and two rows moved on the engine: the async warm-up rises by two fifths and an
all-async transient chain falls by a tenth, both confirmed in a paired probe. The page names the rows the harness
flagged that the probe reads level across the two builds, and `realistic-graph-resolve-root` is a win over injection-js
again. The run's `observations.jsonl` replaces the previous one under `baselines/`.
