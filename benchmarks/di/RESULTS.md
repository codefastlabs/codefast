# Results

Where `@codefast/di` actually stands against the field right now, wins and losses given equal weight — the point of this
page is to know where the engine is slower so the next change knows what to aim at. One machine-derived snapshot, no
accreted ledger. The method is in [`BENCH_GUIDE.md`](./BENCH_GUIDE.md); re-run it with the recipe at the bottom.

**This is one full-profile pass, so read the aggregates, not the rows.** GC-exposed for one collection between trials,
one subprocess per scenario, libraries interleaved with rotating order, 3 trials each over the one closure a scenario
builds before its first trial — a single pass measures no between-run variance of its own, 98 of the cells carry a
per-trial IQR above 5%, and 137 rows sit above ~30M ops/s where the ratio moves between runs of the same build whatever
its IQR says. Ratios are worth more than the absolute `hz/op`; a single row is worth less than the group it sits in. A
loss highlighted below points at a direction — quote a precise factor only after a paired re-run, except where a loss is
a structural difference that reproduces by construction (called out as such).

**This page is the baseline.** It transcribes `baselines/2026-09-26T17-35-37-119Z`, whose `observations.jsonl` is
committed, so every figure here can be re-read from the repository rather than from a local `bench-results/` run only
the author has. `baselines/` holds that one run and nothing else: the next pass is read against it, and a pass accepted
in its place becomes this page. 145 scenarios ran, 131 of them aggregate-eligible; every library implements every row
its declared features allow, so a `—` below is a feature the library lacks, never a row nobody wrote.

**Environment.** `@codefast/di` 0.11.0 from a `dist` the harness rebuilt first, on Node 26.1.0 / V8 14.6, Apple M3 Max ×
14, darwin/arm64, `--expose-gc` for every library. inversify 8.2.3 · awilix 13.0.5 · tsyringe 4.10.0 · brandi 5.1.0 ·
ditox 3.3.0 · injection-js 2.6.1. Each library runs at its canonical decorator mode (inversify legacy decorators +
`reflect-metadata`, codefast TC39 Stage 3 + `Symbol.metadata`); every inversify container uses `{ jitless: false }`, its
fastest documented configuration. Run 2026-09-26, 2m13s wall, 0 sanity failures; the 1-minute load average read 3.43 at
every child's start, on fourteen cores, raised by macOS system daemons. The rivals' own throughput sits within 2% of the
previous pass (brandi 16% above it), so the ratios compare.

## Summary — where we stand

Ratios are `@codefast/di ÷ competitor`; above 1× means codefast is faster. Win `>1.03×`, parity `0.97–1.03×`, loss
`<0.97×`. `Comparable` counts the rows both libraries ran, of 131 aggregate-eligible rows codefast measures; `†` is how
many of those the median and geomean carry from above the throughput ceiling — they stay in the aggregate but no reader
should cite one alone.

| Competitor     | Comparable | Win / parity / loss | Median | Geomean |   † |
| -------------- | ---------: | ------------------: | -----: | ------: | --: |
| InversifyJS 8  |  92 of 131 |          90 / 1 / 1 |  3.65× |   5.34× |  44 |
| Awilix 13      |  38 of 131 |          38 / 0 / 0 |  6.11× |   5.86× |  16 |
| tsyringe 4     |  43 of 131 |          38 / 1 / 4 |  4.57× |   3.77× |  19 |
| Brandi 5       |  30 of 131 |          29 / 0 / 1 |  12.3× |   10.2× |  16 |
| Ditox 3        |  45 of 131 |         31 / 2 / 12 |  1.24× |   1.61× |  20 |
| injection-js 2 |  31 of 131 |         20 / 1 / 10 |  1.29× |   1.40× |  22 |

**The headline, stated plainly: codefast sweeps awilix outright, takes inversify and brandi on all but one row each,
wins tsyringe on the median by 4.57× while still losing it four rows, and holds both aggregates against the two
libraries it is closest to** — ditox 1.24× on the median and 1.61× on the geomean, injection-js 1.29× and 1.40×. The
losses cluster in four shapes, and every one of them is named in the next section: **registration** and everything that
binds before it resolves, **cold collections**, the **failure path**, and a handful of warm rows above the throughput
ceiling where ditox and injection-js read level or ahead.

## The losses, foregrounded — where to improve

Ordered by how much they matter, each marked as a **real deficit** (same work, codefast slower), a **work difference**
(codefast does more per op by design, so the row is a design cost to reconsider, not a bug) or a **chosen cost** (a
correctness property paid for with its price known).

