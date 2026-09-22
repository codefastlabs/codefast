# Results

Where `@codefast/di` actually stands against the field right now, wins and losses given equal weight — the point of this
page is to know where the engine is slower so the next change knows what to aim at. One machine-derived snapshot, no
accreted ledger. The method is in [`BENCH_GUIDE.md`](./BENCH_GUIDE.md); re-run it with the recipe at the bottom.

**This is one full-profile pass, so read the aggregates, not the rows.** GC-exposed for one collection between trials,
one subprocess per scenario, libraries interleaved with rotating order, 3 trials each over the one closure a scenario
builds before its first trial — a single pass measures no between-run variance of its own, 88 of the cells carry a
per-trial IQR above 5%, and 135 rows sit above ~30M ops/s where the ratio moves between runs of the same build whatever
its IQR says. Ratios are worth more than the absolute `hz/op`; a single row is worth less than the group it sits in. A
loss highlighted below points at a direction — quote a precise factor only after a paired re-run, except where a loss is
a structural difference that reproduces by construction (called out as such).

**This page is the baseline.** It transcribes `baselines/2026-09-21T09-29-37-156Z`, whose `observations.jsonl` is
committed, so every figure here can be re-read from the repository rather than from a local `bench-results/` run only
the author has. `baselines/` holds that one run and nothing else: the next pass is read against it, and a pass accepted
in its place becomes this page. 144 scenarios ran, 130 of them aggregate-eligible; every library implements every row
its declared features allow, so a `—` below is a feature the library lacks, never a row nobody wrote.

**Environment.** `@codefast/di` 0.10.1 from a `dist` the harness rebuilt first, on Node 26.1.0 / V8 14.6, Apple M3 Max ×
14, darwin/arm64, `--expose-gc` for every library. inversify 8.2.3 · awilix 13.0.5 · tsyringe 4.10.0 · brandi 5.1.0 ·
ditox 3.3.0 · injection-js 2.6.1. Each library runs at its canonical decorator mode (inversify legacy decorators +
`reflect-metadata`, codefast TC39 Stage 3 + `Symbol.metadata`); every inversify container uses `{ jitless: false }`, its
fastest documented configuration. Run 2026-09-21, 2m12s wall, 0 sanity failures; the 1-minute load average read 2.16 at
every child's start, on fourteen cores.

## Summary — where we stand

Ratios are `@codefast/di ÷ competitor`; above 1× means codefast is faster. Win `>1.03×`, parity `0.97–1.03×`, loss
`<0.97×`. `Comparable` counts the rows both libraries ran, of 130 aggregate-eligible rows codefast measures; `†` is how
many of those the median and geomean carry from above the throughput ceiling — they stay in the aggregate but no reader
should cite one alone.

| Competitor     | Comparable | Win / parity / loss | Median | Geomean |   † |
| -------------- | ---------: | ------------------: | -----: | ------: | --: |
| InversifyJS 8  |  91 of 130 |          89 / 1 / 1 |  3.98× |   5.60× |  43 |
| Awilix 13      |  38 of 130 |          38 / 0 / 0 |  6.28× |   6.07× |  16 |
| tsyringe 4     |  43 of 130 |          38 / 1 / 4 |  4.63× |   3.86× |  18 |
| Brandi 5       |  29 of 130 |          28 / 0 / 1 |  15.3× |   12.3× |  16 |
| Ditox 3        |  44 of 130 |         31 / 2 / 11 |  1.27× |   1.61× |  20 |
| injection-js 2 |  31 of 130 |         18 / 2 / 11 |  1.31× |   1.39× |  22 |

**The headline, stated plainly: codefast sweeps awilix outright, takes inversify and brandi on all but one row each,
wins tsyringe on the median by 4.63× while still losing it four rows, and holds both aggregates against the two
libraries it is closest to** — ditox 1.27× on the median and 1.61× on the geomean, injection-js 1.31× and 1.39×. The
losses cluster in four shapes, and every one of them is named in the next section: **registration** and everything that
binds before it resolves, **cold collections**, the **failure path**, and a handful of warm rows above the throughput
ceiling where ditox and injection-js read level or ahead.

## The losses, foregrounded — where to improve

Ordered by how much they matter, each marked as a **real deficit** (same work, codefast slower), a **work difference**
(codefast does more per op by design, so the row is a design cost to reconsider, not a bug) or a **chosen cost** (a
correctness property paid for with its price known).

