---
"@benchmark/tailwind-variants": patch
---

Declare the library list once in `harness/config.ts` (`BENCH_LIBRARIES`, `COMPETITORS`) with a per-library render
strategy line, and derive the run header, quiet-mode prefixes, report heading, intro bullets, viewer title, scenario
listing and viewer library list from it. The report intro points at the run's `observations.jsonl` instead of a
`latest.jsonl` the harness no longer writes, and the console footer says `pnpm bench:report` derives `report.md` rather
than implying the run wrote one.

The run now shows live progress per library on an interactive terminal (plain milestones when piped or verbose) and
prints the aggregates alone by default; `pnpm bench:verbose` prints the per-scenario table and `pnpm bench:report`
derives it as `report.md`.
