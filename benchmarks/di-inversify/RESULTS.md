# Results — @codefast/di vs InversifyJS 8, Awilix 13, tsyringe 4

> Two profiles are reported below, both `BENCH_ISOLATE=1` (one subprocess per scenario, order-independent) on Node 26.1.0, Apple M3 Max, with nothing else running. `@codefast/di` 0.5.0-canary.6 · inversify 8.2.2 · awilix 13.0.5 · tsyringe 4.10.0. Re-run either in a few minutes — see [Reproduce](#reproduce). This page is transcribed by hand from `bench-results/latest.md`; that file is the source of truth for the most recent run.

## What this measures — and what it doesn't

This is a **first-party** benchmark: the same author maintains `@codefast/di` and this harness. Read it as "here is the workload we optimized for, and a re-runnable way to check the claim" — not a neutral third-party verdict. What keeps it honest:

- Each library runs in its **canonical mode**, never forced into another's: `@codefast/di` with TC39 Stage 3 decorators + `Symbol.metadata`, `inversify`/`tsyringe` with legacy decorators + `reflect-metadata`, `awilix` decorator-free. The realistic-graph and scale scenarios use factory bindings only, so the resolver engines compare apples-to-apples.
- The headline aggregate is the **median and geometric mean of ratios**, not a single row. A fail-fast error path (cycle detection) runs 100×+ faster and is reported in its own `failure` group so it never reads as a typical speedup.
- Scenarios where `@codefast/di` **loses are shown plainly**, not omitted — see [Where it loses](#where-it-loses).
- **Measure on an idle machine.** Running builds or tests alongside a bench run visibly corrupts it: a contaminated run of this same build reported five losses that all disappeared on a clean re-run.

## TL;DR

| Comparison (default profile)                 | Win / parity / loss | Median ratio | Geomean |
| -------------------------------------------- | ------------------- | -----------: | ------: |
| di vs **inversify** (full 43-scenario suite) | **43 / 0 / 0**      |        1.80× |   2.21× |

Under the stricter `BENCH_FULL` profile (GC exposed, 3 trials) the same suite is **41 / 1 / 1** — median 1.87×, geomean 2.27× — with the one loss explained below. Core-subset comparisons against the other libraries, `BENCH_FULL`:

| Comparison (core subset, `BENCH_FULL`) | Win / parity / loss | Median ratio | Geomean |
| -------------------------------------- | ------------------- | -----------: | ------: |
| di vs **inversify**                    | 8 / 0 / 0           |        1.65× |   1.81× |
| di vs **awilix**                       | 7 / 0 / 1           |        2.11× |   2.70× |
| di vs **tsyringe**                     | 7 / 0 / 1           |        3.73× |   3.47× |

Ratios are `@codefast/di / competitor` (>1 = di faster). Win band >1.03×, parity 0.97–1.03×, loss <0.97×.

## Where it loses

1. **Cold container build, versus the leaner containers.** `realistic-graph-cold-resolve` (build a fresh container, bind 10 nodes, resolve once) beats inversify 2.33× but trails awilix (0.83×) and tsyringe (0.54×) under `BENCH_FULL`. Moving resolution frames off a per-resolver `Map` onto the binding cut cold build sharply — enough to overtake awilix in the default profile — but di's per-container setup still does more work than a decorator-free/factory container's: metadata, lifecycle, introspection.
2. **Async chains, but only under `BENCH_FULL`'s forced-GC hook.** `dynamic-async-chain-8` is **0.82× under `BENCH_FULL`** yet a win in the default profile; the `async` group swings from 1.25× to 1.39×.

   Isolating the cause: running the same scenario with **identical `BENCH_FULL` sampling parameters**, once with `--expose-gc` and once without (which no-ops the harness's strided `gc()` hook), gives

   | Run                         |  codefast | inversify |     ratio |
   | --------------------------- | --------: | --------: | --------: |
   | full params, GC hook active |   937,373 | 1,159,604 | **0.81×** |
   | full params, GC hook inert  | 1,480,539 | 1,225,817 | **1.21×** |

   So the flip is the GC hook, not the shorter warmup or sample counts — and it is lopsided: the forced collections cost `@codefast/di` **37%** but inversify only **5%**. Note the `gc()` call itself is _not_ inside the measured region (tinybench runs `beforeEach` before starting its timer), so this is not GC time being charged to the row; it is di paying to re-warm state that a full collection disturbs. di leans harder on warm cross-iteration state — pooled resolution contexts, deeper call chains, more live objects per container — which is exactly what buys the 1.2–2.5× it wins elsewhere.

   One hypothesis was tested and **rejected**: allocation volume. Reworking the lane to allocate 2.8× less per op (118 B → 42 B, unwinding in an `async`/`finally` wrapper instead of a discarded `.then` derived promise) left the row at 0.77× while costing a microtask hop in the default profile, so that rework was reverted. The exact V8-level mechanism behind the remaining gap is not yet pinned down.

   Whether a full GC every 100 samples resembles your workload is a judgement call — most applications do not force one every 100 resolutions — which is why both profiles are reported here rather than just the flattering one.

## Head-to-head: @codefast/di vs inversify (full suite)

Every scenario both libraries implement (43 comparable). Full table: [`bench-results/latest.md`](./bench-results/latest.md).

- **Default profile: 43 wins / 0 parity / 0 losses** — median 1.80×, geomean 2.21×. Group geomeans: micro 1.69×, realistic 1.62×, fan-out 2.18×, async 1.39×, lifecycle 2.67×, scope 2.79×, scale 1.45×, boot 2.37×, production 3.43×, introspection 3.11×, **failure 7.51×**.
- **`BENCH_FULL` profile: 41 wins / 1 parity / 1 loss** — median 1.87×, geomean 2.27×; the loss is `dynamic-async-chain-8` (0.82×), the parity row `resolve-optional-hit` (1.02×). Group geomeans: micro 1.53×, realistic 1.95×, fan-out 2.38×, async 1.25×, lifecycle 2.59×, scope 3.04×, scale 1.55×, boot 3.41×, production 3.90×, introspection 3.60×, **failure 8.08×**.

The `failure` group is broken out precisely so its ~7.8× — driven by `circular-dependency-3` at ~150× — does not inflate the throughput story.

## N-way core subset: di vs inversify vs awilix vs tsyringe

The factory/class-binding scenarios all four libraries support — the graphs you actually wire. Numbers from the `BENCH_FULL` run; `hz/op` is operations per second per logical operation.

| Scenario                       | Group     |    codefast |  inversify |     awilix |   tsyringe | cf/inv |    cf/awi |    cf/tsy |
| ------------------------------ | --------- | ----------: | ---------: | ---------: | ---------: | -----: | --------: | --------: |
| constant-resolve               | micro     | 124,733,680 | 74,832,898 | 41,893,448 | 15,736,085 |  1.67× |     2.98× |     7.93× |
| singleton-class-1-dep          | micro     |  78,666,455 | 48,827,666 | 40,393,495 | 14,088,509 |  1.61× |     1.95× |     5.58× |
| transient-class-1-dep          | micro     |  76,448,729 | 31,927,144 |  9,519,441 |  5,632,722 |  2.39× |     8.03× |    13.57× |
| realistic-graph-resolve-root   | realistic |  10,323,158 |  6,335,374 |  7,042,453 |  2,261,542 |  1.63× |     1.47× |     4.56× |
| realistic-graph-cold-resolve   | realistic |      60,119 |     25,821 |     72,307 |    110,961 |  2.33× | **0.83×** | **0.54×** |
| scale-mid-transient-chain-32   | scale     |     698,228 |    443,161 |    307,506 |    352,870 |  1.58× |     2.27× |     1.98× |
| scale-deep-transient-chain-512 | scale     |      35,677 |     23,518 |      2,481 |     14,263 |  1.52× |    14.38× |     2.50× |
| fan-out-tree-depth-3-breadth-4 | fan-out   |   1,378,582 |    704,550 |    908,416 |    477,143 |  1.96× |     1.52× |     2.89× |

Per competitor: **vs inversify** 8/0/0 (median 1.65×) · **vs awilix** 7/0/1 (median 2.11×) · **vs tsyringe** 7/0/1 (median 3.73×). The only core-subset loss is cold container build against the two leaner containers.

## Reproduce

```bash
pnpm --filter @codefast/benchmark-di-inversify bench:isolate
```

For the stricter profile (GC exposed, 3 trials):

```bash
BENCH_FULL=1 BENCH_TRIALS=3 pnpm --filter @codefast/benchmark-di-inversify bench:isolate
```

Outputs land in `bench-results/<timestamp>/` and mirror to `bench-results/latest.md`. See [README](./README.md) for the full method, environment pinning, and scenario inventory.
