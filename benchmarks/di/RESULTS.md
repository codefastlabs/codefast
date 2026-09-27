# Results

Where `@codefast/di` actually stands against the field right now, wins and losses given equal weight — the point of this
page is to know where the engine is slower so the next change knows what to aim at. One machine-derived snapshot, no
accreted ledger. The method is in [`BENCH_GUIDE.md`](./BENCH_GUIDE.md); re-run it with the recipe at the bottom.

**This is one full-profile pass, so read the aggregates, not the rows.** GC-exposed for one collection between trials,
one subprocess per scenario, libraries interleaved with rotating order, 3 trials each over the one closure a scenario
builds before its first trial — a single pass measures no between-run variance of its own, 114 of the cells carry a
per-trial IQR above 5%, and 140 cells in 48 rows sit above ~30M ops/s, where the ratio moves between runs of the same
build whatever its IQR says. Ratios are worth more than the absolute `hz/op`; a single row is worth less than the group
it sits in. A loss highlighted below points at a direction — quote a precise factor only after a paired re-run, except
where a loss is a structural difference that reproduces by construction (called out as such).

**This page is the baseline.** It transcribes `baselines/2026-09-27T11-39-11-657Z`, whose `observations.jsonl` is
committed, so every figure here can be re-read from the repository rather than from a local `bench-results/` run only
the author has. `baselines/` holds that one run and nothing else: the next pass is read against it, and a pass accepted
in its place becomes this page. 145 scenarios ran, 131 of them aggregate-eligible; every library implements every row
its declared features allow, so a `—` below is a feature the library lacks, never a row nobody wrote.

**Environment.** `@codefast/di` at `0c2e6568b` — 0.11.0 plus the unreleased 0.12 changes — from a `dist` built first, on
Node 26.1.0 / V8 14.6, Apple M3 Max × 14, darwin/arm64, `--expose-gc` for every library. inversify 8.2.3 · awilix 13.0.5
· tsyringe 4.10.0 · brandi 5.1.0 · ditox 3.3.0 · injection-js 2.6.1. Each library runs at its canonical decorator mode
(inversify legacy decorators + `reflect-metadata`, codefast TC39 Stage 3 + `Symbol.metadata`); every inversify container
uses `{ jitless: false }`, its fastest documented configuration. Run 2026-09-27, 2m21s wall, 0 sanity failures; the
1-minute load average read 2.37 at every child's start, on fourteen cores. A second pass over the same build minutes
earlier, under a load average of 7–8, read every median within 6% of these, brandi aside (12.7× against 14.2×).

**What moved since the previous pass.** Per row, codefast's own throughput sits at the previous pass's median (0.995×),
while the rivals read 2–4% lower (brandi 16% lower) — so part of every ratio's rise below is the pass, not the engine.
The rows the engine changes reached moved on their own: the hoisted and inline `slot-tag-*` rows,
`tagged-binding-resolve` and the parent-owned slot rows +20% to +53%, at or within a tenth of the pass before last,
since a root's `resolve` no longer carries a child's chain check; `resolve-all-cold-10` +55% and `resolve-all-cold-100`
+39%, since a member declared with `.many()` before `to*()` registers once and a container read once builds no value
list; and `bind-128-refined` +29%, since a slot declared before registration is one add. `rebind-hot-swap` (+22%) and
`module-cold-128` (+11%) moved with no change aimed at them and are not yet attributed. The child rows did not move
here: a paired probe reads `child-depth-*` about a fifth faster since the chain check inlines outright, but at ~107M
ops/s they sit above the throughput ceiling this harness resolves.

## Summary — where we stand

Ratios are `@codefast/di ÷ competitor`; above 1× means codefast is faster. Win `>1.03×`, parity `0.97–1.03×`, loss
`<0.97×`. `Comparable` counts the rows both libraries ran, of 131 aggregate-eligible rows codefast measures; `†` is how
many of those the median and geomean carry from above the throughput ceiling — they stay in the aggregate but no reader
should cite one alone.

| Competitor     | Comparable | Win / parity / loss | Median | Geomean |   † |
| -------------- | ---------: | ------------------: | -----: | ------: | --: |
| InversifyJS 8  |  92 of 131 |          90 / 1 / 1 |  4.41× |   5.74× |  44 |
| Awilix 13      |  38 of 131 |          38 / 0 / 0 |  6.34× |   6.13× |  17 |
| tsyringe 4     |  43 of 131 |          38 / 2 / 3 |  4.75× |   3.96× |  19 |
| Brandi 5       |  30 of 131 |          29 / 0 / 1 |  14.2× |   12.0× |  17 |
| Ditox 3        |  45 of 131 |          34 / 2 / 9 |  1.37× |   1.68× |  21 |
| injection-js 2 |  31 of 131 |         21 / 0 / 10 |  1.49× |   1.47× |  22 |

