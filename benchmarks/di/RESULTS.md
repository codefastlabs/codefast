# Results

Where `@codefast/di` actually stands against the field right now, wins and losses given equal weight — the point of this
page is to know where the engine is slower so the next change knows what to aim at. One machine-derived snapshot, no
accreted ledger. The method is in [`BENCH_GUIDE.md`](./BENCH_GUIDE.md); re-run it with the recipe at the bottom.

**This is one full-profile pass, so read the aggregates, not the rows.** GC-exposed for one collection between trials,
one subprocess per scenario, libraries interleaved with rotating order, 3 trials each over the one closure a scenario
builds before its first trial — a single pass measures no between-run variance of its own, 100 of the cells carry a
per-trial IQR above 5%, and 141 cells in 48 rows sit above ~30M ops/s, where the ratio moves between runs of the same
build whatever its IQR says. Ratios are worth more than the absolute `hz/op`; a single row is worth less than the group
it sits in. A loss highlighted below points at a direction — quote a precise factor only after a paired re-run, except
where a loss is a structural difference that reproduces by construction (called out as such).

**This page is the baseline.** It transcribes `baselines/2026-09-27T13-27-52-059Z`, whose `observations.jsonl` is
committed, so every figure here can be re-read from the repository rather than from a local `bench-results/` run only
the author has. `baselines/` holds that one run and nothing else: the next pass is read against it, and a pass accepted
in its place becomes this page. 145 scenarios ran, 131 of them aggregate-eligible; every library implements every row
its declared features allow, so a `—` below is a feature the library lacks, never a row nobody wrote.

**Environment.** `@codefast/di` at `92b3596a7` — 0.11.0 plus the unreleased 0.12 changes — from a `dist` built first, on
Node 26.1.0 / V8 14.6, Apple M3 Max × 14, darwin/arm64, `--expose-gc` for every library. inversify 8.2.3 · awilix 13.0.5
· tsyringe 4.10.0 · brandi 5.1.0 · ditox 3.3.0 · injection-js 2.6.1. Each library runs at its canonical decorator mode
(inversify legacy decorators + `reflect-metadata`, codefast TC39 Stage 3 + `Symbol.metadata`); every inversify container
uses `{ jitless: false }`, its fastest documented configuration. Run 2026-09-27, 2m18s wall, 0 sanity failures; the
1-minute load average read 2.60 at every child's start, on fourteen cores. Two passes within the hour before it, over
the build without the teardown change and under load averages of 3.39 and 2.77, read every median within 7% of these.

**What moved since the previous pass.** Per row, every library reads at the previous pass's median, 0.99× to 1.01×, so
this pass sits level with the last and a row that moved is the row, not the pass. The rows the engine changes reached
moved on their own: `unbind-all-100-singletons` +24%, `materialize-100-singletons` +14%,
`boot-decorated-container-build-and-resolve` +18%, the `plan-escape-*` rows +11% to +21%, the `fresh-child-*-n4` rows
+7% to +12% and `plan-runs-mixed-1` +10%, since a class's constructor parameters settle once, the class read last
answers without a map lookup, and a teardown reads a class's `@preDestroy` methods once for a run of its bindings; and
`rebind-parent-resolve-child-depth-3` +9%, since a rebind drains its displaced binding without building an array.
Against ditox the 100-singleton pair moved from 0.58× and 0.55× to 0.66× and 0.66×. Four rows read 7% to 19% lower here
and in a pass over the build before the teardown change — `create-child-empty`, `production-event-bus-dispatch`,
`async-init-single-hop` and `interpreted-class-chain-24` — and a paired probe of the build before the class-lane change
against the one after the rebind change reads each within 3%, so the drop is the pass, not the engine.

## Summary — where we stand

Ratios are `@codefast/di ÷ competitor`; above 1× means codefast is faster. Win `>1.03×`, parity `0.97–1.03×`, loss
`<0.97×`. `Comparable` counts the rows both libraries ran, of 131 aggregate-eligible rows codefast measures; `†` is how
many of those the median and geomean carry from above the throughput ceiling — they stay in the aggregate but no reader
should cite one alone.

| Competitor     | Comparable | Win / parity / loss | Median | Geomean |   † |
| -------------- | ---------: | ------------------: | -----: | ------: | --: |
| InversifyJS 8  |  92 of 131 |          90 / 1 / 1 |  4.28× |   5.79× |  45 |
| Awilix 13      |  38 of 131 |          38 / 0 / 0 |  6.51× |   6.11× |  17 |
| tsyringe 4     |  43 of 131 |          38 / 0 / 5 |  4.73× |   3.97× |  20 |
| Brandi 5       |  30 of 131 |          29 / 0 / 1 |  14.2× |   11.9× |  17 |
| Ditox 3        |  45 of 131 |         33 / 2 / 10 |  1.44× |   1.68× |  21 |
| injection-js 2 |  31 of 131 |         19 / 2 / 10 |  1.47× |   1.45× |  21 |

