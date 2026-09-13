# Results

Where `@codefast/di` actually stands against the field right now, wins and losses given equal weight — the point of this
page is to know where the engine is slower so the next change knows what to aim at. One machine-derived snapshot, no
accreted ledger. The method is in [`BENCH_GUIDE.md`](./BENCH_GUIDE.md); re-run it with the recipe at the bottom.

**This is one full-profile pass, so read the aggregates, not the rows.** GC-exposed, one subprocess per scenario,
libraries interleaved with rotating order, 3 trials each — a single pass measures no between-run variance of its own,
209 of the comparable cells carry a per-trial IQR above 5%, and 112 rows sit above ~30M ops/s where the ratio moves
between runs of the same build whatever its IQR says. Ratios are worth more than the absolute `hz/op`; a single row is
worth less than the group it sits in. A loss highlighted below points at a direction — quote a precise factor only after
a paired re-run, except where a loss is a structural O(N) difference that reproduces by construction (called out as
such).

**This run is the baseline a rewrite is read against.** Its id is `2026-09-13T04-45-37-460Z`; pin it with
`BENCH_BASELINE=2026-09-13T04-45-37-460Z` and every later run's `Δ` reads against it rather than against whatever run
happened to land before. It is the first pass over the full-coverage suite: 126 rows, 101 of them contract rows
specified against the public API, 25 engine rows that name a lane of the current resolver and enter no cross-library
figure; every library implements every row its declared features allow, so a `—` below is a feature the library lacks,
never a row nobody wrote.

**Environment.** `@codefast/di` 0.9.0 from a `dist` the harness rebuilt first, on Node 26.1.0 / V8 14.6, Apple M3 Max ×
14, darwin/arm64, `--expose-gc` for every library. inversify 8.2.3 · awilix 13.0.5 · tsyringe 4.10.0 · brandi 5.1.0 ·
ditox 3.3.0 · injection-js 2.6.1. Each library runs at its canonical decorator mode (inversify legacy decorators +
`reflect-metadata`, codefast TC39 Stage 3 + `Symbol.metadata`); every inversify container uses `{ jitless: false }`, its
fastest documented configuration. Run 2026-09-13, 18m28s wall.

## Summary — where we stand

Ratios are `@codefast/di ÷ competitor`; above 1× means codefast is faster. Win `>1.03×`, parity `0.97–1.03×`, loss
`<0.97×`. `Comparable` counts the rows both libraries ran, of 112 aggregate-eligible rows codefast measures; `†` is how
many of those the median and geomean carry from above the throughput ceiling — they stay in the aggregate but no reader
should cite one alone.

| Competitor     | Comparable | Win / parity / loss | Median | Geomean |   † |
| -------------- | ---------: | ------------------: | -----: | ------: | --: |
| InversifyJS 8  |  91 of 112 |          86 / 0 / 5 |  2.57× |   3.00× |  36 |
| Awilix 13      |  38 of 112 |          35 / 1 / 2 |  2.96× |   2.93× |  15 |
| tsyringe 4     |  43 of 112 |         30 / 0 / 13 |  2.57× |   2.00× |  16 |
| Brandi 5       |  29 of 112 |          27 / 0 / 2 |  14.1× |   7.07× |  13 |
| Ditox 3        |  44 of 112 |         15 / 3 / 26 |  0.72× |   0.66× |  15 |
| injection-js 2 |  31 of 112 |         14 / 2 / 15 |  0.99× |   0.70× |  17 |

**The headline, stated plainly: codefast sweeps inversify, awilix and brandi, wins tsyringe on the median while losing
it a third of the rows, sits at parity with injection-js on the median and loses it on the geomean, and loses ditox
outright (0.72× median, 0.66× geomean).** Every loss below is one of four shapes, and the full-coverage rows make the
shape legible where the old ledger could only name a row: **registration** (binding into a container, cold or per
request), **collections** (`resolveAll` over a stable set), **rebind**, and **two selection lanes** no index serves.
Where codefast wins, it wins on the warm resolve — the transient graph, the scope walk, the named and tagged lookups,
the hooks — which is what a request pays after the container is built.

## The losses, foregrounded — where to improve

Ordered by how much they matter, each marked as a **real deficit** (same work, codefast slower) or a **work difference**
(codefast does more per op by design, so the row is a design cost to reconsider, not a bug).