- **Registration is the biggest deficit, and it is a ditox-only one.** `bind-128-plain` — 128 transient factory bindings
  into a fresh container, no resolve — runs at 0.39× ditox, 1.01× tsyringe and 1.75× injection-js. What it pays is the
  object: the chain object is the fluent builder the contract returns, and the probe is last-wins, so closing this row
  is a contract change (a lighter builder, or a bulk bind), not an optimisation. Everything that binds before it
  resolves sits on the same floor — `create-child-empty` 1.73× ditox and 1.13× tsyringe, `container-create-empty` 1.70×
  and 1.20×, `realistic-graph-class-cold-resolve` 0.68× ditox and 1.11× tsyringe,
  `boot-decorated-container-build-and-resolve` 0.87× tsyringe, `module-cold-from-modules` 1.21× ditox. The two
  empty-container rows lose injection-js above the ceiling (0.55×† and 0.68×†), whose injector is fewer objects still.
  **Real deficit, structural** — one object per binding is the design.
- **The cold collection loses tsyringe, and at N=10 ditox.** `resolve-all-cold-N` builds a fresh container and reads the
  collection once: at N=100, 0.38×‡ tsyringe while ditox 1.32× and injection-js 1.31× stay wins; at N=10, 0.46×
  tsyringe, 0.75× ditox and 0.95× injection-js. A chain's own `.many()` re-slots without a probe, which the
  hundred-member row shows against ditox and the ten-member row does not; what the pair still pays is the registration
  above, ten or a hundred times. **Real deficit against tsyringe and at N=10 against ditox — the registration cost seen
  from the collection side.**
- **Teardown at scale is a registration loss wearing a lifecycle label.** `materialize-100-singletons` (bind and resolve
  100 singletons, no teardown) is 0.47× ditox and 1.55× tsyringe; `unbind-all-100-singletons` (the same, then dispose)
  0.50×‡ and 1.42×‡. The two ratios against ditox are within a hair of each other, so the teardown walk costs nothing
  the rivals do not pay — the loss is the 100 bindings above it. `lifecycle-pre-destroy-unbind` (one singleton, one
  hook) is 1.04× ditox and 2.16× tsyringe. **Real deficit on the registration underneath, not on the hook.**
- **The stable-set collections are a chosen cost.** `resolve-all-strategies-10` 0.75×†‡ ditox and 0.88×† injection-js,
  `-100` 0.64×†‡ and 0.64×†: a root-level `resolveAll` hands each caller a copy of its memoized list rather than the
  list itself, so no caller can mutate the engine's memo. A frozen list was measured and rejected — a frozen array
  iterates through a slow elements kind for every consumer. **Chosen cost**, its own commit, reversible alone.
- **Rebind wins awilix and still loses ditox above the ceiling.** `rebind-hot-swap` 1.45× awilix and 0.21×† ditox;
  `rebind-parent-resolve-child-depth-3` 1.40× awilix and 1.68× ditox. A rebind of a lone token is one registration whose
  displaced binding is deactivated on the spot; what it pays against ditox's bare map write is the builder object and
  the deactivation walk. **Work difference**, above the ceiling.
- **Four rows lose injection-js above the ceiling.** `nested-context-resolve-in-factory` 0.81×† and
  `nested-container-resolve-in-factory` 0.84×† — a factory that resolves from its context or from the container
  mid-construction — `production-event-bus-dispatch` 0.82×† (and 0.69×† ditox), and `alias-parent-owned-terminal`
  0.84×†. injection-js's `get` inside a factory is the same call as at the root, which is why the shape costs it
  nothing. The same-container alias rows are level (`alias-chain-3` 1.02×† injection-js); what the parent-owned one pays
  is the chain-version sum a child reads before it trusts the memo. **Real deficit**, and the parent-owned alias is the
  row that names its own next step.
- **`accessor-injection-construct` 0.22×†‡ inversify.** The row measures the benchmark's transpiler as much as the
  engine: esbuild lowers the scenario's own `accessor` field to `WeakMap`-backed privates (`__privateAdd`,
  `__accessCheck`), a third of the row's self time. What the engine pays is the ambient scope around construction and
  the accessor's own `resolve` through the container, where inversify's property injection is a metadata read on the
  same plan. **Work difference**, and a harness change proposed (a `tsc` compile of the codefast scenarios), not made.
- **Failing fast costs more here: `misconfigured-missing-binding` 0.75×‡ tsyringe, 0.78×‡ brandi, 0.79×‡ ditox, 0.90×‡
  injection-js.** codefast builds a structured error carrying the resolution path; the rivals throw a string, and the
  stack capture both pay is most of the row. **Work difference** on a path a production request should never take.
- **Two warm reads sit on the parity line's wrong side by a hair** — `singleton-class-1-dep` 0.97×† and
  `to-resolved-3-deps` 0.97×† against ditox — both above the throughput ceiling, where the ratio moves between runs of
  the same build. **Open**: these and the four injection-js rows above are the ones to re-measure paired before the next
  change to the nested-factory or alias lanes.

## The wins

