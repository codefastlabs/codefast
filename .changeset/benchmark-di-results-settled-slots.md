---
"@benchmark/di": patch
---

`RESULTS.md` is rewritten from a pass over the tree with settled dependency slots. Every competitor reads level with the
previous pass, and the rows that change aims at moved: `app-boot-40` now reads level with ditox where it read 0.85×, and
`realistic-graph-class-cold-resolve` closes from 0.81× to 0.94×. The run's `observations.jsonl` replaces the previous
one under `baselines/`, and the bundle table picks up the engine's extra 0.1 KB.
