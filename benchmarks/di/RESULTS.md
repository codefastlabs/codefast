# Results

Where `@codefast/di` actually stands against the field right now, wins and losses given equal weight — the point of this
page is to know where the engine is slower so the next change knows what to aim at. One machine-derived snapshot, no
accreted ledger. The method is in [`BENCH_GUIDE.md`](./BENCH_GUIDE.md); re-run it with the recipe at the bottom.

**This is one full-profile pass, so read the aggregates, not the rows.** GC-exposed for one collection between trials,
one subprocess per scenario, libraries interleaved with rotating order, 3 trials each over the one closure a scenario
builds before its first trial — a single pass measures no between-run variance of its own, 97 of the cells carry a
per-trial IQR above 5%, and 137 cells in 48 rows sit above ~30M ops/s, where the ratio moves between runs of the same
build whatever its IQR says. Ratios are worth more than the absolute `hz/op`; a single row is worth less than the group
it sits in. A loss highlighted below points at a direction — quote a precise factor only after a paired re-run, except
where a loss is a structural difference that reproduces by construction (called out as such).

**This page is the baseline.** It transcribes `baselines/2026-10-15T23-25-39-540Z`, whose `observations.jsonl` is
committed, so every figure here can be re-read from the repository rather than from a local `bench-results/` run only
the author has. `baselines/` holds that one run and nothing else: the next pass is read against it, and a pass accepted
in its place becomes this page. 146 scenarios ran, 132 of them aggregate-eligible; every library implements every row
its declared features allow, so a `—` below is a feature the library lacks, never a row nobody wrote.

**Environment.** `@codefast/di` at `a849136d8` — 0.13.0 plus the unreleased introspection functions and settled
dependency slots — from a `dist` built first, on Node 26.1.0 / V8 14.6, Apple M3 Max × 14, darwin/arm64, `--expose-gc`
for every library. inversify 8.2.3 · awilix 13.0.5 · tsyringe 4.10.0 · brandi 5.1.0 · ditox 3.3.0 · injection-js 2.6.1.
Each library runs at its canonical decorator mode (inversify legacy decorators + `reflect-metadata`, codefast standard
decorators + `Symbol.metadata`); every inversify container uses `{ jitless: false }`, its fastest documented
configuration. Run 2026-10-16, 2m17s wall, 0 sanity failures; the 1-minute load average read 3.66 at every child's
start, on fourteen cores.

**What moved since the previous pass.** Per row, every competitor reads within 1% of the previous pass's median, 0.996×
to 1.009×, so this pass sits level with the last and a row that moved is the row, not the pass. One engine change landed
in between: every dependency slot is now settled into one shape before the cold class lane reads it, so that lane no
longer goes megamorphic in a process that has resolved many slot shapes. The rows it aims at moved: `app-boot-40` +24%
(91.8K to 113.6K boots/s), `realistic-graph-class-cold-resolve` +18%, `slot-injected-name-interpreted` +35% and
`-tag-interpreted` +16%, `boot-decorated-container-build-and-resolve` +9%, `interpreted-class-chain-24` and `-40` +6%
and +9%. The paired A/B that landed the change read the first four at +13%, +16%, +31% and +5%, both orders agreeing;
cite those, not this pass. `plan-async-resolved-chain-8` reads +24%, a row bimodal per process. The harness flags four
rows at −5% to −7% — `resolve-all-named-16`, `scale-deep-transient-chain-512`, `plan-runs-mixed-512`,
`fresh-child-default-n1` — each with siblings that read level (`resolve-all-named-8`/`-32`/`-64`,
`scale-mid-transient-chain-32`, `plan-runs-mixed-1024`, `fresh-child-default-n4`), and `alias-parent-owned-terminal`
reads −15% above the ceiling; no paired run has looked at those five yet, so they are directions, not findings.

## Summary — where we stand

Ratios are `@codefast/di ÷ competitor`; above 1× means codefast is faster. Win `>1.03×`, parity `0.97–1.03×`, loss
`<0.97×`. `Comparable` counts the rows both libraries ran, of 132 aggregate-eligible rows codefast measures; `†` is how
many of those the median and geomean carry from above the throughput ceiling — they stay in the aggregate but no reader
should cite one alone.

| Competitor     | Comparable | Win / parity / loss | Median | Geomean |   † |
| -------------- | ---------: | ------------------: | -----: | ------: | --: |
| InversifyJS 8  |  93 of 132 |          91 / 1 / 1 |  4.42× |   5.87× |  44 |
| Awilix 13      |  39 of 132 |          39 / 0 / 0 |  6.25× |   6.27× |  16 |
| tsyringe 4     |  44 of 132 |          40 / 0 / 4 |  4.33× |   3.91× |  19 |
| Brandi 5       |  31 of 132 |          30 / 0 / 1 |  13.2× |   11.8× |  16 |
| Ditox 3        |  46 of 132 |         33 / 3 / 10 |  1.39× |   1.68× |  20 |
| injection-js 2 |  32 of 132 |          22 / 1 / 9 |  1.59× |   1.48× |  22 |