- **inversify — 89 of 91 comparable rows, 3.98× median, 5.60× geomean.** Widest margins on `boot` (20.4×), `production`
  (17.6×), `scope` (14.1×), `lifecycle` (11.6×), `introspection` (7.53×), `realistic` (5.95×), `fan-out` (5.61×),
  `slot-selection` (4.51×) and `micro` (4.24×); tightest on `scale` (2.65×), `failure` (1.53×), `async` (1.50×) and
  `resolution` (0.87×, which is the accessor row pulling against the plan rows). `resolve-all-async-8` is at parity
  (0.99×), and `circular-dependency-3` and `alias-cycle-detected` are excluded from the aggregates entirely — inversify
  recurses toward the stack limit rather than detecting either.
- **awilix — 38 of 38, 6.28× median, 6.07× geomean, no loss at all.** Widest on `boot` (17.2×), `scale` (10.2×), `scope`
  (7.46×), `realistic` (6.94×), `production` (6.91×) and `micro` (6.75×); tightest on `async` (1.30×) and
  `introspection` (1.60×).
- **tsyringe — 38 of 43, 4.63× median, 3.86× geomean.** 12.8× on `micro`, 6.84× on `scope`, 5.17× on `introspection` and
  4.89× on `resolution`; it keeps the four rows named above — the two cold collections, the decorated boot and the
  missing-binding throw — and `bind-128-plain` is a dead heat at 1.01×.
- **brandi — 28 of 29, 15.3× median, 12.3× geomean.** 22.8× on `micro`, 17.7× on `scope`, 16.6× on `resolution` and
  15.6× on `realistic`; it loses only the missing-binding throw (0.78×‡).
- **ditox — 31 rows to 11, and both aggregates (1.27× median, 1.61× geomean).** The sweep is in the warm work and the
  per-request work: `scope` 4.95×, `micro` 2.06×, `realistic` 2.03×, `introspection` 1.59×, `resolution` 1.52×, `scale`
  1.37×. Named rows: `rebind-parent-resolve-child-depth-3` 1.68×, `container-create-empty` 1.70×, `create-child-empty`
  1.73×, `resolve-all-cold-100` 1.32×, `module-cold-from-modules` 1.21×, `async-init-single-hop` 1.08×,
  `lifecycle-pre-destroy-unbind` 1.04×, `nested-container-resolve-in-factory` 1.01×†. What it still takes is every row
  that binds many things and the two stable sets — `lifecycle` is its one winning group (0.62×), which is the
  100-singleton pair.
- **injection-js — 18 rows to 11, 1.31× median, 1.39× geomean.** `realistic` 2.40×, `scope` 1.83×, `micro` 1.59×; level
  on `async` (1.08×) and `boot` (1.04×). Its wins are the four ceiling rows above plus `fan-out` (0.91×), `failure`
  (0.90×), `production` (0.82×) and `resolution` (0.82×) — every one of them a shape where a `ReflectiveInjector` that
  caches every provider per injector does less work than a container that does not.

## Geomean by group

Geomean of the ratios in each group, comparable row count in parentheses. Read a group, not a cell.

| Group          | InversifyJS 8 | Awilix 13 | tsyringe 4 |  Brandi 5 |   Ditox 3 | injection-js 2 |
| -------------- | ------------: | --------: | ---------: | --------: | --------: | -------------: |
| micro          |    4.24× (22) | 6.75× (8) |  12.8× (7) | 22.8× (8) | 2.06× (7) |      1.59× (9) |
| realistic      |     5.95× (5) | 6.94× (4) |  3.71× (4) | 15.6× (5) | 2.03× (5) |      2.40× (5) |
| fan-out        |     5.61× (9) | 2.00× (1) |  1.97× (5) | 9.08× (1) | 0.99× (5) |      0.91× (4) |
| async          |    1.50× (10) | 1.30× (1) |  1.47× (1) | 2.88× (1) | 1.08× (1) |      1.08× (1) |
| lifecycle      |     11.6× (8) | 4.70× (5) |  2.17× (4) |         — | 0.62× (5) |              — |
| scope          |    14.1× (12) | 7.46× (8) |  6.84× (8) | 17.7× (5) | 4.95× (8) |      1.83× (4) |
| scale          |     2.65× (2) | 10.2× (2) |  3.82× (2) | 8.65× (2) | 1.37× (2) |              — |
| boot           |     20.4× (7) | 17.2× (3) |  1.05× (4) | 5.47× (4) | 1.09× (4) |      1.04× (4) |
| failure        |     1.53× (2) | 2.32× (1) |  0.75× (1) | 0.78× (1) | 0.79× (1) |      0.90× (1) |
| production     |     17.6× (3) | 6.91× (2) |  3.51× (3) |         — | 0.98× (3) |      0.82× (1) |
| introspection  |     7.53× (2) | 1.60× (1) |  5.17× (2) |         — | 1.59× (1) |              — |
| slot-selection |     4.51× (6) |         — |          — |         — |         — |              — |
| resolution     |     0.87× (3) | 3.25× (2) |  4.89× (2) | 16.6× (2) | 1.52× (2) |      0.82× (2) |

