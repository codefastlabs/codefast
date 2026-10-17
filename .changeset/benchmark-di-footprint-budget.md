---
"@benchmark/di": patch
---

`pnpm bench:footprint:check` gates `@codefast/di`'s smallest bind-and-resolve program on a gzip budget checked in as
`footprint-budget.json`, and runs in CI and `pnpm verify`; `pnpm bench:footprint` reports and enforces the same budget
under its table.
