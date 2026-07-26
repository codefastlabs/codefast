# @codefast/benchmark-di-inversify

Head-to-head performance harness: **@codefast/di** vs **InversifyJS 8** (full suite), plus **Awilix 13** and **tsyringe 4** on a core subset, scenario-by-scenario, reported as per-trial medians with interquartile range.

Want the numbers and the honest caveats (including where `@codefast/di` loses)? See **[RESULTS.md](./RESULTS.md)**. New to this package? See **[BENCH_GUIDE.md](./BENCH_GUIDE.md)** for a newcomer-oriented glossary, mental model (parent → subprocess → tinybench), and how to read `bench-results/latest.md`.

This is the benchmark _for shipping_. It exists so a regression in `@codefast/di` hot paths cannot silently land on main, and so the performance claims — currently a clean sweep of all 43 comparable scenarios against InversifyJS, with the one remaining exception against a leaner container called out rather than hidden ([RESULTS.md](./RESULTS.md)) — are something a skeptical reader can re-run in 30 seconds. It is also where losses get found: every scenario in the suite that di once lost was fixed only after this harness made the loss impossible to ignore.

## Philosophy

The goal is not to win microbenchmarks. The goal is to measure _what TC39 Stage 3 Decorators + `Symbol.metadata` opens up in practice_ — which is the reason `@codefast/di` exists at all. Everything here is designed backwards from that principle.

### Each library runs in its canonical decorator mode

- `@codefast/di` runs under `tsconfig.codefast.json` — `experimentalDecorators: false`, TC39 Stage 3 decorators, native `Symbol.metadata`.
- InversifyJS 8 runs under `tsconfig.inversify.json` — `experimentalDecorators: true`, `emitDecoratorMetadata: true`, `reflect-metadata` polyfill required.
- tsyringe 4 runs under `tsconfig.tsyringe.json` — same legacy-decorator + `reflect-metadata` mode as inversify.
- Awilix 13 runs under `tsconfig.awilix.json` — decorator-free (factory/class registrations), so no decorator runtime at all.

This compares the _shipping experience_ of each library, not the decorator runtimes in isolation. Forcing one side into the other's mode would measure code neither library would ever ship with.

A consequence: scenarios that would otherwise bake in a per-library decorator setup cost (e.g. module boot, `@injectable` class wiring) use each library's own idiomatic decorator. The `realistic-graph-*` scenarios bypass decorators entirely (factory bindings only) so resolver-engine comparisons stay apples-to-apples.

### Trials, medians, IQR

Each library runs **N trials** back-to-back. **3 is both the minimum and the ceiling** — 5 halves the noisy rows (70% of rows exceed the 5% IQR threshold at 3, 30% at 5) but doubles the wall clock, and that trade was decided against. Read the per-row IQR instead of trusting a single figure. Every trial constructs a fresh `Bench` instance so tinybench's internal warmup fires per trial, reducing (though never eliminating) cross-trial correlation from JIT state. Override with `BENCH_TRIALS` (`>=3`). Two trials cannot separate a real change from ambient noise — a median of two is just the mean of two. The noise here is **throughput-correlated, not load-correlated**: rows above ~50M ops/s carry 10–25% IQR and rows below ~15M carry 2–5%, and two runs of the same build with and without a browser eating a core flagged the same rows to within 1–2 percentage points.

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

`BENCH_ISOLATE=1` (or `pnpm bench:isolate`) goes one step further: **each scenario** gets its own subprocess per library. In the default shared-process mode every scenario trains the library's hot-path inline caches for the scenarios after it (measured at ~30% throughput on async chains), so row order influences results; isolated mode is order-independent. Shared mode approximates a long-lived app that exercises many binding kinds, isolated mode approximates a short-lived process — cite which mode a number came from.

Environment is pinned: `NODE_ENV=production`, `NODE_OPTIONS` always includes `--no-warnings`. When `BENCH_FULL=1`, the parent subprocess launcher also adds **`--expose-gc`**, which unlocks the strided `beforeEach` GC hook in `@codefast/benchmark-harness` (`createRunAllTrials`) for allocation-heavy scenarios. In default / fast runs, GC is not exposed unless your outer environment already sets it.

## Running

From the repo root:

```bash
pnpm --filter @codefast/benchmark-di-inversify bench
```

Or from this package:

```bash
pnpm bench                 # full head-to-head (shared-process mode)
pnpm bench:isolate         # full head-to-head, one subprocess per scenario (order-independent)
pnpm bench:verbose         # full run + forward full child subprocess logs (debug mode)
pnpm bench:codefast        # codefast subprocess only (prints raw JSON payload)
pnpm bench:inversify       # inversify subprocess only
pnpm bench:serve           # serve bench-results/ in the benchmark viewer
pnpm check-types           # tsc --noEmit over src (editor-default project)
```

