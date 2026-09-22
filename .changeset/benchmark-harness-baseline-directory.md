---
"@internal/benchmark-harness": minor
---

`resolveRunDirectory` resolves a directory of runs to its newest member, so `BENCH_BASELINE` can name a suite's
committed-baseline directory instead of one run id that has to be edited whenever the baseline moves. A path that is
itself a run directory still wins, and a directory holding no readable run falls through to the run-id lookup as before.
