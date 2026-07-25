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
| di vs **inversify** (full 43-scenario suite) | **43 / 0 / 0**      |        1.79× |   2.24× |

Under the stricter `BENCH_FULL` profile (GC exposed, 3 trials) the same suite is **42 / 0 / 1** — median 1.83×, geomean 2.21× — with the one loss explained below. Core-subset comparisons against the other libraries, `BENCH_FULL`:

| Comparison (core subset, `BENCH_FULL`) | Win / parity / loss | Median ratio | Geomean |
| -------------------------------------- | ------------------- | -----------: | ------: |
| di vs **inversify**                    | 8 / 0 / 0           |        1.67× |   1.82× |
| di vs **awilix**                       | 7 / 0 / 1           |        1.99× |   2.64× |
| di vs **tsyringe**                     | 7 / 0 / 1           |        3.89× |   3.48× |

Ratios are `@codefast/di / competitor` (>1 = di faster). Win band >1.03×, parity 0.97–1.03×, loss <0.97×.

## Where it loses

1. **Cold container build, versus the leaner containers.** `realistic-graph-cold-resolve` (build a fresh container, bind 10 nodes, resolve once) beats inversify 2.34× but **loses to awilix (0.76×) and tsyringe (0.53×)**. di's per-container setup does genuinely more work — metadata, lifecycle, introspection — than a decorator-free/factory container's. A deliberate trade-off, not a defect.
2. **Async chains, but only under forced GC.** `dynamic-async-chain-8` is **0.75× under `BENCH_FULL`** yet **1.26× in the default profile**, and the whole `async` group swings from 1.17× to 1.39×. `BENCH_FULL` exposes `--expose-gc` and the harness then calls `gc()` on a stride, which makes the row measure _allocation volume_ far more than resolution work (per-op cost jumps from ~0.6 µs to ~27 µs — GC dominates). di's async lane allocates more per level than inversify's, because each level registers a promise-settle listener to unwind the resolution path. Reducing that allocation further is the open item; the sync lane no longer allocates per level at all.

## Head-to-head: @codefast/di vs inversify (full suite)

Every scenario both libraries implement (43 comparable). Full table: [`bench-results/latest.md`](./bench-results/latest.md).

- **Default profile: 43 wins / 0 parity / 0 losses** — median 1.79×, geomean 2.24×. Group geomeans: micro 1.73×, realistic 1.72×, fan-out 2.09×, async 1.39×, lifecycle 2.67×, scope 2.94×, scale 1.78×, boot 2.60×, production 3.28×, introspection 3.08×, **failure 7.60×**.
- **`BENCH_FULL` profile: 42 wins / 0 parity / 1 loss** — median 1.83×, geomean 2.21×; the loss is `dynamic-async-chain-8` (0.75×). Group geomeans: micro 1.53×, realistic 1.95×, fan-out 2.16×, async 1.17×, lifecycle 2.60×, scope 3.02×, scale 1.70×, boot 3.11×, production 3.92×, introspection 3.64×, **failure 7.83×**.

The `failure` group is broken out precisely so its ~7.8× — driven by `circular-dependency-3` at ~140× — does not inflate the throughput story.

## N-way core subset: di vs inversify vs awilix vs tsyringe

The factory/class-binding scenarios all four libraries support — the graphs you actually wire. Numbers from the `BENCH_FULL` run; `hz/op` is operations per second per logical operation.

| Scenario                       | Group     |    codefast |  inversify |     awilix |   tsyringe | cf/inv |    cf/awi |    cf/tsy |
| ------------------------------ | --------- | ----------: | ---------: | ---------: | ---------: | -----: | --------: | --------: |
| constant-resolve               | micro     | 123,883,450 | 72,408,304 | 41,505,237 | 15,230,904 |  1.71× |     2.98× |     8.13× |
| singleton-class-1-dep          | micro     |  78,705,089 | 48,910,796 | 38,750,194 | 13,948,034 |  1.61× |     2.03× |     5.64× |
| transient-class-1-dep          | micro     |  78,594,292 | 31,830,857 |  9,395,457 |  5,521,549 |  2.47× |     8.37× |    14.23× |
| realistic-graph-resolve-root   | realistic |   9,531,610 |  5,882,273 |  6,554,782 |  2,117,003 |  1.62× |     1.45× |     4.50× |
| realistic-graph-cold-resolve   | realistic |      57,749 |     24,689 |     76,281 |    109,344 |  2.34× | **0.76×** | **0.53×** |
| scale-mid-transient-chain-32   | scale     |     591,838 |    436,235 |    304,027 |    340,857 |  1.36× |     1.95× |     1.74× |
| scale-deep-transient-chain-512 | scale     |      47,971 |     22,594 |      2,667 |     14,643 |  2.12× |    17.99× |     3.28× |
| fan-out-tree-depth-3-breadth-4 | fan-out   |   1,150,254 |    719,960 |    956,823 |    475,254 |  1.60× |     1.20× |     2.42× |

Per competitor: **vs inversify** 8/0/0 (median 1.67×) · **vs awilix** 7/0/1 (median 1.99×) · **vs tsyringe** 7/0/1 (median 3.89×). The only core-subset loss is cold container build against the two leaner containers.

## Reproduce

```bash
pnpm --filter @codefast/benchmark-di-inversify bench:isolate
```

For the stricter profile (GC exposed, 3 trials):

```bash
BENCH_FULL=1 BENCH_TRIALS=3 pnpm --filter @codefast/benchmark-di-inversify bench:isolate
```

Outputs land in `bench-results/<timestamp>/` and mirror to `bench-results/latest.md`. See [README](./README.md) for the full method, environment pinning, and scenario inventory.