- **Registration is the biggest deficit, and the new rows isolate it.** `bind-128-plain` — 128 transient factory
  bindings into a fresh container, no resolve — runs at 0.05× ditox, 0.12× tsyringe, 0.28× injection-js: about 350 ns
  per binding against a plain map write. Everything that binds before it resolves inherits the gap:
  `container-create-empty` 0.30× tsyringe / 0.45× ditox, `create-child-empty` 0.36× / 0.48×,
  `realistic-graph-class-cold-resolve` 0.16× ditox / 0.24× tsyringe / 0.49× injection-js, `realistic-graph-cold-resolve`
  0.37× ditox, `boot-decorated-container-build-and-resolve` 0.19× tsyringe / 0.41× injection-js,
  `module-cold-from-modules` 0.27× ditox / 0.42× brandi. The warm siblings of every one of these rows are codefast wins
  (`realistic-graph-class-resolve-root` 1.88× ditox, 4.86× tsyringe), so the cost is paid at bind, not at resolve: each
  binding carries every field any binding kind declares so one hidden class serves the hot path, and the container
  defers its indexes to first use. **Real deficit, structural, reproduces by construction** — the design trade the old
  ledger called "documented" is now priced at 10–20× on the bind path, and a rewrite has to decide whether the uniform
  shape is worth it or whether a leaner registration record can feed the same hot path.
- **`resolve-all` over a stable set: 0.03× ditox and 0.04× injection-js at N=100, and the cold pair says it is not only
  the cache.** The old story — ditox and injection-js memoise the collection, codefast regathers — is true for the
  stable rows, and codefast beats the rebuilding rivals there (2.30× inversify, 1.23× tsyringe at N=100). But
  `resolve-all-cold-N` builds a fresh container and reads the collection **once**, so nobody's cache helps, and codefast
  still runs at 0.03–0.04× tsyringe and 0.07–0.09× ditox and injection-js. The predicate-only multi-binding
  (`.when(() => true)`) is the shape being paid for: N predicate bindings registered and N predicates evaluated per
  gather. **Real deficit**, two levers: a memoised collection for a stable multi-binding set, and a cheaper registration
  for a binding whose only constraint is "always".
- **Teardown at scale is a registration loss wearing a lifecycle label.** `materialize-100-singletons` (bind and resolve
  100 singletons, no teardown) is 0.14× ditox and 0.68× tsyringe; `unbind-all-100-singletons` (the same, then dispose)
  is 0.16× and 0.63×. The two ratios are the same, so the teardown walk itself costs nothing the rivals do not pay — the
  loss is the 100 bindings above. `lifecycle-pre-destroy-unbind` (one singleton, one hook) at 0.32× ditox / 0.69×
  tsyringe is the same story at N=1, with container construction inside the row. **Work difference on the hook, real
  deficit on the registration underneath.**
- **Rebind is slow everywhere it is measured.** `rebind-hot-swap` 0.18× awilix and 0.03×† ditox; the chain version
  `rebind-parent-resolve-child-depth-3` 0.24× awilix and 0.29× ditox. Against inversify the same rows are 7.97× and
  13.0×, because inversify rebuilds its plan cache. codefast's rebind re-slots the binding and bumps the chain's version
  stamp so every descendant's lookup memo is invalidated — correct, and priced at ten times a map overwrite. **Work
  difference**; a rebind that patches the existing slot in place would close most of it.
- **Two selection lanes no index serves, found against inversify.** `slot-name-and-tag` — a request carrying a name and
  a tag — is 0.19× inversify, and `slot-tag-miss-optional` — a tagged request that matches nothing over a populated
  token — is 0.25×. Both fall off the name index and the tag index onto a linear scan; inversify's planner resolves
  either through one constraint pass. **Real deficit**, narrow and concrete: a combined name+tag index entry and a
  negative-lookup memo.
- **`accessor-injection-construct` 0.30× inversify.** A class with one `@inject` accessor declines the compiled plan and
  routes through the ambient-container channel; inversify's property injection is a metadata read on the same plan.
  **Work difference**, and the row that says what property injection costs relative to constructor injection.
- **`resolve-all-async-8` 0.45× inversify.** The async collection fans eight factories into one cascade; inversify's
  `getAllAsync` awaits them as a plain `Promise.all`. **Real deficit** on a row that is otherwise codefast's own
  territory (every other async row is a win, 1.32–1.75×).
- **The parent walk has a slope.** `child-depth-N-resolve` against inversify reads 1.42× at depth 1, 1.31× at 2, 1.22×
  at 4, 0.94×† at 8: codefast's walk is linear in the chain, inversify's is not. Against ditox and awilix the slope runs
  the other way (4.11× → 19.8×, 3.55× → 7.89×), so those two walk more per level than codefast does. Above the ceiling
  at every depth, so the slope is the finding, not any one cell.
