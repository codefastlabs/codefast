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