**The headline, stated plainly: codefast sweeps awilix outright, takes inversify and brandi on all but one row each,
wins tsyringe on the median by 4.33× while losing it four rows, and holds both aggregates against the two libraries it
is closest to** — ditox 1.39× on the median and 1.68× on the geomean, injection-js 1.59× and 1.48×. Startup, which read
0.85× ditox in the previous pass, now reads level. The losses cluster in four shapes, and every one of them is named
below: **registration** and everything that binds before it resolves, **cold collections** against tsyringe, the
**failure path**, and a handful of warm rows above the throughput ceiling where ditox and injection-js read level or
ahead.

## What a user waits for

Most rows above price one operation in isolation, and many of them run faster than any request could notice. Three
measurements are the ones an application feels, so they lead: what starting it up costs, what one request costs, and
what the library adds to a browser bundle.

**Startup.** `app-boot-40` creates a container, registers a forty-service graph as classes in each library's own idiom
(32 singletons, 8 transient handlers) and resolves every handler once: about 8.8 µs per boot (113.6K boots/s). It reads
1.62× tsyringe, 2.45× injection-js, 5.79× brandi, 13.6× awilix and 36.7× inversify, and **0.98× ditox** — level with the
one library that booted faster in the previous pass, about 8.7 µs to codefast's 8.8. The ten-node rows agree:
`realistic-graph-class-cold-resolve` 0.94× ditox and 1.49× tsyringe, `boot-decorated-container-build-and-resolve` 1.19×
tsyringe. What is left of the ditox gap is the registration the next section names.

**One request.** Every per-request row is a win against every library that has a child container. A request through a
child container in `production-http-handler` reads 1.16× ditox, 3.32× tsyringe, 7.69× awilix and 28.4× inversify;
`production-unit-of-work` 1.17× ditox and 2.46× tsyringe; `child-request-lifecycle-create-resolve-dispose` 1.56× ditox
and 5.05× tsyringe; `scoped-binding-per-child` 1.48× ditox and 1.30× tsyringe.

**Bundle.** `pnpm bench:footprint` bundles each library's smallest bind-and-resolve program with Rolldown 1.2.14 for the
browser, minified. A library whose setup requires `reflect-metadata` ships it, and the polyfill is measured alone on the
last line.

| Library                  | Minified | Gzipped |
| ------------------------ | -------: | ------: |
| @codefast/di             |  75.3 KB | 20.2 KB |
| InversifyJS 8            |  97.4 KB | 21.3 KB |
| Awilix 13                |   8.9 KB |  3.4 KB |
| tsyringe 4               |  26.7 KB |  8.2 KB |
| Brandi 5                 |   4.8 KB |  1.6 KB |
| Ditox 3                  |   2.1 KB |  0.9 KB |
| injection-js 2           |  30.9 KB |  8.9 KB |
| `reflect-metadata` alone |  13.3 KB |  4.2 KB |

This is the widest gap on the page. The decorator-free libraries ship one to four kilobytes gzipped, and the
legacy-decorator ones about eight plus the polyfill; `@codefast/di` ships 20.2 KB, second only to inversify. Most of it
is the engine that wins the per-request rows — the resolver, the plan compiler and its code generation — and the
checking and describing functions already stay out of a program that does not call them.

## The losses, foregrounded — where to improve

Ordered by how much they matter, each marked as a **real deficit** (same work, codefast slower), a **work difference**
(codefast does more per op by design, so the row is a design cost to reconsider, not a bug) or a **chosen cost** (a
correctness property paid for with its price known).

- **Registration is the biggest deficit, and ditox is the rival it is wide against.** `bind-128-plain` — 128 transient
  factory bindings into a fresh container, no resolve — runs at 0.40× ditox, 0.95× tsyringe and 1.81× injection-js. What
  it pays is the object: the chain object is the fluent builder the contract returns, and the probe is last-wins, so
  closing this row is a contract change (a lighter builder, or a bulk bind), not an optimisation. Everything that binds
  before it resolves sits on the same floor — `create-child-empty` 1.86× ditox and 1.23× tsyringe,
  `container-create-empty` 1.75× and 1.27×, `realistic-graph-class-cold-resolve` 0.94× ditox and 1.49× tsyringe,
  `app-boot-40` 0.98× ditox and 1.62× tsyringe, `boot-decorated-container-build-and-resolve` 1.19× tsyringe,
  `module-cold-from-modules` 1.30× ditox. The two empty-container rows lose injection-js above the ceiling (0.66×† and
  0.56×†), whose injector is fewer objects still. With the cold class lane settled, the startup rows that bind classes
  now lose ditox by registration alone. **Real deficit, structural** — one object per binding is the design.
- **The cold collection loses tsyringe, and only tsyringe.** `resolve-all-cold-N` builds a fresh container and reads the
  collection once: at N=10, 0.69× tsyringe while ditox 1.10× and injection-js 1.57× are wins; at N=100, 0.49×‡ tsyringe,
  1.74×‡ ditox and 1.57×‡ injection-js. What the pair still pays is the registration above, ten or a hundred times,
  against tsyringe's plain array of providers. **Real deficit against tsyringe — the registration cost seen from the
  collection side.**
