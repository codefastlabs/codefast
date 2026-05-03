# @codefast/benchmark-di-inversify

Head-to-head performance harness: **InversifyJS 8** vs **@codefast/di**, scenario-by-scenario, reported as per-trial medians with interquartile range.

New to this package? See **[BENCH_GUIDE.md](./BENCH_GUIDE.md)** for a newcomer-oriented glossary, mental model (parent → subprocess → tinybench), and how to read `bench-results/latest.md`.

This is the benchmark _for shipping_. It exists so a regression in `@codefast/di` hot paths cannot silently land on main, and so the "@codefast/di is faster than inversify on the graphs you actually wire" claim is something a skeptical reader can re-run in 30 seconds.

## Philosophy

The goal is not to win microbenchmarks. The goal is to measure _what TC39 Stage 3 Decorators + `Symbol.metadata` opens up in practice_ — which is the reason `@codefast/di` exists at all. Everything here is designed backwards from that principle.

### Each library runs in its canonical decorator mode

- `@codefast/di` runs under `tsconfig.codefast.json` — `experimentalDecorators: false`, TC39 Stage 3 decorators, native `Symbol.metadata`.
- InversifyJS 8 runs under `tsconfig.inversify.json` — `experimentalDecorators: true`, `emitDecoratorMetadata: true`, `reflect-metadata` polyfill required.

This compares the _shipping experience_ of each library, not the decorator runtimes in isolation. Forcing one side into the other's mode would measure code neither library would ever ship with.

A consequence: scenarios that would otherwise bake in a per-library decorator setup cost (e.g. module boot, `@injectable` class wiring) use each library's own idiomatic decorator. The `realistic-graph-*` scenarios bypass decorators entirely (factory bindings only) so resolver-engine comparisons stay apples-to-apples.

### Trials, medians, IQR

Each library runs **N trials** back-to-back (minimum 2 trials in normal/fast runs, 3 with `BENCH_FULL=1`). Every trial constructs a fresh `Bench` instance so tinybench's internal warmup fires per trial, reducing (though never eliminating) cross-trial correlation from JIT state. Override with `BENCH_TRIALS` (`>=2`).

The reporter collapses N per-trial results into:

- `hz/op` — median of per-trial `throughput.mean * batch` values.
- `IQR` — interquartile range of per-trial `hz/op`, expressed as a percentage of the median. Treat anything above ~5% as noisy and re-run.
- `mean ms`, `p99 ms` — per-trial medians of tinybench's `latency.mean`, `latency.p99`.

The JSONL export (`bench-results/latest.jsonl`) is one observation per `(library, trial, scenario)` line, with fingerprint inlined. Pivot with pandas / duckdb / jq.

### Batched sub-μs scenarios

Several scenarios run operations that complete in well under one microsecond — below tinybench's `performance.now()` resolution. These declare an explicit `batch` factor (e.g. 1000 for `constant-resolve`) and execute that many logical operations per bench-closure invocation; the reporter multiplies throughput by the batch factor.

If you add a new scenario whose `latency.mean` is under 0.5 μs, batch it. If it's over 5 μs, don't.

### Production-shaped scenario scope

This harness keeps scenarios that map to production-shaped usage: micro resolves, realistic graphs, fan-out (`resolveAll` / named strategies / tree depth), async chains and concurrent fan-out, lifecycle and scope, scale, boot and module load, failure-path fail-fast behaviour, **production-shaped handlers** (`production/*`), binding and resolution variants, registry operations, and codefast-only **initialize / inspect** paths. The report table is the comparison to cite.

### Subprocess protocol

Each library's bench runs in its own subprocess so neither side contaminates the other's V8 state. Each subprocess writes a single `SubprocessPayload` JSON to stdout, delimited by `BENCH_RESULT_JSON_START` / `BENCH_RESULT_JSON_END`. The parent reads only between those markers — Node deprecation warnings, tsx banners, or stray `console.log`s never break parsing.

Environment is pinned: `NODE_ENV=production`, `NODE_OPTIONS` always includes `--no-warnings`. When `BENCH_FULL=1`, the parent subprocess launcher also adds **`--expose-gc`**, which unlocks the strided `beforeEach` GC hook in `@codefast/benchmark-harness` (`createRunAllTrials`) for allocation-heavy scenarios. In default / fast runs, GC is not exposed unless your outer environment already sets it.

## Running

From the repo root:

```bash
pnpm --filter @codefast/benchmark-di-inversify bench
```

Or from this package:

```bash
pnpm bench                 # full head-to-head
pnpm bench:verbose         # full run + forward full child subprocess logs (debug mode)
pnpm bench:codefast        # codefast subprocess only (prints raw JSON payload)
pnpm bench:inversify       # inversify subprocess only
pnpm bench:history         # rebuild HTML history viewer from bench-results JSONL
pnpm check-types           # type-check each tsconfig variant
```

`pnpm bench` defaults to quiet mode (suppresses child stdout spam and keeps the final comparison table readable). Use `BENCH_VERBOSE=1` / `pnpm bench:verbose` when debugging scenario-level subprocess logs.

