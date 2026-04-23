# @codefast/benchmark-di-inversify

Head-to-head performance harness: **InversifyJS 8** vs **@codefast/di**, scenario-by-scenario, reported as per-trial medians with interquartile range.

This is the benchmark _for shipping_. It exists so a regression in `@codefast/di` hot paths cannot silently land on main, and so the "@codefast/di is faster than inversify on the graphs you actually wire" claim is something a skeptical reader can re-run in 30 seconds.

## Philosophy

The goal is not to win microbenchmarks. The goal is to measure _what TC39 Stage 3 Decorators + `Symbol.metadata` opens up in practice_ — which is the reason `@codefast/di` exists at all. Everything here is designed backwards from that principle.

### Each library runs in its canonical decorator mode

- `@codefast/di` runs under `tsconfig.codefast.json` — `experimentalDecorators: false`, TC39 Stage 3 decorators, native `Symbol.metadata`.
- InversifyJS 8 runs under `tsconfig.inversify.json` — `experimentalDecorators: true`, `emitDecoratorMetadata: true`, `reflect-metadata` polyfill required.

This compares the _shipping experience_ of each library, not the decorator runtimes in isolation. Forcing one side into the other's mode would measure code neither library would ever ship with.

A consequence: scenarios that would otherwise bake in a per-library decorator setup cost (e.g. module boot, `@injectable` class wiring) use each library's own idiomatic decorator. The `realistic-graph-*` scenarios bypass decorators entirely (factory bindings only) so resolver-engine comparisons stay apples-to-apples.

### Trials, medians, IQR

Each library runs **N trials = 5** back-to-back. Every trial constructs a fresh `Bench` instance so tinybench's internal warmup fires per trial, reducing (though never eliminating) cross-trial correlation from JIT state.

The reporter collapses N per-trial results into:

- `hz/op` — median of per-trial `throughput.mean * batch` values.
- `IQR` — interquartile range of per-trial `hz/op`, expressed as a percentage of the median. Treat anything above ~5% as noisy and re-run.
- `mean ms`, `p99 ms` — per-trial medians of tinybench's `latency.mean`, `latency.p99`.

The JSONL export (`bench-results/latest.jsonl`) is one observation per `(library, trial, scenario)` line, with fingerprint inlined. Pivot with pandas / duckdb / jq.

### Batched sub-μs scenarios

Several scenarios run operations that complete in well under one microsecond — below tinybench's `performance.now()` resolution. These declare an explicit `batch` factor (e.g. 1000 for `constant-resolve`) and execute that many logical operations per bench-closure invocation; the reporter multiplies throughput by the batch factor.

If you add a new scenario whose `latency.mean` is under 0.5 μs, batch it. If it's over 5 μs, don't.

### Stress and diagnostic quarantine

Not every row belongs in the headline comparison. Two categories are walled off:

- **Stress** (`stress: true`) — worst-case probes like `child-depth-8-stress`. Useful to catch regressions, but no real app wires 8 nested containers. Rendered as a separate table.
- **Diagnostic** (`group: "diagnostic"`) — library-internal probes like `diagnostic-container-create-empty`. Kept as baselines for third-library comparisons and regression detection; not a statement about end-to-end performance.

The "Comparable scenarios" table is the one to cite.

### Subprocess protocol

Each library's bench runs in its own subprocess so neither side contaminates the other's V8 state. Each subprocess writes a single `SubprocessPayload` JSON to stdout, delimited by `BENCH_RESULT_JSON_START` / `BENCH_RESULT_JSON_END`. The parent reads only between those markers — Node deprecation warnings, tsx banners, or stray `console.log`s never break parsing.

Environment is pinned: `NODE_ENV=production`, `NODE_OPTIONS='--expose-gc --no-warnings'`. The `--expose-gc` flag unlocks the `beforeEach` GC hook that stabilises allocation-heavy scenarios.

## Running

From the repo root:

```bash
pnpm --filter @codefast/benchmark-di-inversify bench
```

Or from this package:

```bash
pnpm bench                 # full head-to-head
pnpm bench:codefast        # codefast subprocess only (prints raw JSON payload)
pnpm bench:inversify       # inversify subprocess only
pnpm check-types           # type-check each tsconfig variant
```

Outputs land in `bench-results/<timestamp>/`:

- `report.md` — rendered markdown table with fingerprint + IQR.
- `observations.jsonl` — one line per `(library, trial, scenario)`.

And in `bench-results/`:

- `latest.md`, `latest.jsonl` — mirrors of the most recent run, for stable CI paths.

## Reading the output

The terminal table looks roughly like:

```
Scenario                     Group       codefast hz/op   inversify hz/op    cf/inv     cf mean ms   inv mean ms
constant-resolve             micro           12,345,678        10,123,456    1.22×        0.0001        0.0001
realistic-graph-resolve-root realistic          234,567           145,678    1.61×        0.0043        0.0069
...
```

