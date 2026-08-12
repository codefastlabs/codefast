---
"@codefast/benchmark-harness": minor
---

Derive the whole `BENCH_*` surface from one spec map, and close the five ways it could still fail quietly.

Each key used to declare how it was read at the place it was read, which left four different disciplines in one
namespace: flags threw on a bad value, `BENCH_TRIALS` warned and substituted the default, and `BENCH_PORT` plus the
alloc instrument's `OPERATIONS` went through a bare `Number()` with no check at all. `BENCH_ENV_SPECS` now states each
key's accepted values, who may set it, and which Turbo tasks must pass it through; the parsers, the strip list and the
drift test all derive from it.

- `BENCH_LIST` was an internal protocol key on a shared channel: setting it in the shell put every measuring child into
  discovery mode, and the run exited 0 with a well-formed empty comparison that also overwrote `latest.md`. The parent
  now strips internal keys from every inherited child environment and sets them per subprocess, and setting one by hand
  is rejected.
- Numeric keys take digits only and are range-checked. `BENCH_PORT=` and `BENCH_PORT=0` resolved to `listen(0)`, a
  random port; `BENCH_ALLOC_OPERATIONS=abc` (formerly `OPERATIONS`) made the loop run zero times and the instrument
  report an allocating shape as allocation-free. `BENCH_TRIALS` no longer accepts `3abc` as 3 or reads `1e9` as 1, and
  an out-of-range value throws instead of being replaced by the default.
- An unknown `BENCH_*` key is rejected. With values validated strictly, a misspelled key was the last way to ask for
  something and be ignored — `BENCH_MODEE=fast` selected nothing and said nothing.
- The `BENCH_ONLY` subject guard moves into the harness as `assertSubjectMeasuredSomething`. It existed only in the DI
  suite, so a mistyped id in the tailwind-variants suite produced the same empty-but-successful report.
- A test asserts `turbo.json` passes through every user-facing key and nothing else. That drift is what made
  `BENCH_ONLY` and `BENCH_ISOLATE` silently ineffective from the repo root, and it was invisible until someone read the
  config.

`OPERATIONS` and `SHAPE` are renamed `BENCH_ALLOC_OPERATIONS` and `BENCH_ALLOC_SHAPE`, so every knob the benchmarks read
lives in one namespace and is covered by the unknown-key check.
