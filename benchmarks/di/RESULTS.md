# Results

Where `@codefast/di` actually stands against the field right now, wins and losses given equal weight — the point of this
page is to know where the engine is slower so the next change knows what to aim at. One machine-derived snapshot, no
accreted ledger. The method is in [`BENCH_GUIDE.md`](./BENCH_GUIDE.md); re-run it with the recipe at the bottom.

**This is one full-profile pass, so read the aggregates, not the rows.** GC-exposed for one collection between trials,
one subprocess per scenario, libraries interleaved with rotating order, 3 trials each over the one closure a scenario
builds before its first trial — a single pass measures no between-run variance of its own, 95 of the cells carry a
per-trial IQR above 5%, and 134 cells in 48 rows sit above ~30M ops/s, where the ratio moves between runs of the same
build whatever its IQR says. Ratios are worth more than the absolute `hz/op`; a single row is worth less than the group
it sits in. A loss highlighted below points at a direction — quote a precise factor only after a paired re-run, except
where a loss is a structural difference that reproduces by construction (called out as such).

**This page is the baseline.** It transcribes `baselines/2026-09-27T17-28-12-467Z`, whose `observations.jsonl` is
committed, so every figure here can be re-read from the repository rather than from a local `bench-results/` run only
the author has. `baselines/` holds that one run and nothing else: the next pass is read against it, and a pass accepted
in its place becomes this page. 145 scenarios ran, 131 of them aggregate-eligible; every library implements every row
its declared features allow, so a `—` below is a feature the library lacks, never a row nobody wrote.

**Environment.** `@codefast/di` at `f1234b08f` — 0.11.0 plus the unreleased 0.12 changes — from a `dist` built first, on
Node 26.1.0 / V8 14.6, Apple M3 Max × 14, darwin/arm64, `--expose-gc` for every library. inversify 8.2.3 · awilix 13.0.5
· tsyringe 4.10.0 · brandi 5.1.0 · ditox 3.3.0 · injection-js 2.6.1. Each library runs at its canonical decorator mode
(inversify legacy decorators + `reflect-metadata`, codefast standard decorators + `Symbol.metadata`); every inversify
container uses `{ jitless: false }`, its fastest documented configuration. Run 2026-09-27, 2m17s wall, 0 sanity
failures; the 1-minute load average read 3.16 at every child's start, on fourteen cores.

**What moved since the previous pass.** Per row, every library reads within 2% of the previous pass's median, 1.01× to
1.02×, so this pass sits level with the last and a row that moved is the row, not the pass. Since that pass the async
lane yields only where a dependency, factory or hook really returns a promise, and two rows moved on it:
`initialize-async-warmup` +44%, four async singletons whose instances are now cached as soon as their factory's promise
settles rather than several microtasks behind it, and `plan-async-resolved-chain-8` −9%, a transient chain whose every
factory is async, so every level still yields — the one lane the change made slower, and the one to look at next. A
paired probe of the build before that change against this one reads the pair at +30% and −11%, and every other row it
measured within 3%: `realistic-graph-resolve-root` and `bind-128-refined`, the other two rows the harness calls
regressions (−9% and −6% here); `container-create-empty` and `resolve-all-strategies-10`, −14% each near the ceiling;
and `create-child-empty`, `production-event-bus-dispatch`, `async-init-single-hop`, `resolve-all-async-8`,
`resolve-optional-async-miss`, `async-fanout-concurrent-64` and `async-diamond-shared-leaf`, +5% to +22%. Those moves
are the pass, and the first three of the risers are rows the previous page named as falling in its own.

## Summary — where we stand

Ratios are `@codefast/di ÷ competitor`; above 1× means codefast is faster. Win `>1.03×`, parity `0.97–1.03×`, loss
`<0.97×`. `Comparable` counts the rows both libraries ran, of 131 aggregate-eligible rows codefast measures; `†` is how
many of those the median and geomean carry from above the throughput ceiling — they stay in the aggregate but no reader
should cite one alone.

| Competitor     | Comparable | Win / parity / loss | Median | Geomean |   † |
| -------------- | ---------: | ------------------: | -----: | ------: | --: |
| InversifyJS 8  |  92 of 131 |          90 / 1 / 1 |  4.28× |   5.66× |  43 |
| Awilix 13      |  38 of 131 |          38 / 0 / 0 |  6.33× |   6.13× |  16 |
| tsyringe 4     |  43 of 131 |          38 / 1 / 4 |  4.53× |   3.94× |  18 |
| Brandi 5       |  30 of 131 |          29 / 0 / 1 |  13.5× |   11.9× |  16 |
| Ditox 3        |  45 of 131 |         34 / 1 / 10 |  1.40× |   1.70× |  20 |
| injection-js 2 |  31 of 131 |          21 / 1 / 9 |  1.41× |   1.48× |  21 |

