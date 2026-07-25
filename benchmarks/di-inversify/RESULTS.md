# Results — @codefast/di vs InversifyJS 8, Awilix 13, tsyringe 4

> Numbers below are a publishable run: `BENCH_FULL=1 BENCH_TRIALS=3 BENCH_ISOLATE=1` on Node 26.1.0, Apple M3 Max (GC exposed, 3 trials, one subprocess per scenario). `@codefast/di` 0.5.0-canary.6 · inversify 8.2.2 · awilix 13.0.5 · tsyringe 4.10.0. Re-run it yourself in a few minutes — see [Reproduce](#reproduce). This page is transcribed by hand from `bench-results/latest.md`; that file is the source of truth for exact current numbers.

## What this measures — and what it doesn't

This is a **first-party** benchmark: the same author maintains `@codefast/di` and this harness. Read it as "here is the workload we optimized for, and a re-runnable way to check the claim" — not a neutral third-party verdict. What keeps it honest:

- Each library runs in its **canonical mode**, never forced into another's: `@codefast/di` with TC39 Stage 3 decorators + `Symbol.metadata`, `inversify`/`tsyringe` with legacy decorators + `reflect-metadata`, `awilix` decorator-free. The realistic-graph and scale scenarios use factory bindings only, so the resolver engines compare apples-to-apples.
- The headline aggregate is the **median and geometric mean of ratios**, not a single row. A fail-fast error path (cycle detection) runs 100×+ faster and is reported in its own `failure` group so it never reads as a typical speedup.
- Scenarios where `@codefast/di` **loses are shown plainly**, not omitted — see [Where it loses](#where-it-loses).

## TL;DR

`@codefast/di` is faster on the large majority of scenarios you'd actually wire, across all three competitors — but it is not faster at everything.

| Comparison                                   | Win / parity / loss | Median ratio | Geomean |
| -------------------------------------------- | ------------------- | -----------: | ------: |
| di vs **inversify** (full 43-scenario suite) | 42 / 0 / 1          |        1.89× |   2.23× |
| di vs **inversify** (core subset)            | 8 / 0 / 0           |        1.76× |   1.82× |
| di vs **awilix** (core subset)               | 7 / 0 / 1           |        2.48× |   3.04× |
| di vs **tsyringe** (core subset)             | 7 / 0 / 1           |        4.22× |   3.58× |

Ratios are `@codefast/di / competitor` (>1 = di faster). Win band >1.03×, parity 0.97–1.03×, loss <0.97×.

## Where it loses

Two honest weak spots remain:

1. **Cold container build.** `realistic-graph-cold-resolve` (build a fresh container, bind 10 nodes, resolve once) beats inversify 1.85× but **loses to the leaner libraries: 0.61× vs awilix, 0.43× vs tsyringe.** di's per-container setup does genuinely more work (metadata, lifecycle, introspection) than a decorator-free/factory container's — a deliberate trade-off, not a bug.
2. **Short async chains.** `dynamic-async-chain-8` is **0.95× vs inversify** — nearly parity. It runs the async resolution lane, which still uses the older cycle-detection machinery.

> **Fixed since the last run:** shallow/mid transient-dynamic chains used to lose (a 32-deep chain was 0.55× vs inversify). Cycle detection was rebuilt on an O(1) dense typed-array in-flight marker (replacing an O(depth) path scan and a `Map` of generation marks), so `scale-mid-transient-chain-32` is now **1.82×** and `fan-out-tree-depth-3-breadth-4` went from parity to **1.66×**. The same change fixed a latent false-cycle on deep transient diamonds.

## Head-to-head: @codefast/di vs inversify (full suite)

The primary comparison — every scenario both libraries implement (43 comparable). Full table: [`bench-results/latest.md`](./bench-results/latest.md).

**42 wins / 0 parity / 1 loss — median 1.89×, geomean 2.23×.**

- Geomean by group: micro 1.69×, realistic 1.72×, fan-out 2.23×, async 1.34×, lifecycle 2.76×, scope 2.06×, scale 1.93×, boot 3.31×, production 2.33×, introspection 4.23×, **failure 7.99×** (error paths — fail-fast/cycle detection, not throughput).
- Loss: `dynamic-async-chain-8` (0.95×).
- The `failure` group is broken out precisely so its 7.99× — driven by `circular-dependency-3` at ~130× — does not inflate the throughput story.

## N-way core subset: di vs inversify vs awilix vs tsyringe

The factory/class-binding scenarios all four libraries support — the graphs you actually wire. `hz/op` is operations per second per logical operation; ratio columns are `@codefast/di` over each competitor.

| Scenario                       | Group     |    codefast |  inversify |     awilix |   tsyringe | cf/inv |    cf/awi |    cf/tsy |
| ------------------------------ | --------- | ----------: | ---------: | ---------: | ---------: | -----: | --------: | --------: |
| constant-resolve               | micro     | 122,647,484 | 72,247,594 | 30,897,668 | 15,051,422 |  1.70× |     3.97× |     8.15× |
| singleton-class-1-dep          | micro     |  78,877,913 | 48,512,836 | 33,213,081 | 13,777,197 |  1.63× |     2.37× |     5.73× |
| transient-class-1-dep          | micro     |  78,131,669 | 32,446,853 |  9,461,944 |  5,327,748 |  2.41× |     8.26× |    14.67× |
| realistic-graph-resolve-root   | realistic |   9,708,856 |  6,021,885 |  4,815,256 |  1,983,315 |  1.61× |     2.02× |     4.90× |
| realistic-graph-cold-resolve   | realistic |      46,527 |     25,216 |     75,808 |    109,060 |  1.85× | **0.61×** | **0.43×** |
| scale-mid-transient-chain-32   | scale     |     584,380 |    321,311 |    226,651 |    246,373 |  1.82× |     2.58× |     2.37× |
| scale-deep-transient-chain-512 | scale     |      48,879 |     23,806 |      2,547 |     13,807 |  2.05× |    19.19× |     3.54× |
| fan-out-tree-depth-3-breadth-4 | fan-out   |   1,083,680 |    651,362 |    699,368 |    479,121 |  1.66× |     1.55× |     2.26× |

Per competitor: **vs inversify** 8 win / 0 parity / 0 loss (median 1.76×) · **vs awilix** 7 win / 0 parity / 1 loss (median 2.48×) · **vs tsyringe** 7 win / 0 parity / 1 loss (median 4.22×). The only core-subset loss is `realistic-graph-cold-resolve` versus the two leaner containers.

## Reproduce

```bash
pnpm --filter @codefast/benchmark-di-inversify bench:isolate
```

For the publishable profile used on this page (GC exposed, 3 trials):

```bash
BENCH_FULL=1 BENCH_TRIALS=3 pnpm --filter @codefast/benchmark-di-inversify bench:isolate
```

Outputs land in `bench-results/<timestamp>/` and mirror to `bench-results/latest.md`. See [README](./README.md) for the full method, environment pinning, and scenario inventory.