**The headline, stated plainly: codefast sweeps awilix outright, takes inversify and brandi on all but one row each,
wins tsyringe on the median by 4.75× while still losing it three rows, and holds both aggregates against the two
libraries it is closest to** — ditox 1.37× on the median and 1.68× on the geomean, injection-js 1.49× and 1.47×. The
losses cluster in four shapes, and every one of them is named in the next section: **registration** and everything that
binds before it resolves, **cold collections** against tsyringe, the **failure path**, and a handful of warm rows above
the throughput ceiling where ditox and injection-js read level or ahead.

## The losses, foregrounded — where to improve

Ordered by how much they matter, each marked as a **real deficit** (same work, codefast slower), a **work difference**
(codefast does more per op by design, so the row is a design cost to reconsider, not a bug) or a **chosen cost** (a
correctness property paid for with its price known).

- **Registration is the biggest deficit, and it is a ditox-only one.** `bind-128-plain` — 128 transient factory bindings
  into a fresh container, no resolve — runs at 0.41× ditox, 1.01× tsyringe and 1.81× injection-js. What it pays is the
  object: the chain object is the fluent builder the contract returns, and the probe is last-wins, so closing this row
  is a contract change (a lighter builder, or a bulk bind), not an optimisation. Everything that binds before it
  resolves sits on the same floor — `create-child-empty` 1.90× ditox and 1.18× tsyringe, `container-create-empty` 1.80×†
  and 1.34×†, `realistic-graph-class-cold-resolve` 0.79×‡ ditox and 1.34×‡ tsyringe,
  `boot-decorated-container-build-and-resolve` 0.98× tsyringe, `module-cold-from-modules` 1.31× ditox. The two
  empty-container rows lose injection-js above the ceiling (0.69×† and 0.58×†), whose injector is fewer objects still.
  **Real deficit, structural** — one object per binding is the design.
- **The cold collection loses tsyringe, and only tsyringe.** `resolve-all-cold-N` builds a fresh container and reads the
  collection once: at N=10, 0.68× tsyringe while ditox 1.10× and injection-js 1.49× are wins; at N=100, 0.49×‡ tsyringe,
  1.76×‡ ditox and 1.65×‡ injection-js. What the pair still pays is the registration above, ten or a hundred times,
  against tsyringe's plain array of providers. **Real deficit against tsyringe — the registration cost seen from the
  collection side.**
- **Teardown at scale is a registration loss and a cold-class loss wearing a lifecycle label.**
  `materialize-100-singletons` (bind and resolve 100 singletons, no teardown) is 0.58× ditox and 2.09× tsyringe;
  `unbind-all-100-singletons` (the same, then dispose) 0.55×‡ and 1.63×‡. The two ratios against ditox are within a hair
  of each other, so the teardown walk costs nothing the rivals do not pay. What sits above it is two costs: the 100
  bindings, and the first resolve of each, because codefast's side binds a class with `.to(Class).singleton()` where
  ditox binds a factory, and constructing a class with metadata costs more than calling a factory.
  `lifecycle-pre-destroy-unbind` (one singleton, one hook) is 1.12× ditox and 2.38× tsyringe. **Real deficit on the
  registration and the cold class lane underneath, not on the hook.**
- **The stable-set collections are a chosen cost.** `resolve-all-strategies-10` 0.81×†‡ ditox and 0.84×†‡ injection-js,
  `-100` 0.65×†‡ and 0.66×†, and `production-event-bus-dispatch` 0.72×† ditox and 0.93×† injection-js: a root-level
  `resolveAll` hands each caller a copy of its memoized list rather than the list itself, so no caller can mutate the
  engine's memo, while both rivals hand out the cached array they share. The event bus is that copy plus the dispatch;
  the one map read it used to pay beyond the copy is absorbed by a one-entry cell in front of the collection memo. A
  frozen list was measured and rejected — a frozen array iterates through a slow elements kind for every consumer.
  **Chosen cost**, its own commit, reversible alone.
- **Rebind wins awilix and still loses ditox above the ceiling.** `rebind-hot-swap` 1.57× awilix and 0.23×† ditox;
  `rebind-parent-resolve-child-depth-3` 1.35× awilix and 1.37× ditox. A rebind of a lone token is one registration whose
  displaced binding is deactivated on the spot; what it pays against ditox's bare map write is the builder object and
  the deactivation walk. **Work difference**, above the ceiling.