- **Teardown at scale is mostly a registration loss and a cold-class loss, with a smaller teardown share on top.**
  `materialize-100-singletons` (bind and resolve 100 singletons, no teardown) is 0.70× ditox and 2.43× tsyringe;
  `unbind-all-100-singletons` (the same, then `unbindAll()` with a hundred `@preDestroy` calls) 0.66× and 1.91×. Read as
  time, the teardown itself — the second row less the first — is about 2.7 µs for the hundred against ditox's 1.4 µs for
  its `removeAll()`, and 2.6 µs against 1.8 µs in the previous pass: a difference of two rows carries the noise of both.
  It is the walk plus a method found by name on each instance, where ditox calls the one function it was handed. Most of
  either row sits underneath it: the 100 bindings, and the first resolve of each, because codefast's side binds a class
  with `.to(Class).singleton()` where ditox binds a factory, and constructing a class with metadata costs more than
  calling a factory. `lifecycle-pre-destroy-unbind` (one singleton, one hook) is 1.23× ditox and 2.57× tsyringe. **Real
  deficit on the registration and the cold class lane underneath; the teardown share is a work difference, a hook found
  by name.**
- **The stable-set collections are a chosen cost.** `resolve-all-strategies-10` 0.83×†‡ ditox and 0.88×†‡ injection-js,
  `-100` 0.65×†‡ and 0.65×†‡, and `production-event-bus-dispatch` 0.83×† ditox: a root-level `resolveAll` hands each
  caller a copy of its memoized list rather than the list itself, so no caller can mutate the engine's memo, while both
  rivals hand out the cached array they share. The event bus is that copy plus the dispatch; against injection-js it
  reads 0.90×† in this pass against 1.11×† in the previous one, with codefast's own figure level at 52.7M ops/s, so it
  is the rival's figure that moved above the ceiling. The one map read the bus used to pay beyond the copy is absorbed
  by a one-entry cell in front of the collection memo. A frozen list was measured and rejected — a frozen array iterates
  through a slow elements kind for every consumer. **Chosen cost**, its own commit, reversible alone.
- **Rebind wins awilix and still loses ditox above the ceiling.** `rebind-hot-swap` 1.58× awilix and 0.23×† ditox;
  `rebind-parent-resolve-child-depth-3` 1.50× awilix and 1.50× ditox. A rebind of a lone token is one registration whose
  displaced binding is deactivated on the spot; what it pays against ditox's bare map write is the builder object and
  the deactivation walk. **Work difference**, above the ceiling.
- **Three rows lose injection-js above the ceiling.** `nested-context-resolve-in-factory` 0.85×† and
  `nested-container-resolve-in-factory` 0.79×† — a factory that resolves from its context or from the container
  mid-construction — and the alias `alias-parent-owned-terminal` 0.65×†, with `alias-chain-3` (1.00×†) level and
  `to-alias-redirect` (1.05×†) ahead beside it. Measured on their own, outside the harness, codefast is ahead of
  injection-js on both nested-factory shapes. The loss appears in the harness child, which builds every scenario before
  it measures one, so the factory call site that the transient dynamic lane inlines has already seen hundreds of
  factories and V8 stops inlining through it; injection-js's lane inlines nothing to begin with, so the same state costs
  it nothing. The harness keeps that state on purpose, as [`BENCH_GUIDE.md`](./BENCH_GUIDE.md) records. The aliases are
  structural: injection-js caches an alias's answer in the injector's own slot on the first read, while codefast
  resolves the alias on every read and never caches a parent's instance in a child. **Harness state** for the two nested
  rows, **work difference** for the alias. Below the ceiling, `realistic-graph-resolve-root` reads 1.29× injection-js
  again, injection-js holding level at 15.4M ops/s.
- **`accessor-injection-construct` 0.27×†‡ inversify.** The row measures the benchmark's transpiler as much as the
  engine: tsx's esbuild lowers the scenario's decorated `accessor` field to `WeakMap`-backed privates (`__privateAdd`,
  `__accessCheck`) and its own decorator runtime. A standalone probe of the same class compiled by the repo's `tsc`,
  which keeps a native private field, resolves in 44 ns against 139 ns through esbuild, so the lowering is most of the
  row. What the engine pays is the ambient scope around construction and the accessor's own `resolve` through the
  container, where inversify's property injection is a metadata read on the same plan. **Work difference**, and the
  harness stays as it is: a codefast user on tsx or esbuild pays the same lowering, and a different transpiler for one
  library would move every codefast row, canaries included. Vite 8's Babel recipe keeps a native private field, as `tsc`
  does, so a Vite user sits nearer the probe's figure than the row's.
- **Failing fast costs more here: `misconfigured-missing-binding` 0.74×‡ tsyringe, 0.77×‡ brandi, 0.77×‡ ditox, 0.88×‡
  injection-js.** codefast builds a structured error carrying the resolution path; the rivals throw a string, and the
  stack capture both pay is most of the row. **Work difference** on a path a production request should never take.

## The wins

- **inversify — 91 of 93 comparable rows, 4.42× median, 5.87× geomean.** Widest margins on `boot` (24.6×), `production`
  (18.6×), `scope` (13.4×), `lifecycle` (13.2×), `realistic` (6.59×), `fan-out` (6.21×), `introspection` (5.94×),
  `micro` (4.16×) and `slot-selection` (3.85×); tightest on `scale` (1.97×), `failure` (1.55×), `async` (1.54×) and
  `resolution` (0.92×, which is the accessor row pulling against the plan rows). `resolve-all-async-8` is at parity
  (1.01×), and `circular-dependency-3` and `alias-cycle-detected` are excluded from the aggregates entirely — inversify
  recurses toward the stack limit rather than detecting either.
