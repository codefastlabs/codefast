# `@codefast/di` vs InversifyJS · Awilix · tsyringe

A tinybench harness that runs the same dependency-injection workloads through four containers and reports one table.
`@codefast/di` is the subject; the other three are the comparison.

**This is a first-party benchmark.** The same repository owns the library and the harness, so read it as "here is the
workload we optimised for, and a re-runnable way to check the claim" — not as a neutral verdict.
[`BENCH_GUIDE.md`](./BENCH_GUIDE.md) is the standard a number has to meet before it belongs in
[`RESULTS.md`](./RESULTS.md), including the ways this harness can mislead you.

## Run it

```bash
pnpm di:bench
```

From this directory, `pnpm bench` does the same thing. Both rebuild `@codefast/di` first, so the run measures the
working tree rather than a stale `dist/`.

| Command              | What changes                                                                      |
| -------------------- | --------------------------------------------------------------------------------- |
| `pnpm bench`         | Default profile: no `--expose-gc`, 3 trials per scenario                          |
| `pnpm bench:fast`    | Smoke profile — shorter sampling windows. For "did I break it", never for a claim |
| `pnpm bench:full`    | `--expose-gc` for every library, forcing collections into the measured loop       |
| `pnpm bench:isolate` | One subprocess per scenario, so no scenario inherits another's inline caches      |
| `pnpm bench:verbose` | Per-trial detail on stdout                                                        |
| `pnpm bench:list`    | Prints scenario ids as JSON on stdout, measuring nothing — no bench run needed    |
| `pnpm bench:serve`   | Serves the run history from `bench-results/` in a browser                         |
| `BENCH_MODE=<mode>`  | Timing profile: `fast`, `default` or `full` — what the `bench:*` scripts set      |
| `BENCH_PORT=<n>`     | Preferred port for `bench:serve`                                                  |
| `BENCH_TRIALS=<n>`   | Trials per scenario; the harness refuses anything below 3                         |
| `BENCH_ONLY=<id>`    | One scenario, in the child processes — what the A/B recipes in the guide use      |

Profiles compose: `BENCH_MODE=full pnpm bench:isolate` is the slowest and the most order-independent.

Every run writes a timestamped directory under `bench-results/` (git-ignored) holding `report.md`, `report.json` and
`observations.jsonl`, and mirrors the newest to `latest.md` / `latest.json` / `latest.jsonl`. `report.json` is the same
comparison as data — full-precision ratios and reliability as booleans, where the markdown rounds and uses glyphs. Its
`run` block records the profile, isolation and any scenario filter, so a narrowed run cannot be mistaken for a whole one
— and a narrowed run leaves `latest.*` alone for that reason. The JSONL carries every per-trial figure the markdown
summarises, including each cell's IQR.

## How it is put together

```
src/harness/run.ts          parent: spawns one subprocess per library, merges, renders
src/harness/config.ts       the four library configs (entry file, tsconfig, display name)
src/*-benches.ts            one child entry per library
src/scenarios/<library>/    that library's implementation of each scenario
src/fixtures/               workloads and descriptors both sides share
src/instruments/            diagnostic tools, outside the comparison
```

`src/instruments/` holds what the comparison table cannot answer, and nothing else. Today that is one tool:
`pnpm instrument:alloc` (`BENCH_ALLOC_OPERATIONS=<n>` to change the loop size), which reports how much a resolve
allocates — [`BENCH_GUIDE.md`](./BENCH_GUIDE.md#when-the-claim-is-about-allocation-count-allocations) says when reaching
for it beats re-running the suite.

It produces no row and no ratio, and it is **not** exempt from the standard on that account: a figure from here is a
figure, so it meets [`BENCH_GUIDE.md`](./BENCH_GUIDE.md) and it is published in [`RESULTS.md`](./RESULTS.md) before it
appears in a commit message, exactly like a ratio. An instrument that quietly measured to a lower bar than the suite
would be a way of not being wrong on the record.

**For time, there is no instrument, because the suite already is one.** `BENCH_ONLY=<id> pnpm bench:codefast` runs a
single scenario and reports its ns/op across trials with percentiles and sample counts; a bare loop measuring the same
thing is strictly worse and should not be written.

What a shape measures is the **bench row's own scenario**, so its construction, batch factor and sanity check come from
the one place that owns them. A shape the suite has no row for says so, which is what stops an unmeasured lane from
staying invisible.

Each library runs **in its own subprocess, under its own tsconfig, in its canonical mode**: `@codefast/di` with TC39
Stage 3 decorators and `Symbol.metadata`, `inversify` and `tsyringe` with legacy decorators and `reflect-metadata`,
`awilix` decorator-free. Nothing is forced into another library's idiom, and no two libraries share a heap.

`src/fixtures/scenario-parity.ts` is what keeps a pair honest: scenario id, group, description and batch factor live
there once, and both sides import them. A batch factor that drifted between two implementations would silently scale
`hzPerOp`; here it cannot, because the compiler holds it.

Scenarios are grouped so one kind of work cannot masquerade as another — `micro`, `realistic`, `fan-out`, `async`,
`lifecycle`, `scope`, `scale`, `boot`, `production`, `introspection`, and `failure` (error paths, which run orders of
magnitude faster than success paths and are reported apart for that reason). Two groups hold `@codefast/di`-only
instrumentation instead of a head-to-head pair: `slot-selection` for the criteria lanes, and `resolution` for the engine
lanes — compiled plans and their escapes, the depth thresholds, the sync context pool, the accessor channel.

Awilix and tsyringe implement only the factory/class-binding core subset, so they read `—` on everything outside it; the
report counts only the rows a competitor actually measured.

## Reading the output

- **Cite the aggregates.** The median and geometric mean average dozens of scenarios and reproduce between runs. A
  single row often does not.
- **`†` means the row sits above ~30M ops/s** and its ratio moves between runs of the same build, whatever its IQR says.
- **`‡` means that cell's per-trial IQR exceeded 5%** — unstable within the run that printed it.
- **A row under ~0.5 µs per operation is batched**, and its scenario declares the factor. Timing such an operation one
  at a time measures the timer, not the container.

## Run order, and why it decides the ratio

`bench:isolate` runs **scenario-major and interleaved**: every library measures a scenario before the next scenario
starts, and which library goes first rotates each time. The report's Environment section states which policy produced
the numbers.

That is not a detail. Scheduling one library's whole suite before the next one starts puts minutes between the two sides
of every ratio, so any drift over the run lands entirely on whoever was scheduled later — and in a suite written to
promote one library, that is never the one being promoted. Measured on `realistic-graph-cold-resolve` under the full
profile, before the runner interleaved: library-major read 1.28× of tsyringe, and the same two libraries interleaved
read 0.99×.

**Without `bench:isolate` there is nothing to interleave** — one process per library runs that library's whole suite —
so a cross-library ratio from the plain profile stays provisional, and the report says so in the same place.