- **Four rows lose injection-js above the ceiling.** `nested-context-resolve-in-factory` 0.87×† and
  `nested-container-resolve-in-factory` 0.88×† — a factory that resolves from its context or from the container
  mid-construction — and `alias-parent-owned-terminal` 0.87×†, with `to-alias-redirect` 0.90×† beside it and
  `alias-chain-3` a win at 1.12×†. Measured on their own, outside the harness, codefast is ahead of injection-js on both
  nested-factory shapes. The loss appears in the harness child, which builds every scenario before it measures one, so
  the factory call site that the transient dynamic lane inlines has already seen hundreds of factories and V8 stops
  inlining through it; injection-js's lane inlines nothing to begin with, so the same state costs it nothing. The
  harness keeps that state on purpose, as [`BENCH_GUIDE.md`](./BENCH_GUIDE.md) records. The aliases are structural:
  injection-js caches an alias's answer in the injector's own slot on the first read, while codefast resolves the alias
  on every read and never caches a parent's instance in a child. **Harness state** for the two nested rows, **work
  difference** for the aliases.
- **`accessor-injection-construct` 0.22×†‡ inversify.** The row measures the benchmark's transpiler as much as the
  engine: tsx's esbuild lowers the scenario's decorated `accessor` field to `WeakMap`-backed privates (`__privateAdd`,
  `__accessCheck`) and its own decorator runtime. A standalone probe of the same class compiled by the repo's `tsc`,
  which keeps a native private field, resolves in 44 ns against 139 ns through esbuild, so the lowering is most of the
  row. What the engine pays is the ambient scope around construction and the accessor's own `resolve` through the
  container, where inversify's property injection is a metadata read on the same plan. **Work difference**, and the
  harness stays as it is: a codefast user on Vite or tsx pays the same lowering, and a different transpiler for one
  library would move every codefast row, canaries included.
- **Failing fast costs more here: `misconfigured-missing-binding` 0.73×‡ tsyringe, 0.78×‡ brandi, 0.78×‡ ditox, 0.89×‡
  injection-js.** codefast builds a structured error carrying the resolution path; the rivals throw a string, and the
  stack capture both pay is most of the row. **Work difference** on a path a production request should never take.

## The wins

- **inversify — 90 of 92 comparable rows, 4.41× median, 5.74× geomean.** Widest margins on `boot` (24.1×), `production`
  (19.0×), `scope` (13.3×), `lifecycle` (12.5×), `fan-out` (6.23×), `realistic` (6.20×), `introspection` (6.00×),
  `micro` (4.20×) and `slot-selection` (3.94×); tightest on `scale` (2.48×), `failure` (1.53×), `async` (1.49×) and
  `resolution` (0.88×, which is the accessor row pulling against the plan rows). `resolve-all-async-8` is at parity
  (1.01×), and `circular-dependency-3` and `alias-cycle-detected` are excluded from the aggregates entirely — inversify
  recurses toward the stack limit rather than detecting either.
- **awilix — 38 of 38, 6.34× median, 6.13× geomean, no loss at all.** Widest on `boot` (17.8×), `scale` (9.90×),
  `production` (7.47×), `scope` (7.21×), `realistic` (7.12×) and `micro` (6.76×); tightest on `async` (1.30×) and
  `introspection` (1.30×).
- **tsyringe — 38 of 43, 4.75× median, 3.96× geomean.** 12.7× on `micro`, 6.59× on `scope`, 5.17× on `resolution` and
  4.12× on `introspection`; it keeps three rows — the two cold collections and the missing-binding throw — and
  `bind-128-plain` (1.01×) and the decorated boot (0.98×) sit at parity.
- **brandi — 29 of 30, 14.2× median, 12.0× geomean.** 23.2× on `micro`, 17.5× on `resolution`, 17.1× on `scope` and
  16.1× on `realistic`; it loses only the missing-binding throw (0.78×‡).
- **ditox — 34 rows to 9 with two at parity, and both aggregates (1.37× median, 1.68× geomean).** The sweep is in the
  warm work and the per-request work: `scope` 4.69×, `realistic` 2.13×, `micro` 2.07×, `resolution` 1.66×,
  `introspection` 1.60×, `scale` 1.38×, `boot` 1.35×, `fan-out` 1.17×, `async` 1.11×. Named rows: `module-cold-128`
  2.43×, `create-child-empty` 1.90×, `container-create-empty` 1.80×†, `resolve-all-cold-100` 1.76×‡,
  `rebind-parent-resolve-child-depth-3` 1.37×, `module-cold-from-modules` 1.31×, `scale-deep-transient-chain-512` 1.19×,
  `lifecycle-pre-destroy-unbind` 1.12×, `async-init-single-hop` 1.11×, `nested-container-resolve-in-factory` 1.11×†,
  `resolve-all-cold-10` 1.10×; `singleton-class-1-dep` (0.98×†) and `to-resolved-3-deps` (0.97×†) sit at parity above
  the ceiling. What it still takes is every row that binds many things and the two stable sets; `lifecycle` (0.65×, the
  100-singleton pair) and `failure` (0.78×, the missing-binding throw) are its winning groups, and `production` is level
  (1.00×).
