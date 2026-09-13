# `@codefast/di` vs InversifyJS · Awilix · tsyringe · Brandi · ditox · injection-js

A tinybench suite that runs the same dependency-injection workloads through seven containers and reports one table.
`@codefast/di` is the subject; the other six are the comparison. Each rival runs only the scenarios it can express in
its own idiom — inversify nearly every shared row, awilix/tsyringe/brandi/ditox the factory/class core plus the scope,
production, lifecycle, module, multi-binding and async rows their APIs have a native form for, injection-js the
singleton-friendly rows only.

> **Private benchmark suite.** Never published to npm. Results are recorded in [`RESULTS.md`](./RESULTS.md) and are
> meant to be re-run, not quoted from memory.

**This is a first-party benchmark.** The same repository owns the library and the harness, so read it as "here is the
workload we optimised for, and a re-runnable way to check the claim" — not as a neutral verdict.
[`BENCH_GUIDE.md`](./BENCH_GUIDE.md) is the standard a number has to meet before it belongs in
[`RESULTS.md`](./RESULTS.md), including the ways this harness can mislead you.

## Run it

```bash
pnpm di:bench            # from the repo root
pnpm di:bench:isolate    # one subprocess per scenario, libraries interleaved
pnpm di:bench:serve      # browse recorded runs
```

From this directory, `pnpm bench` does the same as `pnpm di:bench`. Every run rebuilds `@codefast/di` first, so it
measures the working tree rather than a stale `dist/`.

| Command                 | What changes                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ |
| `pnpm bench`            | Default profile: no `--expose-gc`, the default trial count                                                   |
| `pnpm bench:fast`       | Smoke profile — shorter sampling windows. For "did I break it", never for a claim                            |
| `pnpm bench:full`       | `--expose-gc` for every library, forcing collections into the measured loop                                  |
| `pnpm bench:isolate`    | One subprocess per scenario, so no scenario inherits another's inline caches                                 |
| `pnpm bench:verbose`    | Streams every child line and prints the per-scenario table                                                   |
| `pnpm bench:list`       | Prints the scenario inventory as JSON on stdout and a coverage line per library on stderr, measuring nothing |
| `pnpm bench:serve`      | Serves the run history from `bench-results/` in a browser                                                    |
| `pnpm bench:<library>`  | One child process alone: `codefast`, `inversify`, `awilix`, `tsyringe`, `brandi`, `ditox` or `injection-js`  |
| `pnpm instrument:alloc` | The allocation instrument (see below)                                                                        |
| `BENCH_MODE=<mode>`     | Timing profile: `fast`, `default` or `full` — what the `bench:*` scripts set                                 |
| `BENCH_TRIALS=<n>`      | Trials per scenario; the harness refuses anything below its minimum                                          |
| `BENCH_ONLY=<id>,<id>`  | Restrict the run to these scenario ids — what the A/B recipes in the guide use                               |
| `BENCH_TIER=<tier>`     | Restrict the run to `contract` rows (public API, compared across libraries) or `engine` rows (ours alone)    |
| `BENCH_PORT=<n>`        | Preferred port for `bench:serve`                                                                             |
| `PORT=<n>`              | Read by `bench:serve` when `BENCH_PORT` is unset — what a launcher hands the process                         |

Profiles compose: `BENCH_MODE=full pnpm bench:isolate` is the slowest and the most order-independent.

Every run writes a timestamped directory under `bench-results/` (git-ignored) holding one file, `observations.jsonl`,
and — for a whole-suite run — points `bench-results/latest.json` at it. `report.md` and `report.json` are derived on
demand: `pnpm bench:report [run]` rebuilds them from a run's observations (newest by default), and `pnpm bench:serve`
offers them as downloads. The JSONL carries every per-trial figure a report summarises — including each cell's IQR — and
stamps every row with the run's profile, isolation and trial count, so a report derived from disk records the
configuration the run actually used. A run narrowed with `BENCH_ONLY` or `BENCH_TIER` does not move `latest.json`.

## How it is put together