- **Registration is the biggest deficit, and it is a ditox-only one.** `bind-128-plain` — 128 transient factory bindings
  into a fresh container, no resolve — runs at 0.38× ditox, 0.96× tsyringe and 1.70× injection-js. What it pays is the
  object: the chain object is the fluent builder the contract returns, and the probe is last-wins, so closing this row
  is a contract change (a lighter builder, or a bulk bind), not an optimisation. Everything that binds before it
  resolves sits on the same floor — `create-child-empty` 1.76× ditox and 1.15× tsyringe, `container-create-empty` 1.73×
  and 1.18×, `realistic-graph-class-cold-resolve` 0.76×‡ ditox and 1.25×‡ tsyringe,
  `boot-decorated-container-build-and-resolve` 1.01× tsyringe, `module-cold-from-modules` 1.24× ditox. The two
  empty-container rows lose injection-js above the ceiling (0.67×† and 0.56×†), whose injector is fewer objects still.
  **Real deficit, structural** — one object per binding is the design.
- **The cold collection loses tsyringe, and at N=10 ditox.** `resolve-all-cold-N` builds a fresh container and reads the
  collection once: at N=100, 0.35×‡ tsyringe while ditox 1.23× and injection-js 1.13× stay wins; at N=10, 0.43×
  tsyringe, 0.71× ditox and 0.90× injection-js. A chain's own `.many()` re-slots without a probe, which the
  hundred-member row shows against ditox and the ten-member row does not; what the pair still pays is the registration
  above, ten or a hundred times. **Real deficit against tsyringe and at N=10 against ditox — the registration cost seen
  from the collection side.**
- **Teardown at scale is a registration loss and a cold-class loss wearing a lifecycle label.**
  `materialize-100-singletons` (bind and resolve 100 singletons, no teardown) is 0.57× ditox and 1.92× tsyringe;
  `unbind-all-100-singletons` (the same, then dispose) 0.53× and 1.54×‡. The two ratios against ditox are within a hair
  of each other, so the teardown walk costs nothing the rivals do not pay. What sits above it is two costs: the 100
  bindings, and the first resolve of each, because codefast's side binds a class with `.to(Class).singleton()` where
  ditox binds a factory. The cold class lane now looks the class up once per resolve rather than once per fact, which is
  most of what moved these rows since the previous pass; what is left is constructing a class with metadata instead of
  calling a factory. `lifecycle-pre-destroy-unbind` (one singleton, one hook) is 1.08× ditox and 2.17× tsyringe. **Real
  deficit on the registration and the cold class lane underneath, not on the hook.**
- **The stable-set collections are a chosen cost.** `resolve-all-strategies-10` 0.80×†‡ ditox and 1.23×†‡ injection-js,
  `-100` 0.60×†‡ and 0.67×†‡, and `production-event-bus-dispatch` 0.72×†‡ ditox and 0.92×† injection-js: a root-level
  `resolveAll` hands each caller a copy of its memoized list rather than the list itself, so no caller can mutate the
  engine's memo, while both rivals hand out the cached array they share. The event bus is that copy plus the dispatch;
  the one map read it used to pay beyond the copy is absorbed by a one-entry cell in front of the collection memo. A
  frozen list was measured and rejected — a frozen array iterates through a slow elements kind for every consumer.
  **Chosen cost**, its own commit, reversible alone.
- **Rebind wins awilix and still loses ditox above the ceiling.** `rebind-hot-swap` 1.27× awilix and 0.19×† ditox;
  `rebind-parent-resolve-child-depth-3` 1.40× awilix and 1.49× ditox. A rebind of a lone token is one registration whose
  displaced binding is deactivated on the spot; what it pays against ditox's bare map write is the builder object and
  the deactivation walk. **Work difference**, above the ceiling.
- **Three rows lose injection-js above the ceiling.** `nested-context-resolve-in-factory` 0.78×† and
  `nested-container-resolve-in-factory` 0.84×† — a factory that resolves from its context or from the container
  mid-construction — and `alias-parent-owned-terminal` 0.77×†. Measured on their own, outside the harness, codefast is
  ahead of injection-js on both nested-factory shapes. The loss appears in the harness child, which builds every
  scenario before it measures one, so the factory call site that the transient dynamic lane inlines has already seen
  hundreds of factories and V8 stops inlining through it; injection-js's lane inlines nothing to begin with, so the same
  state costs it nothing. The harness keeps that state on purpose, as [`BENCH_GUIDE.md`](./BENCH_GUIDE.md) records. The
  parent-owned alias is structural: injection-js caches the alias's answer in the child's own slot on the first read,
  while codefast never caches a parent's instance in a child, so every read is a child resolve that finds the alias in
  the child and the instance on the parent. `to-alias-redirect` reads 0.89×† beside them and `alias-chain-3` 0.99×†,
  both same-container aliases above the ceiling. **Harness state** for the two nested rows, **work difference** for the
  parent-owned alias.
