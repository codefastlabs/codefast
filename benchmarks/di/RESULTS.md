# Results

Where `@codefast/di` actually stands against the field right now, wins and losses given equal weight — the point of this
page is to know where the engine is slower so the next change knows what to aim at. One machine-derived snapshot, no
accreted ledger. The method is in [`BENCH_GUIDE.md`](./BENCH_GUIDE.md); re-run it with the recipe at the bottom.

**This is one full-profile pass, so read the aggregates, not the rows.** GC-exposed for one collection between trials,
one subprocess per scenario, libraries interleaved with rotating order, 3 trials each over the one closure a scenario
builds before its first trial — a single pass measures no between-run variance of its own, 96 of the cells carry a
per-trial IQR above 5%, and 137 cells in 48 rows sit above ~30M ops/s, where the ratio moves between runs of the same
build whatever its IQR says. Ratios are worth more than the absolute `hz/op`; a single row is worth less than the group
it sits in. A loss highlighted below points at a direction — quote a precise factor only after a paired re-run, except
where a loss is a structural difference that reproduces by construction (called out as such).

**This page is the baseline.** It transcribes `baselines/2026-10-15T00-30-53-982Z`, whose `observations.jsonl` is
committed, so every figure here can be re-read from the repository rather than from a local `bench-results/` run only
the author has. `baselines/` holds that one run and nothing else: the next pass is read against it, and a pass accepted
in its place becomes this page. 146 scenarios ran, 132 of them aggregate-eligible; every library implements every row
its declared features allow, so a `—` below is a feature the library lacks, never a row nobody wrote.

**Environment.** `@codefast/di` at `1d5d44020` — 0.13.0 plus the unreleased introspection functions — from a `dist`
built first, on Node 26.1.0 / V8 14.6, Apple M3 Max × 14, darwin/arm64, `--expose-gc` for every library. inversify 8.2.3
· awilix 13.0.5 · tsyringe 4.10.0 · brandi 5.1.0 · ditox 3.3.0 · injection-js 2.6.1. Each library runs at its canonical
decorator mode (inversify legacy decorators + `reflect-metadata`, codefast standard decorators + `Symbol.metadata`);
every inversify container uses `{ jitless: false }`, its fastest documented configuration. Run 2026-10-15, 2m18s wall, 0
sanity failures; the 1-minute load average read 2.37 at every child's start, on fourteen cores.

**What moved since the previous pass.** Per row, every library reads within 2% of the previous pass's median, 0.99× to
1.01×, so this pass sits level with the last and a row that moved is the row, not the pass. One row is new:
`app-boot-40`, below. Since that pass, `validate`, `inspect`, `lookupBindings`, `explain` and `generateDependencyGraph`
became functions that take the container. `realistic-graph-validate` reads −7%, the internals object
`validate(container)` builds per call, a few nanoseconds on a call an application makes once at startup.
`lookup-bindings` and `inspect-snapshot` read −3% and −5%: an earlier build of the change read them at −13% and −9% in
five paired passes, and reading the inspector without building the internals brought them back. `container-create-empty`
read −14% in three of five paired passes against the method-shaped build and level in the rest, and reads level here
(29.5M ops/s against 29.3M); the harness flags `plan-async-resolved-chain-8` at −20%, a row bimodal per process that a
probe found level across builds. Those moves are the pass.

## Summary — where we stand

Ratios are `@codefast/di ÷ competitor`; above 1× means codefast is faster. Win `>1.03×`, parity `0.97–1.03×`, loss
`<0.97×`. `Comparable` counts the rows both libraries ran, of 131 aggregate-eligible rows codefast measures; `†` is how
many of those the median and geomean carry from above the throughput ceiling — they stay in the aggregate but no reader
should cite one alone.

| Competitor     | Comparable | Win / parity / loss | Median | Geomean |   † |
| -------------- | ---------: | ------------------: | -----: | ------: | --: |
| InversifyJS 8  |  93 of 132 |          91 / 1 / 1 |  4.58× |   5.84× |  44 |
| Awilix 13      |  39 of 132 |          39 / 0 / 0 |  6.47× |   6.26× |  16 |
| tsyringe 4     |  44 of 132 |          40 / 1 / 3 |  4.38× |   3.90× |  19 |
| Brandi 5       |  31 of 132 |          30 / 0 / 1 |  13.9× |   11.8× |  16 |
| Ditox 3        |  46 of 132 |         34 / 0 / 12 |  1.41× |   1.70× |  20 |
| injection-js 2 |  32 of 132 |          22 / 2 / 8 |  1.53× |   1.46× |  22 |

**The headline, stated plainly: codefast sweeps awilix outright, takes inversify and brandi on all but one row each,
wins tsyringe on the median by 4.38× while losing it three rows, and holds both aggregates against the two libraries it
is closest to** — ditox 1.41× on the median and 1.70× on the geomean, injection-js 1.53× and 1.46×. The losses cluster
in four shapes, and every one of them is named in the next section: **registration** and everything that binds before it
resolves, **cold collections** against tsyringe, the **failure path**, and a handful of warm rows above the throughput
ceiling where ditox and injection-js read level or ahead.

