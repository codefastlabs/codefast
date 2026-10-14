# Results

Where `@codefast/di` actually stands against the field right now, wins and losses given equal weight — the point of this
page is to know where the engine is slower so the next change knows what to aim at. One machine-derived snapshot, no
accreted ledger. The method is in [`BENCH_GUIDE.md`](./BENCH_GUIDE.md); re-run it with the recipe at the bottom.

**This is one full-profile pass, so read the aggregates, not the rows.** GC-exposed for one collection between trials,
one subprocess per scenario, libraries interleaved with rotating order, 3 trials each over the one closure a scenario
builds before its first trial — a single pass measures no between-run variance of its own, 86 of the cells carry a
per-trial IQR above 5%, and 137 cells in 48 rows sit above ~30M ops/s, where the ratio moves between runs of the same
build whatever its IQR says. Ratios are worth more than the absolute `hz/op`; a single row is worth less than the group
it sits in. A loss highlighted below points at a direction — quote a precise factor only after a paired re-run, except
where a loss is a structural difference that reproduces by construction (called out as such).

**This page is the baseline.** It transcribes `baselines/2026-10-14T15-54-21-098Z`, whose `observations.jsonl` is
committed, so every figure here can be re-read from the repository rather than from a local `bench-results/` run only
the author has. `baselines/` holds that one run and nothing else: the next pass is read against it, and a pass accepted
in its place becomes this page. 145 scenarios ran, 131 of them aggregate-eligible; every library implements every row
its declared features allow, so a `—` below is a feature the library lacks, never a row nobody wrote.

**Environment.** `@codefast/di` at `2b8197b09` — 0.13.0 — from a `dist` built first, on Node 26.1.0 / V8 14.6, Apple M3
Max × 14, darwin/arm64, `--expose-gc` for every library. inversify 8.2.3 · awilix 13.0.5 · tsyringe 4.10.0 · brandi
5.1.0 · ditox 3.3.0 · injection-js 2.6.1. Each library runs at its canonical decorator mode (inversify legacy
decorators + `reflect-metadata`, codefast standard decorators + `Symbol.metadata`); every inversify container uses
`{ jitless: false }`, its fastest documented configuration. Run 2026-10-14, 2m16s wall, 0 sanity failures; the 1-minute
load average read 1.56 at every child's start, on fourteen cores.

**What moved since the previous pass.** Per row, every library reads within 3% of the previous pass's median, 0.98× to
1.00×, so this pass sits level with the last and a row that moved is the row, not the pass. One row moved on the engine:
`container-create-empty` +13.5%, which a paired A/B of `f1234b08f`, the previous pass's build, against this one reads at
+14.7% in both orders. The harness also calls five rows regressions — `resolve-all-named-64`,
`resolve-optional-async-miss`, `interpreted-class-chain-40` and the two deep `plan-runs-*` rows, −6% to −8% — and the
same A/B reads them between −3.3% and +0.2%, three of them with the two orders disagreeing in sign: they are the pass.
So is `plan-async-resolved-chain-8`, which the previous page named as the lane to look at next after a −9% move; it
reads +13.5% here, its two A/B orders disagree (+4.9% and −9.9%), and a standalone probe of the build before that pass's
async-lane change against this one reads both builds at 327–370 ns per resolve, each process landing in one of two
modes. Its warm path runs the compiled async plan, which that change did not touch, so the row swings with the process
rather than the build, and it is closed rather than a lead.

## Summary — where we stand

Ratios are `@codefast/di ÷ competitor`; above 1× means codefast is faster. Win `>1.03×`, parity `0.97–1.03×`, loss
`<0.97×`. `Comparable` counts the rows both libraries ran, of 131 aggregate-eligible rows codefast measures; `†` is how
many of those the median and geomean carry from above the throughput ceiling — they stay in the aggregate but no reader
should cite one alone.

| Competitor     | Comparable | Win / parity / loss | Median | Geomean |   † |
| -------------- | ---------: | ------------------: | -----: | ------: | --: |
| InversifyJS 8  |  92 of 131 |          90 / 1 / 1 |  4.29× |   5.78× |  44 |
| Awilix 13      |  38 of 131 |          38 / 0 / 0 |  6.25× |   6.17× |  16 |
| tsyringe 4     |  43 of 131 |          39 / 0 / 4 |  4.42× |   4.00× |  19 |
| Brandi 5       |  30 of 131 |          29 / 0 / 1 |  14.6× |   12.2× |  16 |
| Ditox 3        |  45 of 131 |         33 / 1 / 11 |  1.41× |   1.69× |  20 |
| injection-js 2 |  31 of 131 |          21 / 1 / 9 |  1.48× |   1.44× |  22 |