## Full per-scenario table

Every row codefast measures. `hz/op` is codefast's throughput per logical operation; a competitor's own throughput is
that figure divided by its ratio. `†` a row above the ~30M ops/s ceiling (ratio moves between runs); `‡` a cell whose
per-trial IQR exceeds 5% within this run. Rows with no competitor ratio are codefast-only coverage: the `validate`,
introspection, warm-up and multi-tag rows no rival's API expresses, and the 43 engine rows — `mask-*`, the hoisted and
inline `slot-tag-*` matrix, `slot-injected-*`, `plan-*`, `plan-runs-*`, `interpreted-*`, `async-branch-*` — which are
instrumentation for this resolver. `circular-dependency-3`, `alias-cycle-detected` and `plan-escape-scoped-dep` are
excluded from the aggregates above because their two sides do incomparable work per op.

| Scenario                                       | Group          | batch | @codefast/di hz/op | vs InversifyJS 8 | vs Awilix 13 | vs tsyringe 4 | vs Brandi 5 | vs Ditox 3 | vs injection-js 2 |
| ---------------------------------------------- | -------------- | ----: | -----------------: | ---------------: | -----------: | ------------: | ----------: | ---------: | ----------------: |
| constant-resolve                               | micro          |  1000 |        215,111,615 |           2.79×† |       5.61×† |        11.3×† |      36.3×† |     1.11×† |            1.62×† |
| singleton-class-1-dep                          | micro          |   200 |        186,503,142 |           3.57×† |       4.43×† |        10.6×† |      31.9×† |     0.97×† |            3.35×† |
| transient-class-1-dep                          | micro          |   200 |         79,216,570 |           1.92×† |       8.88×† |        13.7×† |      34.4×† |     8.34×† |                 — |
| named-constant-get                             | micro          |   500 |         99,201,390 |           3.65×† |            — |             — |           — |          — |                 — |
| named-resolve-slots-1                          | micro          |   500 |        139,179,492 |           4.91×† |            — |             — |           — |          — |                 — |
| named-resolve-slots-4                          | micro          |   500 |        135,285,474 |           4.90×† |            — |             — |           — |          — |                 — |
| named-resolve-slots-16                         | micro          |   500 |        138,571,812 |           4.84×† |            — |             — |           — |          — |                 — |
| named-resolve-slots-64                         | micro          |   500 |        139,157,468 |           4.96×† |            — |             — |           — |          — |                 — |
| optional-missing-transient                     | micro          |   200 |         51,568,258 |           1.06×† |            — |             — |      12.0×† |     3.85×† |                 — |
| realistic-graph-resolve-root                   | realistic      |    20 |         20,414,496 |            2.86× |        2.97× |         5.93× |       16.5× |      1.71× |             0.99× |
| realistic-graph-cold-resolve                   | realistic      |     1 |           302,064‡ |           9.19×‡ |       4.58×‡ |        2.06×‡ |      4.78×‡ |     1.05×‡ |            2.34×‡ |
| realistic-graph-resolved-root                  | realistic      |    20 |         62,734,910 |           3.26×† |            — |             — |      50.2×† |     5.23×† |            3.96×† |
| realistic-graph-class-resolve-root             | realistic      |    20 |         59,932,656 |           3.07×† |       10.1×† |        14.0×† |      47.1×† |     5.39×† |            4.19×† |
| realistic-graph-class-cold-resolve             | realistic      |     1 |           482,003‡ |           28.4×‡ |       16.9×‡ |        1.11×‡ |      4.99×‡ |     0.68×‡ |            2.06×‡ |
| realistic-graph-validate                       | realistic      |    10 |         20,081,506 |                — |            — |             — |           — |          — |                 — |
| fan-out-tree-depth-3-breadth-4                 | fan-out        |    20 |          1,804,553 |            1.66× |        2.00× |         2.97× |       9.08× |      2.03× |                 — |
| resolve-all-strategies-10                      | fan-out        |     1 |         27,667,903 |            7.17× |            — |         3.11× |           — |    0.75×†‡ |            0.88×† |
| resolve-all-strategies-100                     | fan-out        |     1 |         23,550,472 |            52.3× |            — |         17.9× |           — |    0.64×†‡ |            0.64×† |
| resolve-all-cold-10                            | fan-out        |     1 |          1,581,181 |           20.7×‡ |            — |         0.46× |           — |      0.75× |             0.95× |
| resolve-all-cold-100                           | fan-out        |     1 |            197,450 |           20.9×‡ |            — |        0.38×‡ |           — |      1.32× |             1.31× |
| resolve-all-named-8                            | fan-out        |     1 |         23,738,571 |            2.19× |            — |             — |           — |          — |                 — |
| resolve-all-named-16                           | fan-out        |     1 |         23,351,784 |            2.08× |            — |             — |           — |          — |                 — |
| resolve-all-named-32                           | fan-out        |     1 |         23,493,224 |            2.11× |            — |             — |           — |          — |                 — |
| resolve-all-named-64                           | fan-out        |     1 |         23,287,252 |            2.11× |            — |             — |           — |          — |                 — |
| resolve-async-single-hop                       | async          |     1 |          9,854,393 |            1.41× |            — |             — |           — |          — |                 — |
| async-init-single-hop                          | async          |     1 |          7,275,635 |            1.79× |        1.30× |         1.47× |       2.88× |      1.08× |             1.08× |
| dynamic-async-chain-8                          | async          |     1 |          2,093,199 |            1.47× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-8                      | async          |     1 |          1,201,163 |            1.61× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-16                     | async          |     1 |            654,283 |            1.59× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-32                     | async          |     1 |            336,240 |            1.84× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-64                     | async          |     1 |            150,148 |            1.80× |            — |             — |           — |          — |                 — |
| async-branch-chain-8                           | async          |     1 |          1,325,260 |                — |            — |             — |           — |          — |                 — |
| async-branch-escape-mid-chain-8                | async          |     1 |          1,744,562 |                — |            — |             — |           — |          — |                 — |
| async-diamond-shared-leaf                      | async          |     1 |          1,871,429 |            1.25× |            — |             — |           — |          — |                 — |
| plan-async-resolved-chain-8                    | async          |     1 |          2,553,708 |                — |            — |             — |           — |          — |                 — |
| plan-async-class-chain-8                       | async          |     1 |          5,429,584 |                — |            — |             — |           — |          — |                 — |
| resolve-all-async-8                            | async          |     1 |            974,350 |            0.99× |            — |             — |           — |          — |                 — |
| resolve-optional-async-miss                    | async          |     1 |          9,443,106 |            1.50× |            — |             — |           — |          — |                 — |
| lifecycle-post-construct-singleton             | lifecycle      |   250 |        182,642,882 |           3.13×† |            — |             — |           — |          — |                 — |
| lifecycle-pre-destroy-unbind                   | lifecycle      |     1 |          3,173,461 |            21.4× |       7.66×‡ |         2.16× |           — |      1.04× |                 — |
| binding-level-activation-hook                  | lifecycle      |   200 |         61,984,271 |           2.27×† |            — |             — |           — |          — |                 — |
| child-depth-1-resolve                          | scope          |   500 |        115,542,353 |           1.68×† |       4.55×† |        7.60×† |      21.3×† |     5.33×† |            1.31×† |
| child-depth-2-resolve                          | scope          |   500 |        114,737,172 |           1.56×† |       5.91×† |        8.96×† |      21.7×† |     9.24×† |            1.68×† |
| child-depth-4-resolve                          | scope          |   500 |        114,551,559 |           1.65×† |       8.67×† |        11.5×† |      24.4×† |     18.2×† |            1.74×† |
| child-depth-8-resolve                          | scope          |   500 |        114,703,396 |           1.63×† |       15.2×† |        17.7×† |      29.4×† |     34.3×† |            2.92×† |
| child-request-lifecycle-create-resolve-dispose | scope          |   100 |          2,633,479 |           52.0×‡ |       12.4×‡ |        5.08×‡ |           — |      1.50× |                 — |
| fresh-child-default-n1                         | scope          |   100 |         10,883,484 |           42.3×‡ |       8.26×‡ |         7.17× |           — |      2.04× |                 — |
| fresh-child-default-n4                         | scope          |   100 |          7,623,768 |           32.7×‡ |       6.82×‡ |        7.16×‡ |           — |      2.59× |                 — |
| fresh-child-name-n1                            | scope          |   100 |         10,834,861 |           46.7×‡ |            — |             — |           — |          — |                 — |
| fresh-child-name-n4                            | scope          |   100 |         7,588,138‡ |           30.2×‡ |            — |             — |           — |          — |                 — |
| fresh-child-tag-n1                             | scope          |   100 |         10,956,541 |           50.0×‡ |            — |             — |           — |          — |                 — |
| fresh-child-tag-n4                             | scope          |   100 |         7,497,063‡ |           32.0×‡ |            — |             — |           — |          — |                 — |
| scale-mid-transient-chain-32                   | scale          |     1 |          1,528,158 |            2.62× |        4.96× |         4.38× |       10.7× |      1.54× |                 — |
| scale-deep-transient-chain-512                 | scale          |     1 |             55,468 |            2.69× |        20.9× |         3.32× |       6.97× |      1.22× |                 — |
| boot-decorated-container-build-and-resolve     | boot           |     1 |            661,048 |           15.8×‡ |            — |         0.87× |           — |          — |             1.80× |
| container-create-empty                         | boot           |   100 |         29,784,229 |            47.0× |       12.4×‡ |         1.20× |       8.82× |      1.70× |            0.68×† |
| create-child-empty                             | boot           |   100 |         25,658,117 |           55.8×‡ |       11.9×‡ |         1.13× |       7.49× |      1.73× |            0.55×† |
| bind-128-plain                                 | boot           |     1 |            182,331 |           28.1×‡ |       34.9×‡ |         1.01× |       8.67× |      0.39× |             1.75× |
| bind-128-refined                               | boot           |     1 |             27,978 |           3.64×‡ |            — |             — |           — |          — |                 — |
| misconfigured-missing-binding                  | failure        |     1 |           278,184‡ |           1.53×‡ |       2.32×‡ |        0.75×‡ |      0.78×‡ |     0.79×‡ |            0.90×‡ |
| circular-dependency-3                          | failure        |     1 |           162,550‡ |          211.7×‡ |       1.47×‡ |             — |           — |          — |            0.49×‡ |
| ambiguous-multi-binding                        | failure        |     1 |           223,375‡ |           1.53×‡ |            — |             — |           — |          — |                 — |
| production-http-handler                        | production     |    50 |          1,795,247 |           26.5×‡ |       7.63×‡ |        3.34×‡ |           — |      1.18× |                 — |
| production-unit-of-work                        | production     |   100 |         1,004,988‡ |           17.1×‡ |       6.25×‡ |        2.32×‡ |           — |     1.16×‡ |                 — |
| production-event-bus-dispatch                  | production     |   100 |         48,187,768 |           12.1×† |            — |        5.60×† |           — |     0.69×† |            0.82×† |
| to-resolved-3-deps                             | micro          |   200 |        186,358,053 |           3.42×† |            — |             — |      32.5×† |     0.97×† |            1.67×† |
| to-alias-redirect                              | micro          |   500 |        110,123,054 |           2.11×† |       6.31×† |        12.0×† |           — |          — |            0.93×† |
| to-self-binding                                | micro          |   300 |        175,492,877 |           2.93×† |            — |        8.18×† |           — |          — |            2.96×† |
| alias-chain-3                                  | micro          |   500 |        110,268,865 |           4.19×† |       14.2×† |        25.5×† |           — |          — |            1.02×† |
| alias-parent-owned-terminal                    | micro          |   500 |        108,240,989 |           1.97×† |       7.29×† |        13.6×† |           — |          — |            0.82×† |
| alias-cycle-detected                           | failure        |     1 |           250,333‡ |          701.9×‡ |       2.72×‡ |             — |           — |          — |            0.84×‡ |
| resolve-optional-hit                           | micro          |   500 |        214,338,152 |           6.53×† |       6.07×† |             — |      36.3×† |     1.04×† |            1.63×† |
| resolve-optional-miss                          | micro          |   500 |        262,992,304 |           7.86×† |       4.91×† |             — |      4.35×† |     4.43×† |            1.92×† |
| tagged-binding-resolve                         | micro          |   300 |        146,281,388 |           6.90×† |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-1                         | micro          |   300 |        221,051,935 |           10.4×† |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-4                         | micro          |   300 |        218,916,572 |           10.3×† |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-16                        | micro          |   300 |        218,399,104 |           11.3×† |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-64                        | micro          |   300 |        220,673,434 |           10.1×† |            — |             — |           — |          — |                 — |
| conditional-injection-tagged                   | micro          |   300 |         73,966,836 |           1.94×† |            — |             — |      30.2×† |          — |                 — |
| rebind-hot-swap                                | lifecycle      |    50 |         19,356,633 |           43.1×‡ |        1.45× |             — |           — |     0.21×† |                 — |
| has-bound-check                                | introspection  |  1000 |        368,990,141 |           6.65×† |       1.60×† |        3.40×† |           — |     1.59×† |                 — |
| has-own-unbound-check                          | introspection  |  1000 |        855,555,539 |           8.53×† |            — |        7.87×† |           — |          — |                 — |
| container-level-activation-hook                | lifecycle      |   200 |         54,492,896 |           1.95×† |            — |        4.67×† |           — |          — |                 — |
| scoped-binding-per-child                       | scope          |   100 |         6,275,708‡ |           52.3×‡ |       3.87×‡ |        1.32×‡ |      5.26×‡ |     1.47×‡ |                 — |
| rebind-parent-resolve-child-depth-3            | lifecycle      |    50 |         12,328,918 |           75.1×‡ |        1.40× |             — |           — |      1.68× |                 — |
| materialize-100-singletons                     | lifecycle      |     1 |             66,960 |            18.2× |       12.9×‡ |         1.55× |           — |      0.47× |                 — |
| unbind-all-100-singletons                      | lifecycle      |     1 |            55,914‡ |           18.8×‡ |       11.4×‡ |        1.42×‡ |           — |     0.50×‡ |                 — |
| module-load-unload                             | boot           |     1 |         1,117,101‡ |           16.3×‡ |            — |             — |           — |          — |                 — |
| module-cold-from-modules                       | boot           |     1 |          1,962,278 |           21.6×‡ |            — |             — |       1.57× |      1.21× |                 — |
| initialize-async-warmup                        | boot           |     1 |            579,890 |                — |            — |             — |           — |          — |                 — |
| inspect-snapshot                               | introspection  |    20 |          9,522,459 |                — |            — |             — |           — |          — |                 — |
| lookup-bindings                                | introspection  |   200 |         23,797,619 |                — |            — |             — |           — |          — |                 — |
| generate-dependency-graph                      | introspection  |    10 |            758,471 |                — |            — |             — |           — |          — |                 — |
| multi-tag-slot-resolve                         | micro          |   300 |         14,110,727 |                — |            — |             — |           — |          — |                 — |
| multi-tag-constraint-resolve                   | micro          |   200 |          7,146,593 |                — |            — |             — |           — |          — |                 — |
| multi-tag-select-32                            | micro          |   300 |          2,842,791 |                — |            — |             — |           — |          — |                 — |
| mask-reject-wide-catalog                       | slot-selection |   300 |         35,493,390 |                — |            — |             — |           — |          — |                 — |
| mask-accept-two-of-four                        | slot-selection |   300 |         19,799,352 |                — |            — |             — |           — |          — |                 — |
| mask-collision-same-bit                        | slot-selection |   300 |         52,217,244 |                — |            — |             — |           — |          — |                 — |
| slot-tag-array-hoisted                         | slot-selection |   300 |        146,504,462 |                — |            — |             — |           — |          — |                 — |
| slot-tag-shorthand-hoisted                     | slot-selection |   300 |        159,413,382 |                — |            — |             — |           — |          — |                 — |
| slot-tag-array-inline                          | slot-selection |   300 |         94,453,893 |                — |            — |             — |           — |          — |                 — |
| slot-tag-shorthand-inline                      | slot-selection |   300 |        114,272,605 |                — |            — |             — |           — |          — |                 — |
| slot-tag-zero-value                            | slot-selection |   300 |        145,582,234 |           6.72×† |            — |             — |           — |          — |                 — |
| slot-name-and-tag                              | slot-selection |   300 |         50,319,439 |           2.54×† |            — |             — |           — |          — |                 — |
| slot-tag-resolve-all                           | slot-selection |   300 |         49,106,944 |           3.98×† |            — |             — |           — |          — |                 — |
| slot-tag-miss-optional                         | slot-selection |   300 |         89,909,259 |           3.88×† |            — |             — |           — |          — |                 — |
| slot-tag-parent-owned                          | slot-selection |   300 |        138,949,575 |           6.61×† |            — |             — |           — |          — |                 — |
| slot-name-parent-owned                         | slot-selection |   300 |        113,840,693 |           4.84×† |            — |             — |           — |          — |                 — |
| slot-injected-name-compiled                    | slot-selection |   300 |         69,667,059 |                — |            — |             — |           — |          — |                 — |
| slot-injected-name-interpreted                 | slot-selection |   300 |          4,177,648 |                — |            — |             — |           — |          — |                 — |
| slot-injected-tag-compiled                     | slot-selection |   300 |         70,169,048 |                — |            — |             — |           — |          — |                 — |
| slot-injected-tag-interpreted                  | slot-selection |   300 |          4,185,773 |                — |            — |             — |           — |          — |                 — |
| plan-deps-inlined                              | resolution     |   300 |         61,205,910 |                — |            — |             — |           — |          — |                 — |
| plan-escape-factory-dep                        | resolution     |   300 |          7,286,090 |                — |            — |             — |           — |          — |                 — |
| plan-escape-scoped-dep                         | resolution     |   300 |         12,107,676 |                — |            — |             — |           — |          — |                 — |
| plan-escape-hooked-dep                         | resolution     |   300 |          2,750,316 |                — |            — |             — |           — |          — |                 — |
| plan-escape-optional-dep                       | resolution     |   300 |          3,887,609 |                — |            — |             — |           — |          — |                 — |
| plan-escape-multi-dep                          | resolution     |   300 |          2,341,844 |                — |            — |             — |           — |          — |                 — |
| plan-class-chain-24                            | resolution     |     1 |          7,324,410 |                — |            — |             — |           — |          — |                 — |
| plan-class-chain-40                            | resolution     |     1 |         4,305,729‡ |                — |            — |             — |           — |          — |                 — |
| interpreted-class-chain-24                     | resolution     |     1 |            363,755 |                — |            — |             — |           — |          — |                 — |
| interpreted-class-chain-40                     | resolution     |     1 |            196,226 |                — |            — |             — |           — |          — |                 — |
| plan-runs-1                                    | resolution     |     1 |           736,272‡ |                — |            — |             — |           — |          — |                 — |
| plan-runs-256                                  | resolution     |     1 |             15,024 |                — |            — |             — |           — |          — |                 — |
| plan-runs-512                                  | resolution     |     1 |              7,757 |                — |            — |             — |           — |          — |                 — |
| plan-runs-1024                                 | resolution     |     1 |              4,047 |                — |            — |             — |           — |          — |                 — |
| plan-runs-2048                                 | resolution     |     1 |              1,955 |                — |            — |             — |           — |          — |                 — |
| plan-runs-4096                                 | resolution     |     1 |              1,151 |                — |            — |             — |           — |          — |                 — |
| plan-runs-8192                                 | resolution     |     1 |                640 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-1                               | resolution     |     1 |           208,036‡ |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-256                             | resolution     |     1 |              4,734 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-512                             | resolution     |     1 |              2,370 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-1024                            | resolution     |     1 |              1,257 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-2048                            | resolution     |     1 |                654 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-8192                            | resolution     |     1 |                208 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-1                              | resolution     |     1 |            716,243 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-512                            | resolution     |     1 |              7,862 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-1024                           | resolution     |     1 |              3,806 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-2048                           | resolution     |     1 |              1,993 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-8192                           | resolution     |     1 |                631 |                — |            — |             — |           — |          — |                 — |
| nested-context-resolve-in-factory              | resolution     |   300 |         44,102,350 |           1.78×† |       3.75×† |        5.17×† |      18.0×† |     2.27×† |            0.81×† |
| nested-container-resolve-in-factory            | resolution     |   300 |         39,596,624 |           1.68×† |       2.82×† |        4.63×† |      15.3×† |     1.01×† |            0.84×† |
| accessor-injection-construct                   | resolution     |   300 |         7,909,001‡ |          0.22×†‡ |            — |             — |           — |          — |                 — |