- **awilix — 39 of 39, 6.25× median, 6.27× geomean, no loss at all.** Widest on `boot` (15.7×), `scale` (10.4×),
  `realistic` (7.42×), `scope` (7.06×), `production` (7.06×) and `micro` (6.57×); tightest on `async` (1.29×) and
  `introspection` (1.30×).
- **tsyringe — 40 of 44, 4.33× median, 3.91× geomean.** 12.5× on `micro`, 6.64× on `scope`, 4.75× on `resolution` and
  4.07× on `introspection`; it keeps four rows — the two cold collections, the missing-binding throw and
  `bind-128-plain` at 0.95×, a hair under parity — while `app-boot-40` reads 1.62×, `container-create-empty` 1.27×,
  `create-child-empty` 1.23× and the decorated boot 1.19×.
- **brandi — 30 of 31, 13.2× median, 11.8× geomean.** 23.6× on `micro`, 17.6× on `scope`, 17.0× on `resolution` and
  16.8× on `realistic`; it loses only the missing-binding throw (0.77×‡).
- **ditox — 33 rows to 10 with three at parity, and both aggregates (1.39× median, 1.68× geomean).** The sweep is in the
  warm work and the per-request work: `scope` 4.72×, `realistic` 2.20×, `micro` 2.08×, `introspection` 1.60×,
  `resolution` 1.55×, `scale` 1.31×, `boot` 1.26×, `fan-out` 1.17×, `production` 1.04×, `async` 1.04×. Named rows:
  `module-cold-128` 2.40×, `create-child-empty` 1.86×, `container-create-empty` 1.75×, `resolve-all-cold-100` 1.74×‡,
  `rebind-parent-resolve-child-depth-3` 1.50×, `module-cold-from-modules` 1.30×, `lifecycle-pre-destroy-unbind` 1.23×,
  `resolve-all-cold-10` 1.10×, `scale-deep-transient-chain-512` 1.08×, `async-init-single-hop` 1.04×. At parity:
  `app-boot-40` (0.98×) and two ceiling rows, `to-resolved-3-deps` (1.00×†) and `nested-container-resolve-in-factory`
  (1.01×†). What it still takes is every row that binds many things — `bind-128-plain`, the 100-singleton pair and
  `realistic-graph-class-cold-resolve` (0.94×) — the two stable sets, the event bus, `rebind-hot-swap` (0.23×†) and
  `singleton-class-1-dep` (0.96×†); `lifecycle` (0.72×, the 100-singleton pair) and `failure` (0.77×, the
  missing-binding throw) are its winning groups.
- **injection-js — 22 rows to 9 with one at parity, 1.59× median, 1.48× geomean.** `realistic` 2.66×, `scope` 1.78×,
  `micro` 1.57×; narrower on `boot` (1.32×), `async` (1.12×) and `fan-out` (1.09×). Its wins are the ceiling rows above,
  both stable sets, the two empty containers, the event bus and the missing-binding throw, which leave it the
  `resolution` (0.82×), `failure` (0.88×) and `production` (0.90×, the event bus alone) groups. The alias is a shape
  where a `ReflectiveInjector` that caches every provider's answer per injector does less work than a container that
  does not; the two nested-factory rows are the harness state the loss list names.

## Geomean by group

Geomean of the ratios in each group, comparable row count in parentheses. Read a group, not a cell.