**The headline, stated plainly: codefast sweeps awilix outright, takes inversify and brandi on all but one row each,
wins tsyringe on the median by 4.42× while losing it four rows, one of those at 0.96×, and holds both aggregates against
the two libraries it is closest to** — ditox 1.41× on the median and 1.69× on the geomean, injection-js 1.48× and 1.44×.
The losses cluster in four shapes, and every one of them is named in the next section: **registration** and everything
that binds before it resolves, **cold collections** against tsyringe, the **failure path**, and a handful of warm rows
above the throughput ceiling where ditox and injection-js read level or ahead.

## The losses, foregrounded — where to improve

Ordered by how much they matter, each marked as a **real deficit** (same work, codefast slower), a **work difference**
(codefast does more per op by design, so the row is a design cost to reconsider, not a bug) or a **chosen cost** (a
correctness property paid for with its price known).

- **Registration is the biggest deficit, and ditox is the rival it is wide against.** `bind-128-plain` — 128 transient
  factory bindings into a fresh container, no resolve — runs at 0.39× ditox, 0.96× tsyringe and 1.77× injection-js. What
  it pays is the object: the chain object is the fluent builder the contract returns, and the probe is last-wins, so
  closing this row is a contract change (a lighter builder, or a bulk bind), not an optimisation. Everything that binds
  before it resolves sits on the same floor — `create-child-empty` 1.78× ditox and 1.25× tsyringe,
  `container-create-empty` 1.71× and 1.29×, `realistic-graph-class-cold-resolve` 0.79× ditox and 1.25× tsyringe,
  `boot-decorated-container-build-and-resolve` 1.16× tsyringe, `module-cold-from-modules` 1.30× ditox. The two
  empty-container rows lose injection-js above the ceiling (0.66×† and 0.55×†), whose injector is fewer objects still.
  **Real deficit, structural** — one object per binding is the design.
- **The cold collection loses tsyringe, and only tsyringe.** `resolve-all-cold-N` builds a fresh container and reads the
  collection once: at N=10, 0.69× tsyringe while ditox 1.12× and injection-js 1.48× are wins; at N=100, 0.52×‡ tsyringe,
  1.78×‡ ditox and 1.59×‡ injection-js. What the pair still pays is the registration above, ten or a hundred times,
  against tsyringe's plain array of providers. **Real deficit against tsyringe — the registration cost seen from the
  collection side.**
- **Teardown at scale is mostly a registration loss and a cold-class loss, with a smaller teardown share on top.**
  `materialize-100-singletons` (bind and resolve 100 singletons, no teardown) is 0.66× ditox and 2.22× tsyringe;
  `unbind-all-100-singletons` (the same, then `unbindAll()` with a hundred `@preDestroy` calls) 0.68× and 1.95×. Read as
  time, the teardown itself — the second row less the first — is about 2.3 µs for the hundred against ditox's 1.8 µs for
  its `removeAll()`, and 3.1 µs in the previous pass: a difference of two rows carries the noise of both. It is the walk
  plus a method found by name on each instance, where ditox calls the one function it was handed. Most of either row
  sits underneath it: the 100 bindings, and the first resolve of each, because codefast's side binds a class with
  `.to(Class).singleton()` where ditox binds a factory, and constructing a class with metadata costs more than calling a
  factory. `lifecycle-pre-destroy-unbind` (one singleton, one hook) is 1.30× ditox and 2.70× tsyringe. **Real deficit on
  the registration and the cold class lane underneath; the teardown share is a work difference, a hook found by name.**
- **The stable-set collections are a chosen cost.** `resolve-all-strategies-10` 0.89×†‡ ditox and 0.94×†‡ injection-js,
  `-100` 0.63×†‡ and 0.63×†, and `production-event-bus-dispatch` 0.74×† ditox: a root-level `resolveAll` hands each
  caller a copy of its memoized list rather than the list itself, so no caller can mutate the engine's memo, while both
  rivals hand out the cached array they share. The event bus is that copy plus the dispatch, and against injection-js it
  reads 1.32×† in this pass; the one map read it used to pay beyond the copy is absorbed by a one-entry cell in front of
  the collection memo. A frozen list was measured and rejected — a frozen array iterates through a slow elements kind
  for every consumer. **Chosen cost**, its own commit, reversible alone.
- **Rebind wins awilix and still loses ditox above the ceiling.** `rebind-hot-swap` 1.62× awilix and 0.23×† ditox;
  `rebind-parent-resolve-child-depth-3` 1.49× awilix and 1.78× ditox. A rebind of a lone token is one registration whose
  displaced binding is deactivated on the spot; what it pays against ditox's bare map write is the builder object and
  the deactivation walk. **Work difference**, above the ceiling.