**The headline, stated plainly: codefast sweeps awilix outright, takes inversify and brandi on all but one row each,
wins tsyringe on the median by 4.53× while losing it four rows, one of those at 0.97×, and holds both aggregates against
the two libraries it is closest to** — ditox 1.40× on the median and 1.70× on the geomean, injection-js 1.41× and 1.48×.
The losses cluster in four shapes, and every one of them is named in the next section: **registration** and everything
that binds before it resolves, **cold collections** against tsyringe, the **failure path**, and a handful of warm rows
above the throughput ceiling where ditox and injection-js read level or ahead.

## The losses, foregrounded — where to improve

Ordered by how much they matter, each marked as a **real deficit** (same work, codefast slower), a **work difference**
(codefast does more per op by design, so the row is a design cost to reconsider, not a bug) or a **chosen cost** (a
correctness property paid for with its price known).

- **Registration is the biggest deficit, and ditox is the rival it is wide against.** `bind-128-plain` — 128 transient
  factory bindings into a fresh container, no resolve — runs at 0.39× ditox, 0.97× tsyringe and 1.83× injection-js. What
  it pays is the object: the chain object is the fluent builder the contract returns, and the probe is last-wins, so
  closing this row is a contract change (a lighter builder, or a bulk bind), not an optimisation. Everything that binds
  before it resolves sits on the same floor — `create-child-empty` 1.87× ditox and 1.13× tsyringe,
  `container-create-empty` 1.55× and 1.03×, `realistic-graph-class-cold-resolve` 0.82× ditox and 1.38× tsyringe,
  `boot-decorated-container-build-and-resolve` 1.14× tsyringe, `module-cold-from-modules` 1.30× ditox. The two
  empty-container rows lose injection-js above the ceiling (0.59×† and 0.56×†), whose injector is fewer objects still.
  **Real deficit, structural** — one object per binding is the design.
- **The cold collection loses tsyringe, and only tsyringe.** `resolve-all-cold-N` builds a fresh container and reads the
  collection once: at N=10, 0.67× tsyringe while ditox 1.10× and injection-js 1.40× are wins; at N=100, 0.48×‡ tsyringe,
  1.70×‡ ditox and 1.54×‡ injection-js. What the pair still pays is the registration above, ten or a hundred times,
  against tsyringe's plain array of providers. **Real deficit against tsyringe — the registration cost seen from the
  collection side.**
- **Teardown at scale is mostly a registration loss and a cold-class loss, with a smaller teardown share on top.**
  `materialize-100-singletons` (bind and resolve 100 singletons, no teardown) is 0.69× ditox and 2.28× tsyringe;
  `unbind-all-100-singletons` (the same, then `unbindAll()` with a hundred `@preDestroy` calls) 0.66× and 1.95×. Read as
  time, the teardown itself — the second row less the first — is about 3.1 µs for the hundred against ditox's 1.7 µs for
  its `removeAll()`, and 2.4 µs in the previous pass: a difference of two rows carries the noise of both. It is the walk
  plus a method found by name on each instance, where ditox calls the one function it was handed. Most of either row
  sits underneath it: the 100 bindings, and the first resolve of each, because codefast's side binds a class with
  `.to(Class).singleton()` where ditox binds a factory, and constructing a class with metadata costs more than calling a
  factory. `lifecycle-pre-destroy-unbind` (one singleton, one hook) is 1.22× ditox and 2.57× tsyringe. **Real deficit on
  the registration and the cold class lane underneath; the teardown share is a work difference, a hook found by name.**
- **The stable-set collections are a chosen cost.** `resolve-all-strategies-10` 0.75×†‡ ditox and 0.90×†‡ injection-js,
  `-100` 0.60×†‡ and 0.86×‡, and `production-event-bus-dispatch` 0.81×† ditox: a root-level `resolveAll` hands each
  caller a copy of its memoized list rather than the list itself, so no caller can mutate the engine's memo, while both
  rivals hand out the cached array they share. The event bus is that copy plus the dispatch, and against injection-js it
  reads 1.12×† in this pass; the one map read it used to pay beyond the copy is absorbed by a one-entry cell in front of
  the collection memo. A frozen list was measured and rejected — a frozen array iterates through a slow elements kind
  for every consumer. **Chosen cost**, its own commit, reversible alone.
- **Rebind wins awilix and still loses ditox above the ceiling.** `rebind-hot-swap` 1.62× awilix and 0.24×† ditox;
  `rebind-parent-resolve-child-depth-3` 1.48× awilix and 1.77× ditox. A rebind of a lone token is one registration whose
  displaced binding is deactivated on the spot; what it pays against ditox's bare map write is the builder object and
  the deactivation walk. **Work difference**, above the ceiling.
