# Results — @codefast/di vs InversifyJS 8, Awilix 13, tsyringe 4

> Numbers below are a publishable run: `BENCH_FULL=1 BENCH_TRIALS=3 BENCH_ISOLATE=1` on Node 26.1.0, Apple M3 Max (GC exposed, 3 trials, one subprocess per scenario). `@codefast/di` 0.5.0-canary.6 · inversify 8.2.2 · awilix 13.0.5 · tsyringe 4.10.0. Re-run it yourself in a few minutes — see [Reproduce](#reproduce). This page is transcribed by hand from `bench-results/latest.md`; that file is the source of truth for exact current numbers.

## What this measures — and what it doesn't

This is a **first-party** benchmark: the same author maintains `@codefast/di` and this harness. Read it as "here is the workload we optimized for, and a re-runnable way to check the claim" — not a neutral third-party verdict. What keeps it honest:

- Each library runs in its **canonical mode**, never forced into another's: `@codefast/di` with TC39 Stage 3 decorators + `Symbol.metadata`, `inversify`/`tsyringe` with legacy decorators + `reflect-metadata`, `awilix` decorator-free. The realistic-graph and scale scenarios use factory bindings only, so the resolver engines compare apples-to-apples.
- The headline aggregate is the **median and geometric mean of ratios**, not a single row. A fail-fast error path (cycle detection) runs 100×+ faster and is reported in its own `failure` group so it never reads as a typical speedup.
- Scenarios where `@codefast/di` **loses or ties are shown plainly**, not omitted — see [Where it loses](#where-it-loses).

## TL;DR

`@codefast/di` is faster on the large majority of scenarios you'd actually wire, across all three competitors — but it is not faster at everything.

| Comparison                                   | Win / parity / loss | Median ratio | Geomean |
| -------------------------------------------- | ------------------- | -----------: | ------: |
| di vs **inversify** (full 43-scenario suite) | 40 / 1 / 2          |        2.04× |   2.35× |
| di vs **inversify** (core subset)            | 6 / 1 / 1           |        1.64× |   1.45× |
| di vs **awilix** (core subset)               | 5 / 1 / 2           |        2.37× |   2.54× |
| di vs **tsyringe** (core subset)             | 6 / 0 / 2           |        3.92× |   3.26× |

Ratios are `@codefast/di / competitor` (>1 = di faster). Win band >1.03×, parity 0.97–1.03×, loss <0.97×.

## Where it loses

Three honest weak spots, consistent across the run:

1. **Shallow-to-mid transient-dynamic chains.** `scale-mid-transient-chain-32` — a 32-deep transient chain, right at the resolver's deep-lane handoff — is di's clearest loss: **0.55× vs inversify, 0.78× vs awilix, 0.71× vs tsyringe.** The shared-context machinery that wins at depth 512 (`scale-deep-transient-chain-512`: 1.55× / 13.66× / 2.35×) hasn't amortized yet at depth ~32. This scenario exists specifically to keep that visible instead of hiding it behind the depth-512 row.
2. **Cold container build.** `realistic-graph-cold-resolve` (build a fresh container, bind 10 nodes, resolve once) beats inversify 2.04× but **loses to the leaner libraries: 0.87× vs awilix, 0.63× vs tsyringe.** di's per-container setup costs more than a decorator-free/factory container's.
3. **Short async chains.** `dynamic-async-chain-8` is **0.82× vs inversify** in the GC-exposed full run.

`fan-out-tree-depth-3-breadth-4` is statistical **parity** with both inversify (1.02×) and awilix (0.98×).

## Head-to-head: @codefast/di vs inversify (full suite)

The primary comparison — every scenario both libraries implement (43 comparable). Full table: [`bench-results/latest.md`](./bench-results/latest.md).

**40 wins / 1 parity / 2 losses — median 2.04×, geomean 2.35×.**

- Geomean by group: micro 1.81×, realistic 1.84×, fan-out 2.02×, async 1.25×, lifecycle 2.87×, scope 2.85×, **scale 0.92×**, boot 4.24×, production 4.36×, introspection 4.51×, **failure 9.63×** (error paths — fail-fast/cycle detection, not throughput).
- Losses: `scale-mid-transient-chain-32` (0.55×), `dynamic-async-chain-8` (0.82×). Parity: `fan-out-tree-depth-3-breadth-4` (1.02×).
- The `failure` group is broken out precisely so its 9.63× — driven by `circular-dependency-3` at 175× — does not inflate the throughput story.

## N-way core subset: di vs inversify vs awilix vs tsyringe

The factory/class-binding scenarios all four libraries support — the graphs you actually wire. `hz/op` is operations per second per logical operation; ratio columns are `@codefast/di` over each competitor.

| Scenario                       | Group     |    codefast |  inversify |     awilix |   tsyringe |    cf/inv |    cf/awi |    cf/tsy |
| ------------------------------ | --------- | ----------: | ---------: | ---------: | ---------: | --------: | --------: | --------: |
| constant-resolve               | micro     | 122,051,625 | 73,021,894 | 34,691,587 | 12,087,224 |     1.67× |     3.52× |    10.10× |
| singleton-class-1-dep          | micro     |  78,744,338 | 48,391,600 | 28,325,111 | 11,606,739 |     1.63× |     2.78× |     6.78× |
| transient-class-1-dep          | micro     |  77,684,690 | 32,310,980 |  7,709,603 |  4,669,617 |     2.40× |    10.08× |    16.64× |
| realistic-graph-resolve-root   | realistic |   9,247,091 |  5,562,404 |  4,733,789 |  1,683,973 |     1.66× |     1.95× |     5.49× |
| realistic-graph-cold-resolve   | realistic |      53,422 |     26,138 |     61,452 |     84,430 |     2.04× | **0.87×** | **0.63×** |
| scale-mid-transient-chain-32   | scale     |     172,482 |    313,013 |    222,280 |    242,379 | **0.55×** | **0.78×** | **0.71×** |
| scale-deep-transient-chain-512 | scale     |      31,100 |     20,086 |      2,278 |     13,248 |     1.55× |    13.66× |     2.35× |
| fan-out-tree-depth-3-breadth-4 | fan-out   |     714,395 |    697,609 |    727,325 |    373,498 |     1.02× |     0.98× |     1.91× |

Per competitor: **vs inversify** 6 win / 1 parity / 1 loss (median 1.64×) · **vs awilix** 5 win / 1 parity / 2 loss (median 2.37×) · **vs tsyringe** 6 win / 0 parity / 2 loss (median 3.92×).

## Reproduce

```bash
pnpm --filter @codefast/benchmark-di-inversify bench:isolate
```

For the publishable profile used on this page (GC exposed, 3 trials):

```bash
BENCH_FULL=1 BENCH_TRIALS=3 pnpm --filter @codefast/benchmark-di-inversify bench:isolate
```

Outputs land in `bench-results/<timestamp>/` and mirror to `bench-results/latest.md`. See [README](./README.md) for the full method, environment pinning, and scenario inventory.
