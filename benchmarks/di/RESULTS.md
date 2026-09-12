# Results

Where `@codefast/di` actually stands against the field right now, wins and losses given equal weight — the point of this
page is to know where the engine is slower so the next change knows what to aim at. One machine-derived snapshot, no
accreted ledger. The method is in [`BENCH_GUIDE.md`](./BENCH_GUIDE.md); re-run it with the recipe at the bottom.

**This is one full-profile pass, so read the aggregates, not the rows.** GC-exposed, one subprocess per scenario,
libraries interleaved with rotating order, 3 trials each — a single pass measures no between-run variance of its own, 91
of the comparable cells carry a per-trial IQR above 5%, and 33 rows sit above ~30M ops/s where the ratio moves between
runs of the same build whatever its IQR says. Ratios are worth more than the absolute `hz/op`; a single row is worth
less than the group it sits in. A loss highlighted below points at a direction — quote a precise factor only after a
paired re-run, except where a loss is a structural O(N) difference that reproduces by construction (called out as such).

**Environment.** `@codefast/di` 0.9.0 from a `dist` the harness rebuilt first, on Node 26.1.0 / V8 14.6, Apple M3 Max ×
14, darwin/arm64, `--expose-gc` for every library. inversify 8.2.3 · awilix 13.0.5 · tsyringe 4.10.0 · brandi 5.1.0 ·
ditox 3.3.0 · injection-js 2.6.1. Each library runs at its canonical decorator mode (inversify legacy decorators +
`reflect-metadata`, codefast TC39 Stage 3 + `Symbol.metadata`); every inversify container uses `{ jitless: false }`, its
fastest documented configuration. No competitor implements every row: inversify covers nearly every shared descriptor;
awilix, tsyringe, brandi and ditox the factory/class-binding core plus the scope, lifecycle, module, multi-binding and
async rows their APIs express natively; injection-js only the singleton-friendly rows (`ReflectiveInjector` caches every
provider per injector). Run 2026-09-11.

## Summary — where we stand

Ratios are `@codefast/di ÷ competitor`; above 1× means codefast is faster. Win `>1.03×`, parity `0.97–1.03×`, loss
`<0.97×`. `Comparable` counts the rows both libraries ran, of 92 aggregate-eligible rows codefast measures; `†` is how
many of those the median and geomean carry from above the throughput ceiling — they stay in the aggregate but no reader
should cite one alone.

| Competitor   | Comparable | Win / parity / loss |    Median |   Geomean |   † |
| ------------ | ---------: | ------------------- | --------: | --------: | --: |
| inversify    |   47 of 92 | 47 / 0 / 0          |     2.30× |     2.85× |  16 |
| Awilix 13    |    9 of 92 | 9 / 0 / 0           |     3.06× |     3.67× |   3 |
| tsyringe 4   |   12 of 92 | 9 / 0 / 3           |     3.88× |     2.95× |   3 |
| Brandi 5     |   13 of 92 | 12 / 0 / 1          |     10.7× |     7.65× |   4 |
| Ditox 3      |   15 of 92 | 7 / 0 / 8           | **0.79×** | **0.87×** |   4 |
| injection-js |    7 of 92 | 2 / 2 / 3           |     1.01× | **0.56×** |   3 |

**The headline, stated plainly: codefast loses the aggregate to ditox (0.79× median) and loses the geomean to
injection-js (0.56×).** It sweeps inversify, awilix, tsyringe and brandi. The two libraries it trails are the two that
memoize the paths this suite hammers — a cached warm-singleton `get` and a cached multi-binding collection — and every
loss below is one of those paths.

## The losses, foregrounded — where to improve

Ordered by how much they matter, each marked as a **real deficit** (same work, codefast slower) or a **work difference**
(codefast does more per op by design, so the row is a design cost to reconsider, not a bug).

- **`resolve-all-strategies-10` / `-100` — 0.30× / 0.03× of both ditox and injection-js. Work difference, and the single
  biggest gap.** codefast binds N `toConstantValue` strategies and re-runs the constraint-filtered multi-binding gather
  across all N on every `resolveAll()`; ditox (`bindMultiValue`) and injection-js (`multi: true` under
  `ReflectiveInjector`) return a collection array memoized once at bind time — an O(N) gather against an O(1) cached
  read, which is why the gap widens 10× from N=10 to N=100. Against inversify, which also re-gathers, codefast **wins**
  the same row 2.2×–2.3×. The improvement this points at is concrete: codefast has no memoized `resolveAll` path for a
  stable multi-binding set. This one reproduces by construction — it is structural, not scheduling noise.