- **injection-js — 21 rows to 10, 1.49× median, 1.47× geomean.** `realistic` 2.47×, `scope` 1.87×, `micro` 1.66×;
  narrower on `async` (1.11×), `boot` (1.10×) and `fan-out` (1.08×). Its wins are the ceiling rows above, the two stable
  sets, the two empty containers, the event bus and the missing-binding throw, which leave it the `production` (0.93×),
  `failure` (0.89×) and `resolution` (0.87×) groups. The aliases and the event bus are shapes where a
  `ReflectiveInjector` that caches every provider's answer per injector does less work than a container that does not;
  the two nested-factory rows are the harness state the loss list names.

## Geomean by group

Geomean of the ratios in each group, comparable row count in parentheses. Read a group, not a cell.

| Group          | InversifyJS 8 | Awilix 13 | tsyringe 4 |  Brandi 5 |   Ditox 3 | injection-js 2 |
| -------------- | ------------: | --------: | ---------: | --------: | --------: | -------------: |
| micro          |    4.20× (22) | 6.76× (8) |  12.7× (7) | 23.2× (8) | 2.07× (7) |      1.66× (9) |
| realistic      |     6.20× (5) | 7.12× (4) |  3.87× (4) | 16.1× (5) | 2.13× (5) |      2.47× (5) |
| fan-out        |     6.23× (9) | 2.10× (1) |  2.29× (5) | 9.25× (1) | 1.17× (5) |      1.08× (4) |
| async          |    1.49× (10) | 1.30× (1) |  1.50× (1) | 2.92× (1) | 1.11× (1) |      1.11× (1) |
| lifecycle      |     12.5× (8) | 5.12× (5) |  2.49× (4) |         — | 0.65× (5) |              — |
| scope          |    13.3× (12) | 7.21× (8) |  6.59× (8) | 17.1× (5) | 4.69× (8) |      1.87× (4) |
| scale          |     2.48× (2) | 9.90× (2) |  3.63× (2) | 8.31× (2) | 1.38× (2) |              — |
| boot           |     24.1× (8) | 17.8× (3) |  1.12× (4) | 5.20× (5) | 1.35× (5) |      1.10× (4) |
| failure        |     1.53× (2) | 2.30× (1) |  0.73× (1) | 0.78× (1) | 0.78× (1) |      0.89× (1) |
| production     |     19.0× (3) | 7.47× (2) |  3.64× (3) |         — | 1.00× (3) |      0.93× (1) |
| introspection  |     6.00× (2) | 1.30× (1) |  4.12× (2) |         — | 1.60× (1) |              — |
| slot-selection |     3.94× (6) |         — |          — |         — |         — |              — |
| resolution     |     0.88× (3) | 3.37× (2) |  5.17× (2) | 17.5× (2) | 1.66× (2) |      0.87× (2) |

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
| constant-resolve                               | micro          |  1000 |        210,516,019 |           2.78×† |       5.54×† |        11.5×† |      36.9×† |     1.08×† |            1.83×† |
| singleton-class-1-dep                          | micro          |   200 |        187,050,993 |           3.38×† |       4.64×† |        10.8×† |      32.6×† |     0.98×† |            3.73×† |
| transient-class-1-dep                          | micro          |   200 |         77,594,333 |           1.92×† |       8.98×† |        13.6×† |      33.4×† |     7.92×† |                 — |
| named-constant-get                             | micro          |   500 |         97,147,419 |           3.53×† |            — |             — |           — |          — |                 — |
| named-resolve-slots-1                          | micro          |   500 |        135,512,845 |           4.81×† |            — |             — |           — |          — |                 — |
| named-resolve-slots-4                          | micro          |   500 |        139,150,001 |           4.85×† |            — |             — |           — |          — |                 — |
| named-resolve-slots-16                         | micro          |   500 |        137,877,585 |           4.90×† |            — |             — |           — |          — |                 — |
| named-resolve-slots-64                         | micro          |   500 |        138,414,740 |           4.98×† |            — |             — |           — |          — |                 — |
| optional-missing-transient                     | micro          |   200 |         53,385,020 |           1.07×† |            — |             — |      12.3×† |     3.93×† |                 — |
| realistic-graph-resolve-root                   | realistic      |    20 |         20,245,671 |            2.80× |        2.92× |         5.66× |       16.1× |      1.80× |             1.33× |
| realistic-graph-cold-resolve                   | realistic      |     1 |           293,772‡ |           9.22×‡ |       4.52×‡ |        2.04×‡ |      4.78×‡ |     1.07×‡ |            2.34×‡ |
| realistic-graph-resolved-root                  | realistic      |    20 |        64,294,946‡ |          3.33×†‡ |            — |             — |     52.0×†‡ |    5.42×†‡ |           4.12×†‡ |
| realistic-graph-class-resolve-root             | realistic      |    20 |         58,595,677 |           3.11×† |       9.87×† |        14.4×† |      46.5×† |     5.27×† |            3.14×† |
| realistic-graph-class-cold-resolve             | realistic      |     1 |           550,441‡ |           34.2×‡ |       19.8×‡ |        1.34×‡ |      5.84×‡ |     0.79×‡ |            2.30×‡ |
| realistic-graph-validate                       | realistic      |    10 |         20,387,155 |                — |            — |             — |           — |          — |                 — |
| fan-out-tree-depth-3-breadth-4                 | fan-out        |    20 |          1,836,937 |            1.78× |        2.10× |         3.14× |       9.25× |      2.11× |                 — |
| resolve-all-strategies-10                      | fan-out        |     1 |        29,592,714‡ |           7.72×‡ |            — |        3.37×‡ |           — |    0.81×†‡ |           0.84×†‡ |
| resolve-all-strategies-100                     | fan-out        |     1 |         24,032,943 |            53.8× |            — |         18.2× |           — |    0.65×†‡ |            0.66×† |
| resolve-all-cold-10                            | fan-out        |     1 |          2,325,548 |           31.6×‡ |            — |         0.68× |           — |      1.10× |             1.49× |
| resolve-all-cold-100                           | fan-out        |     1 |           261,013‡ |           28.1×‡ |            — |        0.49×‡ |           — |     1.76×‡ |            1.65×‡ |
| resolve-all-named-8                            | fan-out        |     1 |         23,853,786 |            2.15× |            — |             — |           — |          — |                 — |
| resolve-all-named-16                           | fan-out        |     1 |         23,613,096 |            2.13× |            — |             — |           — |          — |                 — |
| resolve-all-named-32                           | fan-out        |     1 |         23,787,330 |            2.19× |            — |             — |           — |          — |                 — |
| resolve-all-named-64                           | fan-out        |     1 |         23,063,598 |            2.16× |            — |             — |           — |          — |                 — |
| resolve-async-single-hop                       | async          |     1 |          9,863,712 |            1.34× |            — |             — |           — |          — |                 — |
| async-init-single-hop                          | async          |     1 |          7,303,378 |            1.68× |        1.30× |         1.50× |       2.92× |      1.11× |             1.11× |
| dynamic-async-chain-8                          | async          |     1 |          2,070,624 |            1.40× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-8                      | async          |     1 |          1,221,900 |           1.65×‡ |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-16                     | async          |     1 |            655,554 |           1.68×‡ |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-32                     | async          |     1 |           332,767‡ |           1.81×‡ |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-64                     | async          |     1 |            153,007 |            1.91× |            — |             — |           — |          — |                 — |
| async-branch-chain-8                           | async          |     1 |          1,362,482 |                — |            — |             — |           — |          — |                 — |
| async-branch-escape-mid-chain-8                | async          |     1 |          1,719,127 |                — |            — |             — |           — |          — |                 — |
| async-diamond-shared-leaf                      | async          |     1 |          1,835,856 |            1.29× |            — |             — |           — |          — |                 — |
| plan-async-resolved-chain-8                    | async          |     1 |          2,791,775 |                — |            — |             — |           — |          — |                 — |
| plan-async-class-chain-8                       | async          |     1 |          5,513,771 |                — |            — |             — |           — |          — |                 — |
| resolve-all-async-8                            | async          |     1 |            981,153 |            1.01× |            — |             — |           — |          — |                 — |
| resolve-optional-async-miss                    | async          |     1 |          8,910,184 |            1.38× |            — |             — |           — |          — |                 — |
| lifecycle-post-construct-singleton             | lifecycle      |   250 |        185,892,873 |           3.31×† |            — |             — |           — |          — |                 — |
| lifecycle-pre-destroy-unbind                   | lifecycle      |     1 |          3,429,659 |            24.6× |       8.48×‡ |         2.38× |           — |      1.12× |                 — |
| binding-level-activation-hook                  | lifecycle      |   200 |         61,148,444 |           2.33×† |            — |             — |           — |          — |                 — |
| child-depth-1-resolve                          | scope          |   500 |        107,603,884 |           1.54×† |       4.38×† |        7.16×† |      20.1×† |     4.81×† |            1.24×† |
| child-depth-2-resolve                          | scope          |   500 |        108,989,803 |           1.45×† |       5.64×† |        8.55×† |      21.5×† |     8.43×† |            1.42×† |
| child-depth-4-resolve                          | scope          |   500 |        109,260,559 |           1.55×† |       8.24×† |        11.1×† |      23.6×† |     17.4×† |            2.21×† |
| child-depth-8-resolve                          | scope          |   500 |        107,327,322 |           1.55×† |       14.6×† |        16.9×† |      28.2×† |     32.4×† |            3.12×† |
| child-request-lifecycle-create-resolve-dispose | scope          |   100 |         2,647,162‡ |           51.5×‡ |       12.8×‡ |        5.20×‡ |           — |     1.57×‡ |                 — |
| fresh-child-default-n1                         | scope          |   100 |        10,108,844‡ |           41.4×‡ |       8.17×‡ |        7.18×‡ |           — |     1.87×‡ |                 — |
| fresh-child-default-n4                         | scope          |   100 |         7,085,416‡ |           29.4×‡ |       6.40×‡ |        6.67×‡ |           — |     2.53×‡ |                 — |
| fresh-child-name-n1                            | scope          |   100 |         10,314,839 |           46.2×‡ |            — |             — |           — |          — |                 — |
| fresh-child-name-n4                            | scope          |   100 |         6,649,546‡ |           28.3×‡ |            — |             — |           — |          — |                 — |
| fresh-child-tag-n1                             | scope          |   100 |         9,439,870‡ |           46.0×‡ |            — |             — |           — |          — |                 — |
| fresh-child-tag-n4                             | scope          |   100 |         7,088,140‡ |           32.3×‡ |            — |             — |           — |          — |                 — |
| scale-mid-transient-chain-32                   | scale          |     1 |          1,493,905 |            2.46× |        4.98× |         4.26× |       10.4× |      1.60× |                 — |
| scale-deep-transient-chain-512                 | scale          |     1 |             51,997 |            2.51× |        19.7× |         3.10× |       6.66× |      1.19× |                 — |
| boot-decorated-container-build-and-resolve     | boot           |     1 |            724,898 |           18.7×‡ |            — |         0.98× |           — |          — |             1.99× |
| container-create-empty                         | boot           |   100 |         30,486,743 |          53.6×†‡ |      12.4×†‡ |        1.34×† |      9.31×† |     1.80×† |            0.69×† |
| create-child-empty                             | boot           |   100 |         26,583,426 |            58.5× |       12.4×‡ |         1.18× |       7.80× |      1.90× |            0.58×† |
| bind-128-plain                                 | boot           |     1 |            185,827 |           29.0×‡ |       36.4×‡ |         1.01× |       9.04× |      0.41× |             1.81× |
| bind-128-refined                               | boot           |     1 |             37,423 |           6.20×‡ |            — |             — |           — |          — |                 — |
| misconfigured-missing-binding                  | failure        |     1 |           272,914‡ |           1.55×‡ |       2.30×‡ |        0.73×‡ |      0.78×‡ |     0.78×‡ |            0.89×‡ |
| circular-dependency-3                          | failure        |     1 |           164,502‡ |          186.4×‡ |       1.53×‡ |             — |           — |          — |            0.50×‡ |
| ambiguous-multi-binding                        | failure        |     1 |           231,131‡ |           1.51×‡ |            — |             — |           — |          — |                 — |
| production-http-handler                        | production     |    50 |          1,812,711 |           31.5×‡ |       8.17×‡ |        3.50×‡ |           — |      1.20× |                 — |
| production-unit-of-work                        | production     |   100 |         1,008,838‡ |           17.1×‡ |       6.82×‡ |        2.40×‡ |           — |     1.15×‡ |                 — |
| production-event-bus-dispatch                  | production     |   100 |         50,040,504 |           12.8×† |            — |        5.75×† |           — |     0.72×† |            0.93×† |
| to-resolved-3-deps                             | micro          |   200 |        186,278,813 |           3.37×† |            — |             — |      31.7×† |     0.97×† |            1.68×† |
| to-alias-redirect                              | micro          |   500 |        110,051,155 |           2.07×† |       6.27×† |        12.3×† |           — |          — |            0.90×† |
| to-self-binding                                | micro          |   300 |        175,351,489 |           3.03×† |            — |        8.02×† |           — |          — |            2.98×† |
| alias-chain-3                                  | micro          |   500 |        111,139,255 |           4.46×† |       14.8×† |        25.7×† |           — |          — |            1.12×† |
| alias-parent-owned-terminal                    | micro          |   500 |        100,359,474 |           1.86×† |       6.92×† |        12.3×† |           — |          — |            0.87×† |
| alias-cycle-detected                           | failure        |     1 |           248,088‡ |          714.0×‡ |       2.70×‡ |             — |           — |          — |            0.83×‡ |
| resolve-optional-hit                           | micro          |   500 |        214,560,510 |           6.65×† |       5.98×† |             — |      37.6×† |     1.05×† |            1.65×† |
| resolve-optional-miss                          | micro          |   500 |        262,661,307 |           7.77×† |       4.92×† |             — |      4.34×† |     4.86×† |            1.94×† |
| tagged-binding-resolve                         | micro          |   300 |        145,886,227 |           7.06×† |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-1                         | micro          |   300 |        217,240,052 |           10.4×† |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-4                         | micro          |   300 |        218,223,368 |           10.1×† |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-16                        | micro          |   300 |        219,747,340 |           9.67×† |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-64                        | micro          |   300 |        216,869,602 |           9.64×† |            — |             — |           — |          — |                 — |
| conditional-injection-tagged                   | micro          |   300 |         78,347,268 |           2.07×† |            — |             — |      32.7×† |          — |                 — |
| rebind-hot-swap                                | lifecycle      |    50 |         20,752,638 |           46.6×‡ |        1.57× |             — |           — |     0.23×† |                 — |
| has-bound-check                                | introspection  |  1000 |        367,833,943 |           6.73×† |       1.30×† |        3.40×† |           — |     1.60×† |                 — |
| has-own-unbound-check                          | introspection  |  1000 |        529,054,097 |           5.34×† |            — |        4.98×† |           — |          — |                 — |
| container-level-activation-hook                | lifecycle      |   200 |         55,143,704 |           2.02×† |            — |        4.75×† |           — |          — |                 — |
| scoped-binding-per-child                       | scope          |   100 |         5,837,695‡ |           47.7×‡ |       3.68×‡ |        1.25×‡ |      5.08×‡ |     1.38×‡ |                 — |
| rebind-parent-resolve-child-depth-3            | lifecycle      |    50 |         12,104,044 |            73.9× |        1.35× |             — |           — |      1.37× |                 — |
| materialize-100-singletons                     | lifecycle      |     1 |             79,477 |           21.5×‡ |       15.6×‡ |         2.09× |           — |      0.58× |                 — |
| unbind-all-100-singletons                      | lifecycle      |     1 |            60,273‡ |           21.0×‡ |       12.6×‡ |        1.63×‡ |           — |     0.55×‡ |                 — |
| module-load-unload                             | boot           |     1 |         1,176,768‡ |           16.3×‡ |            — |             — |           — |          — |                 — |
| module-cold-from-modules                       | boot           |     1 |          2,101,475 |           24.4×‡ |            — |             — |       4.10× |      1.31× |                 — |
| module-cold-128                                | boot           |     1 |            210,420 |           27.3×‡ |            — |             — |       1.41× |      2.43× |                 — |
| initialize-async-warmup                        | boot           |     1 |            610,454 |                — |            — |             — |           — |          — |                 — |
| inspect-snapshot                               | introspection  |    20 |          9,631,647 |                — |            — |             — |           — |          — |                 — |
| lookup-bindings                                | introspection  |   200 |         24,854,366 |                — |            — |             — |           — |          — |                 — |
| generate-dependency-graph                      | introspection  |    10 |            733,180 |                — |            — |             — |           — |          — |                 — |
| multi-tag-slot-resolve                         | micro          |   300 |         14,017,667 |                — |            — |             — |           — |          — |                 — |
| multi-tag-constraint-resolve                   | micro          |   200 |          7,550,210 |                — |            — |             — |           — |          — |                 — |
| multi-tag-select-32                            | micro          |   300 |          2,780,851 |                — |            — |             — |           — |          — |                 — |
| mask-reject-wide-catalog                       | slot-selection |   300 |         28,161,216 |                — |            — |             — |           — |          — |                 — |
| mask-accept-two-of-four                        | slot-selection |   300 |         19,742,944 |                — |            — |             — |           — |          — |                 — |
| mask-collision-same-bit                        | slot-selection |   300 |         44,877,927 |                — |            — |             — |           — |          — |                 — |
| slot-tag-array-hoisted                         | slot-selection |   300 |        144,857,567 |                — |            — |             — |           — |          — |                 — |
| slot-tag-shorthand-hoisted                     | slot-selection |   300 |        159,050,165 |                — |            — |             — |           — |          — |                 — |
| slot-tag-array-inline                          | slot-selection |   300 |         94,871,797 |                — |            — |             — |           — |          — |                 — |
| slot-tag-shorthand-inline                      | slot-selection |   300 |        114,748,924 |                — |            — |             — |           — |          — |                 — |
| slot-tag-zero-value                            | slot-selection |   300 |        144,972,596 |           6.89×† |            — |             — |           — |          — |                 — |
| slot-name-and-tag                              | slot-selection |   300 |         47,126,221 |           2.46×† |            — |             — |           — |          — |                 — |
| slot-tag-resolve-all                           | slot-selection |   300 |         41,343,408 |           3.53×† |            — |             — |           — |          — |                 — |
| slot-tag-miss-optional                         | slot-selection |   300 |         62,982,296 |           2.44×† |            — |             — |           — |          — |                 — |
| slot-tag-parent-owned                          | slot-selection |   300 |        126,756,585 |           5.92×† |            — |             — |           — |          — |                 — |
| slot-name-parent-owned                         | slot-selection |   300 |        107,314,770 |           4.36×† |            — |             — |           — |          — |                 — |
| slot-injected-name-compiled                    | slot-selection |   300 |         68,376,590 |                — |            — |             — |           — |          — |                 — |
| slot-injected-name-interpreted                 | slot-selection |   300 |          4,282,766 |                — |            — |             — |           — |          — |                 — |
| slot-injected-tag-compiled                     | slot-selection |   300 |         69,190,499 |                — |            — |             — |           — |          — |                 — |
| slot-injected-tag-interpreted                  | slot-selection |   300 |          4,396,113 |                — |            — |             — |           — |          — |                 — |
| plan-deps-inlined                              | resolution     |   300 |         60,339,372 |                — |            — |             — |           — |          — |                 — |
| plan-escape-factory-dep                        | resolution     |   300 |          7,252,179 |                — |            — |             — |           — |          — |                 — |
| plan-escape-scoped-dep                         | resolution     |   300 |        11,828,644‡ |                — |            — |             — |           — |          — |                 — |
| plan-escape-hooked-dep                         | resolution     |   300 |          3,158,882 |                — |            — |             — |           — |          — |                 — |
| plan-escape-optional-dep                       | resolution     |   300 |          5,491,491 |                — |            — |             — |           — |          — |                 — |
| plan-escape-multi-dep                          | resolution     |   300 |          2,701,426 |                — |            — |             — |           — |          — |                 — |
| plan-class-chain-24                            | resolution     |     1 |          7,342,773 |                — |            — |             — |           — |          — |                 — |
| plan-class-chain-40                            | resolution     |     1 |         4,480,811‡ |                — |            — |             — |           — |          — |                 — |
| interpreted-class-chain-24                     | resolution     |     1 |            456,094 |                — |            — |             — |           — |          — |                 — |
| interpreted-class-chain-40                     | resolution     |     1 |            240,424 |                — |            — |             — |           — |          — |                 — |
| plan-runs-1                                    | resolution     |     1 |           858,553‡ |                — |            — |             — |           — |          — |                 — |
| plan-runs-256                                  | resolution     |     1 |             15,091 |                — |            — |             — |           — |          — |                 — |
| plan-runs-512                                  | resolution     |     1 |              7,969 |                — |            — |             — |           — |          — |                 — |
| plan-runs-1024                                 | resolution     |     1 |              3,851 |                — |            — |             — |           — |          — |                 — |
| plan-runs-2048                                 | resolution     |     1 |              1,921 |                — |            — |             — |           — |          — |                 — |
| plan-runs-4096                                 | resolution     |     1 |              1,102 |                — |            — |             — |           — |          — |                 — |
| plan-runs-8192                                 | resolution     |     1 |                610 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-1                               | resolution     |     1 |           236,094‡ |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-256                             | resolution     |     1 |              4,547 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-512                             | resolution     |     1 |              2,394 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-1024                            | resolution     |     1 |              1,259 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-2048                            | resolution     |     1 |                640 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-8192                            | resolution     |     1 |                209 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-1                              | resolution     |     1 |            774,325 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-512                            | resolution     |     1 |              7,543 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-1024                           | resolution     |     1 |              4,065 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-2048                           | resolution     |     1 |              1,918 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-8192                           | resolution     |     1 |                627 |                — |            — |             — |           — |          — |                 — |
| nested-context-resolve-in-factory              | resolution     |   300 |         44,521,723 |           1.83×† |       3.80×† |        5.33×† |      18.2×† |     2.49×† |            0.87×† |
| nested-container-resolve-in-factory            | resolution     |   300 |         41,627,089 |           1.67×† |       2.99×† |        5.02×† |      16.9×† |     1.11×† |            0.88×† |
| accessor-injection-construct                   | resolution     |   300 |         7,896,751‡ |          0.22×†‡ |            — |             — |           — |          — |                 — |

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
