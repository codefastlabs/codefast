---
"@internal/benchmark-harness": minor
---

The full profile no longer forces a collection inside the measured loop: a collection runs between trials only, so a
class whose instances die between resolves is no longer thrown into a deoptimize-and-reoptimize cycle by the harness
itself. Every child records the 1-minute load average at its start, and the report's Environment section prints it,
flagged when any reading exceeded half the cores. The measuring lanes are two Turbo tasks: `bench` (isolated, the one to
cite) and `bench:fast` (shared, smoke); `bench:isolate`, `bench:full` and `bench:verbose` are gone — `BENCH_MODE`,
`BENCH_VERBOSE` and the other switches compose with the two.