Three things to check before drawing conclusions:

1. **IQR columns** (markdown version only): if either library's IQR exceeds ~5%, the medians are unstable; re-run on a quieter machine.
2. **Sanity failures**: any scenario that fails its pre-bench sanity check is skipped and listed under "Sanity failures" at the top of the report. Don't read the absence of a row as "the library can't do it".
3. **GC exposed**: the fingerprint section should say `gcExposed: true, true`. If it says `false` for either library, the `--expose-gc` flag didn't reach the subprocess and allocation-heavy rows are noisier than they should be.

## Scenario inventory

Currently migrated to the trial harness:

| Group        | Scenarios                                                                                                                                                                           |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `micro`      | `constant-resolve`, `singleton-class-1-dep`, `transient-class-1-dep`, `named-constant-get`                                                                                          |
| `realistic`  | `realistic-graph-resolve-root`, `realistic-graph-cold-resolve`, `realistic-graph-validate` (codefast-only)                                                                          |
| `fan-out`    | `fan-out-tree-depth-3-breadth-4` (batch=20, throughput-oriented), `resolve-all-strategies-10` (batch=1, latency-oriented), `resolve-all-strategies-100` (batch=1, latency-oriented) |
| `async`      | `resolve-async-single-hop`, `dynamic-async-chain-8`                                                                                                                                 |
| `scope`      | `child-depth-2-resolve`, `child-depth-8-stress` (stress)                                                                                                                            |
| `diagnostic` | `diagnostic-container-create-empty`                                                                                                                                                 |

### Phase 2 - Fan-out baseline

Completed in PR #420 [`feat/di-bench-fanout-phase2`](https://github.com/codefastlabs/codefast/pull/420)

**A/A stability check** - codefast vs codefast, `BENCH_TRIALS=1`:

| Scenario                         | Hz ratio | Mean-ms ratio | Status |
| -------------------------------- | -------- | ------------- | ------ |
| `fan-out-tree-depth-3-breadth-4` | 0.996    | 0.997         | Stable |
| `resolve-all-strategies-10`      | 0.979    | 1.027         | Stable |
| `resolve-all-strategies-100`     | 0.978    | 1.026         | Stable |

All scenarios passed: `pnpm check-types`, `pnpm bench`, no sanity failures. IQR < 3%.

### Phase 3 - Async baseline

Completed on branch `feat/di-bench-fanout-phase2` (pending PR split for async-only review)

**A/A stability check** - codefast vs codefast, `BENCH_TRIALS=1`:

| Scenario                   | Hz ratio | Mean-ms ratio | Status |
| -------------------------- | -------- | ------------- | ------ |
| `resolve-async-single-hop` | 1.000    | 1.034         | Stable |
| `dynamic-async-chain-8`    | 0.963    | 1.078         | Stable |

All scenarios passed: `pnpm check-types`, `pnpm bench`, no sanity failures.

Planned but not yet migrated (see the git history for the old single-bench implementations):

- `lifecycle` — `postConstruct` / `preDestroy` hot paths, scope dispose.
- `scale` — deep module trees, 500+ bindings.
- `boot` — decorator-driven container construction (each library in its canonical decorator mode).

`boot` is intentionally last: it's spawn-heavy and slow; migrating it prematurely would slow the dev inner loop for every other scenario being tuned.

## Layout

```
src/
  harness/                # library-agnostic bench infrastructure
    run.ts                # parent: spawns subprocesses, renders reports
    trial.ts              # per-subprocess: N-trial loop around tinybench
    protocol.ts           # START/END-framed subprocess wire format
    report.ts             # aggregate → markdown + console + JSONL
    sanity.ts             # pre-bench sanity checks
    fingerprint.ts        # Node/V8/platform/library stamps
    batched.ts            # inner-loop wrapper for sub-μs scenarios
  scenarios/
    types.ts              # shared BenchScenario interface
    codefast/             # @codefast/di scenario modules
      micro.ts
      realistic.ts
      fan-out.ts
      async.ts
      scope.ts
      diagnostic.ts
    inversify/            # InversifyJS 8 scenario modules (mirror)
      micro.ts
      realistic.ts
      fan-out.ts
      async.ts
      scope.ts
      diagnostic.ts
  fixtures/
    realistic-graph.ts    # shared descriptor (no library imports)
    fan-out-descriptor.ts # shared fan-out topology + strategy-count fixtures
    codefast-adapter.ts   # descriptor → codefast Container
    inversify-adapter.ts  # descriptor → inversify Container
  codefast-benches.ts     # subprocess entry — codefast
  inversify-benches.ts    # subprocess entry — inversify
```

Only `fixtures/codefast-adapter.ts` and `scenarios/codefast/*.ts` may import `@codefast/di`. Only `fixtures/inversify-adapter.ts` and `scenarios/inversify/*.ts` may import `inversify`. The harness never sees either library.