- **`lifecycle-pre-destroy-unbind` — 0.32× of ditox, 0.76× of tsyringe. Work difference.** Resolve a singleton, then
  unbind it and run the teardown hook once. codefast drives `@preDestroy` and `.onDeactivation()` through the
  per-container lifecycle manager on the unbind path; ditox's `bindFactory` + `onRemoved` is a single closure invoked by
  `remove()`. Against inversify the same row is 10.5×. A leaner deactivation path for the common one-hook case is the
  lever here.
- **`realistic-graph-cold-resolve` — 0.37× of ditox, 0.80× of injection-js, 0.91× of tsyringe. Documented design
  trade.** A cold iteration builds a ten-node graph once, each binding carrying every field any binding kind declares
  because one uniform V8 hidden class pays on the hot path. The rivals' plain closures carry no uniform shape, so they
  build the fresh graph faster. codefast takes the warm sibling `realistic-graph-resolve-root` back at 1.69× ditox /
  2.87× inversify — this is the cold side of that same trade. (‡ within-run-unstable; the direction is the settled
  part.)
- **`scoped-binding-per-child` — 0.79× of ditox, 0.80× of tsyringe. Work difference.** Per-request child scope: create a
  child, bind a scoped service, resolve twice. tsyringe binds a `ContainerScoped` class once per child; ditox reuses its
  cached scope; codefast does `createChild()` + a per-child bind + resolve. Against inversify the same row is 28.7×.
  (‡.)
- **`module-cold-from-modules` — 0.30× of ditox, 0.46× of brandi. Likely real deficit, needs a paired re-run.** Cold
  load of a module graph. codefast's module registration builds the full binding shape per entry where ditox and brandi
  register lighter records; against inversify codefast is still 7.6×. The mechanism is less nailed down than the rows
  above — treat the factor as directional until re-measured paired.
- **`constant-resolve` / `singleton-class-1-dep` — 0.78× / 0.72× of ditox. Real deficit, ceiling-bound (†).** Fetching a
  warmed singleton: ditox's `get` is close to a plain map read; codefast still carries its binding and lifecycle shape
  on every resolve. Both rows run above 120M ops/s, inside the band that stops reproducing between runs, so this is a
  real property of a leaner warm path, not a citable per-row figure.

## The wins

- **inversify — 47 of 47 comparable rows, 2.30× median, clean sweep.** Widest margins on `scope` (8.57× geomean),
  `production` (6.63×), `boot` (6.58×), `introspection` (3.54×), `lifecycle` (3.93×); tightest but still ahead on
  `async` (1.62×) and `realistic` (2.50×).
- **Awilix 13 — 9 of 9, 3.06× median**, up to 20.0× on the deep transient chain.
- **tsyringe 4 — 9 of 12, 3.88× median**, losing only the three lifecycle/scope/cold-graph rows above.
- **Brandi 5 — 12 of 13, 10.7× median**, losing only `module-cold-from-modules`; up to 31.6× on transient micro.
- Against **ditox** codefast still wins the transient and mid-graph work — `transient-class-1-dep` 7.28×,
  `realistic-graph-resolve-root` 1.69×, `fan-out-tree` 2.21×, `child-depth-2-resolve` 7.33×, `scale-mid` 1.54×.

## Geomean by group

Geomean of the ratios in each group, comparable row count in parentheses. Read a group, not a cell.

| Group         |  inversify | Awilix 13 | tsyringe 4 |  Brandi 5 |   Ditox 3 | injection-js |
| ------------- | ---------: | --------: | ---------: | --------: | --------: | -----------: |
| micro         | 2.38× (10) | 4.45× (3) |  10.3× (3) | 19.8× (5) | 1.72× (4) |    1.43× (2) |
| realistic     |  2.50× (3) | 1.90× (2) |  2.80× (2) | 5.82× (2) | 0.79× (2) |    0.90× (2) |
| fan-out       |  2.03× (7) | 2.18× (1) |  1.77× (3) | 10.7× (1) | 0.28× (3) |    0.10× (2) |
| async         |  1.62× (7) |         — |          — | 2.80× (1) |         — |            — |
| lifecycle     |  3.93× (5) |         — |  0.76× (1) |         — | 0.32× (1) |            — |
| scope         |  8.57× (3) | 1.77× (1) |  0.80× (1) | 2.57× (1) | 2.41× (2) |    1.02× (1) |
| scale         |  2.06× (2) | 9.90× (2) |  3.89× (2) | 9.13× (2) | 1.41× (2) |            — |
| boot          |  6.58× (3) |         — |          — | 0.46× (1) | 0.30× (1) |            — |
| failure       |  1.53× (2) |         — |          — |         — |         — |            — |
| production    |  6.63× (3) |         — |          — |         — |         — |            — |
| introspection |  3.54× (2) |         — |          — |         — |         — |            — |