- **Per-request child work loses to ditox and nobody else.** `production-http-handler` 0.42×, `production-unit-of-work`
  0.48×, `child-request-lifecycle-create-resolve-dispose` 0.53×, `scoped-binding-per-child` 0.77×,
  `fresh-child-default-n1` 0.84× — every one a registration into a fresh child, so the same deficit as the first bullet
  seen from the request side. The same rows against inversify are 11.2×, 7.13×, 17.6×, 28.3× and 17.2×.
- **Warm singleton reads: 0.78×† / 0.72×† ditox on `constant-resolve` and `singleton-class-1-dep`.** ditox's `get` is
  close to a map read; codefast still carries its binding and lifecycle shape on every resolve. Both rows sit above 120M
  ops/s, inside the band that stops reproducing between runs. **Real deficit, ceiling-bound.**
- **Failing fast costs more here: `misconfigured-missing-binding` 0.62× tsyringe, 0.67× ditox, 0.68× brandi.** codefast
  builds a structured error with the resolution path; the rivals throw a string. **Work difference** on a path a
  production request should never take.

Two retractions against the previous ledger. `lifecycle-pre-destroy-unbind` was called a **deactivation** deficit; the
new pair shows the deactivation walk is free and the registration is the cost. `realistic-graph-cold-resolve` was called
a documented design trade and left there; `bind-128-plain` now prices that trade at 0.05× ditox on the bind path alone,
which is a number to act on rather than to document.

## The wins

- **inversify — 86 of 91 comparable rows, 2.57× median, 3.00× geomean.** Widest margins on `failure`'s
  `circular-dependency-3` (181×, excluded) and `alias-cycle-detected` (744×, excluded — inversify recurses to the stack
  limit rather than detecting either), then `scope` (7.42× geomean), `production` (6.30×), `boot` (6.28×), `lifecycle`
  (4.85×); tightest on `async` (1.35×) and `resolution` (0.96×, dragged by the accessor row). Every fresh-child row is
  14.8–19.3×, every production row 3.13–11.2×.
- **Awilix 13 — 35 of 38, 2.96× median**, up to 20.6× on the deep transient chain; loses only the two rebind rows.
- **tsyringe 4 — 30 of 43, 2.57× median**, 12.4× on `micro` and 4.24× on `scope`; loses `boot`, the cold collection and
  the registration-heavy lifecycle rows above.
- **Brandi 5 — 27 of 29, 14.1× median**, 31.8× on transient micro; loses only `module-cold-from-modules` and the
  missing-binding throw.
- **Against ditox codefast still wins the warm work** — `transient-class-1-dep` 7.20×, `realistic-graph-resolve-root`
  1.65×, `realistic-graph-class-resolve-root` 1.88×, `fan-out-tree` 2.27×, every `child-depth` row 4.11–19.8×,
  `scale-mid` 1.58× — and loses every row that binds.
- **Against injection-js** the warm rows are wins or parity (`singleton-class-1-dep` 2.73×†, `to-self-binding` 2.32×†,
  `realistic-graph-class-resolve-root` 1.56×) and the losses are the same registration and collection rows as ditox's.
- **The selection axes are flat where they should be.** `named-resolve-slots-1/4/16/64` read 3.12–3.43× inversify and
  `tagged-resolve-slots-1/4/16/64` 4.59–4.86× with no trend across N: both lanes are indexed, and the axis proves it.

## Geomean by group

Geomean of the ratios in each group, comparable row count in parentheses. Read a group, not a cell.

| Group          | InversifyJS 8 | Awilix 13 | tsyringe 4 |  Brandi 5 |   Ditox 3 | injection-js 2 |
| -------------- | ------------: | --------: | ---------: | --------: | --------: | -------------: |
| micro          |    2.84× (22) | 4.40× (8) |  12.4× (7) | 15.1× (8) | 1.29× (7) |      1.35× (9) |
| realistic      |     2.78× (5) | 2.82× (4) |  1.75× (4) | 6.68× (5) | 0.81× (5) |      1.06× (5) |
| fan-out        |     2.19× (9) | 2.21× (1) |  0.37× (5) | 11.2× (1) | 0.16× (5) |      0.10× (4) |
| async          |    1.35× (10) | 1.11× (1) |  1.22× (1) | 2.30× (1) | 0.99× (1) |      0.91× (1) |
| lifecycle      |     4.85× (8) | 1.07× (5) |  1.14× (4) |         — | 0.14× (5) |              — |
| scope          |    7.42× (12) | 3.70× (8) |  4.24× (8) | 11.0× (5) | 2.69× (8) |      1.62× (4) |
| scale          |     2.01× (2) | 10.1× (2) |  4.20× (2) | 9.51× (2) | 1.24× (2) |              — |
| boot           |     6.28× (7) | 3.27× (3) |  0.22× (4) | 1.16× (4) | 0.24× (4) |      0.27× (4) |
| failure        |     1.37× (2) | 1.99× (1) |  0.62× (1) | 0.68× (1) | 0.67× (1) |      0.96× (1) |
| production     |     6.30× (3) | 2.63× (2) |  1.45× (3) |         — | 0.34× (3) |      0.30× (1) |
| introspection  |     3.50× (2) | 1.03× (1) |  2.38× (2) |         — | 1.23× (1) |              — |
| slot-selection |     1.50× (6) |         — |          — |         — |         — |              — |
| resolution     |     0.96× (3) | 3.14× (2) |  5.62× (2) | 16.3× (2) | 1.51× (2) |      0.95× (2) |