- **Four rows lose injection-js above the ceiling.** `nested-context-resolve-in-factory` 0.80×† and
  `nested-container-resolve-in-factory` 0.88×† — a factory that resolves from its context or from the container
  mid-construction — and the aliases `alias-parent-owned-terminal` 0.88×† and `to-alias-redirect` 0.90×†, with
  `alias-chain-3` (0.99×†) level beside them. Measured on their own, outside the harness, codefast is ahead of
  injection-js on both nested-factory shapes. The loss appears in the harness child, which builds every scenario before
  it measures one, so the factory call site that the transient dynamic lane inlines has already seen hundreds of
  factories and V8 stops inlining through it; injection-js's lane inlines nothing to begin with, so the same state costs
  it nothing. The harness keeps that state on purpose, as [`BENCH_GUIDE.md`](./BENCH_GUIDE.md) records. The aliases are
  structural: injection-js caches an alias's answer in the injector's own slot on the first read, while codefast
  resolves the alias on every read and never caches a parent's instance in a child. **Harness state** for the two nested
  rows, **work difference** for the aliases; the same state puts `nested-container-resolve-in-factory` at 0.96×† against
  ditox in this pass, a win in the last. Below the ceiling, `realistic-graph-resolve-root` reads 1.21× injection-js
  against 1.10× in the previous pass: injection-js holds level at 15.7M ops/s, and codefast's +10% on the row reads
  +2.1% in a paired A/B whose two orders disagree, so the row swings with the pass and one pass does not settle it.
- **`accessor-injection-construct` 0.26×†‡ inversify.** The row measures the benchmark's transpiler as much as the
  engine: tsx's esbuild lowers the scenario's decorated `accessor` field to `WeakMap`-backed privates (`__privateAdd`,
  `__accessCheck`) and its own decorator runtime. A standalone probe of the same class compiled by the repo's `tsc`,
  which keeps a native private field, resolves in 44 ns against 139 ns through esbuild, so the lowering is most of the
  row. What the engine pays is the ambient scope around construction and the accessor's own `resolve` through the
  container, where inversify's property injection is a metadata read on the same plan. **Work difference**, and the
  harness stays as it is: a codefast user on tsx or esbuild pays the same lowering, and a different transpiler for one
  library would move every codefast row, canaries included. Vite 8's Babel recipe keeps a native private field, as `tsc`
  does, so a Vite user sits nearer the probe's figure than the row's.
- **Failing fast costs more here: `misconfigured-missing-binding` 0.73×‡ tsyringe, 0.78×‡ brandi, 0.77×‡ ditox, 0.88×‡
  injection-js.** codefast builds a structured error carrying the resolution path; the rivals throw a string, and the
  stack capture both pay is most of the row. **Work difference** on a path a production request should never take.

## The wins

- **inversify — 90 of 92 comparable rows, 4.29× median, 5.78× geomean.** Widest margins on `boot` (23.2×), `production`
  (18.4×), `scope` (13.5×), `lifecycle` (13.0×), `realistic` (6.24×), `fan-out` (6.20×), `introspection` (5.91×),
  `micro` (4.20×) and `slot-selection` (3.98×); tightest on `scale` (2.55×), `failure` (1.54×), `async` (1.52×) and
  `resolution` (0.93×, which is the accessor row pulling against the plan rows). `resolve-all-async-8` is at parity
  (0.99×), and `circular-dependency-3` and `alias-cycle-detected` are excluded from the aggregates entirely — inversify
  recurses toward the stack limit rather than detecting either.
- **awilix — 38 of 38, 6.25× median, 6.17× geomean, no loss at all.** Widest on `boot` (16.6×), `scale` (10.7×),
  `realistic` (7.22×), `scope` (7.22×), `production` (7.00×) and `micro` (6.72×); tightest on `async` (1.35×) and
  `introspection` (1.19×).
- **tsyringe — 39 of 43, 4.42× median, 4.00× geomean.** 12.6× on `micro`, 6.62× on `scope`, 4.79× on `resolution` and
  4.05× on `introspection`; it keeps four rows — the two cold collections, the missing-binding throw, and
  `bind-128-plain` at 0.96×, a hair under parity — while `container-create-empty`, level at 1.03× in the previous pass,
  is a win at 1.29×, with `create-child-empty` at 1.25× and the decorated boot at 1.16×.
- **brandi — 29 of 30, 14.6× median, 12.2× geomean.** 23.9× on `micro`, 17.5× on `scope`, 16.9× on `realistic` and 16.2×
  on `resolution`; it loses only the missing-binding throw (0.78×‡).