```
src/harness/run.ts          parent: rebuilds @codefast/di, spawns one subprocess per library, merges, renders
src/harness/config.ts       the seven library configs (entry file, tsconfig, display name)
src/harness/list.ts         the bench:list entry
src/harness/serve.ts        the bench:serve entry
src/*-benches.ts            one child entry per library
src/scenarios/<library>/    that library's implementation of each scenario
src/fixtures/               workloads and descriptors both sides share
src/instruments/            diagnostic tools, outside the comparison
```

Each library runs **in its own subprocess, under its own tsconfig, in its canonical mode**: `@codefast/di` with TC39
Stage 3 decorators and `Symbol.metadata`, `inversify`, `tsyringe` and `injection-js` with legacy decorators and
`reflect-metadata`, `awilix` and `brandi` and `ditox` decorator-free (awilix's proxy cradle, brandi's and ditox's token
wiring). Nothing is forced into another library's idiom, and no two libraries share a heap.

`src/fixtures/scenario-parity.ts` is what keeps a pair honest: scenario id, group, description and batch factor live
there once, and both sides import them. A batch factor that drifted between two implementations would silently scale
`hzPerOp`; here it cannot, because the compiler holds it.

The realistic graph runs in two lanes. The factory lane wires `src/fixtures/realistic-graph.ts` through each library's
factory binding, so the resolver is measured with no class machinery in the way; the class lane (`realistic-class.ts`
under each library) wires the same ten nodes as constructor-injected classes in that library's own class idiom, which is
how an application actually declares its services. `src/fixtures/realistic-class-graph.ts` is the one sanity every
class-lane row runs: the resolved tree matches the descriptor node for node, singletons are one instance wherever they
appear, and the root is fresh per resolve.

Scenarios are grouped so one kind of work cannot masquerade as another. The shared groups are `micro`, `realistic`,
`fan-out`, `async`, `lifecycle`, `scope`, `scale`, `boot`, `production`, `introspection`, and `failure` — error paths,
reported apart because their cost is not comparable to a success path. Two further groups hold `@codefast/di`-only
instrumentation instead of a head-to-head pair: `slot-selection` for the criteria lanes, and `resolution` for the engine
lanes — compiled plans and their escapes, the depth thresholds, the sync context pool, the accessor channel.

Every scenario also declares a **tier**. A `contract` row is specified against the public API in
[`SPEC.md`](../../packages/di/SPEC.md): it names a shape a caller can write, so it survives a rewrite of the engine and
is what the libraries are compared on. An `engine` row names a lane of the current resolver — a compiled plan and its
escapes, the tag-key mask, the hoisted-versus-inline options object — so it is instrumentation for this engine, owed by
no other library, and deleted with the engine it names. `BENCH_TIER=contract pnpm bench:isolate` runs the comparison
without the instrumentation, as a narrowed run that leaves `latest.json` alone.

Every scenario declares the **features** it requires, and every library in `src/harness/config.ts` declares the features
its public API offers, both in the vocabulary of `src/fixtures/features.ts` — `transient`, `optional`, `resolve-all`,
`child-container`, `dispose`, `alias`, and so on, each defined by the public behaviour a library must offer to claim it.
`pnpm bench:list` reads one against the other: a library missing a row whose features it declares is a **gap**, a row
somebody owes; a library missing a row it cannot express is **unsupported**, and `—` is the honest cell. The two used to
look identical. A library implementing a row while not declaring a feature it requires fails the listing, so the matrix
cannot drift from the rows.