**The headline, stated plainly: codefast sweeps awilix outright, takes inversify and brandi on all but one row each,
wins tsyringe on the median by 4.73× while losing it five rows, two of those at 0.96×, and holds both aggregates against
the two libraries it is closest to** — ditox 1.44× on the median and 1.68× on the geomean, injection-js 1.47× and 1.45×.
The losses cluster in four shapes, and every one of them is named in the next section: **registration** and everything
that binds before it resolves, **cold collections** against tsyringe, the **failure path**, and a handful of warm rows
above the throughput ceiling where ditox and injection-js read level or ahead.

## The losses, foregrounded — where to improve

Ordered by how much they matter, each marked as a **real deficit** (same work, codefast slower), a **work difference**
(codefast does more per op by design, so the row is a design cost to reconsider, not a bug) or a **chosen cost** (a
correctness property paid for with its price known).

- **Registration is the biggest deficit, and ditox is the rival it is wide against.** `bind-128-plain` — 128 transient
  factory bindings into a fresh container, no resolve — runs at 0.39× ditox, 0.96× tsyringe and 1.82× injection-js. What
  it pays is the object: the chain object is the fluent builder the contract returns, and the probe is last-wins, so
  closing this row is a contract change (a lighter builder, or a bulk bind), not an optimisation. Everything that binds
  before it resolves sits on the same floor — `create-child-empty` 1.45× ditox and 0.96× tsyringe,
  `container-create-empty` 1.85×† and 1.30×†, `realistic-graph-class-cold-resolve` 0.81×‡ ditox and 1.29×‡ tsyringe,
  `boot-decorated-container-build-and-resolve` 1.17× tsyringe, `module-cold-from-modules` 1.35× ditox. The two
  empty-container rows lose injection-js above the ceiling (0.69×† and 0.46×†), whose injector is fewer objects still.
  **Real deficit, structural** — one object per binding is the design.
- **The cold collection loses tsyringe, and only tsyringe.** `resolve-all-cold-N` builds a fresh container and reads the
  collection once: at N=10, 0.70×‡ tsyringe while ditox 1.11× and injection-js 1.53× are wins; at N=100, 0.49×‡
  tsyringe, 1.67×‡ ditox and 1.44×‡ injection-js. What the pair still pays is the registration above, ten or a hundred
  times, against tsyringe's plain array of providers. **Real deficit against tsyringe — the registration cost seen from
  the collection side.**
- **Teardown at scale is mostly a registration loss and a cold-class loss, with a smaller teardown share on top.**
  `materialize-100-singletons` (bind and resolve 100 singletons, no teardown) is 0.66× ditox and 2.35× tsyringe;
  `unbind-all-100-singletons` (the same, then `unbindAll()` with a hundred `@preDestroy` calls) 0.66×‡ and 1.96×‡. Read
  as time, the teardown itself — the second row less the first — is about 2.4 µs for the hundred against ditox's 1.5 µs
  for its `removeAll()`: the walk plus a method found by name on each instance, where ditox calls the one function it
  was handed. Most of either row sits underneath it: the 100 bindings, and the first resolve of each, because codefast's
  side binds a class with `.to(Class).singleton()` where ditox binds a factory, and constructing a class with metadata
  costs more than calling a factory. `lifecycle-pre-destroy-unbind` (one singleton, one hook) is 1.20× ditox and 2.61×
  tsyringe. **Real deficit on the registration and the cold class lane underneath; the teardown share is a work
  difference, a hook found by name.**
- **The stable-set collections are a chosen cost.** `resolve-all-strategies-10` 0.88×†‡ ditox and 0.91×†‡ injection-js,
  `-100` 0.66×†‡ and 0.96×, and `production-event-bus-dispatch` 0.67×† ditox and 0.81×† injection-js: a root-level
  `resolveAll` hands each caller a copy of its memoized list rather than the list itself, so no caller can mutate the
  engine's memo, while both rivals hand out the cached array they share. The event bus is that copy plus the dispatch;
  the one map read it used to pay beyond the copy is absorbed by a one-entry cell in front of the collection memo. A
  frozen list was measured and rejected — a frozen array iterates through a slow elements kind for every consumer.
  **Chosen cost**, its own commit, reversible alone.
- **Rebind wins awilix and still loses ditox above the ceiling.** `rebind-hot-swap` 1.60× awilix and 0.23×† ditox;
  `rebind-parent-resolve-child-depth-3` 1.45× awilix and 1.79× ditox. A rebind of a lone token is one registration whose
  displaced binding is deactivated on the spot; what it pays against ditox's bare map write is the builder object and
  the deactivation walk. **Work difference**, above the ceiling.