- **Four rows lose injection-js above the ceiling.** `nested-context-resolve-in-factory` 0.84×† and
  `nested-container-resolve-in-factory` 0.87×† — a factory that resolves from its context or from the container
  mid-construction — and the aliases `alias-parent-owned-terminal` 0.77×† and `to-alias-redirect` 0.90×†, with
  `alias-chain-3` (1.01×†) level beside them. Measured on their own, outside the harness, codefast is ahead of
  injection-js on both nested-factory shapes. The loss appears in the harness child, which builds every scenario before
  it measures one, so the factory call site that the transient dynamic lane inlines has already seen hundreds of
  factories and V8 stops inlining through it; injection-js's lane inlines nothing to begin with, so the same state costs
  it nothing. The harness keeps that state on purpose, as [`BENCH_GUIDE.md`](./BENCH_GUIDE.md) records. The aliases are
  structural: injection-js caches an alias's answer in the injector's own slot on the first read, while codefast
  resolves the alias on every read and never caches a parent's instance in a child. **Harness state** for the two nested
  rows, **work difference** for the aliases. Below the ceiling, `realistic-graph-resolve-root` reads 1.10× injection-js
  against 0.92× in the previous pass: injection-js's own throughput on the row went from 20.6M back to 15.7M ops/s, the
  figure of the pass before that one, while a paired probe reads codefast's level across the two builds, so the row
  swings with the pass and one pass does not settle it.
- **`accessor-injection-construct` 0.26×†‡ inversify.** The row measures the benchmark's transpiler as much as the
  engine: tsx's esbuild lowers the scenario's decorated `accessor` field to `WeakMap`-backed privates (`__privateAdd`,
  `__accessCheck`) and its own decorator runtime. A standalone probe of the same class compiled by the repo's `tsc`,
  which keeps a native private field, resolves in 44 ns against 139 ns through esbuild, so the lowering is most of the
  row. What the engine pays is the ambient scope around construction and the accessor's own `resolve` through the
  container, where inversify's property injection is a metadata read on the same plan. **Work difference**, and the
  harness stays as it is: a codefast user on Vite or tsx pays the same lowering, and a different transpiler for one
  library would move every codefast row, canaries included.
- **Failing fast costs more here: `misconfigured-missing-binding` 0.74×‡ tsyringe, 0.78×‡ brandi, 0.78×‡ ditox, 0.89×‡
  injection-js.** codefast builds a structured error carrying the resolution path; the rivals throw a string, and the
  stack capture both pay is most of the row. **Work difference** on a path a production request should never take.

## The wins

- **inversify — 90 of 92 comparable rows, 4.28× median, 5.66× geomean.** Widest margins on `boot` (21.6×), `production`
  (18.2×), `scope` (13.3×), `lifecycle` (12.7×), `fan-out` (5.97×), `realistic` (5.95×), `introspection` (5.95×),
  `micro` (4.16×) and `slot-selection` (3.87×); tightest on `scale` (2.59×), `failure` (1.54×), `async` (1.51×) and
  `resolution` (0.96×, which is the accessor row pulling against the plan rows). `resolve-all-async-8` is at parity
  (1.01×), and `circular-dependency-3` and `alias-cycle-detected` are excluded from the aggregates entirely — inversify
  recurses toward the stack limit rather than detecting either.
- **awilix — 38 of 38, 6.33× median, 6.13× geomean, no loss at all.** Widest on `boot` (15.9×), `scale` (10.2×), `scope`
  (7.20×), `production` (7.05×), `realistic` (6.99×) and `micro` (6.71×); tightest on `async` (1.29×) and
  `introspection` (1.20×).
- **tsyringe — 38 of 43, 4.53× median, 3.94× geomean.** 12.6× on `micro`, 6.62× on `scope`, 5.07× on `resolution` and
  4.05× on `introspection`; it keeps four rows — the two cold collections, the missing-binding throw, and
  `bind-128-plain` at 0.97×, a hair under parity — and holds `container-create-empty` level at 1.03×, while
  `create-child-empty` is a win at 1.13× and the decorated boot at 1.14×.
- **brandi — 29 of 30, 13.5× median, 11.9× geomean.** 23.2× on `micro`, 17.4× on `resolution`, 17.3× on `scope` and
  15.9× on `realistic`; it loses only the missing-binding throw (0.78×‡).