The `fan-out` group against ditox (0.28×) and injection-js (0.10×) is dragged almost entirely by the two
`resolve-all-strategies` rows above; the `fan-out-tree` row inside the same group is a codefast win.

## Full per-scenario table

Every row codefast measures. `hz/op` is codefast's throughput per logical operation; a competitor's own throughput is
that figure divided by its ratio. `†` a row above the ~30M ops/s ceiling (ratio moves between runs); `‡` a cell whose
per-trial IQR exceeds 5% within this run. Rows with no competitor ratio are codefast-only coverage.
`circular-dependency-3` and the `mask-*`, `slot-tag-*` hoisted/inline, `slot-injected-*` and `plan-escape-scoped-dep`
rows are excluded from the aggregates above because the two sides do incomparable work per op.

| Scenario                                       | Group          | batch |     cf hz/op |  vs inv |  vs awi |  vs tsy |  vs brn |  vs dtx |  vs inj |
| ---------------------------------------------- | -------------- | ----: | -----------: | ------: | ------: | ------: | ------: | ------: | ------: |
| constant-resolve                               | micro          |  1000 | 143,118,481‡ | 2.15×†‡ | 3.72×†‡ | 9.04×†‡ | 24.4×†‡ | 0.78×†‡ | 1.13×†‡ |
| singleton-class-1-dep                          | micro          |   200 | 123,241,952‡ | 2.44×†‡ | 3.06×†‡ | 9.36×†‡ | 23.6×†‡ | 0.72×†‡ | 1.81×†‡ |
| transient-class-1-dep                          | micro          |   200 |   69,418,001 | 1.88×†‡ |  7.73×† |  12.8×† |  31.6×† |  7.28×† |       — |
| named-constant-get                             | micro          |   500 |  79,014,497‡ | 2.52×†‡ |       — |       — |       — |       — |       — |
| optional-missing-transient                     | micro          |   200 |   27,496,685 |       — |       — |       — |   7.09× |   2.12× |       — |
| realistic-graph-resolve-root                   | realistic      |    20 |   19,117,851 |   2.87× |   2.85× |   8.66× |   17.8× |   1.69× |   1.01× |
| realistic-graph-cold-resolve                   | realistic      |     1 |      94,930‡ |  4.39×‡ |  1.26×‡ |  0.91×‡ |  1.90×‡ |  0.37×‡ |  0.80×‡ |
| realistic-graph-resolved-root                  | realistic      |    20 |   22,429,408 |   1.24× |       — |       — |       — |       — |       — |
| realistic-graph-validate                       | realistic      |    10 |    7,642,003 |       — |       — |       — |       — |       — |       — |
| fan-out-tree-depth-3-breadth-4                 | fan-out        |    20 |    1,892,606 |   1.65× |   2.18× |   4.15× |   10.7× |   2.21× |       — |
| resolve-all-strategies-10                      | fan-out        |     1 |    7,915,885 |   2.30× |       — |   1.09× |       — |   0.30× |   0.30× |
| resolve-all-strategies-100                     | fan-out        |     1 |      911,009 |   2.20× |       — |   1.23× |       — |   0.03× |   0.03× |
| resolve-all-named-8                            | fan-out        |     1 |  17,403,210‡ |  1.94×‡ |       — |       — |       — |       — |       — |
| resolve-all-named-16                           | fan-out        |     1 |   17,777,215 |   1.90× |       — |       — |       — |       — |       — |
| resolve-all-named-32                           | fan-out        |     1 |   20,620,773 |   2.13× |       — |       — |       — |       — |       — |
| resolve-all-named-64                           | fan-out        |     1 |   20,165,277 |   2.15× |       — |       — |       — |       — |       — |
| resolve-async-single-hop                       | async          |     1 |    9,160,743 |   1.39× |       — |       — |       — |       — |       — |
| async-init-single-hop                          | async          |     1 |   3,955,170‡ |  1.38×‡ |       — |       — |  2.80×‡ |       — |       — |
| dynamic-async-chain-8                          | async          |     1 |    1,901,625 |   1.60× |       — |       — |       — |       — |       — |
| async-fanout-concurrent-8                      | async          |     1 |     852,751‡ |  1.61×‡ |       — |       — |       — |       — |       — |
| async-fanout-concurrent-16                     | async          |     1 |      504,866 |  1.75×‡ |       — |       — |       — |       — |       — |
| async-fanout-concurrent-32                     | async          |     1 |      261,404 |  1.84×‡ |       — |       — |       — |       — |       — |
| async-fanout-concurrent-64                     | async          |     1 |      134,587 |   1.86× |       — |       — |       — |       — |       — |
| async-branch-chain-8                           | async          |     1 |      468,098 |       — |       — |       — |       — |       — |       — |
| async-branch-escape-mid-chain-8                | async          |     1 |      790,919 |       — |       — |       — |       — |       — |       — |
| async-diamond-shared-leaf                      | async          |     1 |    1,942,108 |       — |       — |       — |       — |       — |       — |
| plan-async-resolved-chain-8                    | async          |     1 |    1,005,530 |       — |       — |       — |       — |       — |       — |
| plan-async-class-chain-8                       | async          |     1 |    2,526,811 |       — |       — |       — |       — |       — |       — |
| resolve-all-async-8                            | async          |     1 |      431,070 |       — |       — |       — |       — |       — |       — |
| resolve-optional-async-miss                    | async          |     1 |    9,658,284 |       — |       — |       — |       — |       — |       — |
| lifecycle-post-construct-singleton             | lifecycle      |   250 | 122,994,649‡ | 2.46×†‡ |       — |       — |       — |       — |       — |
| lifecycle-pre-destroy-unbind                   | lifecycle      |     1 |      829,355 |   10.5× |       — |  0.76×‡ |       — |   0.32× |       — |
| binding-level-activation-hook                  | lifecycle      |   200 |  60,994,581‡ | 2.39×†‡ |       — |       — |       — |       — |       — |
| child-depth-2-resolve                          | scope          |   500 |   86,220,585 | 1.31×†‡ |       — |       — |       — |  7.33×† |  1.02×† |
| child-request-lifecycle-create-resolve-dispose | scope          |   100 |     847,449‡ |  16.7×‡ |       — |       — |       — |       — |       — |
| fresh-child-default-n1                         | scope          |   100 |    4,336,170 |       — |       — |       — |       — |       — |       — |
| fresh-child-default-n4                         | scope          |   100 |    3,576,900 |       — |       — |       — |       — |       — |       — |
| fresh-child-name-n1                            | scope          |   100 |    4,244,609 |       — |       — |       — |       — |       — |       — |
| fresh-child-name-n4                            | scope          |   100 |    3,477,800 |       — |       — |       — |       — |       — |       — |
| fresh-child-tag-n1                             | scope          |   100 |    4,180,372 |       — |       — |       — |       — |       — |       — |
| fresh-child-tag-n4                             | scope          |   100 |    3,689,382 |       — |       — |       — |       — |       — |       — |
| scale-mid-transient-chain-32                   | scale          |     1 |    1,440,631 |   2.55× |   4.90× |   4.21× |   12.1× |   1.54× |       — |
| scale-deep-transient-chain-512                 | scale          |     1 |       51,636 |   1.66× |   20.0× |   3.60× |   6.86× |   1.29× |       — |
| boot-decorated-container-build-and-resolve     | boot           |     1 |      125,455 |  4.55×‡ |       — |       — |       — |       — |       — |
| container-create-empty                         | boot           |   100 |    7,153,670 |       — |       — |       — |       — |       — |       — |
| create-child-empty                             | boot           |   100 |    7,097,526 |       — |       — |       — |       — |       — |       — |
| bind-128-plain                                 | boot           |     1 |      22,267‡ |       — |       — |       — |       — |       — |       — |
| bind-128-refined                               | boot           |     1 |      10,978‡ |       — |       — |       — |       — |       — |       — |
| misconfigured-missing-binding                  | failure        |     1 |     282,120‡ |  1.73×‡ |       — |       — |       — |       — |       — |
| circular-dependency-3                          | failure        |     1 |      150,862 |  175.8× |       — |       — |       — |       — |       — |
| ambiguous-multi-binding                        | failure        |     1 |      203,312 |   1.36× |       — |       — |       — |       — |       — |
| production-http-handler                        | production     |    50 |     626,576‡ |  11.4×‡ |       — |       — |       — |       — |       — |
| production-unit-of-work                        | production     |   100 |     549,964‡ |  9.07×‡ |       — |       — |       — |       — |       — |
| production-event-bus-dispatch                  | production     |   100 |   11,199,166 |   2.82× |       — |       — |       — |       — |       — |
| to-resolved-3-deps                             | micro          |   200 | 122,553,098‡ | 2.47×†‡ |       — |       — |       — |       — |       — |
| to-alias-redirect                              | micro          |   500 |   85,412,110 | 2.05×†‡ |       — |       — |       — |       — |       — |
| to-self-binding                                | micro          |   300 | 117,856,589‡ | 2.39×†‡ |       — |       — |       — |       — |       — |
| alias-chain-3                                  | micro          |   500 |   85,111,962 |       — |       — |       — |       — |       — |       — |
| alias-parent-owned-terminal                    | micro          |   500 |   82,547,357 |       — |       — |       — |       — |       — |       — |
| alias-cycle-detected                           | failure        |     1 |     250,116‡ |       — |       — |       — |       — |       — |       — |
| resolve-optional-hit                           | micro          |   500 |   86,839,402 | 2.30×†‡ |       — |       — |       — |       — |       — |
| resolve-optional-miss                          | micro          |   500 |   95,296,601 | 2.35×†‡ |       — |       — |       — |       — |       — |
| tagged-binding-resolve                         | micro          |   300 |  86,988,830‡ | 3.60×†‡ |       — |       — |       — |       — |       — |
| conditional-injection-tagged                   | micro          |   300 |   57,411,791 |       — |       — |       — |  23.7×† |       — |       — |
| rebind-hot-swap                                | lifecycle      |    50 |   2,386,270‡ |  6.93×‡ |       — |       — |       — |       — |       — |
| has-bound-check                                | introspection  |  1000 | 257,630,230‡ | 4.99×†‡ |       — |       — |       — |       — |       — |
| has-own-unbound-check                          | introspection  |  1000 |  231,196,018 |  2.52×† |       — |       — |       — |       — |       — |
| container-level-activation-hook                | lifecycle      |   200 |  55,694,961‡ | 2.19×†‡ |       — |       — |       — |       — |       — |
| scoped-binding-per-child                       | scope          |   100 |   3,087,551‡ |  28.7×‡ |  1.77×‡ |  0.80×‡ |  2.57×‡ |  0.79×‡ |       — |
| rebind-parent-resolve-child-depth-3            | lifecycle      |    50 |   1,943,467‡ |       — |       — |       — |       — |       — |       — |
| materialize-100-singletons                     | lifecycle      |     1 |      18,824‡ |       — |       — |       — |       — |       — |       — |
| unbind-all-100-singletons                      | lifecycle      |     1 |      14,791‡ |       — |       — |       — |       — |       — |       — |
| module-load-unload                             | boot           |     1 |      347,992 |   8.18× |       — |       — |       — |       — |       — |
| module-cold-from-modules                       | boot           |     1 |      440,467 |  7.63×‡ |       — |       — |   0.46× |   0.30× |       — |
| initialize-async-warmup                        | boot           |     1 |      197,154 |       — |       — |       — |       — |       — |       — |
| inspect-snapshot                               | introspection  |    20 |    5,263,960 |       — |       — |       — |       — |       — |       — |
| lookup-bindings                                | introspection  |   200 |   24,486,152 |       — |       — |       — |       — |       — |       — |
| generate-dependency-graph                      | introspection  |    10 |      800,360 |       — |       — |       — |       — |       — |       — |
| multi-tag-slot-resolve                         | micro          |   300 |    4,171,165 |       — |       — |       — |       — |       — |       — |
| multi-tag-constraint-resolve                   | micro          |   200 |    3,326,464 |       — |       — |       — |       — |       — |       — |
| multi-tag-select-32                            | micro          |   300 |    3,250,736 |       — |       — |       — |       — |       — |       — |
| mask-reject-wide-catalog                       | slot-selection |   300 |  32,342,415‡ |       — |       — |       — |       — |       — |       — |
| mask-accept-two-of-four                        | slot-selection |   300 |    4,797,595 |       — |       — |       — |       — |       — |       — |
| mask-collision-same-bit                        | slot-selection |   300 |  44,396,403‡ |       — |       — |       — |       — |       — |       — |
| slot-tag-array-hoisted                         | slot-selection |   300 |  86,228,156‡ |       — |       — |       — |       — |       — |       — |
| slot-tag-shorthand-hoisted                     | slot-selection |   300 |  91,651,486‡ |       — |       — |       — |       — |       — |       — |
| slot-tag-array-inline                          | slot-selection |   300 |  64,228,989‡ |       — |       — |       — |       — |       — |       — |
| slot-tag-shorthand-inline                      | slot-selection |   300 |  74,633,452‡ |       — |       — |       — |       — |       — |       — |
| slot-tag-zero-value                            | slot-selection |   300 |  88,032,612‡ |       — |       — |       — |       — |       — |       — |
| slot-name-and-tag                              | slot-selection |   300 |    3,897,498 |       — |       — |       — |       — |       — |       — |
| slot-tag-resolve-all                           | slot-selection |   300 |  44,795,587‡ |       — |       — |       — |       — |       — |       — |
| slot-tag-miss-optional                         | slot-selection |   300 |    5,279,788 |       — |       — |       — |       — |       — |       — |
| slot-tag-parent-owned                          | slot-selection |   300 |  83,005,206‡ |       — |       — |       — |       — |       — |       — |
| slot-name-parent-owned                         | slot-selection |   300 |  79,084,227‡ |       — |       — |       — |       — |       — |       — |
| slot-injected-name-compiled                    | slot-selection |   300 |   22,813,597 |       — |       — |       — |       — |       — |       — |
| slot-injected-name-interpreted                 | slot-selection |   300 |    3,887,442 |       — |       — |       — |       — |       — |       — |
| slot-injected-tag-compiled                     | slot-selection |   300 |   22,931,611 |       — |       — |       — |       — |       — |       — |
| slot-injected-tag-interpreted                  | slot-selection |   300 |    3,696,918 |       — |       — |       — |       — |       — |       — |
| plan-deps-inlined                              | resolution     |   300 |   20,051,802 |       — |       — |       — |       — |       — |       — |
| plan-escape-factory-dep                        | resolution     |   300 |   7,532,339‡ |       — |       — |       — |       — |       — |       — |
| plan-escape-scoped-dep                         | resolution     |   300 |    8,448,597 |       — |       — |       — |       — |       — |       — |
| plan-escape-hooked-dep                         | resolution     |   300 |    2,206,128 |       — |       — |       — |       — |       — |       — |
| plan-escape-optional-dep                       | resolution     |   300 |    2,814,827 |       — |       — |       — |       — |       — |       — |
| plan-escape-multi-dep                          | resolution     |   300 |     827,560‡ |       — |       — |       — |       — |       — |       — |
| plan-class-chain-24                            | resolution     |     1 |    1,724,551 |       — |       — |       — |       — |       — |       — |
| plan-class-chain-40                            | resolution     |     1 |      433,086 |       — |       — |       — |       — |       — |       — |
| interpreted-class-chain-24                     | resolution     |     1 |      244,688 |       — |       — |       — |       — |       — |       — |
| interpreted-class-chain-40                     | resolution     |     1 |      124,937 |       — |       — |       — |       — |       — |       — |
| nested-context-resolve-in-factory              | resolution     |   300 |  41,971,879‡ |       — |       — |       — |       — |       — |       — |
| nested-container-resolve-in-factory            | resolution     |   300 |  37,346,580‡ |       — |       — |       — |       — |       — |       — |
| accessor-injection-construct                   | resolution     |   300 |   6,052,399‡ |       — |       — |       — |       — |       — |       — |

## Re-running this

```bash
BENCH_MODE=full BENCH_ISOLATE=true pnpm bench:isolate   # from benchmarks/di — the full-profile pass above
pnpm bench:report                                       # derive report.md + report.json from the newest run
```

`BENCH_ISOLATE=true` already runs 3 trials per library in its own subprocess — one invocation is one pass, not three.
The run writes a timestamped directory under `bench-results/` (gitignored) holding `observations.jsonl` with every
per-trial `mean ms`, `p99 ms` and IQR; `bench:report` turns the newest run into the `report.md` this page is transcribed
from. Before quoting any single loss as a factor rather than a direction, re-measure it paired and alternating against
the rival on a quiet machine — a full pass carries no between-run variance of its own.
