---
"@benchmark/di": patch
---

`RESULTS.md` is rewritten from a full-profile isolated pass over the suite on the tree after the cold-path redesign and
the one-async-lane series, read against `baselines/2026-09-14T23-41-04-932Z` — the last full pass over the previous
engine, now the pinned baseline of `pnpm bench:baseline`. The run's `observations.jsonl` is committed under
`baselines/`; the pre-rewrite run the page no longer cites is removed.