| Group          | InversifyJS 8 | Awilix 13 | tsyringe 4 |  Brandi 5 |   Ditox 3 | injection-js 2 |
| -------------- | ------------: | --------: | ---------: | --------: | --------: | -------------: |
| micro          |    4.16× (22) | 6.57× (8) |  12.5× (7) | 23.6× (8) | 2.08× (7) |      1.57× (9) |
| realistic      |     6.59× (5) | 7.42× (4) |  3.86× (4) | 16.8× (5) | 2.20× (5) |      2.66× (5) |
| boot           |     24.6× (9) | 15.7× (4) |  1.23× (5) | 5.23× (6) | 1.26× (6) |      1.32× (5) |
| fan-out        |     6.21× (9) | 2.12× (1) |  2.32× (5) | 9.48× (1) | 1.17× (5) |      1.09× (4) |
| async          |    1.54× (10) | 1.29× (1) |  1.44× (1) | 2.85× (1) | 1.04× (1) |      1.12× (1) |
| lifecycle      |     13.2× (8) | 5.78× (5) |  2.74× (4) |         — | 0.72× (5) |              — |
| scope          |    13.4× (12) | 7.06× (8) |  6.64× (8) | 17.6× (5) | 4.72× (8) |      1.78× (4) |
| scale          |     1.97× (2) | 10.4× (2) |  3.62× (2) | 8.36× (2) | 1.31× (2) |              — |
| failure        |     1.55× (2) | 2.29× (1) |  0.74× (1) | 0.77× (1) | 0.77× (1) |      0.88× (1) |
| production     |     18.6× (3) | 7.06× (2) |  3.66× (3) |         — | 1.04× (3) |      0.90× (1) |
| introspection  |     5.94× (2) | 1.30× (1) |  4.07× (2) |         — | 1.60× (1) |              — |
| slot-selection |     3.85× (6) |         — |          — |         — |         — |              — |
| resolution     |     0.92× (3) | 3.27× (2) |  4.75× (2) | 17.0× (2) | 1.55× (2) |      0.82× (2) |

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
| constant-resolve                               | micro          |  1000 |        214,695,141 |           2.71×† |       5.62×† |        11.4×† |      37.2×† |     1.10×† |            1.62×† |
| singleton-class-1-dep                          | micro          |   200 |        185,633,366 |           3.32×† |       4.45×† |        10.6×† |      32.8×† |     0.96×† |            3.31×† |
| transient-class-1-dep                          | micro          |   200 |         78,418,921 |           1.91×† |       8.73×† |        14.0×† |      34.3×† |     8.17×† |                 — |
| named-constant-get                             | micro          |   500 |         99,172,962 |           3.55×† |            — |             — |           — |          — |                 — |
| named-resolve-slots-1                          | micro          |   500 |        135,197,647 |           4.81×† |            — |             — |           — |          — |                 — |
| named-resolve-slots-4                          | micro          |   500 |        138,699,897 |           4.97×† |            — |             — |           — |          — |                 — |
| named-resolve-slots-16                         | micro          |   500 |        138,493,580 |           5.06×† |            — |             — |           — |          — |                 — |
| named-resolve-slots-64                         | micro          |   500 |        138,277,036 |           4.96×† |            — |             — |           — |          — |                 — |
| optional-missing-transient                     | micro          |   200 |         56,782,018 |           1.14×† |            — |             — |      13.2×† |     4.14×† |                 — |
| realistic-graph-resolve-root                   | realistic      |    20 |         19,943,863 |            2.94× |        2.79× |         5.56× |       16.2× |      1.74× |             1.29× |
| realistic-graph-cold-resolve                   | realistic      |     1 |           298,830‡ |           10.6×‡ |       4.63×‡ |        2.07×‡ |      4.79×‡ |     1.06×‡ |            2.20×‡ |
| realistic-graph-resolved-root                  | realistic      |    20 |         63,850,471 |           3.27×† |            — |             — |      50.4×† |     5.36×† |            4.02×† |
| realistic-graph-class-resolve-root             | realistic      |    20 |         59,564,033 |           3.06×† |       10.0×† |        12.9×† |      48.5×† |     5.56×† |            4.13×† |
| realistic-graph-class-cold-resolve             | realistic      |     1 |            669,375 |            39.8× |       23.5×‡ |         1.49× |       7.11× |      0.94× |             2.80× |
| app-boot-40                                    | boot           |     1 |            113,562 |           36.7×‡ |       13.6×‡ |         1.62× |      5.79×‡ |      0.98× |            2.45×‡ |
| realistic-graph-validate                       | realistic      |    10 |         18,334,689 |                — |            — |             — |           — |          — |                 — |
| fan-out-tree-depth-3-breadth-4                 | fan-out        |    20 |          1,868,351 |            1.73× |        2.12× |         3.15× |       9.48× |      2.13× |                 — |
| resolve-all-strategies-10                      | fan-out        |     1 |        32,219,138‡ |          8.43×†‡ |            — |       3.62×†‡ |           — |    0.83×†‡ |           0.88×†‡ |
| resolve-all-strategies-100                     | fan-out        |     1 |         24,184,415 |            54.4× |            — |         17.6× |           — |    0.65×†‡ |           0.65×†‡ |
| resolve-all-cold-10                            | fan-out        |     1 |          2,353,151 |           30.6×‡ |            — |         0.69× |           — |      1.10× |             1.57× |
| resolve-all-cold-100                           | fan-out        |     1 |           263,720‡ |           31.8×‡ |            — |        0.49×‡ |           — |     1.74×‡ |            1.57×‡ |
| resolve-all-named-8                            | fan-out        |     1 |         22,944,221 |            2.02× |            — |             — |           — |          — |                 — |
| resolve-all-named-16                           | fan-out        |     1 |         21,643,295 |            1.90× |            — |             — |           — |          — |                 — |
| resolve-all-named-32                           | fan-out        |     1 |         23,646,083 |            2.14× |            — |             — |           — |          — |                 — |
| resolve-all-named-64                           | fan-out        |     1 |         23,926,548 |            2.16× |            — |             — |           — |          — |                 — |
| resolve-async-single-hop                       | async          |     1 |          9,729,182 |           1.37×‡ |            — |             — |           — |          — |                 — |
| async-init-single-hop                          | async          |     1 |          7,102,439 |            1.68× |        1.29× |         1.44× |       2.85× |      1.04× |            1.12×‡ |
| dynamic-async-chain-8                          | async          |     1 |          2,041,555 |            1.52× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-8                      | async          |     1 |          1,193,910 |            1.57× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-16                     | async          |     1 |            696,960 |           1.72×‡ |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-32                     | async          |     1 |            353,257 |            1.97× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-64                     | async          |     1 |            159,405 |            1.91× |            — |             — |           — |          — |                 — |
| async-branch-chain-8                           | async          |     1 |          1,364,828 |                — |            — |             — |           — |          — |                 — |
| async-branch-escape-mid-chain-8                | async          |     1 |          1,699,964 |                — |            — |             — |           — |          — |                 — |
| async-diamond-shared-leaf                      | async          |     1 |          1,951,450 |            1.35× |            — |             — |           — |          — |                 — |
| plan-async-resolved-chain-8                    | async          |     1 |          2,835,091 |                — |            — |             — |           — |          — |                 — |
| plan-async-class-chain-8                       | async          |     1 |          5,264,744 |                — |            — |             — |           — |          — |                 — |
| resolve-all-async-8                            | async          |     1 |            974,133 |            1.01× |            — |             — |           — |          — |                 — |
| resolve-optional-async-miss                    | async          |     1 |         10,448,553 |            1.59× |            — |             — |           — |          — |                 — |
| lifecycle-post-construct-singleton             | lifecycle      |   250 |        189,458,539 |           3.36×† |            — |             — |           — |          — |                 — |
| lifecycle-pre-destroy-unbind                   | lifecycle      |     1 |          3,697,274 |            26.2× |       9.13×‡ |         2.57× |           — |      1.23× |                 — |
| binding-level-activation-hook                  | lifecycle      |   200 |         62,825,956 |           2.32×† |            — |             — |           — |          — |                 — |
| child-depth-1-resolve                          | scope          |   500 |        109,805,686 |          1.50×†‡ |       4.31×† |        7.50×† |      21.5×† |     4.75×† |            1.42×† |
| child-depth-2-resolve                          | scope          |   500 |        108,936,487 |           1.44×† |       5.72×† |        8.45×† |      22.1×† |     8.10×† |            1.73×† |
| child-depth-4-resolve                          | scope          |   500 |        107,868,451 |           1.42×† |       8.34×† |        11.0×† |      23.4×† |     17.2×† |            1.63×† |
| child-depth-8-resolve                          | scope          |   500 |        108,845,946 |           1.47×† |       14.4×† |        16.9×† |      28.3×† |     30.8×† |            2.51×† |
| child-request-lifecycle-create-resolve-dispose | scope          |   100 |         2,622,975‡ |           48.6×‡ |       11.8×‡ |        5.05×‡ |           — |     1.56×‡ |                 — |
| fresh-child-default-n1                         | scope          |   100 |         10,474,763 |           41.4×‡ |       7.46×‡ |         6.88× |           — |      1.96× |                 — |
| fresh-child-default-n4                         | scope          |   100 |          7,892,757 |           31.3×‡ |       6.65×‡ |         7.16× |           — |      2.65× |                 — |
| fresh-child-name-n1                            | scope          |   100 |         10,226,896 |           42.3×‡ |            — |             — |           — |          — |                 — |
| fresh-child-name-n4                            | scope          |   100 |          7,479,990 |           33.3×‡ |            — |             — |           — |          — |                 — |
| fresh-child-tag-n1                             | scope          |   100 |         10,539,479 |           48.0×‡ |            — |             — |           — |          — |                 — |
| fresh-child-tag-n4                             | scope          |   100 |         7,643,457‡ |           32.8×‡ |            — |             — |           — |          — |                 — |
| scale-mid-transient-chain-32                   | scale          |     1 |          1,533,834 |            2.65× |        5.28× |         4.40× |       10.9× |      1.59× |                 — |
| scale-deep-transient-chain-512                 | scale          |     1 |             51,352 |            1.46× |        20.4× |         2.98× |       6.40× |      1.08× |                 — |
| boot-decorated-container-build-and-resolve     | boot           |     1 |            900,136 |           22.2×‡ |            — |         1.19× |           — |          — |             2.44× |
| container-create-empty                         | boot           |   100 |         29,507,549 |           47.7×‡ |       11.0×‡ |         1.27× |       8.97× |      1.75× |            0.66×† |
| create-child-empty                             | boot           |   100 |         26,022,763 |            54.1× |       11.9×‡ |         1.23× |       7.84× |      1.86× |            0.56×† |
| bind-128-plain                                 | boot           |     1 |            183,542 |           28.1×‡ |       34.5×‡ |         0.95× |       8.90× |      0.40× |             1.81× |
| bind-128-refined                               | boot           |     1 |             37,656 |           6.11×‡ |            — |             — |           — |          — |                 — |
| misconfigured-missing-binding                  | failure        |     1 |           274,796‡ |           1.54×‡ |       2.29×‡ |        0.74×‡ |      0.77×‡ |     0.77×‡ |            0.88×‡ |
| circular-dependency-3                          | failure        |     1 |           165,145‡ |          187.0×‡ |       1.51×‡ |             — |           — |          — |            0.49×‡ |
| ambiguous-multi-binding                        | failure        |     1 |           237,193‡ |           1.56×‡ |            — |             — |           — |          — |                 — |
| production-http-handler                        | production     |    50 |          1,798,030 |           28.4×‡ |       7.69×‡ |        3.32×‡ |           — |      1.16× |                 — |
| production-unit-of-work                        | production     |   100 |         1,025,478‡ |           17.5×‡ |       6.48×‡ |        2.46×‡ |           — |     1.17×‡ |                 — |
| production-event-bus-dispatch                  | production     |   100 |         52,737,419 |           12.9×† |            — |        6.00×† |           — |     0.83×† |            0.90×† |
| to-resolved-3-deps                             | micro          |   200 |        188,624,681 |           3.25×† |            — |             — |      33.0×† |     1.00×† |            1.70×† |
| to-alias-redirect                              | micro          |   500 |        111,680,007 |           2.01×† |       6.25×† |        12.8×† |           — |          — |            1.05×† |
| to-self-binding                                | micro          |   300 |        173,485,712 |           2.94×† |            — |        8.08×† |           — |          — |            2.95×† |
| alias-chain-3                                  | micro          |   500 |        111,051,188 |           4.42×† |       14.7×† |        24.5×† |           — |          — |            1.00×† |
| alias-parent-owned-terminal                    | micro          |   500 |         86,423,510 |           1.54×† |       5.78×† |        10.8×† |           — |          — |            0.65×† |
| alias-cycle-detected                           | failure        |     1 |           251,509‡ |          700.8×‡ |       2.73×‡ |             — |           — |          — |            0.84×‡ |
| resolve-optional-hit                           | micro          |   500 |        216,886,497 |           6.52×† |       6.11×† |             — |      37.3×† |     1.05×† |            1.64×† |
| resolve-optional-miss                          | micro          |   500 |        265,553,045 |           7.80×† |       4.93×† |             — |      4.34×† |     4.48×† |            1.94×† |
| tagged-binding-resolve                         | micro          |   300 |        145,845,803 |           7.01×† |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-1                         | micro          |   300 |        220,998,077 |           10.3×† |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-4                         | micro          |   300 |        220,868,670 |           10.1×† |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-16                        | micro          |   300 |        219,542,908 |           9.83×† |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-64                        | micro          |   300 |        220,654,242 |           10.1×† |            — |             — |           — |          — |                 — |
| conditional-injection-tagged                   | micro          |   300 |         78,671,331 |           2.12×† |            — |             — |      32.4×† |          — |                 — |
| rebind-hot-swap                                | lifecycle      |    50 |         20,919,801 |           50.5×‡ |        1.58× |             — |           — |     0.23×† |                 — |
| has-bound-check                                | introspection  |  1000 |        370,045,317 |           6.63×† |       1.30×† |        3.39×† |           — |     1.60×† |                 — |
| has-own-unbound-check                          | introspection  |  1000 |        535,156,797 |           5.32×† |            — |        4.89×† |           — |          — |                 — |
| container-level-activation-hook                | lifecycle      |   200 |         55,293,455 |           1.97×† |            — |        4.71×† |           — |          — |                 — |
| scoped-binding-per-child                       | scope          |   100 |         6,226,530‡ |           51.6×‡ |       3.58×‡ |        1.30×‡ |      5.29×‡ |     1.48×‡ |                 — |
| rebind-parent-resolve-child-depth-3            | lifecycle      |    50 |         13,255,107 |            74.8× |        1.50× |             — |           — |      1.50× |                 — |
| materialize-100-singletons                     | lifecycle      |     1 |             95,985 |            24.3× |       18.6×‡ |         2.43× |           — |      0.70× |                 — |
| unbind-all-100-singletons                      | lifecycle      |     1 |            76,289‡ |           25.6×‡ |       16.1×‡ |        1.91×‡ |           — |     0.66×‡ |                 — |
| module-load-unload                             | boot           |     1 |         1,184,959‡ |           16.3×‡ |            — |             — |           — |          — |                 — |
| module-cold-from-modules                       | boot           |     1 |          2,150,251 |           22.3×‡ |            — |             — |       4.24× |      1.30× |                 — |
| module-cold-128                                | boot           |     1 |            209,988 |           25.2×‡ |            — |             — |       1.33× |      2.40× |                 — |
| initialize-async-warmup                        | boot           |     1 |            802,978 |                — |            — |             — |           — |          — |                 — |
| inspect-snapshot                               | introspection  |    20 |          9,308,176 |                — |            — |             — |           — |          — |                 — |
| lookup-bindings                                | introspection  |   200 |         24,373,248 |                — |            — |             — |           — |          — |                 — |
| generate-dependency-graph                      | introspection  |    10 |            782,220 |                — |            — |             — |           — |          — |                 — |
| multi-tag-slot-resolve                         | micro          |   300 |         14,234,960 |                — |            — |             — |           — |          — |                 — |
| multi-tag-constraint-resolve                   | micro          |   200 |         7,434,880‡ |                — |            — |             — |           — |          — |                 — |
| multi-tag-select-32                            | micro          |   300 |          2,858,045 |                — |            — |             — |           — |          — |                 — |
| mask-reject-wide-catalog                       | slot-selection |   300 |         31,573,893 |                — |            — |             — |           — |          — |                 — |
| mask-accept-two-of-four                        | slot-selection |   300 |         20,147,059 |                — |            — |             — |           — |          — |                 — |
| mask-collision-same-bit                        | slot-selection |   300 |         39,635,831 |                — |            — |             — |           — |          — |                 — |
| slot-tag-array-hoisted                         | slot-selection |   300 |        148,273,657 |                — |            — |             — |           — |          — |                 — |
| slot-tag-shorthand-hoisted                     | slot-selection |   300 |        158,733,161 |                — |            — |             — |           — |          — |                 — |
| slot-tag-array-inline                          | slot-selection |   300 |         95,763,457 |                — |            — |             — |           — |          — |                 — |
| slot-tag-shorthand-inline                      | slot-selection |   300 |        115,026,253 |                — |            — |             — |           — |          — |                 — |
| slot-tag-zero-value                            | slot-selection |   300 |        146,920,329 |           6.58×† |            — |             — |           — |          — |                 — |
| slot-name-and-tag                              | slot-selection |   300 |         47,133,041 |           2.34×† |            — |             — |           — |          — |                 — |
| slot-tag-resolve-all                           | slot-selection |   300 |         42,060,221 |           3.43×† |            — |             — |           — |          — |                 — |
| slot-tag-miss-optional                         | slot-selection |   300 |         58,385,829 |           2.32×† |            — |             — |           — |          — |                 — |
| slot-tag-parent-owned                          | slot-selection |   300 |        131,698,537 |           6.12×† |            — |             — |           — |          — |                 — |
| slot-name-parent-owned                         | slot-selection |   300 |        109,220,648 |           4.39×† |            — |             — |           — |          — |                 — |
| slot-injected-name-compiled                    | slot-selection |   300 |         69,012,782 |                — |            — |             — |           — |          — |                 — |
| slot-injected-name-interpreted                 | slot-selection |   300 |          6,549,740 |                — |            — |             — |           — |          — |                 — |
| slot-injected-tag-compiled                     | slot-selection |   300 |         71,107,537 |                — |            — |             — |           — |          — |                 — |
| slot-injected-tag-interpreted                  | slot-selection |   300 |          6,016,913 |                — |            — |             — |           — |          — |                 — |
| plan-deps-inlined                              | resolution     |   300 |         61,470,500 |                — |            — |             — |           — |          — |                 — |
| plan-escape-factory-dep                        | resolution     |   300 |          7,711,554 |                — |            — |             — |           — |          — |                 — |
| plan-escape-scoped-dep                         | resolution     |   300 |         12,984,752 |                — |            — |             — |           — |          — |                 — |
| plan-escape-hooked-dep                         | resolution     |   300 |          4,114,478 |                — |            — |             — |           — |          — |                 — |
| plan-escape-optional-dep                       | resolution     |   300 |          6,037,499 |                — |            — |             — |           — |          — |                 — |
| plan-escape-multi-dep                          | resolution     |   300 |          3,094,411 |                — |            — |             — |           — |          — |                 — |
| plan-class-chain-24                            | resolution     |     1 |          7,308,553 |                — |            — |             — |           — |          — |                 — |
| plan-class-chain-40                            | resolution     |     1 |          4,259,948 |                — |            — |             — |           — |          — |                 — |
| interpreted-class-chain-24                     | resolution     |     1 |            461,248 |                — |            — |             — |           — |          — |                 — |
| interpreted-class-chain-40                     | resolution     |     1 |            258,865 |                — |            — |             — |           — |          — |                 — |
| plan-runs-1                                    | resolution     |     1 |            977,243 |                — |            — |             — |           — |          — |                 — |
| plan-runs-256                                  | resolution     |     1 |             14,802 |                — |            — |             — |           — |          — |                 — |
| plan-runs-512                                  | resolution     |     1 |              8,041 |                — |            — |             — |           — |          — |                 — |
| plan-runs-1024                                 | resolution     |     1 |              3,990 |                — |            — |             — |           — |          — |                 — |
| plan-runs-2048                                 | resolution     |     1 |              1,945 |                — |            — |             — |           — |          — |                 — |
| plan-runs-4096                                 | resolution     |     1 |              1,147 |                — |            — |             — |           — |          — |                 — |
| plan-runs-8192                                 | resolution     |     1 |                645 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-1                               | resolution     |     1 |           259,085‡ |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-256                             | resolution     |     1 |              4,675 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-512                             | resolution     |     1 |              2,371 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-1024                            | resolution     |     1 |              1,280 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-2048                            | resolution     |     1 |                649 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-8192                            | resolution     |     1 |                213 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-1                              | resolution     |     1 |            916,507 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-512                            | resolution     |     1 |              7,318 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-1024                           | resolution     |     1 |              3,994 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-2048                           | resolution     |     1 |              1,978 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-8192                           | resolution     |     1 |                637 |                — |            — |             — |           — |          — |                 — |
| nested-context-resolve-in-factory              | resolution     |   300 |         46,370,743 |           1.84×† |       3.90×† |        5.29×† |      18.8×† |     2.40×† |            0.85×† |
| nested-container-resolve-in-factory            | resolution     |   300 |         38,184,217 |           1.60×† |       2.74×† |        4.27×† |      15.4×† |     1.01×† |            0.79×† |
| accessor-injection-construct                   | resolution     |   300 |         9,522,641‡ |          0.27×†‡ |            — |             — |           — |          — |                 — |

† 137 row(s) above ~30M ops/s: this ratio moves between runs of the same build, whatever its IQR says. Cite the
aggregates, not the row.

‡ 97 cell(s) whose per-trial IQR exceeds 5%: the median is unstable within this run. Re-run on a quieter machine before
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
