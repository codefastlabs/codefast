---
"@benchmark/di": patch
---

`RESULTS.md` is rewritten from a pass over the 0.13.0 tree. Every library reads level with the previous pass, and one
row moved on the engine: `container-create-empty` rises by about a seventh, confirmed in both orders of a paired A/B.
The five rows the harness flagged as regressions read level in that A/B, and `plan-async-resolved-chain-8`, which the
previous page named as the lane to look at next, is closed: a standalone probe reads it level across the two builds, so
its earlier fall was the pass, not the engine. The run's `observations.jsonl` replaces the previous one under
`baselines/`.