- **ditox — 34 rows to 10 with one at parity, and both aggregates (1.40× median, 1.70× geomean).** The sweep is in the
  warm work and the per-request work: `scope` 4.80×, `realistic` 2.10×, `micro` 2.08×, `resolution` 1.64×,
  `introspection` 1.60×, `scale` 1.39×, `boot` 1.28×, `fan-out` 1.12×, `async` 1.11×, `production` 1.05×. Named rows:
  `module-cold-128` 2.33×, `create-child-empty` 1.87×, `rebind-parent-resolve-child-depth-3` 1.77×,
  `resolve-all-cold-100` 1.70×‡, `container-create-empty` 1.55×, `module-cold-from-modules` 1.30×,
  `scale-deep-transient-chain-512` 1.24×, `lifecycle-pre-destroy-unbind` 1.22×, `nested-container-resolve-in-factory`
  1.12×†, `async-init-single-hop` 1.11×, `resolve-all-cold-10` 1.10×; `singleton-class-1-dep` (0.98×†) sits at parity,
  and `to-resolved-3-deps` is a 0.96×† loss above the ceiling. What it still takes is every row that binds many things,
  the two stable sets and the event bus; `lifecycle` (0.75×, the 100-singleton pair) and `failure` (0.78×, the
  missing-binding throw) are its winning groups.
- **injection-js — 21 rows to 9 with one at parity, 1.41× median, 1.48× geomean.** `realistic` 2.54×, `scope` 1.77×,
  `micro` 1.66×; narrower on `fan-out` (1.14×), `production` (1.12×), `boot` (1.08×) and `async` (1.07×). Its wins are
  the ceiling rows above, the two stable sets, the two empty containers and the missing-binding throw, which leave it
  the `resolution` (0.86×) and `failure` (0.89×) groups. The aliases are shapes where a `ReflectiveInjector` that caches
  every provider's answer per injector does less work than a container that does not; the two nested-factory rows are
  the harness state the loss list names.

## Geomean by group

Geomean of the ratios in each group, comparable row count in parentheses. Read a group, not a cell.

