---
"@benchmark/di": patch
---

Pin the pre-rewrite baseline: the full-profile isolated run `2026-09-13T04-45-37-460Z` is copied to
`baselines/2026-09-13T04-45-37-460Z/observations.jsonl`, which is tracked, and `pnpm bench:baseline` runs the same pass
read against it through `BENCH_BASELINE`.
