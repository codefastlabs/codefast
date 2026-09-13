---
"@internal/benchmark-harness": minor
---

Live progress per library. `runBenchLibraries` runs a suite's libraries behind one `ProgressDisplay`: on an interactive
terminal a block with one line per library — bar, `done/total`, trial ordinal, elapsed time and the scenario in flight —
redrawn in place with other child output kept above it; piped, under `CI` or with `BENCH_VERBOSE=true`, one plain line
per milestone plus a heartbeat after ten quiet seconds. The child's stderr progress lines become a protocol
(`shared/progress.ts` formats and parses them, with a `plan` line so a bar has its total before the first sample), so a
standalone `bench:<library>` prints the same readable lines a parent consumes. Isolated runs count each library's
scenarios across its per-scenario children. `renderComparisonConsoleReport` gains `includeScenarioTable`, off by default
in the suites so the console report is the aggregates; `bench:verbose` prints the table and `bench:report` derives it.

Colour, via `node:util`'s `styleText` and a shared `createPalette`: the block tints a running library's bar cyan, a
finished one green and a failed one red; the console report tints a reliable win green, a loss red, and a parity or an
unreliable cell dim. `NO_COLOR` disables it, `FORCE_COLOR` enables it on a pipe, and cells are padded before they are
tinted so alignment never depends on colour.

The console report becomes a scoreboard: one row per competitor with `W · P · L`, comparable count, median, geomean and
worst loss; a geomean-by-group table with a column per competitor; and the reliable losses one per line. When
`latest.json` names a run of the same configuration on the same machine, the report diffs against it — `Δ prev` beside
each aggregate over the rows both runs share, regressions beyond noise listed, improvements counted — and otherwise says
which configuration it skipped. Every run closes with a card: timing, counts, profile, run order, sanity failures,
whether `latest.json` moved, library versions, the observations file and the next commands. `writeBenchRunArtifacts` now
returns what happened to the pointer instead of printing it.