- **Three rows lose injection-js above the ceiling.** `nested-context-resolve-in-factory` 0.87×† and
  `nested-container-resolve-in-factory` 0.88×† — a factory that resolves from its context or from the container
  mid-construction — and `alias-parent-owned-terminal` 0.79×†, with `to-alias-redirect` (1.01×†) and `alias-chain-3`
  (0.99×†) level beside it. Measured on their own, outside the harness, codefast is ahead of injection-js on both
  nested-factory shapes. The loss appears in the harness child, which builds every scenario before it measures one, so
  the factory call site that the transient dynamic lane inlines has already seen hundreds of factories and V8 stops
  inlining through it; injection-js's lane inlines nothing to begin with, so the same state costs it nothing. The
  harness keeps that state on purpose, as [`BENCH_GUIDE.md`](./BENCH_GUIDE.md) records. The aliases are structural:
  injection-js caches an alias's answer in the injector's own slot on the first read, while codefast resolves the alias
  on every read and never caches a parent's instance in a child. **Harness state** for the two nested rows, **work
  difference** for the aliases. Below the ceiling, `realistic-graph-resolve-root` reads 0.92× injection-js against 1.33×
  in the previous pass: injection-js's own throughput on the row moved from 15.5M to 20.6M ops/s between the two, while
  a paired probe reads codefast's level, so one pass does not settle that ratio.
- **`accessor-injection-construct` 0.25×†‡ inversify.** The row measures the benchmark's transpiler as much as the
  engine: tsx's esbuild lowers the scenario's decorated `accessor` field to `WeakMap`-backed privates (`__privateAdd`,
  `__accessCheck`) and its own decorator runtime. A standalone probe of the same class compiled by the repo's `tsc`,
  which keeps a native private field, resolves in 44 ns against 139 ns through esbuild, so the lowering is most of the
  row. What the engine pays is the ambient scope around construction and the accessor's own `resolve` through the
  container, where inversify's property injection is a metadata read on the same plan. **Work difference**, and the
  harness stays as it is: a codefast user on Vite or tsx pays the same lowering, and a different transpiler for one
  library would move every codefast row, canaries included.
- **Failing fast costs more here: `misconfigured-missing-binding` 0.76×‡ tsyringe, 0.78×‡ brandi, 0.78×‡ ditox, 0.92×‡
  injection-js.** codefast builds a structured error carrying the resolution path; the rivals throw a string, and the
  stack capture both pay is most of the row. **Work difference** on a path a production request should never take.

## The wins

- **inversify — 90 of 92 comparable rows, 4.28× median, 5.79× geomean.** Widest margins on `boot` (24.3×), `production`
  (17.9×), `scope` (13.6×), `lifecycle` (13.1×), `realistic` (6.36×), `fan-out` (6.12×), `introspection` (5.93×),
  `micro` (4.20×) and `slot-selection` (3.92×); tightest on `scale` (2.54×), `failure` (1.56×), `async` (1.49×) and
  `resolution` (0.96×, which is the accessor row pulling against the plan rows). `resolve-all-async-8` is at parity
  (1.00×), and `circular-dependency-3` and `alias-cycle-detected` are excluded from the aggregates entirely — inversify
  recurses toward the stack limit rather than detecting either.
- **awilix — 38 of 38, 6.51× median, 6.11× geomean, no loss at all.** Widest on `boot` (15.9×), `scale` (9.87×),
  `realistic` (7.26×), `production` (7.24×), `scope` (7.19×) and `micro` (6.72×); tightest on `async` (1.21×) and
  `introspection` (1.19×).
- **tsyringe — 38 of 43, 4.73× median, 3.97× geomean.** 12.7× on `micro`, 6.60× on `scope`, 5.21× on `resolution` and
  4.04× on `introspection`; it keeps five rows — the two cold collections, the missing-binding throw, and
  `create-child-empty` and `bind-128-plain` at 0.96×, a hair under parity — while the decorated boot is a win at 1.17×.
- **brandi — 29 of 30, 14.2× median, 11.9× geomean.** 23.5× on `micro`, 17.8× on `resolution`, 17.2× on `scope` and
  16.1× on `realistic`; it loses only the missing-binding throw (0.78×‡).