| Group          | InversifyJS 8 | Awilix 13 | tsyringe 4 |  Brandi 5 |   Ditox 3 | injection-js 2 |
| -------------- | ------------: | --------: | ---------: | --------: | --------: | -------------: |
| micro          |    4.16× (22) | 6.71× (8) |  12.6× (7) | 23.2× (8) | 2.08× (7) |      1.66× (9) |
| realistic      |     5.95× (5) | 6.99× (4) |  3.78× (4) | 15.9× (5) | 2.10× (5) |      2.54× (5) |
| fan-out        |     5.97× (9) | 2.01× (1) |  2.23× (5) | 9.12× (1) | 1.12× (5) |      1.14× (4) |
| async          |    1.51× (10) | 1.29× (1) |  1.51× (1) | 2.88× (1) | 1.11× (1) |      1.07× (1) |
| lifecycle      |     12.7× (8) | 5.80× (5) |  2.68× (4) |         — | 0.75× (5) |              — |
| scope          |    13.3× (12) | 7.20× (8) |  6.62× (8) | 17.3× (5) | 4.80× (8) |      1.77× (4) |
| scale          |     2.59× (2) | 10.2× (2) |  3.66× (2) | 8.67× (2) | 1.39× (2) |              — |
| boot           |     21.6× (8) | 15.9× (3) |  1.06× (4) | 4.90× (5) | 1.28× (5) |      1.08× (4) |
| failure        |     1.54× (2) | 2.39× (1) |  0.74× (1) | 0.78× (1) | 0.78× (1) |      0.89× (1) |
| production     |     18.2× (3) | 7.05× (2) |  3.62× (3) |         — | 1.05× (3) |      1.12× (1) |
| introspection  |     5.95× (2) | 1.20× (1) |  4.05× (2) |         — | 1.60× (1) |              — |
| slot-selection |     3.87× (6) |         — |          — |         — |         — |              — |
| resolution     |     0.96× (3) | 3.40× (2) |  5.07× (2) | 17.4× (2) | 1.64× (2) |      0.86× (2) |

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
| constant-resolve                               | micro          |  1000 |        216,172,697 |           2.73×† |       5.67×† |        11.3×† |      35.7×† |     1.11×† |           2.48×†‡ |
| singleton-class-1-dep                          | micro          |   200 |        188,023,080 |           3.39×† |       4.45×† |        10.9×† |      31.9×† |     0.98×† |            3.66×† |
| transient-class-1-dep                          | micro          |   200 |         80,020,755 |           1.94×† |       9.02×† |        13.2×† |      34.3×† |     8.65×† |                 — |
| named-constant-get                             | micro          |   500 |         98,963,393 |           3.59×† |            — |             — |           — |          — |                 — |
| named-resolve-slots-1                          | micro          |   500 |        139,997,347 |           5.03×† |            — |             — |           — |          — |                 — |
| named-resolve-slots-4                          | micro          |   500 |        138,369,762 |           5.01×† |            — |             — |           — |          — |                 — |
| named-resolve-slots-16                         | micro          |   500 |        138,483,118 |           4.88×† |            — |             — |           — |          — |                 — |
| named-resolve-slots-64                         | micro          |   500 |        138,407,350 |           4.82×† |            — |             — |           — |          — |                 — |
| optional-missing-transient                     | micro          |   200 |         55,045,761 |           1.18×† |            — |             — |      13.3×† |     4.12×† |                 — |
| realistic-graph-resolve-root                   | realistic      |    20 |         17,272,966 |            2.58× |        2.47× |         4.81× |       13.7× |      1.53× |             1.10× |
| realistic-graph-cold-resolve                   | realistic      |     1 |           313,141‡ |           8.97×‡ |       4.75×‡ |        2.21×‡ |      5.11×‡ |     1.13×‡ |            2.29×‡ |
| realistic-graph-resolved-root                  | realistic      |    20 |         63,482,563 |           3.31×† |            — |             — |      49.6×† |     5.46×† |            4.08×† |
| realistic-graph-class-resolve-root             | realistic      |    20 |         59,514,391 |           3.07×† |       9.91×† |        13.9×† |      47.5×† |     5.26×† |            4.14×† |
| realistic-graph-class-cold-resolve             | realistic      |     1 |            574,796 |            32.0× |        20.5× |         1.38× |       6.10× |      0.82× |             2.46× |
| realistic-graph-validate                       | realistic      |    10 |         20,009,688 |                — |            — |             — |           — |          — |                 — |
| fan-out-tree-depth-3-breadth-4                 | fan-out        |    20 |          1,823,803 |            1.65× |        2.01× |         3.02× |       9.12× |      2.10× |                 — |
| resolve-all-strategies-10                      | fan-out        |     1 |        27,916,815‡ |           7.29×‡ |            — |        3.16×‡ |           — |    0.75×†‡ |           0.90×†‡ |
| resolve-all-strategies-100                     | fan-out        |     1 |         24,357,578 |            53.9× |            — |         18.1× |           — |    0.60×†‡ |            0.86×‡ |
| resolve-all-cold-10                            | fan-out        |     1 |          2,330,925 |           28.5×‡ |            — |         0.67× |           — |      1.10× |             1.40× |
| resolve-all-cold-100                           | fan-out        |     1 |           257,425‡ |           27.9×‡ |            — |        0.48×‡ |           — |     1.70×‡ |            1.54×‡ |
| resolve-all-named-8                            | fan-out        |     1 |         23,695,699 |            2.12× |            — |             — |           — |          — |                 — |
| resolve-all-named-16                           | fan-out        |     1 |         23,576,870 |            2.08× |            — |             — |           — |          — |                 — |
| resolve-all-named-32                           | fan-out        |     1 |         22,467,779 |            2.01× |            — |             — |           — |          — |                 — |
| resolve-all-named-64                           | fan-out        |     1 |         23,946,032 |            2.10× |            — |             — |           — |          — |                 — |
| resolve-async-single-hop                       | async          |     1 |         9,073,759‡ |           1.21×‡ |            — |             — |           — |          — |                 — |
| async-init-single-hop                          | async          |     1 |          7,203,862 |            1.69× |        1.29× |         1.51× |       2.88× |      1.11× |             1.07× |
| dynamic-async-chain-8                          | async          |     1 |          2,069,795 |            1.42× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-8                      | async          |     1 |          1,247,904 |            1.63× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-16                     | async          |     1 |            685,060 |            1.67× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-32                     | async          |     1 |           349,208‡ |           1.90×‡ |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-64                     | async          |     1 |            159,355 |            1.89× |            — |             — |           — |          — |                 — |
| async-branch-chain-8                           | async          |     1 |          1,297,204 |                — |            — |             — |           — |          — |                 — |
| async-branch-escape-mid-chain-8                | async          |     1 |          1,659,376 |                — |            — |             — |           — |          — |                 — |
| async-diamond-shared-leaf                      | async          |     1 |          1,968,721 |            1.37× |            — |             — |           — |          — |                 — |
| plan-async-resolved-chain-8                    | async          |     1 |          2,497,306 |                — |            — |             — |           — |          — |                 — |
| plan-async-class-chain-8                       | async          |     1 |          5,531,582 |                — |            — |             — |           — |          — |                 — |
| resolve-all-async-8                            | async          |     1 |            981,761 |            1.01× |            — |             — |           — |          — |                 — |
| resolve-optional-async-miss                    | async          |     1 |         10,413,276 |            1.59× |            — |             — |           — |          — |                 — |
| lifecycle-post-construct-singleton             | lifecycle      |   250 |        188,129,908 |           3.26×† |            — |             — |           — |          — |                 — |
| lifecycle-pre-destroy-unbind                   | lifecycle      |     1 |          3,711,256 |           25.9×‡ |       9.43×‡ |         2.57× |           — |      1.22× |                 — |
| binding-level-activation-hook                  | lifecycle      |   200 |         61,419,869 |           2.25×† |            — |             — |           — |          — |                 — |
| child-depth-1-resolve                          | scope          |   500 |        109,219,511 |           1.56×† |       4.35×† |        7.15×† |      20.5×† |     5.09×† |            1.41×† |
| child-depth-2-resolve                          | scope          |   500 |        108,645,988 |           1.47×† |       5.59×† |        8.46×† |      21.5×† |     9.12×† |            1.41×† |
| child-depth-4-resolve                          | scope          |   500 |        108,232,195 |           1.54×† |       8.16×† |        10.8×† |      23.4×† |     16.7×† |            1.63×† |
| child-depth-8-resolve                          | scope          |   500 |        110,286,135 |           1.56×† |       14.8×† |        17.0×† |      29.2×† |     30.6×† |            3.04×† |
| child-request-lifecycle-create-resolve-dispose | scope          |   100 |          2,698,002 |            51.1× |       12.0×‡ |        5.19×‡ |           — |      1.55× |                 — |
| fresh-child-default-n1                         | scope          |   100 |         10,686,505 |           38.9×‡ |       8.51×‡ |         7.04× |           — |      2.00× |                 — |
| fresh-child-default-n4                         | scope          |   100 |         8,029,432‡ |           36.2×‡ |       7.05×‡ |        7.16×‡ |           — |     2.76×‡ |                 — |
| fresh-child-name-n1                            | scope          |   100 |         10,629,594 |           41.8×‡ |            — |             — |           — |          — |                 — |
| fresh-child-name-n4                            | scope          |   100 |         7,435,342‡ |           28.5×‡ |            — |             — |           — |          — |                 — |
| fresh-child-tag-n1                             | scope          |   100 |        10,449,748‡ |           43.8×‡ |            — |             — |           — |          — |                 — |
| fresh-child-tag-n4                             | scope          |   100 |         7,466,933‡ |           32.6×‡ |            — |             — |           — |          — |                 — |
| scale-mid-transient-chain-32                   | scale          |     1 |          1,543,060 |            2.58× |        4.93× |         4.30× |       10.9× |      1.57× |                 — |
| scale-deep-transient-chain-512                 | scale          |     1 |             54,070 |            2.60× |        21.0× |         3.12× |       6.92× |      1.24× |                 — |
| boot-decorated-container-build-and-resolve     | boot           |     1 |            815,684 |           20.0×‡ |            — |         1.14× |           — |          — |             2.21× |
| container-create-empty                         | boot           |   100 |         25,824,871 |           40.6×‡ |       9.63×‡ |         1.03× |       7.40× |      1.55× |            0.59×† |
| create-child-empty                             | boot           |   100 |         26,161,489 |           51.9×‡ |       11.8×‡ |         1.13× |       7.79× |      1.87× |            0.56×† |
| bind-128-plain                                 | boot           |     1 |            185,507 |           27.4×‡ |       35.5×‡ |         0.97× |       8.79× |      0.39× |             1.83× |
| bind-128-refined                               | boot           |     1 |             35,098 |           4.30×‡ |            — |             — |           — |          — |                 — |
| misconfigured-missing-binding                  | failure        |     1 |           272,777‡ |           1.52×‡ |       2.39×‡ |        0.74×‡ |      0.78×‡ |     0.78×‡ |            0.89×‡ |
| circular-dependency-3                          | failure        |     1 |           166,741‡ |          187.8×‡ |       1.50×‡ |             — |           — |          — |            0.50×‡ |
| ambiguous-multi-binding                        | failure        |     1 |           237,300‡ |           1.56×‡ |            — |             — |           — |          — |                 — |
| production-http-handler                        | production     |    50 |          1,816,543 |           26.0×‡ |       7.68×‡ |        3.36×‡ |           — |      1.18× |                 — |
| production-unit-of-work                        | production     |   100 |         1,048,133‡ |           17.5×‡ |       6.46×‡ |        2.37×‡ |           — |     1.20×‡ |                 — |
| production-event-bus-dispatch                  | production     |   100 |         52,687,304 |           13.4×† |            — |        5.96×† |           — |     0.81×† |            1.12×† |
| to-resolved-3-deps                             | micro          |   200 |        184,680,553 |           3.20×† |            — |             — |      33.2×† |     0.96×† |            1.64×† |
| to-alias-redirect                              | micro          |   500 |        111,149,965 |           2.02×† |       6.19×† |        12.9×† |           — |          — |            0.90×† |
| to-self-binding                                | micro          |   300 |        176,203,803 |           2.45×† |            — |        7.98×† |           — |          — |            2.97×† |
| alias-chain-3                                  | micro          |   500 |        110,071,600 |           4.26×† |       14.5×† |        24.3×† |           — |          — |            1.01×† |
| alias-parent-owned-terminal                    | micro          |   500 |        102,059,878 |           1.87×† |       6.87×† |        12.3×† |           — |          — |            0.77×† |
| alias-cycle-detected                           | failure        |     1 |           250,473‡ |          703.0×‡ |       2.71×‡ |             — |           — |          — |            0.84×‡ |
| resolve-optional-hit                           | micro          |   500 |        215,556,781 |           6.51×† |       5.96×† |             — |      36.9×† |     1.04×† |            1.63×† |
| resolve-optional-miss                          | micro          |   500 |        264,637,493 |           7.73×† |       4.93×† |             — |      4.30×† |     4.42×† |            1.93×† |
| tagged-binding-resolve                         | micro          |   300 |        142,978,097 |           6.66×† |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-1                         | micro          |   300 |        220,456,744 |           10.0×† |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-4                         | micro          |   300 |        219,966,538 |           9.80×† |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-16                        | micro          |   300 |        219,769,902 |           10.5×† |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-64                        | micro          |   300 |        220,519,528 |           10.3×† |            — |             — |           — |          — |                 — |
| conditional-injection-tagged                   | micro          |   300 |         78,240,164 |           2.02×† |            — |             — |      30.3×† |          — |                 — |
| rebind-hot-swap                                | lifecycle      |    50 |         21,674,205 |           47.4×‡ |        1.62× |             — |           — |     0.24×† |                 — |
| has-bound-check                                | introspection  |  1000 |        370,095,334 |           6.69×† |       1.20×† |        3.38×† |           — |     1.60×† |                 — |
| has-own-unbound-check                          | introspection  |  1000 |        530,529,761 |           5.28×† |            — |        4.85×† |           — |          — |                 — |
| container-level-activation-hook                | lifecycle      |   200 |         53,210,288 |           1.87×† |            — |        4.53×† |           — |          — |                 — |
| scoped-binding-per-child                       | scope          |   100 |         6,049,498‡ |           45.9×‡ |       3.43×‡ |        1.27×‡ |      5.12×‡ |     1.40×‡ |                 — |
| rebind-parent-resolve-child-depth-3            | lifecycle      |    50 |         13,331,703 |            75.5× |        1.48× |             — |           — |      1.77× |                 — |
| materialize-100-singletons                     | lifecycle      |     1 |             96,850 |           21.9×‡ |       19.2×‡ |         2.28× |           — |      0.69× |                 — |
| unbind-all-100-singletons                      | lifecycle      |     1 |             74,595 |           24.5×‡ |       15.1×‡ |         1.95× |           — |      0.66× |                 — |
| module-load-unload                             | boot           |     1 |         1,174,953‡ |           16.4×‡ |            — |             — |           — |          — |                 — |
| module-cold-from-modules                       | boot           |     1 |          2,163,010 |           23.8×‡ |            — |             — |      4.18×‡ |      1.30× |                 — |
| module-cold-128                                | boot           |     1 |            205,035 |           24.9×‡ |            — |             — |       1.34× |      2.33× |                 — |
| initialize-async-warmup                        | boot           |     1 |            816,731 |                — |            — |             — |           — |          — |                 — |
| inspect-snapshot                               | introspection  |    20 |          9,803,049 |                — |            — |             — |           — |          — |                 — |
| lookup-bindings                                | introspection  |   200 |         24,862,894 |                — |            — |             — |           — |          — |                 — |
| generate-dependency-graph                      | introspection  |    10 |            740,658 |                — |            — |             — |           — |          — |                 — |
| multi-tag-slot-resolve                         | micro          |   300 |         14,169,206 |                — |            — |             — |           — |          — |                 — |
| multi-tag-constraint-resolve                   | micro          |   200 |          7,532,052 |                — |            — |             — |           — |          — |                 — |
| multi-tag-select-32                            | micro          |   300 |          2,858,604 |                — |            — |             — |           — |          — |                 — |
| mask-reject-wide-catalog                       | slot-selection |   300 |         39,034,100 |                — |            — |             — |           — |          — |                 — |
| mask-accept-two-of-four                        | slot-selection |   300 |         20,175,563 |                — |            — |             — |           — |          — |                 — |
| mask-collision-same-bit                        | slot-selection |   300 |         46,980,322 |                — |            — |             — |           — |          — |                 — |
| slot-tag-array-hoisted                         | slot-selection |   300 |        146,768,812 |                — |            — |             — |           — |          — |                 — |
| slot-tag-shorthand-hoisted                     | slot-selection |   300 |        158,514,710 |                — |            — |             — |           — |          — |                 — |
| slot-tag-array-inline                          | slot-selection |   300 |         91,496,816 |                — |            — |             — |           — |          — |                 — |
| slot-tag-shorthand-inline                      | slot-selection |   300 |        114,553,279 |                — |            — |             — |           — |          — |                 — |
| slot-tag-zero-value                            | slot-selection |   300 |        142,024,257 |           6.73×† |            — |             — |           — |          — |                 — |
| slot-name-and-tag                              | slot-selection |   300 |         47,879,998 |           2.31×† |            — |             — |           — |          — |                 — |
| slot-tag-resolve-all                           | slot-selection |   300 |         40,956,146 |           3.18×† |            — |             — |           — |          — |                 — |
| slot-tag-miss-optional                         | slot-selection |   300 |         67,198,481 |           2.56×† |            — |             — |           — |          — |                 — |
| slot-tag-parent-owned                          | slot-selection |   300 |        130,365,907 |           5.99×† |            — |             — |           — |          — |                 — |
| slot-name-parent-owned                         | slot-selection |   300 |        107,124,344 |           4.44×† |            — |             — |           — |          — |                 — |
| slot-injected-name-compiled                    | slot-selection |   300 |         68,146,926 |                — |            — |             — |           — |          — |                 — |
| slot-injected-name-interpreted                 | slot-selection |   300 |          4,824,860 |                — |            — |             — |           — |          — |                 — |
| slot-injected-tag-compiled                     | slot-selection |   300 |         69,274,811 |                — |            — |             — |           — |          — |                 — |
| slot-injected-tag-interpreted                  | slot-selection |   300 |          5,190,755 |                — |            — |             — |           — |          — |                 — |
| plan-deps-inlined                              | resolution     |   300 |         59,153,165 |                — |            — |             — |           — |          — |                 — |
| plan-escape-factory-dep                        | resolution     |   300 |          7,056,900 |                — |            — |             — |           — |          — |                 — |
| plan-escape-scoped-dep                         | resolution     |   300 |         12,155,158 |                — |            — |             — |           — |          — |                 — |
| plan-escape-hooked-dep                         | resolution     |   300 |          3,771,451 |                — |            — |             — |           — |          — |                 — |
| plan-escape-optional-dep                       | resolution     |   300 |          6,023,166 |                — |            — |             — |           — |          — |                 — |
| plan-escape-multi-dep                          | resolution     |   300 |          2,960,141 |                — |            — |             — |           — |          — |                 — |
| plan-class-chain-24                            | resolution     |     1 |          7,377,969 |                — |            — |             — |           — |          — |                 — |
| plan-class-chain-40                            | resolution     |     1 |         4,317,509‡ |                — |            — |             — |           — |          — |                 — |
| interpreted-class-chain-24                     | resolution     |     1 |            404,235 |                — |            — |             — |           — |          — |                 — |
| interpreted-class-chain-40                     | resolution     |     1 |            239,336 |                — |            — |             — |           — |          — |                 — |
| plan-runs-1                                    | resolution     |     1 |            885,071 |                — |            — |             — |           — |          — |                 — |
| plan-runs-256                                  | resolution     |     1 |             14,783 |                — |            — |             — |           — |          — |                 — |
| plan-runs-512                                  | resolution     |     1 |              7,720 |                — |            — |             — |           — |          — |                 — |
| plan-runs-1024                                 | resolution     |     1 |              3,887 |                — |            — |             — |           — |          — |                 — |
| plan-runs-2048                                 | resolution     |     1 |              1,936 |                — |            — |             — |           — |          — |                 — |
| plan-runs-4096                                 | resolution     |     1 |              1,139 |                — |            — |             — |           — |          — |                 — |
| plan-runs-8192                                 | resolution     |     1 |                638 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-1                               | resolution     |     1 |            242,914 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-256                             | resolution     |     1 |              4,717 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-512                             | resolution     |     1 |              2,502 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-1024                            | resolution     |     1 |              1,289 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-2048                            | resolution     |     1 |                655 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-8192                            | resolution     |     1 |                214 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-1                              | resolution     |     1 |            843,136 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-512                            | resolution     |     1 |              7,925 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-1024                           | resolution     |     1 |              4,064 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-2048                           | resolution     |     1 |              1,962 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-8192                           | resolution     |     1 |                638 |                — |            — |             — |           — |          — |                 — |
| nested-context-resolve-in-factory              | resolution     |   300 |         46,646,310 |           1.97×† |       3.87×† |        5.36×† |      18.2×† |     2.39×† |            0.84×† |
| nested-container-resolve-in-factory            | resolution     |   300 |         41,307,433 |           1.75×† |       2.99×† |        4.80×† |      16.7×† |     1.12×† |            0.87×† |
| accessor-injection-construct                   | resolution     |   300 |         9,103,420‡ |          0.26×†‡ |            — |             — |           — |          — |                 — |

† 134 row(s) above ~30M ops/s: this ratio moves between runs of the same build, whatever its IQR says. Cite the
aggregates, not the row.

‡ 95 cell(s) whose per-trial IQR exceeds 5%: the median is unstable within this run. Re-run on a quieter machine before
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