- **`accessor-injection-construct` 0.25×†‡ inversify.** The row measures the benchmark's transpiler as much as the
  engine: tsx's esbuild lowers the scenario's decorated `accessor` field to `WeakMap`-backed privates (`__privateAdd`,
  `__accessCheck`) and its own decorator runtime. A standalone probe of the same class compiled by the repo's `tsc`,
  which keeps a native private field, resolves in 44 ns against 139 ns through esbuild, so the lowering is most of the
  row. What the engine pays is the ambient scope around construction and the accessor's own `resolve` through the
  container, where inversify's property injection is a metadata read on the same plan. **Work difference**, and the
  harness stays as it is: a codefast user on Vite or tsx pays the same lowering, and a different transpiler for one
  library would move every codefast row, canaries included.
- **Failing fast costs more here: `misconfigured-missing-binding` 0.73×‡ tsyringe, 0.79×‡ brandi, 0.78×‡ ditox, 0.92×‡
  injection-js.** codefast builds a structured error carrying the resolution path; the rivals throw a string, and the
  stack capture both pay is most of the row. **Work difference** on a path a production request should never take.
- **Two warm reads sit on the parity line's wrong side by a hair** — `singleton-class-1-dep` 0.96×† and
  `to-resolved-3-deps` 0.96×† against ditox — both above the throughput ceiling, where the ratio moves between runs of
  the same build. **Open**: these two are the ones to re-measure paired before the next change to their lanes.
- **Open, against this engine's own previous pass: the tagged lookups in the harness child.** Read against the previous
  baseline's own figures, the hoisted and inline `slot-tag-*` rows, `tagged-binding-resolve`, `slot-tag-parent-owned`
  and `slot-name-parent-owned` run at roughly two thirds to four fifths of what they did. Two causes were found and
  fixed before this pass: the disposed-chain guard every entry point inlines had grown past the caller's inline budget
  (the `tagged-resolve-slots-*` rows recovered in full), and a request missing every slot probed for a default-slot
  alias in registries that never held one (`slot-tag-miss-optional` recovered most of its loss). What is left does not
  reproduce in a standalone probe of the same shapes, only in the child that has built every scenario, whose feedback
  the suite's new scenarios also changed. `has-own-unbound-check` is separate and priced: a child now confirms its whole
  chain is live on every read, which is the O(1) check that refuses a disposed ancestor.

## The wins

- **inversify — 90 of 92 comparable rows, 3.65× median, 5.34× geomean.** Widest margins on `boot` (20.2×), `production`
  (16.7×), `scope` (12.0×), `lifecycle` (11.2×), `introspection` (5.91×), `realistic` (5.90×), `fan-out` (5.56×),
  `micro` (4.11×) and `slot-selection` (3.30×); tightest on `scale` (2.54×), `failure` (1.58×), `async` (1.50×) and
  `resolution` (0.89×, which is the accessor row pulling against the plan rows). `resolve-all-async-8` is at parity
  (1.01×), and `circular-dependency-3` and `alias-cycle-detected` are excluded from the aggregates entirely — inversify
  recurses toward the stack limit rather than detecting either.
- **awilix — 38 of 38, 6.11× median, 5.86× geomean, no loss at all.** Widest on `boot` (16.1×), `scale` (9.75×),
  `realistic` (6.94×), `scope` (6.89×), `production` (6.65×) and `micro` (6.62×); tightest on `async` (1.29×) and
  `introspection` (1.30×).
- **tsyringe — 38 of 43, 4.57× median, 3.77× geomean.** 12.3× on `micro`, 6.41× on `scope`, 4.81× on `resolution` and
  4.06× on `introspection`; it keeps four rows — the two cold collections, `bind-128-plain` (0.96×) and the
  missing-binding throw — and the decorated boot is now at parity (1.01×).
- **brandi — 29 of 30, 12.3× median, 10.2× geomean.** 19.8× on `micro`, 14.5× on `scope`, 13.8× on `resolution` and
  13.7× on `realistic`; it loses only the missing-binding throw (0.79×‡).
- **ditox — 31 rows to 12 with two at parity, and both aggregates (1.24× median, 1.61× geomean).** The sweep is in the
  warm work and the per-request work: `scope` 4.74×, `realistic` 2.10×, `micro` 2.02×, `introspection` 1.60×,
  `resolution` 1.60×, `scale` 1.26×, `boot` 1.25×. Named rows: `module-cold-128` 2.13×, `create-child-empty` 1.76×,
  `container-create-empty` 1.73×, `rebind-parent-resolve-child-depth-3` 1.49×, `module-cold-from-modules` 1.24×,
  `resolve-all-cold-100` 1.23×, `async-init-single-hop` 1.10×, `nested-container-resolve-in-factory` 1.10×†,
  `lifecycle-pre-destroy-unbind` 1.08×; `scale-deep-transient-chain-512` (1.03×) and `resolve-optional-hit` (1.02×†) sit
  at parity. What it still takes is every row that binds many things and the two stable sets — `lifecycle` is its one
  winning group (0.62×), which is the 100-singleton pair.