No competitor implements every row. inversify covers nearly every shared descriptor; awilix, tsyringe, brandi and ditox
cover the factory/class-binding core plus whichever scope, lifecycle, module, multi-binding and async rows their API has
a native form for (each collector's header lists its own); injection-js implements only its singleton-friendly rows,
because Angular's `ReflectiveInjector` caches every provider per injector, so a fresh root's sub-deps stay cached
singletons. Every competitor reads `—` on everything it does not measure, and the report counts only the rows it
actually ran. Forcing a fully-transient tree onto a container that caches its resolutions would measure a proxy rather
than the library, so those rows are omitted rather than faked. A scenario whose two sides do incomparable amounts of
work declares `excludeFromAggregates` and stays in the table but out of the medians and geomeans.

### Reading the console

The run ends with a scoreboard rather than the per-scenario table: one row per competitor with `W · P · L`, the
comparable count, the median and geomean ratio and the worst loss; a geomean per group with a column per competitor; and
the reliable losses one per line, the `†` ones counted rather than listed. When `bench-results/latest.json` names a run
of the same profile, shape and trial count on this machine, each aggregate gains a `Δ prev` over the rows both runs
measured and the regressions beyond noise are listed — the A/B question the guide asks, answered on the spot. A closing
card states the timing, the profile, the run order, sanity failures, whether `latest.json` moved, and the library
versions. The per-scenario table is one `pnpm bench:verbose` or `pnpm bench:report` away.

## Instruments

`src/instruments/` holds what the comparison table cannot answer, and nothing else. Today that is one tool:
`pnpm instrument:alloc`, which reports how much a resolve allocates. `BENCH_ALLOC_OPERATIONS=<n>` changes the loop size
and `BENCH_ALLOC_SHAPE=<id>` measures one shape in a child.
[`BENCH_GUIDE.md`](./BENCH_GUIDE.md#when-the-claim-is-about-allocation-count-allocations) says when reaching for it
beats re-running the suite.

It produces no row and no ratio, and it is **not** exempt from the standard on that account: a figure from here is a
figure, so it meets [`BENCH_GUIDE.md`](./BENCH_GUIDE.md) and it is published in [`RESULTS.md`](./RESULTS.md) before it
appears in a commit message, exactly like a ratio.

A shape measures the **bench row's own scenario**, so its construction, batch factor and sanity check come from the one
place that owns them. A shape the suite has no row for says so, which is what stops an unmeasured lane from staying
invisible.

**For time, there is no instrument, because the suite already is one.** `BENCH_ONLY=<id> pnpm bench:codefast` runs a
single scenario through the `@codefast/di` child alone and reports its per-trial figures; a bare loop measuring the same
thing is strictly worse and should not be written.

## Reading the output

- **Cite the aggregates.** The median and geometric mean average many scenarios and reproduce between runs. A single row
  often does not.
- **`†` means the row sits above the harness's throughput noise ceiling**, where its ratio moves between runs of the
  same build, whatever its IQR says.
- **`‡` means that cell's per-trial IQR exceeded the harness's noise fraction** — the median is unstable within the run
  that printed it.
- **A fast row is batched**, and its scenario declares the factor. Timing such an operation one at a time measures the
  timer, not the container.

## Run order, and why it decides the ratio

`bench:isolate` runs **scenario-major and interleaved**: every library measures a scenario before the next scenario
starts, and which library goes first rotates each time. The report's Environment section states which policy produced
the numbers.

That is not a detail. Scheduling one library's whole suite before the next one starts puts minutes between the two sides
of every ratio, so any drift over the run lands entirely on whoever was scheduled later — and in a suite written to
promote one library, that is never the one being promoted. The same scenario, measured library-major and then
interleaved, reads a materially different ratio against the same competitor; the measured gap is recorded in
[`RESULTS.md`](./RESULTS.md).

**Without `bench:isolate` there is nothing to interleave** — one process per library runs that library's whole suite —
so a cross-library ratio from the plain profile stays provisional, and the report says so in the same place.

## Documentation

- [`BENCH_GUIDE.md`](./BENCH_GUIDE.md) — how to measure so the number survives: paired A/B runs, interleaving, when to
  count allocations, and what must hold before a figure is published.
- [`RESULTS.md`](./RESULTS.md) — the ledger of what has actually been measured, including losses and retractions.
- [`CHANGELOG.md`](./CHANGELOG.md) — release notes for this suite.
- [`../../packages/di`](../../packages/di) — the library under test; its `ARCHITECTURE.md` explains the shapes these
  rows exercise.
- [`../../internal/benchmark-harness`](../../internal/benchmark-harness) — the shared harness, its `BENCH_*` keys and
  report format.

## Contributing

See the repository [`CONTRIBUTING.md`](../../CONTRIBUTING.md).

## License

Released under the [MIT License](../../LICENSE).