> `check-types` type-checks `src` under the default `tsconfig.json` (no experimental decorators; tsyringe's parameter decorators are `@ts-ignore`d there, as inversify's already are). To validate each library under _its own_ decorator mode, point `tsc` at the explicit variant: `pnpm exec tsc --noEmit -p tsconfig.{codefast,inversify,awilix,tsyringe}.json`.

`pnpm bench` defaults to quiet mode (suppresses child stdout spam and keeps the final comparison table readable). Use `BENCH_VERBOSE=1` / `pnpm bench:verbose` when debugging scenario-level subprocess logs.

## Environment configuration

### Pinned runtime environment

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
| `BENCH_TRIALS`  | integer `>= 3` | Overrides trial count; lower/invalid values are rejected and fall back to default. |
| `BENCH_VERBOSE` | `1`            | Forwards child subprocess stdout/stderr for debugging.                             |
| `BENCH_ISOLATE` | `1`            | One subprocess per scenario per library — removes cross-scenario IC wear.          |

### Recommended presets

| Goal                           | Command                                   |
| ------------------------------ | ----------------------------------------- |
| Local sanity check             | `BENCH_FAST=1 pnpm bench`                 |
| Debug noisy/failed scenario    | `BENCH_FAST=1 BENCH_VERBOSE=1 pnpm bench` |
| Publishable comparison         | `BENCH_FULL=1 BENCH_TRIALS=3 pnpm bench`  |
| Order-independent official run | `pnpm bench:isolate`                      |
| Quick isolated smoke           | `BENCH_FAST=1 BENCH_ISOLATE=1 pnpm bench` |

Outputs land in `bench-results/<timestamp>/`:

- `report.md` — rendered markdown table with fingerprint + IQR.
- `observations.jsonl` — one line per `(library, trial, scenario)`.

And in `bench-results/`:

- `latest.md`, `latest.jsonl` — mirrors of the most recent run, for stable CI paths.

`pnpm bench:serve` serves `bench-results/` for the `@codefast/benchmark-viewer` UI (see `src/harness/serve.ts`).

## Reading the output

The terminal table looks roughly like:

```
Scenario                     Group       codefast hz/op   inversify hz/op    cf/inv     cf mean ms   inv mean ms
constant-resolve             micro           12,345,678        10,123,456    1.22×        0.0001        0.0001
realistic-graph-resolve-root realistic          234,567           145,678    1.61×        0.0043        0.0069
...
```

The markdown report opens with a **Head-to-head summary** — win/parity/loss counts over comparable rows (parity band ±3%), the **median and geomean** ratios, a **geomean-by-group** line (which keeps error-path groups like `failure` separate from throughput), and loss/parity lists. The console prints the same tally under the table. After the full di-vs-inversify table, both the markdown and console append the **N-way core-subset** table comparing di against inversify, awilix, and tsyringe.

Things to check before drawing conclusions:

1. **IQR columns** (markdown version only): if either library's IQR exceeds ~5%, the medians are unstable; re-run on a quieter machine.
2. **Sanity failures**: any scenario that fails its pre-bench sanity check is skipped and listed under "Sanity failures" at the top of the report. Don't read the absence of a row as "the library can't do it".
3. **GC exposed**: the fingerprint section should say `gcExposed: true, true`. If it says `false` for either library, the `--expose-gc` flag didn't reach the subprocess and allocation-heavy rows are noisier than they should be.
4. **Mode**: shared-process and isolated (`BENCH_ISOLATE=1`) runs are not comparable to each other — cross-scenario inline-cache wear in shared mode is worth ~30% on async chains.

## Scenario inventory

**Authoritative order** on the codefast side is `src/scenarios/collect-codefast-scenarios.ts`. Inversify’s list is `collect-inversify-scenarios.ts`: it includes the same shared modules in the same relative blocks but **omits** codefast-only sources (`realistic-graph-validate.ts`, `initialize-inspect.ts`, `multi-tag-constraint.ts`). Head-to-head rows still align by shared **`id`** strings; codefast-only ids appear with “—” on the inversify side. **awilix** and **tsyringe** (`collect-{awilix,tsyringe}-scenarios.ts`) implement only the core subset — `micro.ts`, `realistic.ts`, `scale.ts`, `fan-out/` — and appear only in the N-way table, never the full two-way table.

| Area                                    | `codefast/` / `inversify/` modules                                                                      | Notes                                                                                                                                                          |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Core                                    | `micro.ts`, `realistic.ts`, `async.ts`, `lifecycle.ts`, `scope.ts`, `scale.ts`, `boot.ts`, `failure.ts` | Shared ids; `realistic-graph-validate` lives only in `codefast/realistic-graph-validate.ts`.                                                                   |
| Fan-out                                 | `fan-out/index.ts` → `tree.ts`, `resolve-all-strategies.ts`                                             | Tree scenario uses `batch=20`; `resolve-all-strategies-{10,100}`, `resolve-all-named-{8,32}` use `batch=1` (counts from `src/fixtures/fan-out-descriptor.ts`). |
| Production / wiring                     | `production.ts`, `binding-variants.ts`, `resolution-patterns.ts`, `registry-ops.ts`, `module.ts`        | Extra micro-style rows in binding/resolution modules; `registry-ops.ts` mixes `lifecycle`, `introspection`, and `scope` **group** labels per row.              |
| Introspection & startup (codefast-only) | `initialize-inspect.ts`                                                                                 | `initialize-async-warmup` (**`boot`** group), `inspect-snapshot`, `lookup-bindings` (**`introspection`**). Inversify column shows "—" for these ids.           |

