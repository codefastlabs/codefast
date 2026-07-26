# Results — @codefast/di vs InversifyJS 8, Awilix 13, tsyringe 4

> Two profiles are reported below, both `BENCH_ISOLATE=1` (one subprocess per scenario, order-independent) on Node 26.1.0 / V8 14.6, Apple M3 Max. `@codefast/di` 0.5.0-canary.7 · inversify 8.2.2 · awilix 13.0.5 · tsyringe 4.10.0. **This run was not taken on a fully idle machine** (load average ~3 on 14 cores): the ratios hold because every library ran under the same conditions back to back, but treat the absolute `hz/op` figures as a floor, and re-run before quoting them. See [Reproduce](#reproduce). This page is transcribed by hand from `bench-results/latest.md`; that file is the source of truth for the most recent run.
>
> **The tables below predate the branch's last eleven commits.** They were measured before container subsystems were deferred and the fluent chain was collapsed — changes that touch container construction and the bind path, which is exactly what `realistic-graph-cold-resolve` measures. An interleaved A/B against a clean control puts those commits at +1.5% on that row and 1.00× on hot resolve, so the figures here should still stand; nothing below has been re-measured against the current code, and the next clean run replaces the lot. Container construction itself did move a great deal (1.80× on `Container.create()`, 1.31× on a per-request child container), which means the rows that build a container per iteration — `child-request-lifecycle-create-resolve-dispose`, `scoped-binding-per-child`, `module-cold-from-modules` — are more likely understated here than overstated.
>
> **A later re-run was attempted and deliberately not transcribed.** It came out dirtier still — about half its rows above the ~5% IQR the report itself calls noisy, one at 26.3% — and on a dirty machine the cross-library ratios move even where `@codefast/di` provably has not. That run put `dynamic-async-chain-8` at 0.86× against inversify, a row [fixed below](#where-it-loses) to 1.26×; an A/B of that row against a stashed-and-rebuilt baseline, two passes in alternating order with an in-run control, put the change at 1.003× — di's own throughput was identical at ~1.066M hz/op both sides, and it was inversify's number that moved. Transcribing those figures would have published a regression that does not exist. Clean runs are achievable on this hardware (an earlier run the same day held `constant-resolve` to 2.9% / 4.6%), so the fix is to re-run when the machine is genuinely quiet, not to loosen the threshold.

## What this measures — and what it doesn't

This is a **first-party** benchmark: the same author maintains `@codefast/di` and this harness. Read it as "here is the workload we optimized for, and a re-runnable way to check the claim" — not a neutral third-party verdict. What keeps it honest:

- Each library runs in its **canonical mode**, never forced into another's: `@codefast/di` with TC39 Stage 3 decorators + `Symbol.metadata`, `inversify`/`tsyringe` with legacy decorators + `reflect-metadata`, `awilix` decorator-free. The realistic-graph and scale scenarios use factory bindings only, so the resolver engines compare apples-to-apples.
- The headline aggregate is the **median and geometric mean of ratios**, not a single row. A fail-fast error path (cycle detection) runs 100×+ faster and is reported in its own `failure` group so it never reads as a typical speedup.
- Scenarios where `@codefast/di` **loses are shown plainly**, not omitted — see [Where it loses](#where-it-loses).
- Every scenario runs **at least 3 trials** in every profile. Two cannot separate a real change from ambient noise.
- **Measure on an idle machine.** Running builds or tests alongside a bench run visibly corrupts it: a contaminated run of this same build once reported five losses that all disappeared on a clean re-run.

## TL;DR

| Comparison                                   | Win / parity / loss | Median ratio | Geomean |
| -------------------------------------------- | ------------------- | -----------: | ------: |
| Default profile, full 43-scenario suite      | **43 / 0 / 0**      |        1.86× |   2.38× |
| `BENCH_FULL` (GC exposed), same 43 scenarios | **43 / 0 / 0**      |        2.21× |   2.76× |

Core-subset comparisons against the other libraries:

| Comparison      | Default profile       | `BENCH_FULL`              |
| --------------- | --------------------- | ------------------------- |
| di vs inversify | 8 / 0 / 0 — med 1.71× | 8 / 0 / 0 — med 1.81×     |
| di vs awilix    | 8 / 0 / 0 — med 2.14× | 8 / 0 / 0 — med 2.81×     |
| di vs tsyringe  | 8 / 0 / 0 — med 2.46× | 7 / 0 / **1** — med 3.73× |

Ratios are `@codefast/di / competitor` (>1 = di faster). Win band >1.03×, parity 0.97–1.03×, loss <0.97×.

## Where it loses

**One row, one profile: cold container build against tsyringe under `BENCH_FULL`** — `realistic-graph-cold-resolve` is 0.82× there (1.07× in the default profile). It beats inversify 3.1× and awilix 1.06–1.90× on the same row.

The mechanism is now pinned, and it is **entirely garbage collection**. Timed with no collection in the loop, di and tsyringe are at mutator parity on this row — 4.57 µs against 4.58 µs per cold iteration, measured one library per subprocess so neither inherits the other's heap. di only loses once `BENCH_FULL`'s strided forced GC is present, and a forced full collection costs 1.24 ms with di's garbage in flight against 1.05 ms with tsyringe's. Nothing leaks on either side: retained bytes per iteration measure ~0.

The obvious fix was to stop building per-container subsystems eagerly, and it was **tried, shipped, and does not close this row**. A fresh `Container.create()` retained 4763 bytes against tsyringe's 905; deferring the eleven `Map`s a bind-and-resolve container never reads brought that to 2729 (**43% lighter**, and the same for `parent.createChild()`), cutting 13.7% of the whole row's allocation. Throughput moved by less than the suite's noise floor. That is a measurement, not an impression: an A/B against a stashed-and-rebuilt baseline carried `constant-resolve` as an in-run control — it resolves from a pre-built container, so per-container laziness cannot help it — and the control drifted 2.3% while the target moved 2.8%, with two passes in alternating order disagreeing on the sign. An earlier uncontrolled A/B of the same change had shown a tidy +4% on every row including the control, and was pure drift.

So the remaining gap is not per-container setup work. It is that di's cold iteration hands the collector more objects than a factory-only container does — the bindings, closures and compiled-plan state of ten nodes — and the eager subsystems were only 2 KB of it. Worth recording that the deferral was kept anyway, on the footprint result rather than a throughput claim.

Two losses documented in earlier revisions of this page are **fixed**, both by removing work rather than by branching around it:

- **Cold container build** used to be the suite's only loss (0.76× vs inversify, 0.43× vs awilix, 0.22× vs tsyringe). A fluent chain committed its binding to the registry once per refinement — `bind(T).toDynamic(f).singleton()` inserted, removed and re-inserted — so the chain now registers once and refines that same object in place. Cold build-and-resolve went 2.3× faster on the bind path alone.
- **`dynamic-async-chain-8` under `BENCH_FULL`** used to be 0.82× while winning the default profile, and the mechanism was recorded here as unidentified. It is identified now: a per-chain resolution context survives its chain's microtask hops, so under a strided forced GC it is promoted out of the nursery and collected the expensive way. Pooling the chain contexts (and threading each chain's context through the call rather than parking chain identity on the resolver) puts the row at **1.26× under `BENCH_FULL`** and 1.20× in the default profile. Measured in isolation against the previous build under the same forced-GC hook: 0.98× → 1.18× (n=3 each), with the no-GC profile unchanged.

One hypothesis was tested and **rejected** along the way: that di's larger live heap made each forced collection more expensive. Timing a forced full GC with each library's container warm gives 1.35 ms / 9.76 MB for di against 1.41 ms / 9.89 MB for inversify — indistinguishable. The cost was never the collection; it was what di had to re-establish afterwards.

## Head-to-head: @codefast/di vs inversify (full suite)

Every scenario both libraries implement (43 comparable). Full table: [`bench-results/latest.md`](./bench-results/latest.md).

- **Default profile: 43 wins / 0 parity / 0 losses** — median 1.86×, geomean 2.38×. Group geomeans: micro 1.66×, realistic 2.24×, fan-out 2.19×, async 1.22×, lifecycle 3.05×, scope 3.36×, scale 1.56×, boot 4.46×, production 4.61×, introspection 3.53×, **failure 7.57×**.
- **`BENCH_FULL` profile: 43 wins / 0 parity / 0 losses** — median 2.21×, geomean 2.76×. Group geomeans: micro 1.72×, realistic 2.19×, fan-out 2.41×, async 1.57×, lifecycle 3.72×, scope 4.35×, scale 1.86×, boot 6.48×, production 5.67×, introspection 4.27×, **failure 8.62×**.

The `failure` group is broken out precisely so its ~8.6× — driven by `circular-dependency-3` at ~150× — does not inflate the throughput story.

## N-way core subset: di vs inversify vs awilix vs tsyringe

The factory/class-binding scenarios all four libraries support — the graphs you actually wire. `hz/op` is operations per second per logical operation.

### Default profile

| Scenario                       | Group     |    codefast |  inversify |     awilix |   tsyringe | cf/inv | cf/awi | cf/tsy |
| ------------------------------ | --------- | ----------: | ---------: | ---------: | ---------: | -----: | -----: | -----: |
| constant-resolve               | micro     | 118,535,170 | 66,997,261 | 41,360,255 | 19,363,446 |  1.77× |  2.87× |  6.12× |
| singleton-class-1-dep          | micro     |  78,559,270 | 51,772,747 | 39,664,499 | 18,181,850 |  1.52× |  1.98× |  4.32× |
| transient-class-1-dep          | micro     |  79,206,920 | 28,965,087 |  9,516,449 |  6,600,794 |  2.73× |  8.32× | 12.00× |
| realistic-graph-resolve-root   | realistic |  10,655,094 |  6,418,784 |  7,237,961 |  3,944,253 |  1.66× |  1.47× |  2.70× |
| realistic-graph-cold-resolve   | realistic |     149,485 |     49,256 |     78,563 |    139,133 |  3.03× |  1.90× |  1.07× |
| scale-mid-transient-chain-32   | scale     |     722,155 |    452,543 |    313,794 |    385,224 |  1.60× |  2.30× |  1.87× |
| scale-deep-transient-chain-512 | scale     |      37,092 |     24,188 |      2,621 |     18,130 |  1.53× | 14.15× |  2.05× |
| fan-out-tree-depth-3-breadth-4 | fan-out   |   1,436,955 |    709,098 |    964,665 |    650,428 |  2.03× |  1.49× |  2.21× |

### `BENCH_FULL` profile

| Scenario                       | Group     |    codefast |  inversify |     awilix |   tsyringe | cf/inv | cf/awi |    cf/tsy |
| ------------------------------ | --------- | ----------: | ---------: | ---------: | ---------: | -----: | -----: | --------: |
| constant-resolve               | micro     | 123,626,530 | 73,704,912 | 38,806,871 | 15,415,954 |  1.68× |  3.19× |     8.02× |
| singleton-class-1-dep          | micro     |  79,462,809 | 49,356,297 | 32,774,231 | 14,001,982 |  1.61× |  2.42× |     5.68× |
| transient-class-1-dep          | micro     |  76,792,992 | 31,903,493 |  9,426,809 |  5,579,559 |  2.41× |  8.15× |    13.76× |
| realistic-graph-resolve-root   | realistic |   9,461,154 |  6,119,181 |  4,941,786 |  2,026,311 |  1.55× |  1.91× |     4.67× |
| realistic-graph-cold-resolve   | realistic |      82,673 |     26,574 |     77,933 |    100,413 |  3.11× |  1.06× | **0.82×** |
| scale-mid-transient-chain-32   | scale     |     738,126 |    308,446 |    216,946 |    269,792 |  2.39× |  3.40× |     2.74× |
| scale-deep-transient-chain-512 | scale     |      34,831 |     24,061 |      2,668 |     14,239 |  1.45× | 13.05× |     2.45× |
| fan-out-tree-depth-3-breadth-4 | fan-out   |   1,385,570 |    711,495 |    905,838 |    496,982 |  1.95× |  1.53× |     2.79× |

## Reproduce

```bash
pnpm --filter @codefast/benchmark-di-inversify bench:isolate
```

For the stricter profile (GC exposed, 3 trials):

```bash
BENCH_FULL=1 BENCH_TRIALS=3 pnpm --filter @codefast/benchmark-di-inversify bench:isolate
```

Outputs land in `bench-results/<timestamp>/` and mirror to `bench-results/latest.md`. See [README](./README.md) for the full method, environment pinning, and scenario inventory. For why the engine is shaped the way it is — and which shapes are load-bearing for these numbers — see [`packages/di/ARCHITECTURE.md`](../../packages/di/ARCHITECTURE.md).