- **ditox — 33 rows to 11 with one at parity, and both aggregates (1.41× median, 1.69× geomean).** The sweep is in the
  warm work and the per-request work: `scope` 4.74×, `realistic` 2.13×, `micro` 2.06×, `introspection` 1.60×,
  `resolution` 1.46×, `scale` 1.35×, `boot` 1.30×, `fan-out` 1.19×, `async` 1.05×, with `production` level at 1.00×.
  Named rows: `module-cold-128` 2.40×‡, `create-child-empty` 1.78×, `rebind-parent-resolve-child-depth-3` 1.78×,
  `resolve-all-cold-100` 1.78×‡, `container-create-empty` 1.71×, `module-cold-from-modules` 1.30×,
  `lifecycle-pre-destroy-unbind` 1.30×, `scale-deep-transient-chain-512` 1.22×, `resolve-all-cold-10` 1.12×,
  `async-init-single-hop` 1.05×; `singleton-class-1-dep` (0.97×†) sits at parity, and `to-resolved-3-deps` (0.95×†) and
  `nested-container-resolve-in-factory` (0.96×†) are losses above the ceiling. What it still takes is every row that
  binds many things, the two stable sets and the event bus; `lifecycle` (0.76×, the 100-singleton pair) and `failure`
  (0.77×, the missing-binding throw) are its winning groups.
- **injection-js — 21 rows to 9 with one at parity, 1.48× median, 1.44× geomean.** `realistic` 2.42×, `scope` 1.64×,
  `micro` 1.62×; narrower on `production` (1.32×), `boot` (1.09×), `fan-out` (1.09×) and `async` (1.03×). Its wins are
  the ceiling rows above, the two stable sets, the two empty containers and the missing-binding throw, which leave it
  the `resolution` (0.84×) and `failure` (0.88×) groups. The aliases are shapes where a `ReflectiveInjector` that caches
  every provider's answer per injector does less work than a container that does not; the two nested-factory rows are
  the harness state the loss list names.

## Geomean by group

Geomean of the ratios in each group, comparable row count in parentheses. Read a group, not a cell.