- **ditox — 33 rows to 10 with two at parity, and both aggregates (1.44× median, 1.68× geomean).** The sweep is in the
  warm work and the per-request work: `scope` 4.73×, `realistic` 2.11×, `micro` 2.05×, `resolution` 1.65×,
  `introspection` 1.58×, `scale` 1.37×, `boot` 1.26×, `fan-out` 1.17×, `async` 1.03×. Named rows: `module-cold-128`
  2.27×, `container-create-empty` 1.85×†, `rebind-parent-resolve-child-depth-3` 1.79×, `resolve-all-cold-100` 1.67×‡,
  `create-child-empty` 1.45×, `module-cold-from-modules` 1.35×, `scale-deep-transient-chain-512` 1.22×,
  `lifecycle-pre-destroy-unbind` 1.20×, `nested-container-resolve-in-factory` 1.14×†, `resolve-all-cold-10` 1.11×;
  `async-init-single-hop` (1.03×) and `to-resolved-3-deps` (0.97×†) sit at parity, and `singleton-class-1-dep` is a
  0.96×† loss above the ceiling. What it still takes is every row that binds many things and the two stable sets;
  `lifecycle` (0.74×, the 100-singleton pair) and `failure` (0.78×, the missing-binding throw) are its winning groups,
  and `production` is level (0.98×).
- **injection-js — 19 rows to 10 with two at parity, 1.47× median, 1.45× geomean.** `realistic` 2.34×, `scope` 1.90×,
  `micro` 1.62×; narrower on `fan-out` (1.18×), `boot` (1.08×) and `async` (1.04×). Its wins are the ceiling rows above,
  the two stable sets, the two empty containers, the event bus, the missing-binding throw and this pass's realistic
  root, which leave it the `production` (0.81×), `resolution` (0.87×) and `failure` (0.92×) groups. The aliases and the
  event bus are shapes where a `ReflectiveInjector` that caches every provider's answer per injector does less work than
  a container that does not; the two nested-factory rows are the harness state the loss list names.

## Geomean by group

Geomean of the ratios in each group, comparable row count in parentheses. Read a group, not a cell.