## Environment configuration

### Runtime baseline (pinned by harness)

| Key                        | Value / behavior                       |
| -------------------------- | -------------------------------------- |
| `NODE_ENV`                 | `production`                           |
| `NODE_OPTIONS`             | Always includes `--no-warnings`        |
| `NODE_OPTIONS` (full mode) | Adds `--expose-gc` when `BENCH_FULL=1` |

### User-tunable env vars

| Variable        | Values         | Effect                                                                             |
| --------------- | -------------- | ---------------------------------------------------------------------------------- |
| `BENCH_FAST`    | `1`            | Quick smoke profile (shorter tinybench sampling windows).                          |
| `BENCH_FULL`    | `1`            | Slower, publishable profile with GC exposed and longer sampling.                   |
| `BENCH_TRIALS`  | integer `>= 2` | Overrides trial count; lower/invalid values are rejected and fall back to default. |
| `BENCH_VERBOSE` | `1`            | Forwards child subprocess stdout/stderr for debugging.                             |

### Recommended presets

| Goal                        | Command                                   |
| --------------------------- | ----------------------------------------- |
| Local sanity check          | `BENCH_FAST=1 pnpm bench`                 |
| Debug noisy/failed scenario | `BENCH_FAST=1 BENCH_VERBOSE=1 pnpm bench` |
| Publishable comparison      | `BENCH_FULL=1 BENCH_TRIALS=3 pnpm bench`  |

Outputs land in `bench-results/<timestamp>/`:

- `report.md` — rendered markdown table with fingerprint + IQR.
- `observations.jsonl` — one line per `(library, trial, scenario)`.

And in `bench-results/`:

- `latest.md`, `latest.jsonl` — mirrors of the most recent run, for stable CI paths.

`pnpm bench:history` reads historical runs and writes `bench-results/history-viewer.html` (open locally; see `src/harness/generate-history-html.ts`).

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

**Authoritative order** on the codefast side is `src/scenarios/collect-codefast-scenarios.ts`. Inversify’s list is `collect-inversify-scenarios.ts`: it includes the same shared modules in the same relative blocks but **omits** codefast-only sources (`realistic-graph-validate.ts`, `initialize-inspect.ts`). Head-to-head rows still align by shared **`id`** strings; codefast-only ids appear with “—” on the inversify side.

| Area                                    | `codefast/` / `inversify/` modules                                                                      | Notes                                                                                                                                                          |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Core                                    | `micro.ts`, `realistic.ts`, `async.ts`, `lifecycle.ts`, `scope.ts`, `scale.ts`, `boot.ts`, `failure.ts` | Shared ids; `realistic-graph-validate` lives only in `codefast/realistic-graph-validate.ts`.                                                                   |
| Fan-out                                 | `fan-out/index.ts` → `tree.ts`, `resolve-all-strategies.ts`                                             | Tree scenario uses `batch=20`; `resolve-all-strategies-{10,100}`, `resolve-all-named-{8,32}` use `batch=1` (counts from `src/fixtures/fan-out-descriptor.ts`). |
| Production / wiring                     | `production.ts`, `binding-variants.ts`, `resolution-patterns.ts`, `registry-ops.ts`, `module.ts`        | Extra micro-style rows in binding/resolution modules; `registry-ops.ts` mixes `lifecycle`, `introspection`, and `scope` **group** labels per row.              |
| Introspection & startup (codefast-only) | `initialize-inspect.ts`                                                                                 | `initialize-async-warmup` (**`boot`** group), `inspect-snapshot`, `lookup-bindings` (**`introspection`**). Inversify column shows "—" for these ids.           |

Representative **stable ids** (not exhaustive of every `group` value): `constant-resolve`, `singleton-class-1-dep`, `transient-class-1-dep`, `named-constant-get`, `realistic-graph-resolve-root`, `realistic-graph-cold-resolve`, `fan-out-tree-depth-3-breadth-4`, `resolve-all-strategies-10`, `resolve-all-strategies-100`, `resolve-all-named-8`, `resolve-all-named-32`, `resolve-async-single-hop`, `dynamic-async-chain-8`, `async-fanout-concurrent-8`, `async-fanout-concurrent-32`, `lifecycle-post-construct-singleton`, `lifecycle-pre-destroy-unbind`, `child-depth-2-resolve`, `child-request-lifecycle-create-resolve-dispose`, `scale-deep-transient-chain-512`, `boot-decorated-container-build-and-resolve`, `misconfigured-missing-binding`, `circular-dependency-3`, `ambiguous-multi-binding`, plus production / binding / resolution / registry / module / initialize-inspect ids defined in those modules.

### Phase 2 - Fan-out baseline

Completed in PR #420 [`feat/di-bench-fanout-phase2`](https://github.com/codefastlabs/codefast/pull/420)

**A/A stability check** - codefast vs codefast, `BENCH_TRIALS=1` (historical run before the min-2 floor):