† 135 row(s) above ~30M ops/s: this ratio moves between runs of the same build, whatever its IQR says. Cite the
aggregates, not the row.

‡ 88 cell(s) whose per-trial IQR exceeds 5%: the median is unstable within this run. Re-run on a quieter machine before
reading the cell closely.

## Re-running this

```bash
pnpm bench:baseline                                             # from benchmarks/di — the full-profile pass above, read against the baseline
pnpm bench:report                                               # derive report.md + report.json from the newest run
BENCH_MODE=full pnpm bench                                      # the same pass, read against whatever run landed before
```

`bench:baseline` is `bench` in the full profile with `BENCH_BASELINE=baselines`, which reads the newest run under
`baselines/`. That directory holds exactly one run — the pass this page transcribes — so the lane names its baseline
structurally instead of by an id hand-edited into the script, and a run the repository no longer transcribes is deleted
rather than left to be picked up by a later read. Accepting a pass means committing its `observations.jsonl` there in
place of the one before it and rewriting this page from it: the page and the baseline move together, which is what keeps
either from going stale. It runs 3 trials per library in its own subprocess, every trial over the one closure the
scenario built before the first — one invocation is one pass, not three — and the whole suite takes a little over two
minutes on this machine.

The run writes a timestamped directory under `bench-results/` (gitignored) holding `observations.jsonl` with every
per-trial `mean ms`, `p99 ms` and IQR; `bench:report` turns the newest run into the `report.md` this page is transcribed
from, whose Environment section prints the load average each child started under. Before quoting any single loss as a
factor rather than a direction, re-measure it paired and alternating on a quiet machine — a full pass carries no
between-run variance of its own, and two passes over a byte-identical build move rows by several percent in either
direction. The A/B protocol is in [`BENCH_GUIDE.md`](./BENCH_GUIDE.md): swap the change's `src` files per side,
`BENCH_LIBRARY=@codefast/di` and `BENCH_ONLY` the target rows plus warm canaries, a `BENCH_MODE=fast` gate first and one
full pass per side only when it wins, and read the per-trial spread, not one ratio; the cheaper gate that comes first is
a standalone probe of the scenario's own function for time, bytes and objects per op. `BENCH_TIER=contract` runs the
comparison without the engine rows; `pnpm bench:list` prints which rows each library implements and confirms there is no
row a library's features allow that nobody wrote.