Representative **stable ids** (not exhaustive of every `group` value): `constant-resolve`, `singleton-class-1-dep`, `transient-class-1-dep`, `named-constant-get`, `realistic-graph-resolve-root`, `realistic-graph-cold-resolve`, `fan-out-tree-depth-3-breadth-4`, `resolve-all-strategies-10`, `resolve-all-strategies-100`, `resolve-all-named-8`, `resolve-all-named-32`, `resolve-async-single-hop`, `dynamic-async-chain-8`, `async-fanout-concurrent-8`, `async-fanout-concurrent-32`, `lifecycle-post-construct-singleton`, `lifecycle-pre-destroy-unbind`, `child-depth-2-resolve`, `child-request-lifecycle-create-resolve-dispose`, `scale-mid-transient-chain-32`, `scale-deep-transient-chain-512`, `boot-decorated-container-build-and-resolve`, `misconfigured-missing-binding`, `circular-dependency-3`, `ambiguous-multi-binding`, plus production / binding / resolution / registry / module / initialize-inspect ids defined in those modules.

## Layout

```
benchmarks/di-inversify/
  src/
    harness/                         # this package’s bench driver (uses @codefast/benchmark-harness for wire + reports)
      run.ts                         # parent: rebuild @codefast/di, spawn subprocesses (shared or BENCH_ISOLATE), write report.md + JSONL + console
      serve.ts                       # serve bench-results/ for the benchmark viewer
      presentation.ts                # markdown + console column copy for the two-way + N-way reports
      config.ts                      # library names / tsconfig / entry-file wiring
      batched.ts                     # inner-loop helper for sub-μs scenarios (throughput × batch)
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
        multi-tag-constraint.ts      # codefast-only (no inversify counterpart)
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
        initialize-inspect.ts
        fan-out/
          index.ts
          tree.ts
          resolve-all-strategies.ts
    fixtures/
      realistic-graph.ts             # graph descriptor (no DI imports)
      fan-out-descriptor.ts          # fan-out counts + tree shape helpers
      codefast-adapter.ts            # descriptor → @codefast/di Container
      inversify-adapter.ts           # descriptor → inversify Container
      awilix-adapter.ts              # descriptor → awilix container (core subset)
      tsyringe-adapter.ts            # descriptor → tsyringe container (core subset)
    scenarios/awilix/, scenarios/tsyringe/   # core-subset scenarios for the N-way report
    codefast-benches.ts              # subprocess entry — tsconfig.codefast.json
    inversify-benches.ts             # subprocess entry — tsconfig.inversify.json (+ reflect-metadata)
    awilix-benches.ts                # subprocess entry — tsconfig.awilix.json (decorator-free)
    tsyringe-benches.ts              # subprocess entry — tsconfig.tsyringe.json (+ reflect-metadata)
  tsconfig.json
  tsconfig.codefast.json
  tsconfig.inversify.json
  tsconfig.awilix.json
  tsconfig.tsyringe.json
  package.json
  README.md
  RESULTS.md
  BENCH_GUIDE.md
```

The core subset (`scenarios/{awilix,tsyringe}/**`) implements only the factory/class-binding scenarios all four libraries support; `run.ts` renders them as an N-way table (di pivot) via `@codefast/benchmark-harness/report/n-way`, appended after the full di-vs-inversify two-way report.

**Shared workspace package:** `@codefast/benchmark-harness` owns the framed stdout protocol (`emitSubprocessPayload` / `extractSubprocessPayload`), fingerprinting, `runBenchSubprocess` + `runBenchSubprocessIsolated`, `buildLibraryReport`, the head-to-head summary (`summarizeTwoWayComparison`), and the markdown + JSONL writers. This benchmark package does **not** ship `protocol.ts` / `report.ts` under `src/harness/`.

**Import boundaries**

- Only `src/fixtures/codefast-adapter.ts` and `src/scenarios/codefast/**` may import `@codefast/di`.
- Only `src/fixtures/inversify-adapter.ts` and `src/scenarios/inversify/**` may import `inversify` (and `inversify-benches.ts` imports `reflect-metadata`).
- Likewise `src/fixtures/awilix-adapter.ts` + `src/scenarios/awilix/**` import `awilix`; `src/fixtures/tsyringe-adapter.ts` + `src/scenarios/tsyringe/**` import `tsyringe` (+ `reflect-metadata`).
- `src/harness/**` and `src/fixtures/{realistic-graph,fan-out-descriptor}.ts` stay library-agnostic (they import `@codefast/benchmark-harness`, `tinybench`, and local `#/…` modules only).
