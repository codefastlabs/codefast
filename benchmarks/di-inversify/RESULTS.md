# Results — @codefast/di vs InversifyJS 8, Awilix 13, tsyringe 4

> Both profiles below are `BENCH_ISOLATE=1` (one subprocess per scenario, order-independent) at **3 trials** on Node 26.1.0 / V8 14.6, Apple M3 Max, on a quiet machine. `@codefast/di` 0.5.0-canary.7 · inversify 8.2.2 · awilix 13.0.5 · tsyringe 4.10.0. Transcribed by hand from `bench-results/latest.md`, which is the source of truth for the most recent run.
>
> **Read the aggregates, not the rows.** Averaging 43 scenarios cancels most of the per-row noise, so the median and geomean reproduce well. Individual high-throughput rows do not — see [Reading the noise](#reading-the-noise) for how far they move between runs and which ones to distrust.

## What this measures — and what it doesn't

This is a **first-party** benchmark: the same author maintains `@codefast/di` and this harness. Read it as "here is the workload we optimized for, and a re-runnable way to check the claim" — not a neutral third-party verdict. What keeps it honest:

- Each library runs in its **canonical mode**, never forced into another's: `@codefast/di` with TC39 Stage 3 decorators + `Symbol.metadata`, `inversify`/`tsyringe` with legacy decorators + `reflect-metadata`, `awilix` decorator-free. The realistic-graph and scale scenarios use factory bindings only, so the resolver engines compare apples-to-apples.
- The headline aggregate is the **median and geometric mean of ratios**, not a single row. A fail-fast error path (cycle detection) runs 100×+ faster and is reported in its own `failure` group so it never reads as a typical speedup.
- Scenarios where `@codefast/di` **loses are shown plainly**, not omitted — see [Where it loses](#where-it-loses).
- Every scenario runs **at least 3 trials**, and anything published here runs **5** — the difference is large and is quantified under [Reading the noise](#reading-the-noise).
- **A claim gets retracted when a better measurement disagrees with it.** This page has retracted one — see `dynamic-async-chain-8` below.

## TL;DR

| Comparison                                   | Win / parity / loss | Median ratio | Geomean |
| -------------------------------------------- | ------------------- | -----------: | ------: |
| Default profile, full 43-scenario suite      | **43 / 0 / 0**      |        2.06× |   2.52× |
| `BENCH_FULL` (GC exposed), same 43 scenarios | 41 / 1 / **1**      |        2.10× |   2.60× |

Core subset against the other libraries:

| Comparison      | Default profile       | `BENCH_FULL`              |
| --------------- | --------------------- | ------------------------- |
| di vs inversify | 8 / 0 / 0 — med 2.03× | 8 / 0 / 0 — med 2.01×     |
| di vs awilix    | 8 / 0 / 0 — med 2.31× | 8 / 0 / 0 — med 2.54×     |
| di vs tsyringe  | 8 / 0 / 0 — med 2.67× | 7 / 0 / **1** — med 4.30× |

Ratios are `@codefast/di / competitor` (>1 = di faster). Win band >1.03×, parity 0.97–1.03×, loss <0.97×.

## Where it loses

Two rows, both only under `BENCH_FULL`'s forced collections.

### `dynamic-async-chain-8` — 0.90× vs inversify

**A previous revision of this page claimed this row was fixed and running at 1.26×. That was wrong, and the correction matters more than the row does.**

On a quiet machine the row is **0.90×** with an IQR under 1% — one of the tightest measurements in the suite, and not something more sampling will move. The retracted 1.26× came from a 3-trial run on a machine under load. The supporting "0.98× → 1.18×" figure came from a probe that loaded both library builds into **one process**, which this harness's own README warns is worth ~30% on async chains; a shared-process ratio between two libraries is not a substitute for the isolated measurement.

What survives the correction is narrower: pooling the chain contexts is kept because a per-chain context, freshly allocated, is promoted out of the nursery when a collection lands mid-chain, and an ablation that allocated per chain cost **2.5×** on this row. That is a real mechanism and a real reason for the shape. It is not evidence the row is won, and the row is not won.

### `realistic-graph-cold-resolve` — 0.93× vs tsyringe

**1.05× in the default profile**, and it beats inversify 4.09× and awilix 1.35× in the same run — a row that opened this branch at 0.22×. The mechanism is **entirely garbage collection**: timed with no collection in the loop, di and tsyringe are at mutator parity — 4.57 µs against 4.58 µs per cold iteration, one library per subprocess so neither inherits the other's heap — and a forced full collection costs 1.24 ms with di's garbage in flight against 1.05 ms with tsyringe's. Nothing leaks on either side; retained bytes per iteration measure ~0.

Two attempts and what they settled:

- **Deferring per-container subsystems** cut a fresh container from 4763 to 2729 retained bytes and 13.7% of the row's allocation, and moved the row ~1.5% — which the arithmetic predicts, since 103 ns off container construction is 2.5% of a 4.06 µs iteration. It is a large win where container construction _is_ the work (`Container.create()` 1.80×, `createChild()` + resolve 1.31×), just not here.
- **Collapsing the fluent chain** to one builder object moved nothing measurable, and the ceiling for removing _every_ builder object measures ~19% on this row — below the ~22% the row needs.

So the residue is not setup work: it is that a cold iteration hands the collector ten bindings, each carrying the fourteen fields that keep every binding on one V8 hidden class. That uniform shape is worth ~30% on hot resolve. **Winning this row means paying for it everywhere else, so it stays lost on purpose.**

### What the deferral costs

Building a container's collaborators on first use is worth 1.80× on `Container.create()` and 1.31× on a per-request child, and it does have a price: the registry's slot index gained a presence check on the read path. An ablation making just those two indexes eager again, both builds in one process with a control at 1.01, puts the named-resolve path **~5% slower with the lazy index under a collecting profile** and identical without one. Worth paying for a container that allocates half as much, but it is a real cost and this is where it lands.

### Rejected hypotheses, recorded so they are not re-tried

- _di's larger live heap makes each collection more expensive._ Timing a forced full GC with each library's container warm: 1.35 ms / 9.76 MB for di against 1.41 ms / 9.89 MB for inversify — indistinguishable.
- _Reducing the async lane's allocation volume closes the async row._ Reworking it to allocate 2.8× less per op (118 B → 42 B) left the row where it was and cost a microtask hop in the default profile. Reverted.

## Reading the noise

**IQR measures stability _within_ a run and is blind to variation _between_ them.** Two consecutive `BENCH_FULL` runs, same build, same quiet machine, minutes apart:

| Run    | `named-constant-get`, di |  inversify |     Ratio | IQR that run |
| ------ | -----------------------: | ---------: | --------: | ------------ |
| first  |               34,554,288 | 39,865,930 | **0.87×** | 2.0% / 0.5%  |
| second |           **48,087,659** | 39,675,479 | **1.21×** | 2.1% / 1.6%  |

inversify barely moved. di's own number jumped **39%** — while both runs reported that row as one of the tightest in the suite. The first run put it in the loss column; nothing had changed but the run. Anything above roughly 30M ops/s behaves this way here.

So when citing this page:

- **Cite the aggregates.** Median and geomean average 43 scenarios and reproduce across runs; a single high-throughput row does not.
- **Distrust `constant-resolve`, `has-bound-check`, `singleton-class-1-dep`, `named-constant-get`** and anything else above ~30M ops/s at the 10% level, whatever their IQR says. The rows worth reading precisely sit below ~15M: `realistic-graph-resolve-root`, `dynamic-async-chain-8`, `fan-out-*`, the `production/*` group.
- **Trial count moves the noise floor more than machine quiet does.** 70% of rows exceed the 5% IQR threshold at 3 trials, 30% at 5 — and closing every other application changed neither figure. This page publishes 3-trial runs: doubling the wall clock to halve the noisy-row count was decided against, and the aggregates are stable either way.
- **Batch anything under ~0.5 µs before believing it.** Timing an 11 ns call one at a time made a control read 0.88×; batched the way this harness does it, the same control reads 1.02× with a 4% spread.

## Head-to-head: @codefast/di vs inversify (full suite)

Every scenario both libraries implement (43 comparable). Full table: [`bench-results/latest.md`](./bench-results/latest.md).

- **Default profile: 43 wins / 0 parity / 0 losses** — median 2.06×, geomean 2.52×. Group geomeans: micro 1.85×, realistic 2.37×, fan-out 2.28×, async 1.24×, lifecycle 3.55×, scope 4.10×, scale 1.60×, boot 4.64×, production 4.86×, introspection 3.07×, **failure 7.24×**.
- **`BENCH_FULL` profile: 41 wins / 1 parity / 1 loss** — median 2.10×, geomean 2.60×. The loss is `dynamic-async-chain-8` (0.90×), the parity row `resolve-optional-hit` (1.02×). Group geomeans: micro 1.70×, realistic 2.97×, fan-out 2.20×, async 1.21×, lifecycle 3.63×, scope 4.39×, scale 1.44×, boot 7.12×, production 6.04×, introspection 3.47×, **failure 7.91×**.

The `failure` group is broken out precisely so its ~8.6× — driven by `circular-dependency-3` at ~150× — does not inflate the throughput story.

## N-way core subset: di vs inversify vs awilix vs tsyringe

The factory/class-binding scenarios all four libraries support — the graphs you actually wire. `hz/op` is operations per second per logical operation.

### Default profile

| Scenario                       | Group     |    codefast |  inversify |     awilix |   tsyringe | cf/inv | cf/awi | cf/tsy |
| ------------------------------ | --------- | ----------: | ---------: | ---------: | ---------: | -----: | -----: | -----: |
| constant-resolve               | micro     | 104,514,602 | 59,889,286 | 40,195,830 | 18,038,781 |  1.75× |  2.60× |  5.79× |
| singleton-class-1-dep          | micro     |  94,779,799 | 44,088,924 | 41,954,460 | 17,082,667 |  2.15× |  2.26× |  5.55× |
| transient-class-1-dep          | micro     |  66,539,265 | 27,438,426 |  9,100,907 |  6,693,625 |  2.43× |  7.31× |  9.94× |
| realistic-graph-resolve-root   | realistic |  12,381,356 |  6,012,833 |  7,141,475 |  4,038,438 |  2.06× |  1.73× |  3.07× |
| realistic-graph-cold-resolve   | realistic |     152,632 |     56,049 |     87,022 |    144,718 |  2.72× |  1.75× |  1.05× |
| scale-mid-transient-chain-32   | scale     |     753,268 |    437,776 |    319,858 |    395,118 |  1.72× |  2.36× |  1.91× |
| scale-deep-transient-chain-512 | scale     |      36,719 |     24,774 |      2,661 |     17,049 |  1.48× | 13.80× |  2.15× |
| fan-out-tree-depth-3-breadth-4 | fan-out   |   1,439,719 |    722,930 |    966,959 |    632,166 |  1.99× |  1.49× |  2.28× |

### `BENCH_FULL` profile

| Scenario                       | Group     |    codefast |  inversify |     awilix |   tsyringe | cf/inv | cf/awi |    cf/tsy |
| ------------------------------ | --------- | ----------: | ---------: | ---------: | ---------: | -----: | -----: | --------: |
| constant-resolve               | micro     | 126,351,317 | 75,056,655 | 41,734,905 | 15,382,959 |  1.68× |  3.03× |     8.21× |
| singleton-class-1-dep          | micro     | 106,105,074 | 50,448,416 | 40,412,507 | 14,282,306 |  2.10× |  2.63× |     7.43× |
| transient-class-1-dep          | micro     |  77,550,593 | 32,466,572 |  9,360,457 |  5,629,100 |  2.39× |  8.28× |    13.78× |
| realistic-graph-resolve-root   | realistic |  12,861,785 |  5,982,925 |  7,001,553 |  2,237,155 |  2.15× |  1.84× |     5.75× |
| realistic-graph-cold-resolve   | realistic |     104,949 |     25,631 |     77,546 |    113,437 |  4.09× |  1.35× | **0.93×** |
| scale-mid-transient-chain-32   | scale     |     744,664 |    423,832 |    302,547 |    345,269 |  1.76× |  2.46× |     2.16× |
| scale-deep-transient-chain-512 | scale     |      33,951 |     28,760 |      2,515 |     14,390 |  1.18× | 13.50× |     2.36× |
| fan-out-tree-depth-3-breadth-4 | fan-out   |   1,357,813 |    709,127 |    914,058 |    475,015 |  1.91× |  1.49× |     2.86× |

## Reproduce

```bash
pnpm --filter @codefast/benchmark-di-inversify bench:isolate
```

For the stricter profile (GC exposed):

```bash
BENCH_FULL=1 pnpm --filter @codefast/benchmark-di-inversify bench:isolate
```

Outputs land in `bench-results/<timestamp>/` and mirror to `bench-results/latest.md`. See [README](./README.md) for the full method, environment pinning, and scenario inventory. For why the engine is shaped the way it is — and which shapes are load-bearing for these numbers — see [`packages/di/ARCHITECTURE.md`](../../packages/di/ARCHITECTURE.md).
