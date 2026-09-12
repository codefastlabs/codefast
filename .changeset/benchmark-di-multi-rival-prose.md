---
"@benchmark/di": patch
---

Bring the run header, quiet-mode hint, report intro and README prose in line with the six-competitor suite. The library
list now lives once in `harness/config.ts` (`BENCH_LIBRARIES`, `COMPETITORS`), and the run header, report heading,
viewer title and per-library runtime lines derive from it, so a new competitor no longer needs a prose edit. The claim
that only inversify implemented the full suite is gone: inversify covers nearly every shared row, the decorator-free
containers cover the core plus the scope/lifecycle/module/multi-binding/async rows their APIs express, and injection-js
its singleton-friendly rows. Every rival gains a `bench:<library>` script for running its child process alone.

The run now shows live progress per library on an interactive terminal (plain milestones when piped or verbose) and
prints the aggregates alone by default; `pnpm bench:verbose` prints the per-scenario table and `pnpm bench:report`
derives it as `report.md`.
