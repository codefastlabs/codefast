# Results — @codefast/di vs InversifyJS 8, Awilix 13, tsyringe 4

> Both profiles below are `BENCH_ISOLATE=1` (one subprocess per scenario, order-independent) on Node 26.1.0 / V8 14.6, Apple M3 Max, on a quiet machine. `@codefast/di` 0.5.0-canary.7 · inversify 8.2.2 · awilix 13.0.5 · tsyringe 4.10.0. The `BENCH_FULL` profile ran **5 trials**, not 3 — see [Reading the noise](#reading-the-noise) for why that turned out to matter more than machine quiet. Transcribed by hand from `bench-results/latest.md`, which is the source of truth for the most recent run.

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
| Default profile, full 43-scenario suite      | **43 / 0 / 0**      |        2.11× |   2.49× |
| `BENCH_FULL` (GC exposed, 5 trials), same 43 | 41 / 1 / **1**      |        2.06× |   2.56× |

Core subset against the other libraries:

| Comparison      | Default profile       | `BENCH_FULL`              |
| --------------- | --------------------- | ------------------------- |
| di vs inversify | 8 / 0 / 0 — med 1.99× | 8 / 0 / 0 — med 1.98×     |
| di vs awilix    | 8 / 0 / 0 — med 2.35× | 8 / 0 / 0 — med 2.43×     |
| di vs tsyringe  | 8 / 0 / 0 — med 2.68× | 7 / 0 / **1** — med 4.19× |

Ratios are `@codefast/di / competitor` (>1 = di faster). Win band >1.03×, parity 0.97–1.03×, loss <0.97×.

## Where it loses

Two rows, both only under `BENCH_FULL`'s forced collections.

### `dynamic-async-chain-8` — 0.87× vs inversify

**A previous revision of this page claimed this row was fixed and running at 1.26×. That was wrong, and the correction matters more than the row does.**

At 5 trials on a quiet machine the row is **0.87×** with an IQR of **0.6% / 0.3%** — one of the tightest measurements in the suite, and not something more sampling will move. The retracted 1.26× came from a 3-trial run on a machine under load. The supporting "0.98× → 1.18×" figure came from a probe that loaded both library builds into **one process**, which this harness's own README warns is worth ~30% on async chains; a shared-process ratio between two libraries is not a substitute for the isolated measurement.

What survives the correction is narrower: pooling the chain contexts is kept because a per-chain context, freshly allocated, is promoted out of the nursery when a collection lands mid-chain, and an ablation that allocated per chain cost **2.5×** on this row. That is a real mechanism and a real reason for the shape. It is not evidence the row is won, and the row is not won.

### `realistic-graph-cold-resolve` — 0.82× vs tsyringe

1.15× in the default profile, and it beats inversify 4.06× and awilix 1.33× in the same run. The mechanism is **entirely garbage collection**: timed with no collection in the loop, di and tsyringe are at mutator parity — 4.57 µs against 4.58 µs per cold iteration, one library per subprocess so neither inherits the other's heap — and a forced full collection costs 1.24 ms with di's garbage in flight against 1.05 ms with tsyringe's. Nothing leaks on either side; retained bytes per iteration measure ~0.

Two attempts and what they settled:

- **Deferring per-container subsystems** cut a fresh container from 4763 to 2729 retained bytes and 13.7% of the row's allocation, and moved the row ~1.5% — which the arithmetic predicts, since 103 ns off container construction is 2.5% of a 4.06 µs iteration. It is a large win where container construction _is_ the work (`Container.create()` 1.80×, `createChild()` + resolve 1.31×), just not here.
- **Collapsing the fluent chain** to one builder object moved nothing measurable, and the ceiling for removing _every_ builder object measures ~19% on this row — below the ~22% the row needs.

So the residue is not setup work: it is that a cold iteration hands the collector ten bindings, each carrying the fourteen fields that keep every binding on one V8 hidden class. That uniform shape is worth ~30% on hot resolve. **Winning this row means paying for it everywhere else, so it stays lost on purpose.**

### Rejected hypotheses, recorded so they are not re-tried

- _di's larger live heap makes each collection more expensive._ Timing a forced full GC with each library's container warm: 1.35 ms / 9.76 MB for di against 1.41 ms / 9.89 MB for inversify — indistinguishable.
- _Reducing the async lane's allocation volume closes the async row._ Reworking it to allocate 2.8× less per op (118 B → 42 B) left the row where it was and cost a microtask hop in the default profile. Reverted.

## Reading the noise

Machine quiet was not the binding constraint; **trial count was.** The same suite, on the same build, went from 70% of rows above the 5% IQR the report itself calls noisy (worst 24.7%) at 3 trials, to **30% (worst 19.8%) at 5 trials** — and closing every other application first changed nothing measurable.

The noise is **throughput-correlated, not load-correlated**. Rows above ~50M ops/s carry 10–25% IQR; rows below ~15M carry 2–5%. Two runs of the default profile, one with a browser eating a core and one without, produced per-row IQRs within 1–2 percentage points of each other and flagged the same rows — ambient load does not reproduce like that.

Practical consequences when citing this page:

- **Use 5 trials for anything publishable.** `BENCH_TRIALS=5`, and expect the run to take proportionally longer.
- **Do not read a 10% difference on `constant-resolve`, `has-bound-check` or `singleton-class-1-dep` as real.** Read the tight rows: `realistic-graph-resolve-root` (2.9% IQR), `dynamic-async-chain-8` (0.6%), `fan-out-*`, the `production/*` group.
- **Batch anything under ~0.5 µs before believing it.** Timing an 11 ns call one at a time made a control read 0.88×; batching it the way this harness does put the same control at 1.02× with a 4% spread. A control too fine-grained to measure is worse than no control.

## Head-to-head: @codefast/di vs inversify (full suite)

Every scenario both libraries implement (43 comparable). Full table: [`bench-results/latest.md`](./bench-results/latest.md).

- **Default profile: 43 wins / 0 parity / 0 losses** — median 2.11×, geomean 2.49×. Group geomeans: micro 1.87×, realistic 2.54×, fan-out 2.27×, async 1.23×, lifecycle 3.44×, scope 3.50×, scale 1.38×, boot 4.73×, production 4.90×, introspection 3.04×, **failure 7.18×**.
- **`BENCH_FULL` profile, 5 trials: 41 wins / 1 parity / 1 loss** — median 2.06×, geomean 2.56×. The loss is `dynamic-async-chain-8` (0.87×), the parity row `resolve-optional-hit` (1.01×). Group geomeans: micro 1.70×, realistic 2.81×, fan-out 2.30×, async 1.23×, lifecycle 3.47×, scope 4.40×, scale 1.39×, boot 6.21×, production 5.55×, introspection 3.46×, **failure 7.78×**.

The `failure` group is broken out precisely so its ~8.6× — driven by `circular-dependency-3` at ~150× — does not inflate the throughput story.

## N-way core subset: di vs inversify vs awilix vs tsyringe

The factory/class-binding scenarios all four libraries support — the graphs you actually wire. `hz/op` is operations per second per logical operation.

### Default profile

| Scenario                       | Group     |    codefast |  inversify |     awilix |   tsyringe | cf/inv | cf/awi | cf/tsy |
| ------------------------------ | --------- | ----------: | ---------: | ---------: | ---------: | -----: | -----: | -----: |
| constant-resolve               | micro     | 103,380,384 | 58,250,210 | 40,169,330 | 18,713,877 |  1.77× |  2.57× |  5.52× |
| singleton-class-1-dep          | micro     |  92,276,006 | 41,102,325 | 40,035,700 | 16,809,629 |  2.25× |  2.30× |  5.49× |
| transient-class-1-dep          | micro     |  67,904,041 | 25,685,628 |  9,250,843 |  6,780,382 |  2.64× |  7.34× | 10.01× |
| realistic-graph-resolve-root   | realistic |  12,185,358 |  6,290,269 |  7,092,213 |  3,984,504 |  1.94× |  1.72× |  3.06× |
| realistic-graph-cold-resolve   | realistic |     167,874 |     50,579 |     82,921 |    146,100 |  3.32× |  2.02× |  1.15× |
| scale-mid-transient-chain-32   | scale     |     784,981 |    467,814 |    328,512 |    389,326 |  1.68× |  2.39× |  2.02× |
| scale-deep-transient-chain-512 | scale     |      32,561 |     28,857 |      2,583 |     18,489 |  1.13× | 12.61× |  1.76× |
| fan-out-tree-depth-3-breadth-4 | fan-out   |   1,428,243 |    701,753 |    957,373 |    621,495 |  2.04× |  1.49× |  2.30× |

### `BENCH_FULL` profile, 5 trials

| Scenario                       | Group     |    codefast |  inversify |     awilix |   tsyringe | cf/inv | cf/awi |    cf/tsy |
| ------------------------------ | --------- | ----------: | ---------: | ---------: | ---------: | -----: | -----: | --------: |
| constant-resolve               | micro     | 124,456,362 | 75,350,990 | 41,862,766 | 15,314,024 |  1.65× |  2.97× |     8.13× |
| singleton-class-1-dep          | micro     | 105,966,119 | 47,821,196 | 40,192,340 | 14,083,076 |  2.22× |  2.64× |     7.52× |
| transient-class-1-dep          | micro     |  69,843,030 | 31,705,186 |  9,463,666 |  5,518,483 |  2.20× |  7.38× |    12.66× |
| realistic-graph-resolve-root   | realistic |  11,810,007 |  6,087,401 |  6,897,405 |  2,167,879 |  1.94× |  1.71× |     5.45× |
| realistic-graph-cold-resolve   | realistic |     114,399 |     28,148 |     86,028 |    138,952 |  4.06× |  1.33× | **0.82×** |
| scale-mid-transient-chain-32   | scale     |     674,974 |    441,571 |    302,808 |    348,439 |  1.53× |  2.23× |     1.94× |
| scale-deep-transient-chain-512 | scale     |      34,853 |     27,715 |      2,672 |     14,347 |  1.26× | 13.04× |     2.43× |
| fan-out-tree-depth-3-breadth-4 | fan-out   |   1,433,756 |    708,084 |    940,530 |    490,007 |  2.02× |  1.52× |     2.93× |

## Reproduce

```bash
pnpm --filter @codefast/benchmark-di-inversify bench:isolate
```

For the stricter profile (GC exposed, 5 trials — see [Reading the noise](#reading-the-noise)):

```bash
BENCH_FULL=1 BENCH_TRIALS=5 pnpm --filter @codefast/benchmark-di-inversify bench:isolate
```

Outputs land in `bench-results/<timestamp>/` and mirror to `bench-results/latest.md`. See [README](./README.md) for the full method, environment pinning, and scenario inventory. For why the engine is shaped the way it is — and which shapes are load-bearing for these numbers — see [`packages/di/ARCHITECTURE.md`](../../packages/di/ARCHITECTURE.md).
