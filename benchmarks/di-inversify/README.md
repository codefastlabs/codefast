# `@codefast/di` vs InversifyJS · Awilix · tsyringe

A tinybench harness that runs the same dependency-injection workloads through four containers and
reports one table. `@codefast/di` is the subject; the other three are the comparison.

**This is a first-party benchmark.** The same repository owns the library and the harness, so read it
as "here is the workload we optimised for, and a re-runnable way to check the claim" — not as a
neutral verdict. [`BENCH_GUIDE.md`](./BENCH_GUIDE.md) is the standard a number has to meet before it
belongs in [`RESULTS.md`](./RESULTS.md), including the ways this harness can mislead you.

## Run it

```bash
pnpm di:bench
```

From this directory, `pnpm bench` does the same thing. Both rebuild `@codefast/di` first, so the run
measures the working tree rather than a stale `dist/`.

| Command              | What changes                                                                      |
| -------------------- | --------------------------------------------------------------------------------- |
| `pnpm bench`         | Default profile: no `--expose-gc`, 3 trials per scenario                          |
| `pnpm bench:fast`    | Smoke profile — shorter sampling windows. For "did I break it", never for a claim |
| `pnpm bench:full`    | `--expose-gc` for every library, forcing collections into the measured loop       |
| `pnpm bench:isolate` | One subprocess per scenario, so no scenario inherits another's inline caches      |
| `pnpm bench:verbose` | Per-trial detail on stdout                                                        |
| `pnpm bench:serve`   | Serves the run history from `bench-results/` in a browser                         |
| `BENCH_TRIALS=<n>`   | Trials per scenario; the harness refuses anything below 3                         |
| `BENCH_ONLY=<id>`    | One scenario, in the child processes — what the A/B recipes in the guide use      |

Profiles compose: `BENCH_FULL=1 pnpm bench:isolate` is the slowest and the most order-independent.

Every run writes a timestamped directory under `bench-results/` (git-ignored) holding `report.md` and
`observations.jsonl`, and mirrors the newest to `latest.md` / `latest.jsonl`. The JSONL carries every
per-trial figure the markdown summarises, including each cell's IQR.

## How it is put together

```
src/harness/run.ts          parent: spawns one subprocess per library, merges, renders
src/harness/config.ts       the four library configs (entry file, tsconfig, display name)
src/*-benches.ts            one child entry per library
src/scenarios/<library>/    that library's implementation of each scenario
src/fixtures/               workloads and descriptors both sides share
```

Each library runs **in its own subprocess, under its own tsconfig, in its canonical mode**:
`@codefast/di` with TC39 Stage 3 decorators and `Symbol.metadata`, `inversify` and `tsyringe` with
legacy decorators and `reflect-metadata`, `awilix` decorator-free. Nothing is forced into another
library's idiom, and no two libraries share a heap.

`src/fixtures/scenario-parity.ts` is what keeps a pair honest: scenario id, group, description and
batch factor live there once, and both sides import them. A batch factor that drifted between two
implementations would silently scale `hzPerOp`; here it cannot, because the compiler holds it.

Scenarios are grouped so one kind of work cannot masquerade as another — `micro`, `realistic`,
`fan-out`, `async`, `lifecycle`, `scope`, `scale`, `boot`, `production`, `introspection`, and
`failure` (error paths, which run orders of magnitude faster than success paths and are reported
apart for that reason).

Awilix and tsyringe implement only the factory/class-binding core subset, so they read `—` on
everything outside it; the report counts only the rows a competitor actually measured.

## Reading the output

- **Cite the aggregates.** The median and geometric mean average dozens of scenarios and reproduce
  between runs. A single row often does not.
- **`†` means the row sits above ~30M ops/s** and its ratio moves between runs of the same build,
  whatever its IQR says.
- **`‡` means that cell's per-trial IQR exceeded 5%** — unstable within the run that printed it.
- **A row under ~0.5 µs per operation is batched**, and its scenario declares the factor. Timing such
  an operation one at a time measures the timer, not the container.

## Known limitation

The parent runs **library-major**: every scenario for `@codefast/di`, then every scenario for
inversify, then awilix, then tsyringe. In `bench:isolate` those phases are minutes apart, so machine
drift over the run lands on the ratio — and it always lands on whoever is scheduled later, which is
never `@codefast/di`. Measured on `realistic-graph-cold-resolve` under `BENCH_FULL`: library-major put
di at 1.28× of tsyringe, and re-running the same two libraries interleaved with rotating order put
them at 0.99×.

Until the runner interleaves, **a cross-library ratio from a single suite run is provisional**. The
guide's paired recipe is what a published claim uses.
