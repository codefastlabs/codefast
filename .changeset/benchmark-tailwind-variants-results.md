---
"@benchmark/tailwind-variants": minor
---

The suite has a committed baseline and a generated `RESULTS.md` and `results.json`, as the DI suite does:
`pnpm bench:baseline` is the full-profile isolated pass read against the run under `baselines/`, `pnpm bench:results`
rebuilds the page from it, and `pnpm bench:results:check` gates CI and `pnpm verify`. The page leads with what a user
feels — defining a component, one render, and the bundle — and `pnpm bench:footprint` bundles each library's smallest
`tv()` program with Rolldown, holding `@codefast/tailwind-variants`'s gzipped size to `footprint-budget.json` behind
`pnpm bench:footprint:check`, which gates CI as well.