The `fan-out` group against tsyringe (0.37×), ditox (0.16×) and injection-js (0.10×) is the collection rows above; the
`fan-out-tree` row inside the same group is a codefast win against tsyringe and ditox (injection-js has no transient
tree). `boot` against tsyringe, ditox and injection-js (0.22–0.27×) is the registration deficit in one number. `failure`
against inversify fell from 12.0× to 1.37× when `alias-cycle-detected` was excluded, which is why it was.

## Full per-scenario table

Every row codefast measures. `hz/op` is codefast's throughput per logical operation; a competitor's own throughput is
that figure divided by its ratio. `†` a row above the ~30M ops/s ceiling (ratio moves between runs); `‡` a cell whose
per-trial IQR exceeds 5% within this run. Rows with no competitor ratio are codefast-only coverage: the `validate`,
introspection, warm-up and multi-tag rows no rival's API expresses, and the 25 engine rows — `mask-*`, the hoisted and
inline `slot-tag-*` matrix, `slot-injected-*`, `plan-*`, `interpreted-*`, `async-branch-*` — which are instrumentation
for this resolver. `circular-dependency-3`, `alias-cycle-detected` and `plan-escape-scoped-dep` are excluded from the
aggregates above because their two sides do incomparable work per op.

| Scenario                                       | Group          | batch | @codefast/di hz/op | vs InversifyJS 8 | vs Awilix 13 | vs tsyringe 4 | vs Brandi 5 | vs Ditox 3 | vs injection-js 2 |
| ---------------------------------------------- | -------------- | ----: | -----------------: | ---------------: | -----------: | ------------: | ----------: | ---------: | ----------------: |
| constant-resolve                               | micro          |  1000 |       140,747,746‡ |          2.15×†‡ |      3.77×†‡ |       9.39×†‡ |     23.9×†‡ |    0.78×†‡ |           1.29×†‡ |
| singleton-class-1-dep                          | micro          |   200 |       121,798,415‡ |          2.42×†‡ |      3.27×†‡ |       9.40×†‡ |     23.1×†‡ |    0.72×†‡ |           2.73×†‡ |
| transient-class-1-dep                          | micro          |   200 |         68,510,511 |          1.88×†‡ |       7.96×† |        15.5×† |     31.8×†‡ |     7.20×† |                 — |
| named-constant-get                             | micro          |   500 |        78,736,368‡ |          3.20×†‡ |            — |             — |           — |          — |                 — |
| named-resolve-slots-1                          | micro          |   500 |        83,269,648‡ |          3.12×†‡ |            — |             — |           — |          — |                 — |
| named-resolve-slots-4                          | micro          |   500 |        83,086,225‡ |          3.16×†‡ |            — |             — |           — |          — |                 — |
| named-resolve-slots-16                         | micro          |   500 |        83,401,799‡ |          3.15×†‡ |            — |             — |           — |          — |                 — |
| named-resolve-slots-64                         | micro          |   500 |        83,149,832‡ |          3.43×†‡ |            — |             — |           — |          — |                 — |
| optional-missing-transient                     | micro          |   200 |         28,505,163 |           1.22×‡ |            — |             — |       8.03× |      2.32× |                 — |
| realistic-graph-resolve-root                   | realistic      |    20 |         18,490,292 |            2.63× |        2.78× |         9.20× |       17.7× |      1.65× |            1.34×‡ |
| realistic-graph-cold-resolve                   | realistic      |     1 |            94,730‡ |           4.21×‡ |       1.60×‡ |        0.90×‡ |      1.89×‡ |     0.37×‡ |            0.82×‡ |
| realistic-graph-resolved-root                  | realistic      |    20 |         21,834,522 |            1.49× |            — |             — |       20.3× |      1.99× |            1.60×‡ |
| realistic-graph-class-resolve-root             | realistic      |    20 |         14,740,632 |            1.41× |        3.12× |         4.86× |       14.4× |      1.88× |             1.56× |
| realistic-graph-class-cold-resolve             | realistic      |     1 |            101,548 |           7.15×‡ |        4.56× |        0.24×‡ |       1.36× |      0.16× |             0.49× |
| realistic-graph-validate                       | realistic      |    10 |          7,821,310 |                — |            — |             — |           — |          — |                 — |
| fan-out-tree-depth-3-breadth-4                 | fan-out        |    20 |          1,905,845 |            1.74× |        2.21× |         4.14× |       11.2× |      2.27× |                 — |
| resolve-all-strategies-10                      | fan-out        |     1 |          7,270,622 |            2.11× |            — |         0.97× |           — |      0.27× |            0.31×‡ |
| resolve-all-strategies-100                     | fan-out        |     1 |            927,474 |            2.30× |            — |        1.23×‡ |           — |      0.03× |            0.04×‡ |
| resolve-all-cold-10                            | fan-out        |     1 |           126,084‡ |           2.73×‡ |            — |        0.04×‡ |           — |     0.07×‡ |            0.08×‡ |
| resolve-all-cold-100                           | fan-out        |     1 |            11,727‡ |           1.66×‡ |            — |        0.03×‡ |           — |     0.08×‡ |            0.09×‡ |
| resolve-all-named-8                            | fan-out        |     1 |         20,174,781 |            2.38× |            — |             — |           — |          — |                 — |
| resolve-all-named-16                           | fan-out        |     1 |         22,140,947 |           2.61×‡ |            — |             — |           — |          — |                 — |
| resolve-all-named-32                           | fan-out        |     1 |         18,544,034 |           2.08×‡ |            — |             — |           — |          — |                 — |
| resolve-all-named-64                           | fan-out        |     1 |        19,275,084‡ |           2.35×‡ |            — |             — |           — |          — |                 — |
| resolve-async-single-hop                       | async          |     1 |          9,880,614 |            1.32× |            — |             — |           — |          — |                 — |
| async-init-single-hop                          | async          |     1 |          4,562,007 |            1.33× |        1.11× |         1.22× |       2.30× |      0.99× |             0.91× |
| dynamic-async-chain-8                          | async          |     1 |          2,290,256 |            1.65× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-8                      | async          |     1 |          1,056,572 |            1.66× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-16                     | async          |     1 |            548,159 |            1.70× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-32                     | async          |     1 |            252,015 |            1.61× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-64                     | async          |     1 |            130,849 |            1.75× |            — |             — |           — |          — |                 — |
| async-branch-chain-8                           | async          |     1 |            456,510 |                — |            — |             — |           — |          — |                 — |
| async-branch-escape-mid-chain-8                | async          |     1 |            787,173 |                — |            — |             — |           — |          — |                 — |
| async-diamond-shared-leaf                      | async          |     1 |          1,940,478 |            1.36× |            — |             — |           — |          — |                 — |
| plan-async-resolved-chain-8                    | async          |     1 |            983,229 |                — |            — |             — |           — |          — |                 — |
| plan-async-class-chain-8                       | async          |     1 |          2,513,867 |                — |            — |             — |           — |          — |                 — |
| resolve-all-async-8                            | async          |     1 |            420,854 |            0.45× |            — |             — |           — |          — |                 — |
| resolve-optional-async-miss                    | async          |     1 |          9,325,689 |            1.47× |            — |             — |           — |          — |                 — |
| lifecycle-post-construct-singleton             | lifecycle      |   250 |       123,182,779‡ |          2.47×†‡ |            — |             — |           — |          — |                 — |
| lifecycle-pre-destroy-unbind                   | lifecycle      |     1 |           815,224‡ |           9.83×‡ |       2.24×‡ |        0.69×‡ |           — |     0.32×‡ |                 — |
| binding-level-activation-hook                  | lifecycle      |   200 |        48,770,879‡ |          1.88×†‡ |            — |             — |           — |          — |                 — |
| child-depth-1-resolve                          | scope          |   500 |         87,609,988 |          1.42×†‡ |       3.55×† |        6.76×† |      15.8×† |     4.11×† |           1.29×†‡ |
| child-depth-2-resolve                          | scope          |   500 |         83,482,763 |          1.31×†‡ |       4.52×† |        7.56×† |      15.6×† |     6.40×† |           1.76×†‡ |
| child-depth-4-resolve                          | scope          |   500 |         75,902,463 |          1.22×†‡ |       5.76×† |        8.95×† |      16.3×† |     12.3×† |           1.73×†‡ |
| child-depth-8-resolve                          | scope          |   500 |         58,955,959 |          0.94×†‡ |       7.89×† |        10.0×† |      15.3×† |     19.8×† |           1.74×†‡ |
| child-request-lifecycle-create-resolve-dispose | scope          |   100 |           861,609‡ |           17.6×‡ |       4.03×‡ |        1.81×‡ |           — |     0.53×‡ |                 — |
| fresh-child-default-n1                         | scope          |   100 |          4,326,311 |           17.2×‡ |       2.74×‡ |        3.17×‡ |           — |      0.84× |                 — |
| fresh-child-default-n4                         | scope          |   100 |          3,596,116 |           16.6×‡ |       2.80×‡ |         3.72× |           — |      1.26× |                 — |
| fresh-child-name-n1                            | scope          |   100 |          4,160,388 |           19.3×‡ |            — |             — |           — |          — |                 — |
| fresh-child-name-n4                            | scope          |   100 |          3,454,924 |           14.8×‡ |            — |             — |           — |          — |                 — |
| fresh-child-tag-n1                             | scope          |   100 |          4,330,033 |           18.9×‡ |            — |             — |           — |          — |                 — |
| fresh-child-tag-n4                             | scope          |   100 |          3,628,537 |           16.9×‡ |            — |             — |           — |          — |                 — |
| scale-mid-transient-chain-32                   | scale          |     1 |          1,449,335 |            2.57× |        4.96× |         4.27× |       12.6× |      1.58× |                 — |
| scale-deep-transient-chain-512                 | scale          |     1 |             51,744 |            1.58× |        20.6× |         4.13× |       7.16× |      0.98× |                 — |
| boot-decorated-container-build-and-resolve     | boot           |     1 |            123,822 |           4.07×‡ |            — |         0.19× |           — |          — |             0.41× |
| container-create-empty                         | boot           |   100 |          6,856,762 |           12.4×‡ |       2.60×‡ |         0.30× |       1.93× |      0.45× |            0.23×‡ |
| create-child-empty                             | boot           |   100 |          6,777,109 |           16.1×‡ |       2.72×‡ |         0.36× |       1.89× |      0.48× |           0.21×†‡ |
| bind-128-plain                                 | boot           |     1 |            22,275‡ |           3.97×‡ |       4.94×‡ |        0.12×‡ |      1.20×‡ |     0.05×‡ |            0.28×‡ |
| bind-128-refined                               | boot           |     1 |            10,141‡ |           1.88×‡ |            — |             — |           — |          — |                 — |
| misconfigured-missing-binding                  | failure        |     1 |           250,271‡ |           1.54×‡ |       1.99×‡ |        0.62×‡ |      0.68×‡ |     0.67×‡ |            0.96×‡ |
| circular-dependency-3                          | failure        |     1 |            149,581 |           181.1× |       1.48×‡ |             — |           — |          — |             0.46× |
| ambiguous-multi-binding                        | failure        |     1 |           183,799‡ |           1.22×‡ |            — |             — |           — |          — |                 — |
| production-http-handler                        | production     |    50 |           579,832‡ |           11.2×‡ |       2.63×‡ |        1.39×‡ |           — |     0.42×‡ |                 — |
| production-unit-of-work                        | production     |   100 |           402,120‡ |           7.13×‡ |       2.62×‡ |        1.07×‡ |           — |     0.48×‡ |                 — |
| production-event-bus-dispatch                  | production     |   100 |         12,324,018 |            3.13× |            — |         2.06× |           — |     0.20×† |           0.30×†‡ |
| to-resolved-3-deps                             | micro          |   200 |       122,801,792‡ |          2.48×†‡ |            — |             — |     23.3×†‡ |    0.72×†‡ |           1.60×†‡ |
| to-alias-redirect                              | micro          |   500 |         85,798,812 |           1.68×† |       4.89×† |        13.7×† |           — |          — |           1.11×†‡ |
| to-self-binding                                | micro          |   300 |       117,781,177‡ |          2.39×†‡ |            — |       7.62×†‡ |           — |          — |           2.32×†‡ |
| alias-chain-3                                  | micro          |   500 |         84,039,019 |           3.44×† |       11.3×† |        22.6×† |           — |          — |           1.07×†‡ |
| alias-parent-owned-terminal                    | micro          |   500 |         81,706,645 |          1.71×†‡ |       5.74×† |        13.8×† |           — |          — |           0.92×†‡ |
| alias-cycle-detected                           | failure        |     1 |           258,749‡ |          743.7×‡ |       2.49×‡ |             — |           — |          — |            0.85×‡ |
| resolve-optional-hit                           | micro          |   500 |         86,251,851 |           2.95×† |       2.47×† |             — |      14.5×† |     0.47×† |           0.99×†‡ |
| resolve-optional-miss                          | micro          |   500 |         95,445,646 |           3.18×† |       1.84×† |             — |      2.48×† |     1.85×† |           1.09×†‡ |
| tagged-binding-resolve                         | micro          |   300 |        86,768,938‡ |          4.34×†‡ |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-1                         | micro          |   300 |        94,604,921‡ |          4.68×†‡ |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-4                         | micro          |   300 |        94,876,663‡ |          4.86×†‡ |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-16                        | micro          |   300 |        94,338,097‡ |          4.59×†‡ |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-64                        | micro          |   300 |        94,301,224‡ |          4.69×†‡ |            — |             — |           — |          — |                 — |
| conditional-injection-tagged                   | micro          |   300 |         51,504,838 |           2.03×† |            — |             — |      22.3×† |          — |                 — |
| rebind-hot-swap                                | lifecycle      |    50 |          2,338,386 |           7.97×‡ |        0.18× |             — |           — |     0.03×† |                 — |
| has-bound-check                                | introspection  |  1000 |       259,181,208‡ |          4.97×†‡ |      1.03×†‡ |       2.57×†‡ |           — |    1.23×†‡ |                 — |
| has-own-unbound-check                          | introspection  |  1000 |        229,068,618 |           2.46×† |            — |        2.21×† |           — |          — |                 — |
| container-level-activation-hook                | lifecycle      |   200 |        52,553,896‡ |          2.05×†‡ |            — |       5.64×†‡ |           — |          — |                 — |
| scoped-binding-per-child                       | scope          |   100 |          3,094,056 |           28.3×‡ |       1.55×‡ |         1.07× |       2.60× |      0.77× |                 — |
| rebind-parent-resolve-child-depth-3            | lifecycle      |    50 |         2,050,666‡ |           13.0×‡ |       0.24×‡ |             — |           — |     0.29×‡ |                 — |
| materialize-100-singletons                     | lifecycle      |     1 |            18,153‡ |           5.48×‡ |       3.89×‡ |        0.68×‡ |           — |     0.14×‡ |                 — |
| unbind-all-100-singletons                      | lifecycle      |     1 |            15,737‡ |           5.76×‡ |       3.69×‡ |        0.63×‡ |           — |     0.16×‡ |                 — |
| module-load-unload                             | boot           |     1 |           336,286‡ |           7.86×‡ |            — |             — |           — |          — |                 — |
| module-cold-from-modules                       | boot           |     1 |            405,920 |            8.04× |            — |             — |       0.42× |      0.27× |                 — |
| initialize-async-warmup                        | boot           |     1 |            198,002 |                — |            — |             — |           — |          — |                 — |
| inspect-snapshot                               | introspection  |    20 |          5,203,194 |                — |            — |             — |           — |          — |                 — |
| lookup-bindings                                | introspection  |   200 |         23,681,656 |                — |            — |             — |           — |          — |                 — |
| generate-dependency-graph                      | introspection  |    10 |            806,270 |                — |            — |             — |           — |          — |                 — |
| multi-tag-slot-resolve                         | micro          |   300 |          4,164,335 |                — |            — |             — |           — |          — |                 — |
| multi-tag-constraint-resolve                   | micro          |   200 |          3,442,245 |                — |            — |             — |           — |          — |                 — |
| multi-tag-select-32                            | micro          |   300 |          3,163,618 |                — |            — |             — |           — |          — |                 — |
| mask-reject-wide-catalog                       | slot-selection |   300 |        40,680,003‡ |                — |            — |             — |           — |          — |                 — |
| mask-accept-two-of-four                        | slot-selection |   300 |          4,830,694 |                — |            — |             — |           — |          — |                 — |
| mask-collision-same-bit                        | slot-selection |   300 |        46,256,312‡ |                — |            — |             — |           — |          — |                 — |
| slot-tag-array-hoisted                         | slot-selection |   300 |        88,330,051‡ |                — |            — |             — |           — |          — |                 — |
| slot-tag-shorthand-hoisted                     | slot-selection |   300 |        92,151,517‡ |                — |            — |             — |           — |          — |                 — |
| slot-tag-array-inline                          | slot-selection |   300 |        63,845,724‡ |                — |            — |             — |           — |          — |                 — |
| slot-tag-shorthand-inline                      | slot-selection |   300 |        75,021,783‡ |                — |            — |             — |           — |          — |                 — |
| slot-tag-zero-value                            | slot-selection |   300 |        86,402,943‡ |          4.24×†‡ |            — |             — |           — |          — |                 — |
| slot-name-and-tag                              | slot-selection |   300 |          3,595,613 |            0.19× |            — |             — |           — |          — |                 — |
| slot-tag-resolve-all                           | slot-selection |   300 |        43,858,685‡ |          3.90×†‡ |            — |             — |           — |          — |                 — |
| slot-tag-miss-optional                         | slot-selection |   300 |          5,270,810 |           0.25×‡ |            — |             — |           — |          — |                 — |
| slot-tag-parent-owned                          | slot-selection |   300 |        82,696,107‡ |          4.06×†‡ |            — |             — |           — |          — |                 — |
| slot-name-parent-owned                         | slot-selection |   300 |        79,473,466‡ |          3.53×†‡ |            — |             — |           — |          — |                 — |
| slot-injected-name-compiled                    | slot-selection |   300 |         22,691,746 |                — |            — |             — |           — |          — |                 — |
| slot-injected-name-interpreted                 | slot-selection |   300 |          4,248,534 |                — |            — |             — |           — |          — |                 — |
| slot-injected-tag-compiled                     | slot-selection |   300 |         22,400,421 |                — |            — |             — |           — |          — |                 — |
| slot-injected-tag-interpreted                  | slot-selection |   300 |          4,021,619 |                — |            — |             — |           — |          — |                 — |
| plan-deps-inlined                              | resolution     |   300 |         21,442,887 |                — |            — |             — |           — |          — |                 — |
| plan-escape-factory-dep                        | resolution     |   300 |          6,991,179 |                — |            — |             — |           — |          — |                 — |
| plan-escape-scoped-dep                         | resolution     |   300 |          9,091,737 |                — |            — |             — |           — |          — |                 — |
| plan-escape-hooked-dep                         | resolution     |   300 |          2,221,408 |                — |            — |             — |           — |          — |                 — |
| plan-escape-optional-dep                       | resolution     |   300 |          2,947,191 |                — |            — |             — |           — |          — |                 — |
| plan-escape-multi-dep                          | resolution     |   300 |           880,995‡ |                — |            — |             — |           — |          — |                 — |
| plan-class-chain-24                            | resolution     |     1 |          1,658,992 |                — |            — |             — |           — |          — |                 — |
| plan-class-chain-40                            | resolution     |     1 |            430,039 |                — |            — |             — |           — |          — |                 — |
| interpreted-class-chain-24                     | resolution     |     1 |            245,604 |                — |            — |             — |           — |          — |                 — |
| interpreted-class-chain-40                     | resolution     |     1 |            119,211 |                — |            — |             — |           — |          — |                 — |
| nested-context-resolve-in-factory              | resolution     |   300 |        43,801,119‡ |          1.88×†‡ |      3.79×†‡ |       6.23×†‡ |     18.9×†‡ |    2.28×†‡ |           1.00×†‡ |
| nested-container-resolve-in-factory            | resolution     |   300 |        35,295,034‡ |          1.57×†‡ |      2.60×†‡ |       5.06×†‡ |     14.1×†‡ |    1.00×†‡ |           0.91×†‡ |
| accessor-injection-construct                   | resolution     |   300 |          6,103,891 |            0.30× |            — |             — |           — |          — |                 — |

## Re-running this

```bash
BENCH_MODE=full pnpm bench:isolate                              # from benchmarks/di — the full-profile pass above
pnpm bench:report                                               # derive report.md + report.json from the newest run
pnpm bench:baseline                                             # the same pass, read against this run (baselines/2026-09-13T04-45-37-460Z)
```

`bench:isolate` already runs 3 trials per library in its own subprocess — one invocation is one pass, not three. The run
writes a timestamped directory under `bench-results/` (gitignored) holding `observations.jsonl` with every per-trial
`mean ms`, `p99 ms` and IQR; `bench:report` turns the newest run into the `report.md` this page is transcribed from.
Before quoting any single loss as a factor rather than a direction, re-measure it paired and alternating against the
rival on a quiet machine — a full pass carries no between-run variance of its own. `BENCH_TIER=contract` runs the
comparison without the 25 engine rows; `pnpm bench:list` prints which rows each library implements and confirms there is
no row a library's features allow that nobody wrote.