## What a user waits for

Most rows above price one operation in isolation, and many of them run faster than any request could notice. Three
measurements are the ones an application feels, so they lead: what starting it up costs, what one request costs, and
what the library adds to a browser bundle.

**Startup.** `app-boot-40` creates a container, registers a forty-service graph as classes in each library's own idiom
(32 singletons, 8 transient handlers) and resolves every handler once: about 10.9 µs per boot (91.8K boots/s). It reads
1.40× tsyringe, 2.08× injection-js, 5.07× brandi, 11.8× awilix and 32.0× inversify, and **0.85× ditox** — the one
library that boots faster. The ten-node rows agree: `realistic-graph-class-cold-resolve` 0.81× ditox and 1.37× tsyringe,
`boot-decorated-container-build-and-resolve` 1.11× tsyringe. What the ditox gap pays is the registration and the cold
class lane the next section names.

**One request.** Every per-request row is a win against every library that has a child container. A request through a
child container in `production-http-handler` reads 1.19× ditox, 3.37× tsyringe, 7.72× awilix and 27.1× inversify;
`production-unit-of-work` 1.15× ditox and 2.27× tsyringe; `child-request-lifecycle-create-resolve-dispose` 1.52× ditox
and 5.25× tsyringe; `scoped-binding-per-child` 1.47× ditox and 1.27× tsyringe.

**Bundle.** `pnpm bench:footprint` bundles each library's smallest bind-and-resolve program with Rolldown 1.2.14 for the
browser, minified. A library whose setup requires `reflect-metadata` ships it, and the polyfill is measured alone on the
last line.

| Library                  | Minified | Gzipped |
| ------------------------ | -------: | ------: |
| @codefast/di             |  75.0 KB | 20.1 KB |
| InversifyJS 8            |  97.4 KB | 21.3 KB |
| Awilix 13                |   8.9 KB |  3.4 KB |
| tsyringe 4               |  26.7 KB |  8.2 KB |
| Brandi 5                 |   4.8 KB |  1.6 KB |
| Ditox 3                  |   2.1 KB |  0.9 KB |
| injection-js 2           |  30.9 KB |  8.9 KB |
| `reflect-metadata` alone |  13.3 KB |  4.2 KB |

This is the widest gap on the page. The decorator-free libraries ship one to four kilobytes gzipped, and the
legacy-decorator ones about eight plus the polyfill; `@codefast/di` ships 20.1 KB, second only to inversify. Most of it
is the engine that wins the per-request rows — the resolver, the plan compiler and its code generation — and the
checking and describing functions already stay out of a program that does not call them.

## The losses, foregrounded — where to improve

Ordered by how much they matter, each marked as a **real deficit** (same work, codefast slower), a **work difference**
(codefast does more per op by design, so the row is a design cost to reconsider, not a bug) or a **chosen cost** (a
correctness property paid for with its price known).

- **Registration is the biggest deficit, and ditox is the rival it is wide against.** `bind-128-plain` — 128 transient
  factory bindings into a fresh container, no resolve — runs at 0.40× ditox, 0.99× tsyringe and 1.83× injection-js. What
  it pays is the object: the chain object is the fluent builder the contract returns, and the probe is last-wins, so
  closing this row is a contract change (a lighter builder, or a bulk bind), not an optimisation. Everything that binds
  before it resolves sits on the same floor — `create-child-empty` 1.79× ditox and 1.11× tsyringe,
  `container-create-empty` 1.68× and 1.18×, `realistic-graph-class-cold-resolve` 0.81× ditox and 1.37× tsyringe,
  `app-boot-40` 0.85× ditox and 1.40× tsyringe, `boot-decorated-container-build-and-resolve` 1.11× tsyringe,
  `module-cold-from-modules` 1.35× ditox. The two empty-container rows lose injection-js above the ceiling (0.67×† and
  0.54×†), whose injector is fewer objects still. **Real deficit, structural** — one object per binding is the design.
- **The cold collection loses tsyringe, and only tsyringe.** `resolve-all-cold-N` builds a fresh container and reads the
  collection once: at N=10, 0.70× tsyringe while ditox 1.15× and injection-js 1.39× are wins; at N=100, 0.48×‡ tsyringe,
  1.64×‡ ditox and 1.44×‡ injection-js. What the pair still pays is the registration above, ten or a hundred times,
  against tsyringe's plain array of providers. **Real deficit against tsyringe — the registration cost seen from the
  collection side.**
- **Teardown at scale is mostly a registration loss and a cold-class loss, with a smaller teardown share on top.**
  `materialize-100-singletons` (bind and resolve 100 singletons, no teardown) is 0.70× ditox and 2.38× tsyringe;
  `unbind-all-100-singletons` (the same, then `unbindAll()` with a hundred `@preDestroy` calls) 0.70× and 2.06×. Read as
  time, the teardown itself — the second row less the first — is about 2.6 µs for the hundred against ditox's 1.8 µs for
  its `removeAll()`, and 2.3 µs in the previous pass: a difference of two rows carries the noise of both. It is the walk
  plus a method found by name on each instance, where ditox calls the one function it was handed. Most of either row
  sits underneath it: the 100 bindings, and the first resolve of each, because codefast's side binds a class with
  `.to(Class).singleton()` where ditox binds a factory, and constructing a class with metadata costs more than calling a
  factory. `lifecycle-pre-destroy-unbind` (one singleton, one hook) is 1.22× ditox and 2.55× tsyringe. **Real deficit on
  the registration and the cold class lane underneath; the teardown share is a work difference, a hook found by name.**
