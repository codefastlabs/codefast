---
"@benchmark/di": patch
---

`RESULTS.md` opens with what an application feels — startup (`app-boot-40`), one request, and the bundle table from
`bench:footprint` — before the per-row losses, and is rewritten from a pass over the tree with the introspection
functions. The run's `observations.jsonl` replaces the previous one under `baselines/`.