- **injection-js — 20 rows to 10, 1.29× median, 1.40× geomean.** `realistic` 2.41×, `scope` 1.72×, `micro` 1.60×; level
  on `async` (1.11×) and `boot` (1.07×). Its wins are the three ceiling rows, `to-alias-redirect` and the event bus
  above, the two empty containers, the hundred-member stable set, `resolve-all-cold-10` and the missing-binding throw,
  which leave it the `fan-out` (0.95×), `failure` (0.92×), `production` (0.92×) and `resolution` (0.81×) groups. The
  alias and the event bus are shapes where a `ReflectiveInjector` that caches every provider's answer per injector does
  less work than a container that does not; the two nested-factory rows are the harness state the loss list names.

## Geomean by group

Geomean of the ratios in each group, comparable row count in parentheses. Read a group, not a cell.

| Group          | InversifyJS 8 | Awilix 13 | tsyringe 4 |  Brandi 5 |   Ditox 3 | injection-js 2 |
| -------------- | ------------: | --------: | ---------: | --------: | --------: | -------------: |
| micro          |    4.11× (22) | 6.62× (8) |  12.3× (7) | 19.8× (8) | 2.02× (7) |      1.60× (9) |
| realistic      |     5.90× (5) | 6.94× (4) |  3.74× (4) | 13.7× (5) | 2.10× (5) |      2.41× (5) |
| fan-out        |     5.56× (9) | 2.02× (1) |  1.98× (5) | 8.71× (1) | 0.98× (5) |      0.95× (4) |
| async          |    1.50× (10) | 1.29× (1) |  1.46× (1) | 2.69× (1) | 1.10× (1) |      1.11× (1) |
| lifecycle      |     11.2× (8) | 4.76× (5) |  2.35× (4) |         — | 0.62× (5) |              — |
| scope          |    12.0× (12) | 6.89× (8) |  6.41× (8) | 14.5× (5) | 4.74× (8) |      1.72× (4) |
| scale          |     2.54× (2) | 9.75× (2) |  3.61× (2) | 7.46× (2) | 1.26× (2) |              — |
| boot           |     20.2× (8) | 16.1× (3) |  1.07× (4) | 4.13× (5) | 1.25× (5) |      1.07× (4) |
| failure        |     1.58× (2) | 2.30× (1) |  0.73× (1) | 0.79× (1) | 0.78× (1) |      0.92× (1) |
| production     |     16.7× (3) | 6.65× (2) |  3.42× (3) |         — | 0.96× (3) |      0.92× (1) |
| introspection  |     5.91× (2) | 1.30× (1) |  4.06× (2) |         — | 1.60× (1) |              — |
| slot-selection |     3.30× (6) |         — |          — |         — |         — |              — |
| resolution     |     0.89× (3) | 3.23× (2) |  4.81× (2) | 13.8× (2) | 1.60× (2) |      0.81× (2) |

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
| constant-resolve                               | micro          |  1000 |        215,029,791 |           2.69×† |       5.54×† |        11.1×† |      30.1×† |     1.10×† |            1.84×† |
| singleton-class-1-dep                          | micro          |   200 |        186,448,485 |           3.22×† |       4.37×† |        10.5×† |      26.8×† |     0.96×† |            3.69×† |
| transient-class-1-dep                          | micro          |   200 |         80,056,614 |           1.90×† |       8.92×† |        13.7×† |      29.8×† |     7.88×† |                 — |
| named-constant-get                             | micro          |   500 |        100,251,832 |           3.65×† |            — |             — |           — |          — |                 — |
| named-resolve-slots-1                          | micro          |   500 |        137,646,758 |           4.97×† |            — |             — |           — |          — |                 — |
| named-resolve-slots-4                          | micro          |   500 |        138,083,838 |           4.80×† |            — |             — |           — |          — |                 — |
| named-resolve-slots-16                         | micro          |   500 |        138,297,231 |           4.94×† |            — |             — |           — |          — |                 — |
| named-resolve-slots-64                         | micro          |   500 |        138,034,203 |           4.83×† |            — |             — |           — |          — |                 — |
| optional-missing-transient                     | micro          |   200 |         57,279,898 |           1.16×† |            — |             — |      11.5×† |     4.14×† |                 — |
| realistic-graph-resolve-root                   | realistic      |    20 |         19,145,090 |            2.62× |        2.65× |         5.32× |       13.1× |      1.71× |             1.23× |
| realistic-graph-cold-resolve                   | realistic      |     1 |           307,785‡ |           8.21×‡ |       4.46×‡ |        2.13×‡ |      4.40×‡ |     1.08×‡ |            2.22×‡ |
| realistic-graph-resolved-root                  | realistic      |    20 |         63,874,536 |           3.26×† |            — |             — |      42.4×† |     5.52×† |            4.07×† |
| realistic-graph-class-resolve-root             | realistic      |    20 |         60,892,967 |           3.15×† |       10.5×† |        13.9×† |      41.4×† |     5.28×† |            3.21×† |
| realistic-graph-class-cold-resolve             | realistic      |     1 |           527,805‡ |           32.1×‡ |       18.8×‡ |        1.25×‡ |      4.83×‡ |     0.76×‡ |            2.29×‡ |
| realistic-graph-validate                       | realistic      |    10 |         19,592,124 |                — |            — |             — |           — |          — |                 — |
| fan-out-tree-depth-3-breadth-4                 | fan-out        |    20 |          1,870,076 |            1.63× |        2.02× |         3.21× |       8.71× |      2.16× |                 — |
| resolve-all-strategies-10                      | fan-out        |     1 |        31,156,249‡ |          8.18×†‡ |            — |       3.53×†‡ |           — |    0.80×†‡ |           1.23×†‡ |
| resolve-all-strategies-100                     | fan-out        |     1 |         24,037,580 |            52.6× |            — |         18.0× |           — |    0.60×†‡ |           0.67×†‡ |
| resolve-all-cold-10                            | fan-out        |     1 |          1,502,852 |           20.3×‡ |            — |         0.43× |           — |      0.71× |             0.90× |
| resolve-all-cold-100                           | fan-out        |     1 |            188,143 |           18.8×‡ |            — |        0.35×‡ |           — |      1.23× |             1.13× |
| resolve-all-named-8                            | fan-out        |     1 |         21,798,012 |            1.95× |            — |             — |           — |          — |                 — |
| resolve-all-named-16                           | fan-out        |     1 |         23,738,835 |            2.13× |            — |             — |           — |          — |                 — |
| resolve-all-named-32                           | fan-out        |     1 |         23,309,032 |            2.15× |            — |             — |           — |          — |                 — |
| resolve-all-named-64                           | fan-out        |     1 |         23,877,140 |            2.12× |            — |             — |           — |          — |                 — |
| resolve-async-single-hop                       | async          |     1 |          9,687,176 |            1.28× |            — |             — |           — |          — |                 — |
| async-init-single-hop                          | async          |     1 |          7,234,912 |            1.68× |        1.29× |         1.46× |       2.69× |      1.10× |             1.11× |
| dynamic-async-chain-8                          | async          |     1 |          2,108,179 |            1.42× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-8                      | async          |     1 |          1,237,481 |            1.61× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-16                     | async          |     1 |            693,385 |            1.71× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-32                     | async          |     1 |           348,867‡ |           1.82×‡ |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-64                     | async          |     1 |            161,367 |            1.91× |            — |             — |           — |          — |                 — |
| async-branch-chain-8                           | async          |     1 |          1,338,169 |                — |            — |             — |           — |          — |                 — |
| async-branch-escape-mid-chain-8                | async          |     1 |          1,766,252 |                — |            — |             — |           — |          — |                 — |
| async-diamond-shared-leaf                      | async          |     1 |          1,911,858 |            1.26× |            — |             — |           — |          — |                 — |
| plan-async-resolved-chain-8                    | async          |     1 |          2,858,378 |                — |            — |             — |           — |          — |                 — |
| plan-async-class-chain-8                       | async          |     1 |          5,402,773 |                — |            — |             — |           — |          — |                 — |
| resolve-all-async-8                            | async          |     1 |            982,927 |            1.01× |            — |             — |           — |          — |                 — |
| resolve-optional-async-miss                    | async          |     1 |          9,522,114 |           1.52×‡ |            — |             — |           — |          — |                 — |
| lifecycle-post-construct-singleton             | lifecycle      |   250 |        185,929,423 |           3.19×† |            — |             — |           — |          — |                 — |
| lifecycle-pre-destroy-unbind                   | lifecycle      |     1 |          3,219,079 |            21.0× |       7.76×‡ |         2.17× |           — |      1.08× |                 — |
| binding-level-activation-hook                  | lifecycle      |   200 |         60,535,089 |           2.21×† |            — |             — |           — |          — |                 — |
| child-depth-1-resolve                          | scope          |   500 |        108,031,703 |           1.51×† |       4.25×† |        7.08×† |      16.6×† |     4.92×† |            1.39×† |
| child-depth-2-resolve                          | scope          |   500 |        109,174,538 |           1.51×† |       5.59×† |        8.38×† |      18.3×† |     8.81×† |            1.29×† |
| child-depth-4-resolve                          | scope          |   500 |        109,246,943 |           1.60×† |       8.11×† |        10.9×† |      19.8×† |     17.8×† |            2.10×† |
| child-depth-8-resolve                          | scope          |   500 |        106,969,026 |           1.55×† |       14.3×† |        16.4×† |      25.1×† |     31.8×† |            2.35×† |
| child-request-lifecycle-create-resolve-dispose | scope          |   100 |         2,465,457‡ |           41.4×‡ |       10.8×‡ |        4.71×‡ |           — |     1.44×‡ |                 — |
| fresh-child-default-n1                         | scope          |   100 |        10,390,490‡ |           36.5×‡ |       7.39×‡ |        6.75×‡ |           — |     1.85×‡ |                 — |
| fresh-child-default-n4                         | scope          |   100 |          8,069,337 |           27.9×‡ |       6.85×‡ |         7.10× |           — |      2.71× |                 — |
| fresh-child-name-n1                            | scope          |   100 |          9,843,647 |           35.3×‡ |            — |             — |           — |          — |                 — |
| fresh-child-name-n4                            | scope          |   100 |         6,850,585‡ |           24.9×‡ |            — |             — |           — |          — |                 — |
| fresh-child-tag-n1                             | scope          |   100 |         10,043,924 |           37.3×‡ |            — |             — |           — |          — |                 — |
| fresh-child-tag-n4                             | scope          |   100 |         7,004,619‡ |           27.8×‡ |            — |             — |           — |          — |                 — |
| scale-mid-transient-chain-32                   | scale          |     1 |          1,520,598 |            2.53× |        4.81× |         4.25× |       9.39× |      1.53× |                 — |
| scale-deep-transient-chain-512                 | scale          |     1 |             53,770 |            2.55× |        19.8× |         3.07× |       5.92× |      1.03× |                 — |
| boot-decorated-container-build-and-resolve     | boot           |     1 |            761,087 |           18.4×‡ |            — |         1.01× |           — |          — |             2.05× |
| container-create-empty                         | boot           |   100 |         29,901,392 |           43.3×‡ |       10.9×‡ |         1.18× |       6.99× |      1.73× |            0.67×† |
| create-child-empty                             | boot           |   100 |         26,211,265 |           50.3×‡ |       11.3×‡ |         1.15× |       6.10× |      1.76× |            0.56×† |
| bind-128-plain                                 | boot           |     1 |            178,232 |           25.8×‡ |       33.7×‡ |         0.96× |       7.08× |      0.38× |             1.70× |
| bind-128-refined                               | boot           |     1 |             28,983 |           3.40×‡ |            — |             — |           — |          — |                 — |
| misconfigured-missing-binding                  | failure        |     1 |           283,155‡ |           1.61×‡ |       2.30×‡ |        0.73×‡ |      0.79×‡ |     0.78×‡ |            0.92×‡ |
| circular-dependency-3                          | failure        |     1 |           166,682‡ |          189.2×‡ |       1.47×‡ |             — |           — |          — |            0.48×‡ |
| ambiguous-multi-binding                        | failure        |     1 |           242,688‡ |           1.56×‡ |            — |             — |           — |          — |                 — |
| production-http-handler                        | production     |    50 |          1,730,396 |           24.6×‡ |       7.29×‡ |        3.18×‡ |           — |      1.12× |                 — |
| production-unit-of-work                        | production     |   100 |           981,540‡ |           15.4×‡ |       6.08×‡ |        2.20×‡ |           — |     1.09×‡ |                 — |
| production-event-bus-dispatch                  | production     |   100 |         50,239,834 |           12.4×† |            — |        5.74×† |           — |    0.72×†‡ |            0.92×† |
| to-resolved-3-deps                             | micro          |   200 |        185,709,725 |           3.34×† |            — |             — |      26.1×† |     0.96×† |            1.65×† |
| to-alias-redirect                              | micro          |   500 |        110,559,820 |           1.99×† |       6.15×† |        11.8×† |           — |          — |            0.89×† |
| to-self-binding                                | micro          |   300 |        171,853,701 |           2.93×† |            — |        7.69×† |           — |          — |            2.88×† |
| alias-chain-3                                  | micro          |   500 |        111,709,467 |           4.20×† |       14.3×† |        24.5×† |           — |          — |            0.99×† |
| alias-parent-owned-terminal                    | micro          |   500 |        102,165,040 |           2.00×† |       6.80×† |        12.3×† |           — |          — |            0.77×† |
| alias-cycle-detected                           | failure        |     1 |           256,124‡ |          722.3×‡ |       2.67×‡ |             — |           — |          — |            0.81×‡ |
| resolve-optional-hit                           | micro          |   500 |        210,423,681 |           6.31×† |       5.78×† |             — |      28.4×† |     1.02×† |            1.59×† |
| resolve-optional-miss                          | micro          |   500 |        265,984,862 |           7.80×† |       4.96×† |             — |      4.33×† |     4.13×† |            2.00×† |
| tagged-binding-resolve                         | micro          |   300 |        101,965,718 |           4.81×† |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-1                         | micro          |   300 |        216,992,516 |           10.7×† |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-4                         | micro          |   300 |        217,953,709 |           10.3×† |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-16                        | micro          |   300 |        217,266,963 |           9.66×† |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-64                        | micro          |   300 |        215,185,657 |           9.78×† |            — |             — |           — |          — |                 — |
| conditional-injection-tagged                   | micro          |   300 |         79,429,596 |           1.99×† |            — |             — |      27.1×† |          — |                 — |
| rebind-hot-swap                                | lifecycle      |    50 |         16,959,933 |           39.3×‡ |        1.27× |             — |           — |     0.19×† |                 — |
| has-bound-check                                | introspection  |  1000 |        372,213,563 |           6.61×† |       1.30×† |        3.41×† |           — |     1.60×† |                 — |
| has-own-unbound-check                          | introspection  |  1000 |        532,816,355 |           5.28×† |            — |        4.84×† |           — |          — |                 — |
| container-level-activation-hook                | lifecycle      |   200 |         56,309,010 |           1.96×† |            — |        4.77×† |           — |          — |                 — |
| scoped-binding-per-child                       | scope          |   100 |         5,932,216‡ |           41.6×‡ |       3.39×‡ |        1.20×‡ |      4.33×‡ |     1.43×‡ |                 — |
| rebind-parent-resolve-child-depth-3            | lifecycle      |    50 |         12,384,589 |            67.4× |        1.40× |             — |           — |      1.49× |                 — |
| materialize-100-singletons                     | lifecycle      |     1 |             79,163 |           17.5×‡ |       14.8×‡ |         1.92× |           — |      0.57× |                 — |
| unbind-all-100-singletons                      | lifecycle      |     1 |             59,881 |            18.2× |       11.9×‡ |        1.54×‡ |           — |      0.53× |                 — |
| module-load-unload                             | boot           |     1 |         1,158,608‡ |           16.5×‡ |            — |             — |           — |          — |                 — |
| module-cold-from-modules                       | boot           |     1 |          2,039,832 |           20.3×‡ |            — |             — |       3.33× |      1.24× |                 — |
| module-cold-128                                | boot           |     1 |            190,245 |           23.2×‡ |            — |             — |       1.20× |      2.13× |                 — |
| initialize-async-warmup                        | boot           |     1 |            581,426 |                — |            — |             — |           — |          — |                 — |
| inspect-snapshot                               | introspection  |    20 |          9,926,375 |                — |            — |             — |           — |          — |                 — |
| lookup-bindings                                | introspection  |   200 |         25,447,885 |                — |            — |             — |           — |          — |                 — |
| generate-dependency-graph                      | introspection  |    10 |            743,372 |                — |            — |             — |           — |          — |                 — |
| multi-tag-slot-resolve                         | micro          |   300 |         14,294,205 |                — |            — |             — |           — |          — |                 — |
| multi-tag-constraint-resolve                   | micro          |   200 |          7,171,052 |                — |            — |             — |           — |          — |                 — |
| multi-tag-select-32                            | micro          |   300 |          2,878,535 |                — |            — |             — |           — |          — |                 — |
| mask-reject-wide-catalog                       | slot-selection |   300 |         28,922,428 |                — |            — |             — |           — |          — |                 — |
| mask-accept-two-of-four                        | slot-selection |   300 |         20,236,643 |                — |            — |             — |           — |          — |                 — |
| mask-collision-same-bit                        | slot-selection |   300 |         45,863,794 |                — |            — |             — |           — |          — |                 — |
| slot-tag-array-hoisted                         | slot-selection |   300 |        102,970,653 |                — |            — |             — |           — |          — |                 — |
| slot-tag-shorthand-hoisted                     | slot-selection |   300 |        104,221,762 |                — |            — |             — |           — |          — |                 — |
| slot-tag-array-inline                          | slot-selection |   300 |         72,803,435 |                — |            — |             — |           — |          — |                 — |
| slot-tag-shorthand-inline                      | slot-selection |   300 |         84,769,515 |                — |            — |             — |           — |          — |                 — |
| slot-tag-zero-value                            | slot-selection |   300 |        101,445,373 |           4.66×† |            — |             — |           — |          — |                 — |
| slot-name-and-tag                              | slot-selection |   300 |         41,973,617 |           1.98×† |            — |             — |           — |          — |                 — |
| slot-tag-resolve-all                           | slot-selection |   300 |         40,515,752 |           3.45×† |            — |             — |           — |          — |                 — |
| slot-tag-miss-optional                         | slot-selection |   300 |         65,140,364 |           2.54×† |            — |             — |           — |          — |                 — |
| slot-tag-parent-owned                          | slot-selection |   300 |         93,241,908 |           4.36×† |            — |             — |           — |          — |                 — |
| slot-name-parent-owned                         | slot-selection |   300 |         89,327,697 |           3.64×† |            — |             — |           — |          — |                 — |
| slot-injected-name-compiled                    | slot-selection |   300 |         72,829,853 |                — |            — |             — |           — |          — |                 — |
| slot-injected-name-interpreted                 | slot-selection |   300 |          4,615,205 |                — |            — |             — |           — |          — |                 — |
| slot-injected-tag-compiled                     | slot-selection |   300 |         75,597,325 |                — |            — |             — |           — |          — |                 — |
| slot-injected-tag-interpreted                  | slot-selection |   300 |          4,822,475 |                — |            — |             — |           — |          — |                 — |
| plan-deps-inlined                              | resolution     |   300 |         61,917,495 |                — |            — |             — |           — |          — |                 — |
| plan-escape-factory-dep                        | resolution     |   300 |          7,466,434 |                — |            — |             — |           — |          — |                 — |
| plan-escape-scoped-dep                         | resolution     |   300 |         12,129,770 |                — |            — |             — |           — |          — |                 — |
| plan-escape-hooked-dep                         | resolution     |   300 |          3,293,562 |                — |            — |             — |           — |          — |                 — |
| plan-escape-optional-dep                       | resolution     |   300 |          5,371,555 |                — |            — |             — |           — |          — |                 — |
| plan-escape-multi-dep                          | resolution     |   300 |          2,851,885 |                — |            — |             — |           — |          — |                 — |
| plan-class-chain-24                            | resolution     |     1 |          7,369,448 |                — |            — |             — |           — |          — |                 — |
| plan-class-chain-40                            | resolution     |     1 |          4,324,494 |                — |            — |             — |           — |          — |                 — |
| interpreted-class-chain-24                     | resolution     |     1 |            473,794 |                — |            — |             — |           — |          — |                 — |
| interpreted-class-chain-40                     | resolution     |     1 |            228,521 |                — |            — |             — |           — |          — |                 — |
| plan-runs-1                                    | resolution     |     1 |            828,714 |                — |            — |             — |           — |          — |                 — |
| plan-runs-256                                  | resolution     |     1 |             14,915 |                — |            — |             — |           — |          — |                 — |
| plan-runs-512                                  | resolution     |     1 |              8,044 |                — |            — |             — |           — |          — |                 — |
| plan-runs-1024                                 | resolution     |     1 |              4,019 |                — |            — |             — |           — |          — |                 — |
| plan-runs-2048                                 | resolution     |     1 |              1,983 |                — |            — |             — |           — |          — |                 — |
| plan-runs-4096                                 | resolution     |     1 |              1,180 |                — |            — |             — |           — |          — |                 — |
| plan-runs-8192                                 | resolution     |     1 |                660 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-1                               | resolution     |     1 |            243,351 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-256                             | resolution     |     1 |              4,807 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-512                             | resolution     |     1 |              2,561 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-1024                            | resolution     |     1 |              1,276 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-2048                            | resolution     |     1 |                661 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-8192                            | resolution     |     1 |                207 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-1                              | resolution     |     1 |           800,551‡ |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-512                            | resolution     |     1 |              8,071 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-1024                           | resolution     |     1 |              4,016 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-2048                           | resolution     |     1 |              2,009 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-8192                           | resolution     |     1 |                649 |                — |            — |             — |           — |          — |                 — |
| nested-context-resolve-in-factory              | resolution     |   300 |         43,538,260 |           1.81×† |       3.65×† |        5.05×† |      14.3×† |     2.32×† |            0.78×† |
| nested-container-resolve-in-factory            | resolution     |   300 |         39,829,980 |           1.58×† |       2.86×† |        4.57×† |      13.3×† |     1.10×† |            0.84×† |
| accessor-injection-construct                   | resolution     |   300 |         8,881,085‡ |          0.25×†‡ |            — |             — |           — |          — |                 — |

† 137 row(s) above ~30M ops/s: this ratio moves between runs of the same build, whatever its IQR says. Cite the
aggregates, not the row.

‡ 98 cell(s) whose per-trial IQR exceeds 5%: the median is unstable within this run. Re-run on a quieter machine before
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