| Group          | InversifyJS 8 | Awilix 13 | tsyringe 4 |  Brandi 5 |   Ditox 3 | injection-js 2 |
| -------------- | ------------: | --------: | ---------: | --------: | --------: | -------------: |
| micro          |    4.20× (22) | 6.72× (8) |  12.7× (7) | 23.5× (8) | 2.05× (7) |      1.62× (9) |
| realistic      |     6.36× (5) | 7.26× (4) |  3.70× (4) | 16.1× (5) | 2.11× (5) |      2.34× (5) |
| fan-out        |     6.12× (9) | 1.99× (1) |  2.32× (5) | 9.72× (1) | 1.17× (5) |      1.18× (4) |
| async          |    1.49× (10) | 1.21× (1) |  1.44× (1) | 2.72× (1) | 1.03× (1) |      1.04× (1) |
| lifecycle      |     13.1× (8) | 5.60× (5) |  2.74× (4) |         — | 0.74× (5) |              — |
| scope          |    13.6× (12) | 7.19× (8) |  6.60× (8) | 17.2× (5) | 4.73× (8) |      1.90× (4) |
| scale          |     2.54× (2) | 9.87× (2) |  3.64× (2) | 8.58× (2) | 1.37× (2) |              — |
| boot           |     24.3× (8) | 15.9× (3) |  1.09× (4) | 4.88× (5) | 1.26× (5) |      1.08× (4) |
| failure        |     1.56× (2) | 2.36× (1) |  0.76× (1) | 0.78× (1) | 0.78× (1) |      0.92× (1) |
| production     |     17.9× (3) | 7.24× (2) |  3.52× (3) |         — | 0.98× (3) |      0.81× (1) |
| introspection  |     5.93× (2) | 1.19× (1) |  4.04× (2) |         — | 1.58× (1) |              — |
| slot-selection |     3.92× (6) |         — |          — |         — |         — |              — |
| resolution     |     0.96× (3) | 3.44× (2) |  5.21× (2) | 17.8× (2) | 1.65× (2) |      0.87× (2) |

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
| constant-resolve                               | micro          |  1000 |        212,527,823 |           2.82×† |       5.65×† |        11.2×† |      37.8×† |     1.10×† |            1.86×† |
| singleton-class-1-dep                          | micro          |   200 |        186,447,644 |           3.25×† |       4.52×† |        11.0×† |      32.5×† |     0.96×† |            3.16×† |
| transient-class-1-dep                          | micro          |   200 |         74,381,230 |           1.81×† |       8.63×† |        12.7×† |      32.5×† |     8.03×† |                 — |
| named-constant-get                             | micro          |   500 |         99,256,198 |           3.62×† |            — |             — |           — |          — |                 — |
| named-resolve-slots-1                          | micro          |   500 |        139,705,716 |           5.13×† |            — |             — |           — |          — |                 — |
| named-resolve-slots-4                          | micro          |   500 |        139,465,321 |           5.08×† |            — |             — |           — |          — |                 — |
| named-resolve-slots-16                         | micro          |   500 |        136,500,427 |           5.04×† |            — |             — |           — |          — |                 — |
| named-resolve-slots-64                         | micro          |   500 |        138,278,932 |           4.91×† |            — |             — |           — |          — |                 — |
| optional-missing-transient                     | micro          |   200 |         55,243,804 |           1.09×† |            — |             — |      13.1×† |     3.92×† |                 — |
| realistic-graph-resolve-root                   | realistic      |    20 |         18,997,055 |            2.81× |        2.79× |         5.48× |       15.4× |      1.61× |             0.92× |
| realistic-graph-cold-resolve                   | realistic      |     1 |           289,414‡ |           10.8×‡ |       4.76×‡ |        2.07×‡ |      4.74×‡ |     1.06×‡ |            2.33×‡ |
| realistic-graph-resolved-root                  | realistic      |    20 |         62,414,995 |           3.30×† |            — |             — |      50.8×† |     5.45×† |            3.06×† |
| realistic-graph-class-resolve-root             | realistic      |    20 |         59,199,460 |           3.05×† |       10.1×† |        12.8×† |      47.7×† |     5.43×† |            4.23×† |
| realistic-graph-class-cold-resolve             | realistic      |     1 |           566,705‡ |           34.2×‡ |       20.7×‡ |        1.29×‡ |      6.07×‡ |     0.81×‡ |            2.50×‡ |
| realistic-graph-validate                       | realistic      |    10 |         20,160,252 |                — |            — |             — |           — |          — |                 — |
| fan-out-tree-depth-3-breadth-4                 | fan-out        |    20 |          1,784,860 |            1.65× |        1.99× |         2.99× |       9.72× |      2.05× |                 — |
| resolve-all-strategies-10                      | fan-out        |     1 |         32,482,354 |           8.55×† |            — |        3.66×† |           — |    0.88×†‡ |           0.91×†‡ |
| resolve-all-strategies-100                     | fan-out        |     1 |         23,834,654 |            53.3× |            — |         18.0× |           — |    0.66×†‡ |             0.96× |
| resolve-all-cold-10                            | fan-out        |     1 |          2,301,730 |           34.9×‡ |            — |        0.70×‡ |           — |      1.11× |             1.53× |
| resolve-all-cold-100                           | fan-out        |     1 |           244,361‡ |           26.2×‡ |            — |        0.49×‡ |           — |     1.67×‡ |            1.44×‡ |
| resolve-all-named-8                            | fan-out        |     1 |         21,349,786 |            1.95× |            — |             — |           — |          — |                 — |
| resolve-all-named-16                           | fan-out        |     1 |         23,729,420 |            2.16× |            — |             — |           — |          — |                 — |
| resolve-all-named-32                           | fan-out        |     1 |         21,422,086 |            1.99× |            — |             — |           — |          — |                 — |
| resolve-all-named-64                           | fan-out        |     1 |         23,150,081 |            2.10× |            — |             — |           — |          — |                 — |
| resolve-async-single-hop                       | async          |     1 |          9,048,468 |            1.22× |            — |             — |           — |          — |                 — |
| async-init-single-hop                          | async          |     1 |          6,790,051 |            1.61× |        1.21× |         1.44× |       2.72× |      1.03× |             1.04× |
| dynamic-async-chain-8                          | async          |     1 |          2,025,350 |            1.46× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-8                      | async          |     1 |          1,226,682 |            1.65× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-16                     | async          |     1 |            690,589 |            1.68× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-32                     | async          |     1 |            346,080 |            1.85× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-64                     | async          |     1 |            146,830 |            1.83× |            — |             — |           — |          — |                 — |
| async-branch-chain-8                           | async          |     1 |          1,268,799 |                — |            — |             — |           — |          — |                 — |
| async-branch-escape-mid-chain-8                | async          |     1 |          1,677,272 |                — |            — |             — |           — |          — |                 — |
| async-diamond-shared-leaf                      | async          |     1 |          1,850,713 |            1.30× |            — |             — |           — |          — |                 — |
| plan-async-resolved-chain-8                    | async          |     1 |          2,752,455 |                — |            — |             — |           — |          — |                 — |
| plan-async-class-chain-8                       | async          |     1 |          5,384,002 |                — |            — |             — |           — |          — |                 — |
| resolve-all-async-8                            | async          |     1 |            928,716 |            1.00× |            — |             — |           — |          — |                 — |
| resolve-optional-async-miss                    | async          |     1 |          9,906,521 |            1.58× |            — |             — |           — |          — |                 — |
| lifecycle-post-construct-singleton             | lifecycle      |   250 |        186,655,990 |           3.35×† |            — |             — |           — |          — |                 — |
| lifecycle-pre-destroy-unbind                   | lifecycle      |     1 |          3,592,896 |            26.3× |       8.86×‡ |         2.61× |           — |      1.20× |                 — |
| binding-level-activation-hook                  | lifecycle      |   200 |         59,074,854 |           2.22×† |            — |             — |           — |          — |                 — |
| child-depth-1-resolve                          | scope          |   500 |        107,522,241 |           1.60×† |       4.34×† |        7.21×† |      20.6×† |     5.04×† |            1.47×† |
| child-depth-2-resolve                          | scope          |   500 |        108,620,353 |           1.55×† |       5.83×† |        8.58×† |      21.8×† |     8.31×† |            1.32×† |
| child-depth-4-resolve                          | scope          |   500 |        107,738,095 |           1.52×† |       8.38×† |        10.9×† |      23.1×† |     16.7×† |            1.94×† |
| child-depth-8-resolve                          | scope          |   500 |        110,107,346 |           1.60×† |       14.6×† |        17.3×† |      28.6×† |     31.7×† |            3.49×† |
| child-request-lifecycle-create-resolve-dispose | scope          |   100 |          2,440,350 |           46.5×‡ |       11.6×‡ |        4.75×‡ |           — |      1.50× |                 — |
| fresh-child-default-n1                         | scope          |   100 |         10,502,962 |           43.3×‡ |       8.23×‡ |        6.98×‡ |           — |      1.95× |                 — |
| fresh-child-default-n4                         | scope          |   100 |         7,973,954‡ |           31.5×‡ |       7.07×‡ |        7.30×‡ |           — |     2.69×‡ |                 — |
| fresh-child-name-n1                            | scope          |   100 |        10,593,638‡ |           40.7×‡ |            — |             — |           — |          — |                 — |
| fresh-child-name-n4                            | scope          |   100 |          7,260,630 |           31.7×‡ |            — |             — |           — |          — |                 — |
| fresh-child-tag-n1                             | scope          |   100 |        11,026,581‡ |           46.6×‡ |            — |             — |           — |          — |                 — |
| fresh-child-tag-n4                             | scope          |   100 |         7,459,223‡ |           34.9×‡ |            — |             — |           — |          — |                 — |
| scale-mid-transient-chain-32                   | scale          |     1 |          1,478,372 |            2.49× |        4.82× |         4.18× |       10.7× |      1.54× |                 — |
| scale-deep-transient-chain-512                 | scale          |     1 |             53,430 |            2.59× |        20.2× |         3.17× |       6.90× |      1.22× |                 — |
| boot-decorated-container-build-and-resolve     | boot           |     1 |            851,279 |           22.6×‡ |            — |         1.17× |           — |          — |             2.35× |
| container-create-empty                         | boot           |   100 |         30,163,626 |          48.0×†‡ |      11.5×†‡ |        1.30×† |      8.99×† |     1.85×† |            0.69×† |
| create-child-empty                             | boot           |   100 |         21,486,094 |            47.6× |       10.1×‡ |         0.96× |       6.41× |      1.45× |            0.46×† |
| bind-128-plain                                 | boot           |     1 |            183,039 |           26.5×‡ |       34.3×‡ |         0.96× |       8.62× |      0.39× |             1.82× |
| bind-128-refined                               | boot           |     1 |             37,151 |           5.85×‡ |            — |             — |           — |          — |                 — |
| misconfigured-missing-binding                  | failure        |     1 |           277,812‡ |           1.56×‡ |       2.36×‡ |        0.76×‡ |      0.78×‡ |     0.78×‡ |            0.92×‡ |
| circular-dependency-3                          | failure        |     1 |           161,334‡ |          184.2×‡ |       1.49×‡ |             — |           — |          — |            0.50×‡ |
| ambiguous-multi-binding                        | failure        |     1 |           235,642‡ |           1.57×‡ |            — |             — |           — |          — |                 — |
| production-http-handler                        | production     |    50 |         1,786,848‡ |           28.5×‡ |       7.66×‡ |        3.45×‡ |           — |     1.18×‡ |                 — |
| production-unit-of-work                        | production     |   100 |         1,025,597‡ |           17.4×‡ |       6.85×‡ |        2.35×‡ |           — |     1.19×‡ |                 — |
| production-event-bus-dispatch                  | production     |   100 |         46,600,074 |           11.6×† |            — |        5.38×† |           — |     0.67×† |            0.81×† |
| to-resolved-3-deps                             | micro          |   200 |        186,614,452 |           3.40×† |            — |             — |      32.4×† |     0.97×† |            1.69×† |
| to-alias-redirect                              | micro          |   500 |        110,403,527 |           2.03×† |       6.17×† |        12.8×† |           — |          — |            1.01×† |
| to-self-binding                                | micro          |   300 |        171,001,418 |           2.88×† |            — |        7.90×† |           — |          — |            2.89×† |
| alias-chain-3                                  | micro          |   500 |        110,277,395 |           4.19×† |       14.4×† |        26.2×† |           — |          — |            0.99×† |
| alias-parent-owned-terminal                    | micro          |   500 |        101,386,192 |           1.88×† |       6.97×† |        13.0×† |           — |          — |            0.79×† |
| alias-cycle-detected                           | failure        |     1 |           244,654‡ |          704.6×‡ |       2.67×‡ |             — |           — |          — |            0.82×‡ |
| resolve-optional-hit                           | micro          |   500 |        216,399,829 |           6.54×† |       6.04×† |             — |      37.5×† |     1.06×† |            1.70×† |
| resolve-optional-miss                          | micro          |   500 |        263,361,710 |           7.90×† |       5.03×† |             — |      4.57×† |     4.50×† |            1.93×† |
| tagged-binding-resolve                         | micro          |   300 |        146,584,448 |           7.15×† |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-1                         | micro          |   300 |        219,703,269 |           10.0×† |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-4                         | micro          |   300 |        219,679,705 |           10.2×† |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-16                        | micro          |   300 |        219,004,063 |           10.4×† |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-64                        | micro          |   300 |        217,922,326 |           10.1×† |            — |             — |           — |          — |                 — |
| conditional-injection-tagged                   | micro          |   300 |         77,893,969 |           1.99×† |            — |             — |      32.1×† |          — |                 — |
| rebind-hot-swap                                | lifecycle      |    50 |         21,114,749 |           48.9×‡ |        1.60× |             — |           — |     0.23×† |                 — |
| has-bound-check                                | introspection  |  1000 |        364,513,550 |           6.64×† |       1.19×† |        3.34×† |           — |     1.58×† |                 — |
| has-own-unbound-check                          | introspection  |  1000 |        529,649,556 |           5.30×† |            — |        4.89×† |           — |          — |                 — |
| container-level-activation-hook                | lifecycle      |   200 |         54,739,885 |           1.99×† |            — |        4.73×† |           — |          — |                 — |
| scoped-binding-per-child                       | scope          |   100 |         5,917,499‡ |           50.8×‡ |       3.40×‡ |        1.27×‡ |      5.02×‡ |     1.44×‡ |                 — |
| rebind-parent-resolve-child-depth-3            | lifecycle      |    50 |         13,023,106 |           74.9×‡ |        1.45× |             — |           — |      1.79× |                 — |
| materialize-100-singletons                     | lifecycle      |     1 |             90,825 |           23.8×‡ |       18.0×‡ |         2.35× |           — |      0.66× |                 — |
| unbind-all-100-singletons                      | lifecycle      |     1 |            74,321‡ |           25.1×‡ |       14.9×‡ |        1.96×‡ |           — |     0.66×‡ |                 — |
| module-load-unload                             | boot           |     1 |         1,184,479‡ |           18.5×‡ |            — |             — |           — |          — |                 — |
| module-cold-from-modules                       | boot           |     1 |          2,189,357 |           25.1×‡ |            — |             — |      4.28×‡ |      1.35× |                 — |
| module-cold-128                                | boot           |     1 |            201,933 |           32.4×‡ |            — |             — |       1.31× |      2.27× |                 — |
| initialize-async-warmup                        | boot           |     1 |            566,038 |                — |            — |             — |           — |          — |                 — |
| inspect-snapshot                               | introspection  |    20 |          9,622,860 |                — |            — |             — |           — |          — |                 — |
| lookup-bindings                                | introspection  |   200 |         23,289,343 |                — |            — |             — |           — |          — |                 — |
| generate-dependency-graph                      | introspection  |    10 |            748,043 |                — |            — |             — |           — |          — |                 — |
| multi-tag-slot-resolve                         | micro          |   300 |         13,824,798 |                — |            — |             — |           — |          — |                 — |
| multi-tag-constraint-resolve                   | micro          |   200 |          7,573,451 |                — |            — |             — |           — |          — |                 — |
| multi-tag-select-32                            | micro          |   300 |          2,791,572 |                — |            — |             — |           — |          — |                 — |
| mask-reject-wide-catalog                       | slot-selection |   300 |         32,046,809 |                — |            — |             — |           — |          — |                 — |
| mask-accept-two-of-four                        | slot-selection |   300 |         19,984,899 |                — |            — |             — |           — |          — |                 — |
| mask-collision-same-bit                        | slot-selection |   300 |         46,179,217 |                — |            — |             — |           — |          — |                 — |
| slot-tag-array-hoisted                         | slot-selection |   300 |        144,502,578 |                — |            — |             — |           — |          — |                 — |
| slot-tag-shorthand-hoisted                     | slot-selection |   300 |        158,359,926 |                — |            — |             — |           — |          — |                 — |
| slot-tag-array-inline                          | slot-selection |   300 |         93,462,886 |                — |            — |             — |           — |          — |                 — |
| slot-tag-shorthand-inline                      | slot-selection |   300 |        112,467,650 |                — |            — |             — |           — |          — |                 — |
| slot-tag-zero-value                            | slot-selection |   300 |        145,131,424 |           6.65×† |            — |             — |           — |          — |                 — |
| slot-name-and-tag                              | slot-selection |   300 |         47,059,403 |           2.27×† |            — |             — |           — |          — |                 — |
| slot-tag-resolve-all                           | slot-selection |   300 |         42,049,384 |           3.54×† |            — |             — |           — |          — |                 — |
| slot-tag-miss-optional                         | slot-selection |   300 |         60,626,324 |           2.54×† |            — |             — |           — |          — |                 — |
| slot-tag-parent-owned                          | slot-selection |   300 |        128,342,546 |           6.14×† |            — |             — |           — |          — |                 — |
| slot-name-parent-owned                         | slot-selection |   300 |        107,381,129 |           4.37×† |            — |             — |           — |          — |                 — |
| slot-injected-name-compiled                    | slot-selection |   300 |         69,041,644 |                — |            — |             — |           — |          — |                 — |
| slot-injected-name-interpreted                 | slot-selection |   300 |          5,056,462 |                — |            — |             — |           — |          — |                 — |
| slot-injected-tag-compiled                     | slot-selection |   300 |         69,057,511 |                — |            — |             — |           — |          — |                 — |
| slot-injected-tag-interpreted                  | slot-selection |   300 |          5,054,881 |                — |            — |             — |           — |          — |                 — |
| plan-deps-inlined                              | resolution     |   300 |         60,641,154 |                — |            — |             — |           — |          — |                 — |
| plan-escape-factory-dep                        | resolution     |   300 |          7,372,398 |                — |            — |             — |           — |          — |                 — |
| plan-escape-scoped-dep                         | resolution     |   300 |         11,751,459 |                — |            — |             — |           — |          — |                 — |
| plan-escape-hooked-dep                         | resolution     |   300 |          3,951,457 |                — |            — |             — |           — |          — |                 — |
| plan-escape-optional-dep                       | resolution     |   300 |          6,122,506 |                — |            — |             — |           — |          — |                 — |
| plan-escape-multi-dep                          | resolution     |   300 |          2,982,294 |                — |            — |             — |           — |          — |                 — |
| plan-class-chain-24                            | resolution     |     1 |          7,250,400 |                — |            — |             — |           — |          — |                 — |
| plan-class-chain-40                            | resolution     |     1 |         4,296,195‡ |                — |            — |             — |           — |          — |                 — |
| interpreted-class-chain-24                     | resolution     |     1 |            420,441 |                — |            — |             — |           — |          — |                 — |
| interpreted-class-chain-40                     | resolution     |     1 |            239,825 |                — |            — |             — |           — |          — |                 — |
| plan-runs-1                                    | resolution     |     1 |            860,610 |                — |            — |             — |           — |          — |                 — |
| plan-runs-256                                  | resolution     |     1 |             14,531 |                — |            — |             — |           — |          — |                 — |
| plan-runs-512                                  | resolution     |     1 |              7,869 |                — |            — |             — |           — |          — |                 — |
| plan-runs-1024                                 | resolution     |     1 |              3,985 |                — |            — |             — |           — |          — |                 — |
| plan-runs-2048                                 | resolution     |     1 |              1,875 |                — |            — |             — |           — |          — |                 — |
| plan-runs-4096                                 | resolution     |     1 |              1,126 |                — |            — |             — |           — |          — |                 — |
| plan-runs-8192                                 | resolution     |     1 |                635 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-1                               | resolution     |     1 |            247,343 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-256                             | resolution     |     1 |              4,580 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-512                             | resolution     |     1 |              2,554 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-1024                            | resolution     |     1 |              1,224 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-2048                            | resolution     |     1 |                634 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-8192                            | resolution     |     1 |                213 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-1                              | resolution     |     1 |            853,460 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-512                            | resolution     |     1 |              7,756 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-1024                           | resolution     |     1 |              3,843 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-2048                           | resolution     |     1 |              1,889 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-8192                           | resolution     |     1 |                637 |                — |            — |             — |           — |          — |                 — |
| nested-context-resolve-in-factory              | resolution     |   300 |         46,666,814 |           1.96×† |       3.91×† |        5.50×† |      18.8×† |     2.37×† |            0.87×† |
| nested-container-resolve-in-factory            | resolution     |   300 |         42,187,949 |           1.81×† |       3.02×† |        4.94×† |      16.8×† |     1.14×† |            0.88×† |
| accessor-injection-construct                   | resolution     |   300 |         8,420,339‡ |          0.25×†‡ |            — |             — |           — |          — |                 — |

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
