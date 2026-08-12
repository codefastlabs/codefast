---
"@codefast/benchmark-harness": minor
---

Make `BENCH_ONLY` a scenario filter the parent honours, so one row can be benched through the full report.

`BENCH_ONLY` was documented child-side and worked only there: `bench:isolate` discovered every scenario id before the
filter was applied and then overwrote the variable per worker, so an outer value was ignored and the whole suite ran. It
now accepts a comma-separated list and is read by both isolated runners, which makes
`BENCH_ONLY=<id> pnpm bench:isolate` a single-row run that is still interleaved and still citable — the lane that
removes any reason to swap a prebuilt `dist` under the runner, which fails silently because the run rebuilds from source
before its first sample.

A library implementing none of the requested ids now measures nothing and reads `—` in the comparison, where it
previously threw `matched no collected scenario` and took every other library in the run down with it. Guarding against
a mistyped id moves to the suite, which is the only level that knows which library is the subject.