| Group          | InversifyJS 8 | Awilix 13 | tsyringe 4 |  Brandi 5 |   Ditox 3 | injection-js 2 |
| -------------- | ------------: | --------: | ---------: | --------: | --------: | -------------: |
| micro          |    4.20× (22) | 6.72× (8) |  12.6× (7) | 23.9× (8) | 2.06× (7) |      1.62× (9) |
| realistic      |     6.24× (5) | 7.22× (4) |  3.87× (4) | 16.9× (5) | 2.13× (5) |      2.42× (5) |
| fan-out        |     6.20× (9) | 2.08× (1) |  2.36× (5) | 9.45× (1) | 1.19× (5) |      1.09× (4) |
| async          |    1.52× (10) | 1.35× (1) |  1.38× (1) | 2.79× (1) | 1.05× (1) |      1.03× (1) |
| lifecycle      |     13.0× (8) | 5.80× (5) |  2.74× (4) |         — | 0.76× (5) |              — |
| scope          |    13.5× (12) | 7.22× (8) |  6.62× (8) | 17.5× (5) | 4.74× (8) |      1.64× (4) |
| scale          |     2.55× (2) | 10.7× (2) |  3.74× (2) | 8.98× (2) | 1.35× (2) |              — |
| boot           |     23.2× (8) | 16.6× (3) |  1.16× (4) | 5.13× (5) | 1.30× (5) |      1.09× (4) |
| failure        |     1.54× (2) | 2.28× (1) |  0.73× (1) | 0.78× (1) | 0.77× (1) |      0.88× (1) |
| production     |     18.4× (3) | 7.00× (2) |  3.57× (3) |         — | 1.00× (3) |      1.32× (1) |
| introspection  |     5.91× (2) | 1.19× (1) |  4.05× (2) |         — | 1.60× (1) |              — |
| slot-selection |     3.98× (6) |         — |          — |         — |         — |              — |
| resolution     |     0.93× (3) | 3.15× (2) |  4.79× (2) | 16.2× (2) | 1.46× (2) |      0.84× (2) |

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
| constant-resolve                               | micro          |  1000 |        205,387,673 |           2.66×† |       5.42×† |        11.4×† |      37.4×† |     1.08×† |            1.62×† |
| singleton-class-1-dep                          | micro          |   200 |        187,117,695 |           3.47×† |       4.51×† |        10.8×† |      35.4×† |     0.97×† |            3.38×† |
| transient-class-1-dep                          | micro          |   200 |         74,695,995 |           1.87×† |       8.78×† |        12.7×† |      32.6×† |     7.71×† |                 — |
| named-constant-get                             | micro          |   500 |         98,593,956 |           3.73×† |            — |             — |           — |          — |                 — |
| named-resolve-slots-1                          | micro          |   500 |        138,260,324 |           4.90×† |            — |             — |           — |          — |                 — |
| named-resolve-slots-4                          | micro          |   500 |        136,176,467 |           4.88×† |            — |             — |           — |          — |                 — |
| named-resolve-slots-16                         | micro          |   500 |        135,714,741 |           4.99×† |            — |             — |           — |          — |                 — |
| named-resolve-slots-64                         | micro          |   500 |        136,202,935 |           4.88×† |            — |             — |           — |          — |                 — |
| optional-missing-transient                     | micro          |   200 |         56,740,540 |           1.20×† |            — |             — |      14.1×† |     4.23×† |                 — |
| realistic-graph-resolve-root                   | realistic      |    20 |         18,960,060 |            2.58× |        2.70× |         5.66× |       15.9× |      1.65× |             1.21× |
| realistic-graph-cold-resolve                   | realistic      |     1 |           309,029‡ |           11.7×‡ |       4.85×‡ |        2.27×‡ |      5.47×‡ |     1.12×‡ |            2.24×‡ |
| realistic-graph-resolved-root                  | realistic      |    20 |         60,562,970 |           3.13×† |            — |             — |      50.0×† |     5.22×† |            3.88×† |
| realistic-graph-class-resolve-root             | realistic      |    20 |         60,679,646 |           3.08×† |       10.2×† |        14.0×† |      48.8×† |     5.67×† |            3.20×† |
| realistic-graph-class-cold-resolve             | realistic      |     1 |            563,707 |           32.5×‡ |       20.4×‡ |         1.25× |       6.46× |      0.79× |             2.46× |
| realistic-graph-validate                       | realistic      |    10 |         19,578,702 |                — |            — |             — |           — |          — |                 — |
| fan-out-tree-depth-3-breadth-4                 | fan-out        |    20 |          1,825,543 |            1.68× |        2.08× |         3.07× |       9.45× |      2.13× |                 — |
| resolve-all-strategies-10                      | fan-out        |     1 |         33,772,146 |           8.78×† |            — |        3.76×† |           — |    0.89×†‡ |           0.94×†‡ |
| resolve-all-strategies-100                     | fan-out        |     1 |         23,967,981 |            53.7× |            — |         17.8× |           — |    0.63×†‡ |            0.63×† |
| resolve-all-cold-10                            | fan-out        |     1 |          2,349,720 |           30.4×‡ |            — |         0.69× |           — |      1.12× |             1.48× |
| resolve-all-cold-100                           | fan-out        |     1 |           265,271‡ |           32.0×‡ |            — |        0.52×‡ |           — |     1.78×‡ |            1.59×‡ |
| resolve-all-named-8                            | fan-out        |     1 |         23,932,535 |            2.11× |            — |             — |           — |          — |                 — |
| resolve-all-named-16                           | fan-out        |     1 |         23,640,846 |            2.11× |            — |             — |           — |          — |                 — |
| resolve-all-named-32                           | fan-out        |     1 |         22,397,137 |            1.97× |            — |             — |           — |          — |                 — |
| resolve-all-named-64                           | fan-out        |     1 |         22,088,612 |            2.00× |            — |             — |           — |          — |                 — |
| resolve-async-single-hop                       | async          |     1 |          9,648,470 |            1.23× |            — |             — |           — |          — |                 — |
| async-init-single-hop                          | async          |     1 |          6,883,183 |            1.62× |        1.35× |         1.38× |       2.79× |      1.05× |             1.03× |
| dynamic-async-chain-8                          | async          |     1 |          2,049,107 |            1.45× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-8                      | async          |     1 |          1,249,947 |            1.67× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-16                     | async          |     1 |            687,791 |           1.74×‡ |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-32                     | async          |     1 |            354,072 |            1.92× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-64                     | async          |     1 |            160,860 |            1.98× |            — |             — |           — |          — |                 — |
| async-branch-chain-8                           | async          |     1 |          1,361,200 |                — |            — |             — |           — |          — |                 — |
| async-branch-escape-mid-chain-8                | async          |     1 |          1,745,074 |                — |            — |             — |           — |          — |                 — |
| async-diamond-shared-leaf                      | async          |     1 |          1,936,746 |            1.27× |            — |             — |           — |          — |                 — |
| plan-async-resolved-chain-8                    | async          |     1 |          2,835,430 |                — |            — |             — |           — |          — |                 — |
| plan-async-class-chain-8                       | async          |     1 |          5,405,954 |                — |            — |             — |           — |          — |                 — |
| resolve-all-async-8                            | async          |     1 |            963,643 |            0.99× |            — |             — |           — |          — |                 — |
| resolve-optional-async-miss                    | async          |     1 |          9,641,236 |           1.61×‡ |            — |             — |           — |          — |                 — |
| lifecycle-post-construct-singleton             | lifecycle      |   250 |        188,261,505 |           3.26×† |            — |             — |           — |          — |                 — |
| lifecycle-pre-destroy-unbind                   | lifecycle      |     1 |          3,859,864 |           27.1×‡ |       9.55×‡ |         2.70× |           — |      1.30× |                 — |
| binding-level-activation-hook                  | lifecycle      |   200 |         61,451,359 |           2.23×† |            — |             — |           — |          — |                 — |
| child-depth-1-resolve                          | scope          |   500 |        108,655,127 |           1.59×† |       4.38×† |        7.30×† |      20.9×† |     4.85×† |            1.23×† |
| child-depth-2-resolve                          | scope          |   500 |        109,743,368 |           1.54×† |       5.98×† |        8.47×† |      22.0×† |     8.22×† |            1.30×† |
| child-depth-4-resolve                          | scope          |   500 |        108,193,600 |           1.59×† |       8.07×† |        10.9×† |      23.6×† |     17.3×† |            1.64×† |
| child-depth-8-resolve                          | scope          |   500 |        108,317,160 |           1.45×† |       14.4×† |        16.9×† |      28.6×† |     32.4×† |            2.74×† |
| child-request-lifecycle-create-resolve-dispose | scope          |   100 |          2,660,579 |            49.4× |       12.6×‡ |        5.14×‡ |           — |      1.55× |                 — |
| fresh-child-default-n1                         | scope          |   100 |         10,767,992 |           40.1×‡ |       7.68×‡ |         7.04× |           — |      1.97× |                 — |
| fresh-child-default-n4                         | scope          |   100 |          8,002,806 |           31.3×‡ |       6.92×‡ |         7.16× |           — |      2.68× |                 — |
| fresh-child-name-n1                            | scope          |   100 |         10,905,997 |           46.3×‡ |            — |             — |           — |          — |                 — |
| fresh-child-name-n4                            | scope          |   100 |         7,275,607‡ |           33.8×‡ |            — |             — |           — |          — |                 — |
| fresh-child-tag-n1                             | scope          |   100 |         10,604,112 |           46.3×‡ |            — |             — |           — |          — |                 — |
| fresh-child-tag-n4                             | scope          |   100 |          7,779,919 |           32.9×‡ |            — |             — |           — |          — |                 — |
| scale-mid-transient-chain-32                   | scale          |     1 |          1,530,336 |            2.57× |        4.84× |         4.42× |       11.5× |      1.50× |                 — |
| scale-deep-transient-chain-512                 | scale          |     1 |             54,019 |            2.52× |        23.8× |         3.17× |       7.03× |      1.22× |                 — |
| boot-decorated-container-build-and-resolve     | boot           |     1 |            827,906 |           20.7×‡ |            — |         1.16× |           — |          — |             2.22× |
| container-create-empty                         | boot           |   100 |         29,301,450 |           46.0×‡ |       10.7×‡ |         1.29× |       8.74× |      1.71× |            0.66×† |
| create-child-empty                             | boot           |   100 |         25,707,495 |           52.8×‡ |       12.1×‡ |         1.25× |       7.73× |      1.78× |            0.55×† |
| bind-128-plain                                 | boot           |     1 |            185,040 |           27.7×‡ |       35.2×‡ |         0.96× |       9.05× |      0.39× |             1.77× |
| bind-128-refined                               | boot           |     1 |             36,904 |           5.96×‡ |            — |             — |           — |          — |                 — |
| misconfigured-missing-binding                  | failure        |     1 |           273,167‡ |           1.52×‡ |       2.28×‡ |        0.73×‡ |      0.78×‡ |     0.77×‡ |            0.88×‡ |
| circular-dependency-3                          | failure        |     1 |           164,351‡ |          185.2×‡ |       1.48×‡ |             — |           — |          — |            0.49×‡ |
| ambiguous-multi-binding                        | failure        |     1 |           236,365‡ |           1.57×‡ |            — |             — |           — |          — |                 — |
| production-http-handler                        | production     |    50 |          1,806,373 |            28.9× |       7.93×‡ |        3.36×‡ |           — |      1.21× |                 — |
| production-unit-of-work                        | production     |   100 |           978,205‡ |           16.3×‡ |       6.18×‡ |        2.23×‡ |           — |     1.12×‡ |                 — |
| production-event-bus-dispatch                  | production     |   100 |         52,619,593 |           13.3×† |            — |        6.09×† |           — |     0.74×† |            1.32×† |
| to-resolved-3-deps                             | micro          |   200 |        183,656,394 |           3.21×† |            — |             — |      32.4×† |     0.95×† |           1.66×†‡ |
| to-alias-redirect                              | micro          |   500 |        110,483,964 |           1.98×† |       6.33×† |        12.6×† |           — |          — |            0.90×† |
| to-self-binding                                | micro          |   300 |        175,501,467 |           2.91×† |            — |        8.05×† |           — |          — |            2.95×† |
| alias-chain-3                                  | micro          |   500 |        111,002,480 |           4.23×† |       14.3×† |        26.0×† |           — |          — |            0.99×† |
| alias-parent-owned-terminal                    | micro          |   500 |        101,578,327 |           1.89×† |       6.97×† |        12.6×† |           — |          — |            0.88×† |
| alias-cycle-detected                           | failure        |     1 |           250,635‡ |          710.2×‡ |       2.68×‡ |             — |           — |          — |            0.82×‡ |
| resolve-optional-hit                           | micro          |   500 |        215,729,326 |           6.69×† |       6.06×† |             — |      37.8×† |     1.05×† |            1.86×† |
| resolve-optional-miss                          | micro          |   500 |        265,155,437 |           7.96×† |       5.06×† |             — |      4.41×† |     4.58×† |            1.96×† |
| tagged-binding-resolve                         | micro          |   300 |        146,501,754 |           6.98×† |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-1                         | micro          |   300 |        221,855,442 |           10.3×† |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-4                         | micro          |   300 |        213,926,318 |           9.40×† |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-16                        | micro          |   300 |        215,579,641 |          10.00×† |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-64                        | micro          |   300 |        218,837,230 |           10.7×† |            — |             — |           — |          — |                 — |
| conditional-injection-tagged                   | micro          |   300 |         78,644,325 |           2.01×† |            — |             — |      32.5×† |          — |                 — |
| rebind-hot-swap                                | lifecycle      |    50 |         21,263,075 |           47.7×‡ |        1.62× |             — |           — |     0.23×† |                 — |
| has-bound-check                                | introspection  |  1000 |        370,051,519 |           6.61×† |       1.19×† |        3.39×† |           — |     1.60×† |                 — |
| has-own-unbound-check                          | introspection  |  1000 |        531,449,976 |           5.28×† |            — |        4.85×† |           — |          — |                 — |
| container-level-activation-hook                | lifecycle      |   200 |         56,738,209 |           2.02×† |            — |        4.84×† |           — |          — |                 — |
| scoped-binding-per-child                       | scope          |   100 |         6,088,491‡ |           44.4×‡ |       3.63×‡ |        1.26×‡ |      5.30×‡ |     1.41×‡ |                 — |
| rebind-parent-resolve-child-depth-3            | lifecycle      |    50 |         13,358,839 |            78.8× |        1.49× |             — |           — |      1.78× |                 — |
| materialize-100-singletons                     | lifecycle      |     1 |             93,948 |           22.1×‡ |       18.3×‡ |         2.22× |           — |      0.66× |                 — |
| unbind-all-100-singletons                      | lifecycle      |     1 |             77,085 |            25.0× |       15.6×‡ |         1.95× |           — |      0.68× |                 — |
| module-load-unload                             | boot           |     1 |         1,181,553‡ |           15.7×‡ |            — |             — |           — |          — |                 — |
| module-cold-from-modules                       | boot           |     1 |          2,191,718 |           23.2×‡ |            — |             — |       4.21× |      1.30× |                 — |
| module-cold-128                                | boot           |     1 |           211,340‡ |           27.3×‡ |            — |             — |      1.39×‡ |     2.40×‡ |                 — |
| initialize-async-warmup                        | boot           |     1 |            799,169 |                — |            — |             — |           — |          — |                 — |
| inspect-snapshot                               | introspection  |    20 |          9,752,704 |                — |            — |             — |           — |          — |                 — |
| lookup-bindings                                | introspection  |   200 |         25,088,424 |                — |            — |             — |           — |          — |                 — |
| generate-dependency-graph                      | introspection  |    10 |            748,606 |                — |            — |             — |           — |          — |                 — |
| multi-tag-slot-resolve                         | micro          |   300 |         14,162,018 |                — |            — |             — |           — |          — |                 — |
| multi-tag-constraint-resolve                   | micro          |   200 |          7,218,551 |                — |            — |             — |           — |          — |                 — |
| multi-tag-select-32                            | micro          |   300 |          2,849,717 |                — |            — |             — |           — |          — |                 — |
| mask-reject-wide-catalog                       | slot-selection |   300 |         27,349,327 |                — |            — |             — |           — |          — |                 — |
| mask-accept-two-of-four                        | slot-selection |   300 |         20,183,705 |                — |            — |             — |           — |          — |                 — |
| mask-collision-same-bit                        | slot-selection |   300 |         41,961,130 |                — |            — |             — |           — |          — |                 — |
| slot-tag-array-hoisted                         | slot-selection |   300 |        146,547,506 |                — |            — |             — |           — |          — |                 — |
| slot-tag-shorthand-hoisted                     | slot-selection |   300 |        160,495,683 |                — |            — |             — |           — |          — |                 — |
| slot-tag-array-inline                          | slot-selection |   300 |         96,110,112 |                — |            — |             — |           — |          — |                 — |
| slot-tag-shorthand-inline                      | slot-selection |   300 |        113,036,136 |                — |            — |             — |           — |          — |                 — |
| slot-tag-zero-value                            | slot-selection |   300 |        147,185,623 |           6.80×† |            — |             — |           — |          — |                 — |
| slot-name-and-tag                              | slot-selection |   300 |         47,536,016 |           2.30×† |            — |             — |           — |          — |                 — |
| slot-tag-resolve-all                           | slot-selection |   300 |         41,705,097 |           3.53×† |            — |             — |           — |          — |                 — |
| slot-tag-miss-optional                         | slot-selection |   300 |         63,710,243 |           2.77×† |            — |             — |           — |          — |                 — |
| slot-tag-parent-owned                          | slot-selection |   300 |        132,232,157 |           5.98×† |            — |             — |           — |          — |                 — |
| slot-name-parent-owned                         | slot-selection |   300 |        107,819,907 |           4.35×† |            — |             — |           — |          — |                 — |
| slot-injected-name-compiled                    | slot-selection |   300 |         67,848,803 |                — |            — |             — |           — |          — |                 — |
| slot-injected-name-interpreted                 | slot-selection |   300 |          4,885,105 |                — |            — |             — |           — |          — |                 — |
| slot-injected-tag-compiled                     | slot-selection |   300 |         69,194,580 |                — |            — |             — |           — |          — |                 — |
| slot-injected-tag-interpreted                  | slot-selection |   300 |          5,071,438 |                — |            — |             — |           — |          — |                 — |
| plan-deps-inlined                              | resolution     |   300 |         59,238,367 |                — |            — |             — |           — |          — |                 — |
| plan-escape-factory-dep                        | resolution     |   300 |          7,325,084 |                — |            — |             — |           — |          — |                 — |
| plan-escape-scoped-dep                         | resolution     |   300 |         12,011,625 |                — |            — |             — |           — |          — |                 — |
| plan-escape-hooked-dep                         | resolution     |   300 |          3,983,353 |                — |            — |             — |           — |          — |                 — |
| plan-escape-optional-dep                       | resolution     |   300 |          6,269,614 |                — |            — |             — |           — |          — |                 — |
| plan-escape-multi-dep                          | resolution     |   300 |          3,065,032 |                — |            — |             — |           — |          — |                 — |
| plan-class-chain-24                            | resolution     |     1 |          7,390,098 |                — |            — |             — |           — |          — |                 — |
| plan-class-chain-40                            | resolution     |     1 |          4,467,365 |                — |            — |             — |           — |          — |                 — |
| interpreted-class-chain-24                     | resolution     |     1 |            433,624 |                — |            — |             — |           — |          — |                 — |
| interpreted-class-chain-40                     | resolution     |     1 |            222,215 |                — |            — |             — |           — |          — |                 — |
| plan-runs-1                                    | resolution     |     1 |            890,653 |                — |            — |             — |           — |          — |                 — |
| plan-runs-256                                  | resolution     |     1 |             14,859 |                — |            — |             — |           — |          — |                 — |
| plan-runs-512                                  | resolution     |     1 |              7,931 |                — |            — |             — |           — |          — |                 — |
| plan-runs-1024                                 | resolution     |     1 |              3,982 |                — |            — |             — |           — |          — |                 — |
| plan-runs-2048                                 | resolution     |     1 |              1,949 |                — |            — |             — |           — |          — |                 — |
| plan-runs-4096                                 | resolution     |     1 |              1,160 |                — |            — |             — |           — |          — |                 — |
| plan-runs-8192                                 | resolution     |     1 |                634 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-1                               | resolution     |     1 |            240,411 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-256                             | resolution     |     1 |              4,541 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-512                             | resolution     |     1 |              2,359 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-1024                            | resolution     |     1 |              1,216 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-2048                            | resolution     |     1 |                638 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-8192                            | resolution     |     1 |                215 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-1                              | resolution     |     1 |           869,736‡ |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-512                            | resolution     |     1 |              8,088 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-1024                           | resolution     |     1 |              4,081 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-2048                           | resolution     |     1 |              1,966 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-8192                           | resolution     |     1 |                625 |                — |            — |             — |           — |          — |                 — |
| nested-context-resolve-in-factory              | resolution     |   300 |         44,228,093 |           1.91×† |       3.68×† |        5.23×† |      17.6×† |     2.23×† |            0.80×† |
| nested-container-resolve-in-factory            | resolution     |   300 |         37,739,047 |           1.61×† |       2.70×† |        4.39×† |      15.0×† |     0.96×† |            0.88×† |
| accessor-injection-construct                   | resolution     |   300 |         9,455,038‡ |          0.26×†‡ |            — |             — |           — |          — |                 — |

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
