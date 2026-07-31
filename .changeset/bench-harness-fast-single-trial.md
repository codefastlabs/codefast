---
"@codefast/benchmark-harness": patch
---

`BENCH_FAST` now runs a single trial per scenario: it is a smoke profile — "does it run and roughly how fast" — and one trial answers that in a third of the time. The default and `BENCH_FULL` profiles keep 3 trials, and an explicit `BENCH_TRIALS` below 3 is still rejected, because those are the profiles a median is quoted from.