- **The stable-set collections are a chosen cost.** `resolve-all-strategies-10` 0.89×†‡ ditox and level with
  injection-js (1.02×†), `-100` 0.65×†‡ and 0.69×†‡, and `production-event-bus-dispatch` 0.75×† ditox: a root-level
  `resolveAll` hands each caller a copy of its memoized list rather than the list itself, so no caller can mutate the
  engine's memo, while both rivals hand out the cached array they share. The event bus is that copy plus the dispatch,
  and against injection-js it reads 1.11×† in this pass; the one map read it used to pay beyond the copy is absorbed by
  a one-entry cell in front of the collection memo. A frozen list was measured and rejected — a frozen array iterates
  through a slow elements kind for every consumer. **Chosen cost**, its own commit, reversible alone.
- **Rebind wins awilix and still loses ditox above the ceiling.** `rebind-hot-swap` 1.61× awilix and 0.23×† ditox;
  `rebind-parent-resolve-child-depth-3` 1.47× awilix and 1.90× ditox. A rebind of a lone token is one registration whose
  displaced binding is deactivated on the spot; what it pays against ditox's bare map write is the builder object and
  the deactivation walk. **Work difference**, above the ceiling.
- **Four rows lose injection-js above the ceiling.** `nested-context-resolve-in-factory` 0.79×† and
  `nested-container-resolve-in-factory` 0.82×† — a factory that resolves from its context or from the container
  mid-construction — and the aliases `alias-parent-owned-terminal` 0.78×† and `to-alias-redirect` 0.90×†, with
  `alias-chain-3` (0.99×†) level beside them. Measured on their own, outside the harness, codefast is ahead of
  injection-js on both nested-factory shapes. The loss appears in the harness child, which builds every scenario before
  it measures one, so the factory call site that the transient dynamic lane inlines has already seen hundreds of
  factories and V8 stops inlining through it; injection-js's lane inlines nothing to begin with, so the same state costs
  it nothing. The harness keeps that state on purpose, as [`BENCH_GUIDE.md`](./BENCH_GUIDE.md) records. The aliases are
  structural: injection-js caches an alias's answer in the injector's own slot on the first read, while codefast
  resolves the alias on every read and never caches a parent's instance in a child. **Harness state** for the two nested
  rows, **work difference** for the aliases. Below the ceiling, `realistic-graph-resolve-root` reads 1.29× injection-js
  against 1.21× in the previous pass: injection-js holds level at 15.6M ops/s and codefast's own figure moves with the
  pass, so one pass does not settle the row.
- **`accessor-injection-construct` 0.25×†‡ inversify.** The row measures the benchmark's transpiler as much as the
  engine: tsx's esbuild lowers the scenario's decorated `accessor` field to `WeakMap`-backed privates (`__privateAdd`,
  `__accessCheck`) and its own decorator runtime. A standalone probe of the same class compiled by the repo's `tsc`,
  which keeps a native private field, resolves in 44 ns against 139 ns through esbuild, so the lowering is most of the
  row. What the engine pays is the ambient scope around construction and the accessor's own `resolve` through the
  container, where inversify's property injection is a metadata read on the same plan. **Work difference**, and the
  harness stays as it is: a codefast user on tsx or esbuild pays the same lowering, and a different transpiler for one
  library would move every codefast row, canaries included. Vite 8's Babel recipe keeps a native private field, as `tsc`
  does, so a Vite user sits nearer the probe's figure than the row's.
- **Failing fast costs more here: `misconfigured-missing-binding` 0.74×‡ tsyringe, 0.76×‡ brandi, 0.77×‡ ditox, 0.92×‡
  injection-js.** codefast builds a structured error carrying the resolution path; the rivals throw a string, and the
  stack capture both pay is most of the row. **Work difference** on a path a production request should never take.

## The wins

- **inversify — 91 of 93 comparable rows, 4.58× median, 5.84× geomean.** Widest margins on `boot` (24.0×), `production`
  (18.5×), `scope` (13.5×), `lifecycle` (13.0×), `fan-out` (6.24×), `realistic` (6.10×), `introspection` (5.89×),
  `micro` (4.17×) and `slot-selection` (3.97×); tightest on `scale` (2.17×), `failure` (1.54×), `async` (1.50×) and
  `resolution` (0.91×, which is the accessor row pulling against the plan rows). `resolve-all-async-8` is at parity
  (1.03×), and `circular-dependency-3` and `alias-cycle-detected` are excluded from the aggregates entirely — inversify
  recurses toward the stack limit rather than detecting either.
- **awilix — 39 of 39, 6.47× median, 6.26× geomean, no loss at all.** Widest on `boot` (15.0×), `scale` (10.0×),
  `realistic` (7.37×), `scope` (7.17×), `production` (7.07×) and `micro` (6.78×); tightest on `async` (1.28×) and
  `introspection` (1.20×).