| Scenario                         | Hz ratio | Mean-ms ratio | Status |
| -------------------------------- | -------- | ------------- | ------ |
| `fan-out-tree-depth-3-breadth-4` | 0.996    | 0.997         | Stable |
| `resolve-all-strategies-10`      | 0.979    | 1.027         | Stable |
| `resolve-all-strategies-100`     | 0.978    | 1.026         | Stable |

All scenarios passed: `pnpm check-types`, `pnpm bench`, no sanity failures. IQR < 3%.

### Phase 3 - Async baseline

Completed on branch `feat/di-bench-fanout-phase2` (pending PR split for async-only review)

**A/A stability check** - codefast vs codefast, `BENCH_TRIALS=1` (historical run before the min-2 floor):

| Scenario                   | Hz ratio | Mean-ms ratio | Status |
| -------------------------- | -------- | ------------- | ------ |
| `resolve-async-single-hop` | 1.000    | 1.034         | Stable |
| `dynamic-async-chain-8`    | 0.963    | 1.078         | Stable |

All scenarios passed: `pnpm check-types`, `pnpm bench`, no sanity failures.

### Phase 4 - Lifecycle, scale, boot migration

Completed in this branch with new scenario modules:

- `lifecycle-post-construct-singleton`
- `lifecycle-pre-destroy-unbind`
- `scale-deep-transient-chain-512`
- `boot-decorated-container-build-and-resolve`

Validation status:

- `pnpm check-types` passes for both `tsconfig.codefast.json` and `tsconfig.inversify.json`.
- `pnpm bench:fast` runs head-to-head with no sanity failures on either library.
- Full-run tuning remains the same recommendation: use `pnpm bench` / `pnpm bench:full` when collecting publishable numbers and stability envelopes.

## Layout

```
benchmarks/di-inversify/
  src/
    harness/                         # this package’s bench driver (uses @codefast/benchmark-harness for wire + reports)
      run.ts                         # parent: rebuild @codefast/di, spawn both subprocesses, write report.md + JSONL + console
      trial.ts                       # per-subprocess: N trials, tinybench, extract per-scenario stats
      sanity.ts                      # optional per-scenario sanity hooks
      batched.ts                     # inner-loop helper for sub-μs scenarios (throughput × batch)
      di-two-way-presentation.ts     # markdown + console column copy for the two-way report
      generate-history-html.ts       # optional: aggregate bench-results → history-viewer.html
    scenarios/
      types.ts                       # BenchScenario / AsyncBenchScenario / ScenarioGroup
      collect-codefast-scenarios.ts  # ordered list of codefast scenario builders
      collect-inversify-scenarios.ts # ordered list of inversify scenario builders (ids must align with codefast)
      codefast/                      # @codefast/di scenario implementations
        micro.ts
        realistic.ts
        realistic-graph-validate.ts
        async.ts
        lifecycle.ts
        scope.ts
        scale.ts
        boot.ts
        failure.ts
        production.ts
        binding-variants.ts
        resolution-patterns.ts
        registry-ops.ts
        module.ts
        initialize-inspect.ts
        fan-out/
          index.ts                   # exports buildCodefastFanOutScenarios
          tree.ts
          resolve-all-strategies.ts
      inversify/                     # InversifyJS 8 mirrors (same ids; library-specific wiring)
        micro.ts
        realistic.ts
        async.ts
        lifecycle.ts
        scope.ts
        scale.ts
        boot.ts
        failure.ts
        production.ts
        binding-variants.ts
        resolution-patterns.ts
        registry-ops.ts
        module.ts
        fan-out/
          index.ts
          tree.ts
          resolve-all-strategies.ts
    fixtures/
      realistic-graph.ts             # graph descriptor (no DI imports)
      fan-out-descriptor.ts          # fan-out counts + tree shape helpers
      codefast-adapter.ts            # descriptor → @codefast/di Container
      inversify-adapter.ts           # descriptor → inversify Container
    codefast-benches.ts              # subprocess entry — tsconfig.codefast.json
    inversify-benches.ts             # subprocess entry — tsconfig.inversify.json (+ reflect-metadata)
  tsconfig.json
  tsconfig.codefast.json
  tsconfig.inversify.json
  package.json
  README.md
  BENCH_GUIDE.md
```

**Shared workspace package:** `@codefast/benchmark-harness` owns the framed stdout protocol (`emitSubprocessPayload` / `extractSubprocessPayload`), fingerprinting, `runBenchSubprocess`, `buildLibraryReport`, markdown + JSONL writers, and the two-way comparison row builder. This benchmark package does **not** ship `protocol.ts` / `report.ts` under `src/harness/`.

**Import boundaries**

- Only `src/fixtures/codefast-adapter.ts` and `src/scenarios/codefast/**` may import `@codefast/di`.
- Only `src/fixtures/inversify-adapter.ts` and `src/scenarios/inversify/**` may import `inversify` (and `inversify-benches.ts` imports `reflect-metadata`).
- `src/harness/**` and `src/fixtures/{realistic-graph,fan-out-descriptor}.ts` stay library-agnostic (they import `@codefast/benchmark-harness`, `tinybench`, and local `#/…` modules only).
