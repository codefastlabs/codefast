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
| di vs **inversify** (full 43-scenario suite) | **43 / 0 / 0**      |        1.87× |   2.23× |

Under the stricter `BENCH_FULL` profile (GC exposed, 3 trials) the same suite is **42 / 0 / 1** — median 1.84×, geomean 2.24× — with the one loss explained below. Core-subset comparisons against the other libraries, `BENCH_FULL`:

| Comparison (core subset, `BENCH_FULL`) | Win / parity / loss | Median ratio | Geomean |
| -------------------------------------- | ------------------- | -----------: | ------: |
| di vs **inversify**                    | 8 / 0 / 0           |        1.67× |   1.80× |
| di vs **awilix**                       | 7 / 0 / 1           |        2.13× |   2.68× |
| di vs **tsyringe**                     | 7 / 0 / 1           |        3.77× |   3.44× |

Ratios are `@codefast/di / competitor` (>1 = di faster). Win band >1.03×, parity 0.97–1.03×, loss <0.97×.

## Where it loses

1. **Cold container build, versus the leaner containers — under `BENCH_FULL` only.** `realistic-graph-cold-resolve` (build a fresh container, bind 10 nodes, resolve once) beats inversify 2.39× but under `BENCH_FULL` still trails awilix (0.78×) and tsyringe (0.45×). In the default profile it now **beats awilix (1.07×)** after frames moved from a per-resolver `Map` to the binding, which cut cold build ~62%. What remains is that di's per-container setup does more work — metadata, lifecycle, introspection — than a decorator-free/factory container's.
2. **Async chains, but only under `BENCH_FULL`'s forced-GC hook.** `dynamic-async-chain-8` is **0.76× under `BENCH_FULL`** yet a win in the default profile; the `async` group swings from 1.20× to 1.37×.

   Isolating the cause: running the same scenario with **identical `BENCH_FULL` sampling parameters**, once with `--expose-gc` and once without (which no-ops the harness's strided `gc()` hook), gives

   | Run                         |  codefast | inversify |     ratio |
   | --------------------------- | --------: | --------: | --------: |
   | full params, GC hook active |   888,962 | 1,166,301 | **0.76×** |
   | full params, GC hook inert  | 1,563,780 | 1,228,917 | **1.27×** |

   So the flip is the GC hook, not the shorter warmup or sample counts — and it is lopsided: the forced collections cost `@codefast/di` **43%** but inversify only **5%**. Note the `gc()` call itself is _not_ inside the measured region (tinybench runs `beforeEach` before starting its timer), so this is not GC time being charged to the row; it is di paying to re-warm state that a full collection disturbs. di leans harder on warm cross-iteration state — pooled resolution contexts, deeper call chains, more live objects per container — which is exactly what buys the 1.2–2.5× it wins elsewhere.

   One hypothesis was tested and **rejected**: allocation volume. Reworking the lane to allocate 2.8× less per op (118 B → 42 B, unwinding in an `async`/`finally` wrapper instead of a discarded `.then` derived promise) left the row at 0.77× while costing a microtask hop in the default profile, so that rework was reverted. The exact V8-level mechanism behind the remaining 43% is not yet pinned down.

   Whether a full GC every 100 samples resembles your workload is a judgement call — most applications do not force one every 100 resolutions — which is why both profiles are reported here rather than just the flattering one.

## Head-to-head: @codefast/di vs inversify (full suite)

Every scenario both libraries implement (43 comparable). Full table: [`bench-results/latest.md`](./bench-results/latest.md).

- **Default profile: 43 wins / 0 parity / 0 losses** — median 1.87×, geomean 2.23×. Group geomeans: micro 1.71×, realistic 1.76×, fan-out 2.26×, async 1.37×, lifecycle 2.52×, scope 2.78×, scale 1.57×, boot 2.47×, production 3.38×, introspection 3.08×, **failure 7.49×**.
- **`BENCH_FULL` profile: 42 wins / 0 parity / 1 loss** — median 1.84×, geomean 2.24×; the loss is `dynamic-async-chain-8` (0.76×). Group geomeans: micro 1.49×, realistic 2.03×, fan-out 2.34×, async 1.20×, lifecycle 2.66×, scope 3.02×, scale 1.49×, boot 3.37×, production 3.94×, introspection 3.62×, **failure 7.99×**.

The `failure` group is broken out precisely so its ~7.8× — driven by `circular-dependency-3` at ~140× — does not inflate the throughput story.

## N-way core subset: di vs inversify vs awilix vs tsyringe

The factory/class-binding scenarios all four libraries support — the graphs you actually wire. Numbers from the `BENCH_FULL` run; `hz/op` is operations per second per logical operation.

| Scenario                       | Group     |    codefast |  inversify |     awilix |   tsyringe | cf/inv |    cf/awi |    cf/tsy |
| ------------------------------ | --------- | ----------: | ---------: | ---------: | ---------: | -----: | --------: | --------: |
| constant-resolve               | micro     | 122,593,946 | 75,522,799 | 41,556,445 | 15,603,884 |  1.62× |     2.95× |     7.86× |
| singleton-class-1-dep          | micro     |  79,174,954 | 54,729,451 | 40,284,084 | 13,711,462 |  1.45× |     1.97× |     5.77× |
| transient-class-1-dep          | micro     |  79,470,699 | 30,958,848 |  9,497,564 |  5,528,042 |  2.57× |     8.37× |    14.38× |
| realistic-graph-resolve-root   | realistic |  10,418,357 |  6,082,878 |  6,979,346 |  2,241,671 |  1.71× |     1.49× |     4.65× |
| realistic-graph-cold-resolve   | realistic |      60,979 |     25,464 |     77,982 |    135,743 |  2.39× | **0.78×** | **0.45×** |
| scale-mid-transient-chain-32   | scale     |     703,723 |    435,254 |    307,449 |    355,777 |  1.62× |     2.29× |     1.98× |
| scale-deep-transient-chain-512 | scale     |      36,366 |     26,337 |      2,624 |     14,306 |  1.38× |    13.86× |     2.54× |
| fan-out-tree-depth-3-breadth-4 | fan-out   |   1,400,125 |    715,934 |    950,865 |    485,053 |  1.96× |     1.47× |     2.89× |

Per competitor: **vs inversify** 8/0/0 (median 1.67×) · **vs awilix** 7/0/1 (median 2.13×) · **vs tsyringe** 7/0/1 (median 3.77×). The only core-subset loss is cold container build against the two leaner containers.

## Reproduce

```bash
pnpm --filter @codefast/benchmark-di-inversify bench:isolate
```

For the stricter profile (GC exposed, 3 trials):

```bash
BENCH_FULL=1 BENCH_TRIALS=3 pnpm --filter @codefast/benchmark-di-inversify bench:isolate
```

Outputs land in `bench-results/<timestamp>/` and mirror to `bench-results/latest.md`. See [README](./README.md) for the full method, environment pinning, and scenario inventory.