- **tsyringe — 40 of 44, 4.38× median, 3.90× geomean.** 12.5× on `micro`, 6.63× on `scope`, 4.79× on `resolution` and
  4.06× on `introspection`; it keeps three rows — the two cold collections and the missing-binding throw — with
  `bind-128-plain` level at 0.99×, while `app-boot-40` reads 1.40×, `container-create-empty` 1.18×, and
  `create-child-empty` and the decorated boot 1.11× each.
- **brandi — 30 of 31, 13.9× median, 11.8× geomean.** 23.9× on `micro`, 17.4× on `scope`, 17.0× on `realistic` and 16.6×
  on `resolution`; it loses only the missing-binding throw (0.76×‡).
- **ditox — 34 rows to 12, and both aggregates (1.41× median, 1.70× geomean).** The sweep is in the warm work and the
  per-request work: `scope` 4.88×, `realistic` 2.18×, `micro` 2.08×, `introspection` 1.60×, `resolution` 1.54×, `scale`
  1.44×, `boot` 1.21×, `fan-out` 1.18×, `async` 1.08×, with `production` level at 1.01×. Named rows: `module-cold-128`
  2.33×, `rebind-parent-resolve-child-depth-3` 1.90×, `create-child-empty` 1.79×, `container-create-empty` 1.68×,
  `resolve-all-cold-100` 1.64×‡, `module-cold-from-modules` 1.35×, `scale-deep-transient-chain-512` 1.34×,
  `lifecycle-pre-destroy-unbind` 1.22×, `resolve-all-cold-10` 1.15×, `async-init-single-hop` 1.08×‡; two ceiling rows,
  `singleton-class-1-dep` and `to-resolved-3-deps`, read 0.97×†, a hair under parity. What it still takes is every row
  that binds many things — `app-boot-40` among them — the two stable sets and the event bus; `lifecycle` (0.77×, the
  100-singleton pair) and `failure` (0.77×, the missing-binding throw) are its winning groups.
- **injection-js — 22 rows to 8 with two at parity, 1.53× median, 1.46× geomean.** `realistic` 2.31×, `scope` 1.76×,
  `micro` 1.67×; narrower on `boot` (1.25×), `production` (1.11×), `fan-out` (1.09×) and `async` (1.05×). Its wins are
  the ceiling rows above, `resolve-all-strategies-100`, the two empty containers and the missing-binding throw, which
  leave it the `resolution` (0.81×) and `failure` (0.92×) groups. The aliases are shapes where a `ReflectiveInjector`
  that caches every provider's answer per injector does less work than a container that does not; the two nested-factory
  rows are the harness state the loss list names.

## Geomean by group

Geomean of the ratios in each group, comparable row count in parentheses. Read a group, not a cell.

