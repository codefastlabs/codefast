---
"@internal/benchmark-harness": minor
---

The run diff lists improvements beyond noise the way it lists regressions: one row per scenario with its group,
throughput now, delta and what it was, in columns shared with the regression list, and `none` when there are none. The
one-line summary showed five names and folded the rest into `+N more`, which hid rows the console is the only place to
read — and a jump needs the same scrutiny as a drop, since a scenario that suddenly runs faster may have stopped doing
its work.