| Group          | InversifyJS 8 | Awilix 13 | tsyringe 4 |  Brandi 5 |   Ditox 3 | injection-js 2 |
| -------------- | ------------: | --------: | ---------: | --------: | --------: | -------------: |
| micro          |    4.17× (22) | 6.78× (8) |  12.5× (7) | 23.9× (8) | 2.08× (7) |      1.67× (9) |
| realistic      |     6.10× (5) | 7.37× (4) |  3.92× (4) | 17.0× (5) | 2.18× (5) |      2.31× (5) |
| boot           |     24.0× (9) | 15.0× (4) |  1.15× (5) | 5.07× (6) | 1.21× (6) |      1.25× (5) |
| fan-out        |     6.24× (9) | 2.04× (1) |  2.39× (5) | 9.88× (1) | 1.18× (5) |      1.09× (4) |
| async          |    1.50× (10) | 1.28× (1) |  1.48× (1) | 2.89× (1) | 1.08× (1) |      1.05× (1) |
| lifecycle      |     13.0× (8) | 5.75× (5) |  2.78× (4) |         — | 0.77× (5) |              — |
| scope          |    13.5× (12) | 7.17× (8) |  6.63× (8) | 17.4× (5) | 4.88× (8) |      1.76× (4) |
| scale          |     2.17× (2) | 10.0× (2) |  3.63× (2) | 8.74× (2) | 1.44× (2) |              — |
| failure        |     1.54× (2) | 2.34× (1) |  0.74× (1) | 0.76× (1) | 0.77× (1) |      0.92× (1) |
| production     |     18.5× (3) | 7.07× (2) |  3.59× (3) |         — | 1.01× (3) |      1.11× (1) |
| introspection  |     5.89× (2) | 1.20× (1) |  4.06× (2) |         — | 1.60× (1) |              — |
| slot-selection |     3.97× (6) |         — |          — |         — |         — |              — |
| resolution     |     0.91× (3) | 3.24× (2) |  4.79× (2) | 16.6× (2) | 1.54× (2) |      0.81× (2) |

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
| constant-resolve                               | micro          |  1000 |        215,096,383 |           2.80×† |       5.94×† |        11.1×† |      38.7×† |     1.10×† |            2.41×† |
| singleton-class-1-dep                          | micro          |   200 |        184,650,917 |           3.32×† |       4.46×† |        10.6×† |      33.8×† |     0.97×† |            3.72×† |
| transient-class-1-dep                          | micro          |   200 |         75,464,463 |           1.84×† |       8.74×† |        13.1×† |      34.9×† |     7.85×† |                 — |
| named-constant-get                             | micro          |   500 |         96,273,212 |           3.48×† |            — |             — |           — |          — |                 — |
| named-resolve-slots-1                          | micro          |   500 |        137,988,260 |           4.83×† |            — |             — |           — |          — |                 — |
| named-resolve-slots-4                          | micro          |   500 |        140,068,038 |           4.78×† |            — |             — |           — |          — |                 — |
| named-resolve-slots-16                         | micro          |   500 |        137,252,363 |           4.83×† |            — |             — |           — |          — |                 — |
| named-resolve-slots-64                         | micro          |   500 |        139,666,053 |           5.08×† |            — |             — |           — |          — |                 — |
| optional-missing-transient                     | micro          |   200 |         56,128,177 |           1.12×† |            — |             — |      13.9×† |     4.17×† |                 — |
| realistic-graph-resolve-root                   | realistic      |    20 |         20,116,857 |            2.84× |        2.86× |         5.67× |       16.9× |      1.79× |             1.29× |
| realistic-graph-cold-resolve                   | realistic      |     1 |           294,159‡ |           9.30×‡ |       4.73×‡ |        2.09×‡ |      4.94×‡ |     1.11×‡ |            2.21×‡ |
| realistic-graph-resolved-root                  | realistic      |    20 |         60,848,102 |           3.15×† |            — |             — |      52.1×† |     5.47×† |            2.90×† |
| realistic-graph-class-resolve-root             | realistic      |    20 |         60,677,964 |           3.08×† |       10.9×† |        14.5×† |      49.9×† |     5.53×† |            3.20×† |
| realistic-graph-class-cold-resolve             | realistic      |     1 |            566,147 |            33.0× |       20.1×‡ |         1.37× |       6.45× |      0.81× |             2.48× |
| app-boot-40                                    | boot           |     1 |             91,764 |           32.0×‡ |       11.8×‡ |         1.40× |       5.07× |      0.85× |             2.08× |
| realistic-graph-validate                       | realistic      |    10 |         18,167,185 |                — |            — |             — |           — |          — |                 — |
| fan-out-tree-depth-3-breadth-4                 | fan-out        |    20 |          1,854,310 |            1.70× |        2.04× |         3.44× |       9.88× |      2.06× |                 — |
| resolve-all-strategies-10                      | fan-out        |     1 |         32,139,244 |           8.40×† |            — |        3.78×† |           — |    0.89×†‡ |            1.02×† |
| resolve-all-strategies-100                     | fan-out        |     1 |         23,967,673 |            53.5× |            — |         18.0× |           — |    0.65×†‡ |           0.69×†‡ |
| resolve-all-cold-10                            | fan-out        |     1 |          2,336,891 |           34.8×‡ |            — |         0.70× |           — |      1.15× |             1.39× |
| resolve-all-cold-100                           | fan-out        |     1 |           249,228‡ |           27.9×‡ |            — |        0.48×‡ |           — |     1.64×‡ |            1.44×‡ |
| resolve-all-named-8                            | fan-out        |     1 |         23,430,863 |            2.06× |            — |             — |           — |          — |                 — |
| resolve-all-named-16                           | fan-out        |     1 |         23,332,376 |            2.07× |            — |             — |           — |          — |                 — |
| resolve-all-named-32                           | fan-out        |     1 |         23,833,025 |            2.13× |            — |             — |           — |          — |                 — |
| resolve-all-named-64                           | fan-out        |     1 |         23,934,783 |            2.14× |            — |             — |           — |          — |                 — |
| resolve-async-single-hop                       | async          |     1 |          9,551,760 |            1.24× |            — |             — |           — |          — |                 — |
| async-init-single-hop                          | async          |     1 |          7,104,567 |            1.66× |        1.28× |         1.48× |       2.89× |     1.08×‡ |             1.05× |
| dynamic-async-chain-8                          | async          |     1 |          1,976,430 |            1.35× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-8                      | async          |     1 |          1,205,892 |            1.58× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-16                     | async          |     1 |            680,383 |            1.63× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-32                     | async          |     1 |            342,057 |            1.87× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-64                     | async          |     1 |            163,117 |            2.03× |            — |             — |           — |          — |                 — |
| async-branch-chain-8                           | async          |     1 |          1,360,124 |                — |            — |             — |           — |          — |                 — |
| async-branch-escape-mid-chain-8                | async          |     1 |          1,700,274 |                — |            — |             — |           — |          — |                 — |
| async-diamond-shared-leaf                      | async          |     1 |          1,941,921 |            1.35× |            — |             — |           — |          — |                 — |
| plan-async-resolved-chain-8                    | async          |     1 |          2,279,838 |                — |            — |             — |           — |          — |                 — |
| plan-async-class-chain-8                       | async          |     1 |          5,381,672 |                — |            — |             — |           — |          — |                 — |
| resolve-all-async-8                            | async          |     1 |            977,196 |            1.03× |            — |             — |           — |          — |                 — |
| resolve-optional-async-miss                    | async          |     1 |         10,051,247 |            1.56× |            — |             — |           — |          — |                 — |
| lifecycle-post-construct-singleton             | lifecycle      |   250 |        189,083,072 |           3.29×† |            — |             — |           — |          — |                 — |
| lifecycle-pre-destroy-unbind                   | lifecycle      |     1 |          3,739,927 |           27.0×‡ |       9.03×‡ |         2.55× |           — |      1.22× |                 — |
| binding-level-activation-hook                  | lifecycle      |   200 |         62,702,713 |           2.30×† |            — |             — |           — |          — |                 — |
| child-depth-1-resolve                          | scope          |   500 |        108,489,037 |           1.49×† |       4.34×† |        7.11×† |      20.1×† |     4.99×† |            1.11×† |
| child-depth-2-resolve                          | scope          |   500 |        109,831,865 |           1.51×† |       5.55×† |        8.55×† |      22.0×† |     8.37×† |            1.91×† |
| child-depth-4-resolve                          | scope          |   500 |        109,497,972 |           1.53×† |       8.26×† |        10.9×† |      23.5×† |     18.8×† |            1.78×† |
| child-depth-8-resolve                          | scope          |   500 |        109,333,163 |           1.60×† |       14.9×† |        16.9×† |      28.7×† |     34.4×† |            2.53×† |
| child-request-lifecycle-create-resolve-dispose | scope          |   100 |          2,651,122 |           47.5×‡ |       11.7×‡ |        5.25×‡ |           — |      1.52× |                 — |
| fresh-child-default-n1                         | scope          |   100 |         11,042,311 |           43.7×‡ |       8.22×‡ |         7.26× |           — |      2.02× |                 — |
| fresh-child-default-n4                         | scope          |   100 |         7,518,091‡ |           28.1×‡ |       6.52×‡ |        6.84×‡ |           — |     2.62×‡ |                 — |
| fresh-child-name-n1                            | scope          |   100 |        10,657,148‡ |           49.2×‡ |            — |             — |           — |          — |                 — |
| fresh-child-name-n4                            | scope          |   100 |         7,210,288‡ |           30.2×‡ |            — |             — |           — |          — |                 — |
| fresh-child-tag-n1                             | scope          |   100 |         10,268,189 |           42.8×‡ |            — |             — |           — |          — |                 — |
| fresh-child-tag-n4                             | scope          |   100 |          7,830,680 |           36.9×‡ |            — |             — |           — |          — |                 — |
| scale-mid-transient-chain-32                   | scale          |     1 |          1,488,834 |            2.46× |        4.74× |         4.22× |       10.7× |      1.55× |                 — |
| scale-deep-transient-chain-512                 | scale          |     1 |             55,343 |            1.91× |        21.2× |         3.13× |       7.12× |      1.34× |                 — |
| boot-decorated-container-build-and-resolve     | boot           |     1 |            828,868 |           20.6×‡ |            — |        1.11×‡ |           — |          — |             2.25× |
| container-create-empty                         | boot           |   100 |         29,535,559 |           47.5×‡ |       11.1×‡ |         1.18× |       8.86× |      1.68× |            0.67×† |
| create-child-empty                             | boot           |   100 |         25,484,787 |           52.5×‡ |       11.3×‡ |         1.11× |       7.73× |      1.79× |            0.54×† |
| bind-128-plain                                 | boot           |     1 |            186,879 |           27.0×‡ |       34.7×‡ |         0.99× |       8.92× |      0.40× |             1.83× |
| bind-128-refined                               | boot           |     1 |             38,423 |           6.41×‡ |            — |             — |           — |          — |                 — |
| misconfigured-missing-binding                  | failure        |     1 |           276,379‡ |           1.54×‡ |       2.34×‡ |        0.74×‡ |      0.76×‡ |     0.77×‡ |            0.92×‡ |
| circular-dependency-3                          | failure        |     1 |           165,379‡ |          187.7×‡ |       1.50×‡ |             — |           — |          — |            0.49×‡ |
| ambiguous-multi-binding                        | failure        |     1 |           237,592‡ |           1.54×‡ |            — |             — |           — |          — |                 — |
| production-http-handler                        | production     |    50 |          1,823,539 |           27.1×‡ |       7.72×‡ |         3.37× |           — |      1.19× |                 — |
| production-unit-of-work                        | production     |   100 |         1,011,230‡ |           17.4×‡ |       6.47×‡ |        2.27×‡ |           — |     1.15×‡ |                 — |
| production-event-bus-dispatch                  | production     |   100 |         53,345,936 |           13.5×† |            — |        6.05×† |           — |     0.75×† |            1.11×† |
| to-resolved-3-deps                             | micro          |   200 |        187,078,058 |           3.36×† |            — |             — |      32.9×† |     0.97×† |            1.66×† |
| to-alias-redirect                              | micro          |   500 |        111,013,910 |           2.23×† |       6.35×† |        12.1×† |           — |          — |            0.90×† |
| to-self-binding                                | micro          |   300 |        178,080,704 |           2.87×† |            — |        8.05×† |           — |          — |            3.01×† |
| alias-chain-3                                  | micro          |   500 |        111,456,988 |           4.24×† |       14.4×† |        24.5×† |           — |          — |            0.99×† |
| alias-parent-owned-terminal                    | micro          |   500 |        102,116,147 |           1.84×† |       7.14×† |        12.7×† |           — |          — |            0.78×† |
| alias-cycle-detected                           | failure        |     1 |           248,659‡ |          696.4×‡ |       2.66×‡ |             — |           — |          — |            0.84×‡ |
| resolve-optional-hit                           | micro          |   500 |        214,143,039 |           6.56×† |       5.97×† |             — |      36.0×† |     1.04×† |            1.62×† |
| resolve-optional-miss                          | micro          |   500 |        265,338,570 |           7.81×† |       4.92×† |             — |      4.34×† |     4.86×† |            2.00×† |
| tagged-binding-resolve                         | micro          |   300 |        146,281,761 |           6.85×† |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-1                         | micro          |   300 |        219,824,864 |           9.90×† |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-4                         | micro          |   300 |        219,263,482 |           9.81×† |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-16                        | micro          |   300 |        218,312,262 |           9.77×† |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-64                        | micro          |   300 |        221,357,271 |           10.1×† |            — |             — |           — |          — |                 — |
| conditional-injection-tagged                   | micro          |   300 |         81,114,086 |           2.05×† |            — |             — |      33.0×† |          — |                 — |
| rebind-hot-swap                                | lifecycle      |    50 |         21,254,209 |           45.9×‡ |        1.61× |             — |           — |     0.23×† |                 — |
| has-bound-check                                | introspection  |  1000 |        370,735,496 |           6.61×† |       1.20×† |        3.39×† |           — |     1.60×† |                 — |
| has-own-unbound-check                          | introspection  |  1000 |        530,870,927 |           5.25×† |            — |        4.86×† |           — |          — |                 — |
| container-level-activation-hook                | lifecycle      |   200 |         55,721,106 |           1.97×† |            — |        4.77×† |           — |          — |                 — |
| scoped-binding-per-child                       | scope          |   100 |         6,237,293‡ |           48.9×‡ |       3.76×‡ |        1.27×‡ |      5.38×‡ |     1.47×‡ |                 — |
| rebind-parent-resolve-child-depth-3            | lifecycle      |    50 |         13,259,224 |            72.4× |        1.47× |             — |           — |      1.90× |                 — |
| materialize-100-singletons                     | lifecycle      |     1 |             97,896 |           23.6×‡ |       18.8×‡ |        2.38×‡ |           — |      0.70× |                 — |
| unbind-all-100-singletons                      | lifecycle      |     1 |            77,822‡ |           25.7×‡ |       15.6×‡ |        2.06×‡ |           — |     0.70×‡ |                 — |
| module-load-unload                             | boot           |     1 |         1,178,615‡ |           16.3×‡ |            — |             — |           — |          — |                 — |
| module-cold-from-modules                       | boot           |     1 |          2,162,811 |           23.2×‡ |            — |             — |       4.16× |      1.35× |                 — |
| module-cold-128                                | boot           |     1 |            205,025 |           24.5×‡ |            — |             — |       1.31× |      2.33× |                 — |
| initialize-async-warmup                        | boot           |     1 |            814,120 |                — |            — |             — |           — |          — |                 — |
| inspect-snapshot                               | introspection  |    20 |          9,300,344 |                — |            — |             — |           — |          — |                 — |
| lookup-bindings                                | introspection  |   200 |         24,350,243 |                — |            — |             — |           — |          — |                 — |
| generate-dependency-graph                      | introspection  |    10 |            728,017 |                — |            — |             — |           — |          — |                 — |
| multi-tag-slot-resolve                         | micro          |   300 |         14,155,961 |                — |            — |             — |           — |          — |                 — |
| multi-tag-constraint-resolve                   | micro          |   200 |          7,185,978 |                — |            — |             — |           — |          — |                 — |
| multi-tag-select-32                            | micro          |   300 |          2,865,540 |                — |            — |             — |           — |          — |                 — |
| mask-reject-wide-catalog                       | slot-selection |   300 |        38,507,625‡ |                — |            — |             — |           — |          — |                 — |
| mask-accept-two-of-four                        | slot-selection |   300 |         20,423,835 |                — |            — |             — |           — |          — |                 — |
| mask-collision-same-bit                        | slot-selection |   300 |         41,703,965 |                — |            — |             — |           — |          — |                 — |
| slot-tag-array-hoisted                         | slot-selection |   300 |        143,715,703 |                — |            — |             — |           — |          — |                 — |
| slot-tag-shorthand-hoisted                     | slot-selection |   300 |        159,230,510 |                — |            — |             — |           — |          — |                 — |
| slot-tag-array-inline                          | slot-selection |   300 |         95,028,387 |                — |            — |             — |           — |          — |                 — |
| slot-tag-shorthand-inline                      | slot-selection |   300 |        114,622,843 |                — |            — |             — |           — |          — |                 — |
| slot-tag-zero-value                            | slot-selection |   300 |        147,947,811 |           6.92×† |            — |             — |           — |          — |                 — |
| slot-name-and-tag                              | slot-selection |   300 |         47,652,403 |           2.37×† |            — |             — |           — |          — |                 — |
| slot-tag-resolve-all                           | slot-selection |   300 |         41,191,971 |           3.61×† |            — |             — |           — |          — |                 — |
| slot-tag-miss-optional                         | slot-selection |   300 |         61,812,771 |           2.40×† |            — |             — |           — |          — |                 — |
| slot-tag-parent-owned                          | slot-selection |   300 |        131,688,043 |           6.01×† |            — |             — |           — |          — |                 — |
| slot-name-parent-owned                         | slot-selection |   300 |        108,073,454 |           4.58×† |            — |             — |           — |          — |                 — |
| slot-injected-name-compiled                    | slot-selection |   300 |         69,791,942 |                — |            — |             — |           — |          — |                 — |
| slot-injected-name-interpreted                 | slot-selection |   300 |          4,842,164 |                — |            — |             — |           — |          — |                 — |
| slot-injected-tag-compiled                     | slot-selection |   300 |         69,616,606 |                — |            — |             — |           — |          — |                 — |
| slot-injected-tag-interpreted                  | slot-selection |   300 |          5,178,106 |                — |            — |             — |           — |          — |                 — |
| plan-deps-inlined                              | resolution     |   300 |         61,346,137 |                — |            — |             — |           — |          — |                 — |
| plan-escape-factory-dep                        | resolution     |   300 |          7,550,000 |                — |            — |             — |           — |          — |                 — |
| plan-escape-scoped-dep                         | resolution     |   300 |        12,085,248‡ |                — |            — |             — |           — |          — |                 — |
| plan-escape-hooked-dep                         | resolution     |   300 |          3,975,464 |                — |            — |             — |           — |          — |                 — |
| plan-escape-optional-dep                       | resolution     |   300 |          6,014,799 |                — |            — |             — |           — |          — |                 — |
| plan-escape-multi-dep                          | resolution     |   300 |          3,034,547 |                — |            — |             — |           — |          — |                 — |
| plan-class-chain-24                            | resolution     |     1 |          7,405,391 |                — |            — |             — |           — |          — |                 — |
| plan-class-chain-40                            | resolution     |     1 |          4,367,307 |                — |            — |             — |           — |          — |                 — |
| interpreted-class-chain-24                     | resolution     |     1 |            434,333 |                — |            — |             — |           — |          — |                 — |
| interpreted-class-chain-40                     | resolution     |     1 |            237,860 |                — |            — |             — |           — |          — |                 — |
| plan-runs-1                                    | resolution     |     1 |           907,719‡ |                — |            — |             — |           — |          — |                 — |
| plan-runs-256                                  | resolution     |     1 |             14,849 |                — |            — |             — |           — |          — |                 — |
| plan-runs-512                                  | resolution     |     1 |              8,103 |                — |            — |             — |           — |          — |                 — |
| plan-runs-1024                                 | resolution     |     1 |              3,851 |                — |            — |             — |           — |          — |                 — |
| plan-runs-2048                                 | resolution     |     1 |              1,917 |                — |            — |             — |           — |          — |                 — |
| plan-runs-4096                                 | resolution     |     1 |              1,188 |                — |            — |             — |           — |          — |                 — |
| plan-runs-8192                                 | resolution     |     1 |                628 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-1                               | resolution     |     1 |            239,745 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-256                             | resolution     |     1 |              4,675 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-512                             | resolution     |     1 |              2,483 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-1024                            | resolution     |     1 |              1,310 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-2048                            | resolution     |     1 |                647 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-8192                            | resolution     |     1 |                215 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-1                              | resolution     |     1 |            886,724 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-512                            | resolution     |     1 |              7,865 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-1024                           | resolution     |     1 |              4,081 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-2048                           | resolution     |     1 |              1,953 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-8192                           | resolution     |     1 |                632 |                — |            — |             — |           — |          — |                 — |
| nested-context-resolve-in-factory              | resolution     |   300 |         44,008,695 |           1.84×† |       3.73×† |        5.04×† |      17.5×† |     2.23×† |            0.79×† |
| nested-container-resolve-in-factory            | resolution     |   300 |         39,093,705 |           1.65×† |       2.81×† |       4.55×†‡ |      15.7×† |     1.06×† |            0.82×† |
| accessor-injection-construct                   | resolution     |   300 |         9,158,157‡ |          0.25×†‡ |            — |             — |           — |          — |                 — |

† 134 row(s) above ~30M ops/s: this ratio moves between runs of the same build, whatever its IQR says. Cite the
aggregates, not the row.

‡ 95 cell(s) whose per-trial IQR exceeds 5%: the median is unstable within this run. Re-run on a quieter machine before
reading the cell closely.

## Re-running this

```bash
pnpm bench:baseline                                             # from benchmarks/di — the full-profile pass above, read against the baseline
pnpm bench:report                                               # derive report.md + report.json from the newest run
pnpm bench:footprint                                            # the bundle table: each library's smallest program, minified and gzipped
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
