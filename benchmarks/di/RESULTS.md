# Results

Where `@codefast/di` actually stands against the field right now, wins and losses given equal weight — the point of this
page is to know where the engine is slower so the next change knows what to aim at. One machine-derived snapshot, no
accreted ledger. The method is in [`BENCH_GUIDE.md`](./BENCH_GUIDE.md); re-run it with the recipe at the bottom.

**This is one full-profile pass, so read the aggregates, not the rows.** GC-exposed, one subprocess per scenario,
libraries interleaved with rotating order, 3 trials each — a single pass measures no between-run variance of its own,
211 of the comparable cells carry a per-trial IQR above 5%, and 116 rows sit above ~30M ops/s where the ratio moves
between runs of the same build whatever its IQR says. Ratios are worth more than the absolute `hz/op`; a single row is
worth less than the group it sits in. A loss highlighted below points at a direction — quote a precise factor only after
a paired re-run, except where a loss is a structural O(N) difference that reproduces by construction (called out as
such).

**This run reads against the pinned baseline.** Its id is `2026-09-13T09-59-09-892Z`; the baseline it is compared to is
`2026-09-13T04-45-37-460Z`, the last pass over the engine before the rewrite began, whose observations are tracked under
`baselines/` and pinned by `pnpm bench:baseline`. Every `Δ` on this page is that comparison. The suite is unchanged
between the two: 126 rows, 101 contract rows specified against the public API, 25 engine rows that name a lane of the
resolver and enter no cross-library figure; every library implements every row its declared features allow, so a `—`
below is a feature the library lacks, never a row nobody wrote.

**Environment.** `@codefast/di` 0.9.0 from a `dist` the harness rebuilt first, on Node 26.1.0 / V8 14.6, Apple M3 Max ×
14, darwin/arm64, `--expose-gc` for every library. inversify 8.2.3 · awilix 13.0.5 · tsyringe 4.10.0 · brandi 5.1.0 ·
ditox 3.3.0 · injection-js 2.6.1. Each library runs at its canonical decorator mode (inversify legacy decorators +
`reflect-metadata`, codefast TC39 Stage 3 + `Symbol.metadata`); every inversify container uses `{ jitless: false }`, its
fastest documented configuration. Run 2026-09-13, 16m23s wall.

## What changed since the baseline

Every step below landed as one commit on the rewrite branch, was measured in a paired alternating A/B against the code
before it (three passes, `BENCH_ONLY` narrowed to its target rows plus warm canaries, each side's `src` swapped in and
`dist` rebuilt), and was kept only when the canaries held. The per-step tables are in the pull request; this page reads
the whole suite once, against the pinned baseline.

- **The registry keeps the common token in one map.** A token with one default-slot binding and no predicate lives only
  in the fast-default map; a record — binding list plus tagged indexes — exists for a token with several bindings, a
  tagged slot or a predicate, and the token moves between the two as it changes shape. A plain bind is one map write and
  one binding object; `getFastDefault()` stays a bare `Map.get`.
- **A container defers everything a resolve can happen without.** The plan compiler and plan maps, the lookup memo maps,
  the activation-need memo and the registry's record and id maps are allocated on first need, so a per-request child
  that is created, asked one parent-owned token and disposed allocates none of them.
- **Collections build in linear time.** A record's binding list appends in place and is replaced only on removal or
  displacement, every selection walk reads its starting length first, and a bare `when()` rewrites the predicate in
  place instead of re-registering the binding.
- **A request the slot indexes decline gets an allocation-free first pass.** One slot match is the answer once its
  predicate agrees, no match is a clean miss; two matches go to full selection.
- **Async collection members take the non-`async` factory lane** a single `resolveAsync` already used.
- **Accessor-injected classes** construct without a per-instantiation ambient object and wrapper closure.
- **Teardown allocates its pair list only when a deactivation is owed.**
- **Chain sums are memoized against a process-wide state epoch.** A resolve from a deep child no longer walks its
  ancestors on every lookup while nothing has changed; a root reads its own version directly.
- **Presence and miss lanes are priced.** `has()` reads the lone map's size before probing it, `hasOwn()` answers from a
  registry probe instead of a materialised list, and a miss reads the record map alone once the lone probe has failed.

## Summary — where we stand

Ratios are `@codefast/di ÷ competitor`; above 1× means codefast is faster. Win `>1.03×`, parity `0.97–1.03×`, loss
`<0.97×`. `Comparable` counts the rows both libraries ran, of 112 aggregate-eligible rows codefast measures; `†` is how
many of those the median and geomean carry from above the throughput ceiling — they stay in the aggregate but no reader
should cite one alone.

| Competitor     | Comparable | Win / parity / loss | Median | Geomean |   † |
| -------------- | ---------: | ------------------: | -----: | ------: | --: |
| InversifyJS 8  |  91 of 112 |          86 / 1 / 4 |  2.74× |   3.54× |  37 |
| Awilix 13      |  38 of 112 |          36 / 0 / 2 |  3.76× |   3.64× |  15 |
| tsyringe 4     |  43 of 112 |         32 / 0 / 11 |  3.61× |   2.55× |  16 |
| Brandi 5       |  29 of 112 |          27 / 0 / 2 |  14.0× |   8.53× |  14 |
| Ditox 3        |  44 of 112 |         20 / 2 / 22 |  0.93× |   0.84× |  16 |
| injection-js 2 |  31 of 112 |         14 / 1 / 16 |  0.97× |   0.84× |  18 |

**The headline, stated plainly: codefast sweeps inversify, awilix and brandi, now wins tsyringe on the median by 3.6×
while still losing it a quarter of the rows, sits at parity with injection-js on the median (0.97×) and loses it on the
geomean (0.84×), and loses ditox by less than before — 0.93× median and 0.84× geomean, from 0.72× and 0.66× at the
baseline.** Against the baseline, 41 rows improved beyond noise and four read down; they are named below. Every loss is
still one of the same four shapes — **registration**, **collections over a stable set**, **rebind**, and the **two
selection lanes** — but each is a smaller number than it was, and one shape the baseline named, the parent walk's slope,
is gone. Where codefast wins it still wins on the warm resolve, which is what a request pays after the container is
built; what this round moved is the price of building it.

## The losses, foregrounded — where to improve

Ordered by how much they matter, each marked as a **real deficit** (same work, codefast slower) or a **work difference**
(codefast does more per op by design, so the row is a design cost to reconsider, not a bug). Where the baseline is
quoted, it is the same row in `2026-09-13T04-45-37-460Z`.

- **Registration is still the biggest deficit, at roughly half its old size.** `bind-128-plain` — 128 transient factory
  bindings into a fresh container, no resolve — runs at 0.09× ditox, 0.22× tsyringe and 0.50× injection-js, from 0.05×,
  0.12× and 0.28×: the row is 1.90× faster than the baseline, which prices a plain bind at under 200 ns against a map
  write. Everything that binds before it resolves moved with it — `container-create-empty` 0.71× tsyringe and 1.03×
  ditox (from 0.30× and 0.45×), `create-child-empty` 0.81× and 1.26× (from 0.36× and 0.48×),
  `realistic-graph-cold-resolve` 0.44× ditox and 1.06× tsyringe (from 0.37× and 0.90×),
  `boot-decorated-container-build-and-resolve` 0.24× tsyringe and 0.47× injection-js (from 0.19× and 0.41×),
  `module-cold-from-modules` 0.39× ditox and 0.64× brandi (from 0.27× and 0.42×). `realistic-graph-class-cold-resolve`
  barely moved (0.17× ditox, 0.27× tsyringe, 0.54× injection-js) because a cold class graph is decorator metadata and
  plan compilation, not registration. What the registration path still pays is the binding object, the fluent chain
  object and the string binding id, and the id is the one of the three that costs a public type: `BindingIdentifier` is
  a branded string, and minting one is about a fifth of a plain bind. **Real deficit, structural**; the remaining levers
  are named, and one of them is an API decision.
- **`resolveAll` over a stable set: 0.04× ditox and 0.04× injection-js at N=100, unchanged, and the cold pair no longer
  hides it.** `resolve-all-cold-N` builds a fresh container and reads the collection once: 0.10× tsyringe, 0.24× ditox
  and 0.27× injection-js at N=100 (from 0.03×, 0.08× and 0.09×), 0.13×, 0.14× and 0.18× at N=10 — three times the
  baseline, because a hundred predicate-only bindings on one token no longer copy the token's list a hundred times and a
  bare `when()` no longer re-registers the binding. The stable rows did not move, and were not expected to: ditox and
  injection-js memoise the collection, codefast regathers and evaluates N predicates per read. **Real deficit**, one
  lever left: a memoised collection for a stable multi-binding set, invalidated by the same chain version the lookups
  use.
- **Teardown at scale is a registration loss wearing a lifecycle label.** `materialize-100-singletons` (bind and resolve
  100 singletons, no teardown) is 0.15× ditox and 0.78× tsyringe; `unbind-all-100-singletons` (the same, then dispose)
  is 0.16× and 0.69×. The two ratios are still the same, so the teardown walk costs nothing the rivals do not pay — the
  loss is the 100 bindings above. `lifecycle-pre-destroy-unbind` (one singleton, one hook) at 0.36× ditox and 0.82×
  tsyringe is the same story at N=1, with container construction inside the row. **Work difference on the hook, real
  deficit on the registration underneath.**
- **Rebind is smaller and still slow.** `rebind-hot-swap` 0.26× awilix (from 0.18×) and 0.04×† ditox;
  `rebind-parent-resolve-child-depth-3` 0.37× awilix and 0.41× ditox (from 0.24× and 0.29×). Both rows are about 1.5×
  their baseline from the cheaper registration and a teardown that no longer allocates when nothing is owed, and the
  shape is unchanged: a rebind unbinds, re-registers and bumps the chain's version. **Work difference**; a rebind that
  patches the existing slot in place would close most of what is left, and is the one change that would also recover the
  rebind-every-iteration shape's share of the epoch bookkeeping.
- **The two selection lanes no index serves: three times faster, and still losses.** `slot-name-and-tag` — a request
  carrying a name and a tag — is 0.61× inversify (from 0.19×) and `slot-tag-miss-optional` — a tagged request matching
  nothing over a populated token — is 0.66× (from 0.25×). Both now get an allocation-free first pass over the token's
  candidates before full selection; what remains is the scan itself against inversify's single constraint pass. **Real
  deficit**, narrow: a combined name-plus-tag index entry would make the first lane an index hit, and a negative memo
  keyed on the chain version would make the second one.
- **`accessor-injection-construct` 0.33× inversify.** A class with one `@inject` accessor declines the compiled plan and
  routes through the ambient-container channel; the per-instantiation ambient object and wrapper closure are gone, and
  the row moved from 0.30× to 0.33×. It stays off the plan on purpose — an accessor cycle detected under the interpreted
  path would be a stack overflow under a plan. **Work difference**, and the row that says what property injection costs
  relative to constructor injection.
- **`resolve-all-async-8` 0.54× inversify, from 0.45×.** Every member now takes the non-`async` factory lane a single
  `resolveAsync` takes; what remains is a branch stack and a level context per member against inversify's plain
  `Promise.all`. **Real deficit** on a row that is otherwise codefast's own territory (every other async row is a win).
- **Per-request child work loses to ditox and nobody else, and by less.** `production-http-handler` 0.60× (from 0.42×),
  `production-unit-of-work` 0.82× (from 0.48×), `child-request-lifecycle-create-resolve-dispose` 0.88× (from 0.53×);
  `scoped-binding-per-child` (1.30×) and `fresh-child-default-n1` (1.82×) crossed into wins. Every one is a registration
  into a fresh child, so the same deficit as the first bullet seen from the request side.
- **Warm singleton reads: 0.79×† and 0.71×† ditox on `constant-resolve` and `singleton-class-1-dep`**, unchanged.
  ditox's `get` is close to a map read; codefast still carries its binding and lifecycle shape on every resolve. Both
  rows sit above 120M ops/s, inside the band that stops reproducing between runs. **Real deficit, ceiling-bound.**
- **Failing fast costs more here: `misconfigured-missing-binding` 0.68× tsyringe, 0.71× ditox, 0.73× brandi**,
  unchanged. codefast builds a structured error with the resolution path; the rivals throw a string. **Work difference**
  on a path a production request should never take.
- **Four rows read down against the baseline in this pass** — `resolve-all-named-64` (0.73×), `resolve-all-named-16`
  (0.86×), `dynamic-async-chain-8` (0.87×) and `realistic-graph-resolved-root` (0.91×) — and the previous pass over a
  build one commit older flagged a different four, of which two were real and were fixed before this run (the
  `resolveOptional` miss lane and a root's collection lane). Paired and alternating against the pre-rewrite source,
  three passes: `dynamic-async-chain-8` reads 0.97–0.98× (noise), `realistic-graph-resolved-root` 0.94–0.95× in every
  pass — a real, small loss on the `toResolved` plan lane with no cause identified yet — and the two named collections
  0.80–0.98× with a per-pass spread wider than their median, on a path that does one index read per call whatever N is.
  **Open**: the resolved-root row and the named collections are the two places this round left worse than it found them,
  both under 10% paired, both to re-measure before the next change to the plan getters or the tagged index.

One retraction against the baseline ledger. **The parent walk had a slope and no longer does.** `child-depth-N-resolve`
against inversify read 1.42× at depth 1 and 0.94×† at depth 8; it now reads 1.48×, 1.43×, 1.51× and 1.46× at depths 1,
2, 4 and 8, because the summed chain version a descendant's memo is stamped with is re-walked only when the process-wide
state epoch has moved. Against ditox and awilix the slope still runs the other way (4.35× → 27.6×, 3.70× → 12.2×). Above
the ceiling at every depth, so the flatness is the finding, not any one cell.

## The wins

- **inversify — 86 of 91 comparable rows, 2.74× median, 3.54× geomean.** Widest margins on `failure`'s
  `circular-dependency-3` and `alias-cycle-detected` (both excluded — inversify recurses to the stack limit rather than
  detecting either), then `scope` (11.4× geomean), `boot` (9.47×), `production` (8.07×), `lifecycle` (5.35×); tightest
  on `async` (1.38×) and `resolution` (0.96×, dragged by the accessor row). Every fresh-child row is 14–46×, every
  production row 8–14×, and the `child-depth` axis is flat at 1.4–1.5×.
- **Awilix 13 — 36 of 38, 3.76× median**, up to 12× on the deep child walk; loses only the two rebind rows.
- **tsyringe 4 — 32 of 43, 3.61× median**, 11.9× on `micro` and 6.26× on `scope`; loses `boot`, the cold collections and
  the registration-heavy lifecycle rows above, all by less than at the baseline.
- **Brandi 5 — 27 of 29, 14.0× median**, 33× on transient micro; loses only `module-cold-from-modules` and the
  missing-binding throw.
- **Against ditox codefast wins the warm work and now some of the cold** — `transient-class-1-dep` 6.77×†,
  `realistic-graph-resolve-root` 1.70×, `realistic-graph-class-resolve-root` 1.77×, `fan-out-tree` 2.14×, every
  `child-depth` row 4.35–27.6×†, `fresh-child-default-n1` 1.82×, `scoped-binding-per-child` 1.30×, `create-child-empty`
  1.26×, `container-create-empty` at parity — and still loses every row that binds many things or reads a stable
  collection.
- **Against injection-js** the warm rows are wins (`singleton-class-1-dep` 2.54×†, `realistic-graph-class-resolve-root`
  1.31×, `realistic-graph-resolve-root` 1.33×) and the losses are the same registration and collection rows as ditox's,
  each smaller than it was.
- **The selection axes are flat where they should be.** `named-resolve-slots-1/64` read 3.15× and 3.29× inversify and
  `tagged-resolve-slots-1/64` 4.49× and 4.38× with no trend across N: both lanes are indexed, and the axis proves it.
- **What this round moved, against the baseline.** `slot-name-and-tag` 3.0×, `slot-tag-miss-optional` 2.9×,
  `multi-tag-slot-resolve` 2.9×, `resolve-all-cold-100` 3.0×, `has-own-unbound-check` 2.7×, `create-child-empty` 2.7×,
  `container-create-empty` 2.5×, the four `fresh-child-*-n1` rows 2.2–2.3×, `resolve-all-cold-10` 2.1×, `bind-128-plain`
  1.9×, `production-unit-of-work` 1.8×, `scoped-binding-per-child` 1.8×, `rebind-parent-resolve-child-depth-3` 1.6×,
  `child-depth-8-resolve` 1.6×, `resolve-optional-miss` 1.5×, `production-http-handler` 1.5×, `rebind-hot-swap` 1.5×,
  `module-cold-from-modules` 1.4×, `resolve-all-async-8` 1.2× — 47 of 126 rows more than 10% faster, with the warm
  resolve rows (`constant-resolve`, `singleton-class-1-dep`, `transient-class-1-dep`, `realistic-graph-resolve-root`,
  `plan-class-chain-24`) at parity, which is what every step's A/B was gated on.

## Geomean by group

Geomean of the ratios in each group, comparable row count in parentheses. Read a group, not a cell.

| Group          | InversifyJS 8 | Awilix 13 | tsyringe 4 |  Brandi 5 |   Ditox 3 | injection-js 2 |
| -------------- | ------------: | --------: | ---------: | --------: | --------: | -------------: |
| micro          |    2.85× (22) | 4.69× (8) |  11.9× (7) | 16.8× (8) | 1.39× (7) |      1.47× (9) |
| realistic      |     2.78× (5) | 2.95× (4) |  1.82× (4) | 6.93× (5) | 0.84× (5) |      1.04× (5) |
| fan-out        |     2.62× (9) | 2.12× (1) |  0.58× (5) | 11.0× (1) | 0.23× (5) |      0.15× (4) |
| async          |    1.38× (10) | 1.09× (1) |  1.13× (1) | 2.21× (1) | 0.97× (1) |      0.89× (1) |
| lifecycle      |     5.35× (8) | 1.30× (5) |  1.24× (4) |         — | 0.17× (5) |              — |
| scope          |    11.4× (12) | 5.49× (8) |  6.26× (8) | 14.5× (5) | 4.01× (8) |      1.84× (4) |
| scale          |     2.04× (2) | 11.1× (2) |  5.04× (2) | 9.67× (2) | 1.41× (2) |              — |
| boot           |     9.47× (7) | 6.89× (3) |  0.42× (4) | 2.43× (4) | 0.47× (4) |      0.50× (4) |
| failure        |     1.47× (2) | 2.18× (1) |  0.68× (1) | 0.73× (1) | 0.71× (1) |      0.91× (1) |
| production     |     8.07× (3) | 4.02× (2) |  1.92× (3) |         — | 0.47× (3) |      0.40× (1) |
| introspection  |     6.20× (2) | 1.25× (1) |  4.28× (2) |         — | 1.50× (1) |              — |
| slot-selection |     2.15× (6) |         — |          — |         — |         — |              — |
| resolution     |     0.96× (3) | 3.03× (2) |  5.50× (2) | 16.3× (2) | 1.49× (2) |      0.91× (2) |

The `boot` group against tsyringe, ditox and injection-js (0.42×, 0.47×, 0.50×) is the registration deficit in one
number, from 0.22–0.27× at the baseline. The `fan-out` group against tsyringe (0.58×), ditox (0.23×) and injection-js
(0.15×) is the stable-set collection rows, the cold pair inside the same group having moved from 0.03–0.09× to
0.10–0.27×; the `fan-out-tree` row is a codefast win against everyone who runs it. `production` against ditox (0.47×) is
the per-request child rows, from 0.34×. `failure` against inversify stays at 1.47× because `alias-cycle-detected` is
excluded, which is why it was.

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
| constant-resolve                               | micro          |  1000 |       144,795,787‡ |          2.15×†‡ |      3.78×†‡ |       9.28×†‡ |     24.6×†‡ |    0.79×†‡ |           1.66×†‡ |
| singleton-class-1-dep                          | micro          |   200 |       121,696,716‡ |          2.46×†‡ |      3.09×†‡ |       8.69×†‡ |     23.2×†‡ |    0.71×†‡ |           2.54×†‡ |
| transient-class-1-dep                          | micro          |   200 |         68,712,531 |           1.82×† |       7.65×† |        14.2×† |      33.1×† |     6.77×† |                 — |
| named-constant-get                             | micro          |   500 |        78,265,047‡ |          3.08×†‡ |            — |             — |           — |          — |                 — |
| named-resolve-slots-1                          | micro          |   500 |        83,443,133‡ |          3.15×†‡ |            — |             — |           — |          — |                 — |
| named-resolve-slots-4                          | micro          |   500 |        83,366,979‡ |          3.09×†‡ |            — |             — |           — |          — |                 — |
| named-resolve-slots-16                         | micro          |   500 |        83,436,457‡ |          3.09×†‡ |            — |             — |           — |          — |                 — |
| named-resolve-slots-64                         | micro          |   500 |        83,391,139‡ |          3.29×†‡ |            — |             — |           — |          — |                 — |
| optional-missing-transient                     | micro          |   200 |         33,023,943 |           1.03×† |            — |             — |      8.83×† |     2.65×† |                 — |
| realistic-graph-resolve-root                   | realistic      |    20 |         18,358,336 |            2.74× |        2.80× |        8.36×‡ |       17.7× |      1.70× |            1.33×‡ |
| realistic-graph-cold-resolve                   | realistic      |     1 |           117,131‡ |           4.90×‡ |       1.88×‡ |        1.06×‡ |      2.33×‡ |     0.44×‡ |            0.91×‡ |
| realistic-graph-resolved-root                  | realistic      |    20 |         19,853,159 |            1.32× |            — |             — |       19.4× |      1.81× |            1.44×‡ |
| realistic-graph-class-resolve-root             | realistic      |    20 |         14,137,438 |            1.33× |        3.01× |         4.65× |       14.0× |      1.77× |             1.31× |
| realistic-graph-class-cold-resolve             | realistic      |     1 |            111,950 |           7.07×‡ |        4.76× |         0.27× |       1.43× |      0.17× |             0.54× |
| realistic-graph-validate                       | realistic      |    10 |         18,353,867 |                — |            — |             — |           — |          — |                 — |
| fan-out-tree-depth-3-breadth-4                 | fan-out        |    20 |          1,944,610 |            1.71× |        2.12× |         3.93× |       11.0× |      2.14× |                 — |
| resolve-all-strategies-10                      | fan-out        |     1 |          7,074,289 |            2.19× |            — |         1.03× |           — |      0.25× |            0.29×‡ |
| resolve-all-strategies-100                     | fan-out        |     1 |            940,912 |            2.28× |            — |        1.29×‡ |           — |      0.04× |            0.04×‡ |
| resolve-all-cold-10                            | fan-out        |     1 |            260,479 |           5.36×‡ |            — |         0.13× |           — |      0.14× |            0.18×‡ |
| resolve-all-cold-100                           | fan-out        |     1 |            35,314‡ |           4.54×‡ |            — |        0.10×‡ |           — |     0.24×‡ |            0.27×‡ |
| resolve-all-named-8                            | fan-out        |     1 |         19,641,437 |            2.53× |            — |             — |           — |          — |                 — |
| resolve-all-named-16                           | fan-out        |     1 |        18,990,581‡ |           2.41×‡ |            — |             — |           — |          — |                 — |
| resolve-all-named-32                           | fan-out        |     1 |        19,881,108‡ |           2.53×‡ |            — |             — |           — |          — |                 — |
| resolve-all-named-64                           | fan-out        |     1 |        14,149,892‡ |           1.78×‡ |            — |             — |           — |          — |                 — |
| resolve-async-single-hop                       | async          |     1 |          9,416,927 |            1.35× |            — |             — |           — |          — |                 — |
| async-init-single-hop                          | async          |     1 |          4,342,772 |            1.31× |        1.09× |        1.13×‡ |       2.21× |      0.97× |             0.89× |
| dynamic-async-chain-8                          | async          |     1 |          1,981,871 |            1.45× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-8                      | async          |     1 |          1,054,259 |            1.63× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-16                     | async          |     1 |            569,136 |            1.72× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-32                     | async          |     1 |            267,709 |            1.66× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-64                     | async          |     1 |            137,380 |            1.81× |            — |             — |           — |          — |                 — |
| async-branch-chain-8                           | async          |     1 |            467,871 |                — |            — |             — |           — |          — |                 — |
| async-branch-escape-mid-chain-8                | async          |     1 |            802,778 |                — |            — |             — |           — |          — |                 — |
| async-diamond-shared-leaf                      | async          |     1 |          1,919,490 |            1.34× |            — |             — |           — |          — |                 — |
| plan-async-resolved-chain-8                    | async          |     1 |            992,978 |                — |            — |             — |           — |          — |                 — |
| plan-async-class-chain-8                       | async          |     1 |          2,459,039 |                — |            — |             — |           — |          — |                 — |
| resolve-all-async-8                            | async          |     1 |            510,056 |            0.54× |            — |             — |           — |          — |                 — |
| resolve-optional-async-miss                    | async          |     1 |          9,342,674 |            1.58× |            — |             — |           — |          — |                 — |
| lifecycle-post-construct-singleton             | lifecycle      |   250 |       123,245,135‡ |          2.39×†‡ |            — |             — |           — |          — |                 — |
| lifecycle-pre-destroy-unbind                   | lifecycle      |     1 |            934,671 |            10.8× |       2.43×‡ |         0.82× |           — |      0.36× |                 — |
| binding-level-activation-hook                  | lifecycle      |   200 |        51,177,280‡ |          1.96×†‡ |            — |             — |           — |          — |                 — |
| child-depth-1-resolve                          | scope          |   500 |         92,207,968 |          1.48×†‡ |       3.70×† |        7.06×† |      16.8×† |     4.35×† |            1.48×† |
| child-depth-2-resolve                          | scope          |   500 |         92,525,179 |          1.43×†‡ |       4.68×† |        8.16×† |      17.5×† |     6.79×† |           1.42×†‡ |
| child-depth-4-resolve                          | scope          |   500 |         92,766,017 |          1.51×†‡ |       6.94×† |        10.7×† |      20.2×† |     15.5×† |           2.06×†‡ |
| child-depth-8-resolve                          | scope          |   500 |         92,454,641 |          1.46×†‡ |       12.2×† |        15.3×† |      24.0×† |     27.6×† |           2.69×†‡ |
| child-request-lifecycle-create-resolve-dispose | scope          |   100 |         1,492,338‡ |           26.6×‡ |       6.00×‡ |        2.77×‡ |           — |     0.88×‡ |                 — |
| fresh-child-default-n1                         | scope          |   100 |          9,998,452 |           35.7×‡ |       6.22×‡ |         6.93× |           — |      1.82× |                 — |
| fresh-child-default-n4                         | scope          |   100 |          7,410,667 |           27.0×‡ |       5.52×‡ |         7.20× |           — |      2.52× |                 — |
| fresh-child-name-n1                            | scope          |   100 |          9,526,812 |           36.1×‡ |            — |             — |           — |          — |                 — |
| fresh-child-name-n4                            | scope          |   100 |          6,572,124 |           25.8×‡ |            — |             — |           — |          — |                 — |
| fresh-child-tag-n1                             | scope          |   100 |          9,347,777 |           34.7×‡ |            — |             — |           — |          — |                 — |
| fresh-child-tag-n4                             | scope          |   100 |          7,037,521 |           27.9×‡ |            — |             — |           — |          — |                 — |
| scale-mid-transient-chain-32                   | scale          |     1 |          1,446,253 |            2.57× |        4.94× |         7.05× |       12.4× |      1.55× |                 — |
| scale-deep-transient-chain-512                 | scale          |     1 |             55,215 |            1.62× |        25.1× |         3.61× |       7.55× |      1.27× |                 — |
| boot-decorated-container-build-and-resolve     | boot           |     1 |            145,841 |            5.28× |            — |         0.24× |           — |          — |            0.47×‡ |
| container-create-empty                         | boot           |   100 |        16,899,498‡ |           25.3×‡ |       5.93×‡ |        0.71×‡ |      4.76×‡ |     1.03×‡ |           0.51×†‡ |
| create-child-empty                             | boot           |   100 |         18,105,736 |           36.1×‡ |        6.66× |         0.81× |       5.15× |      1.26× |           0.53×†‡ |
| bind-128-plain                                 | boot           |     1 |            42,426‡ |           7.17×‡ |       8.29×‡ |        0.22×‡ |      2.23×‡ |     0.09×‡ |            0.50×‡ |
| bind-128-refined                               | boot           |     1 |            13,291‡ |           2.26×‡ |            — |             — |           — |          — |                 — |
| misconfigured-missing-binding                  | failure        |     1 |           281,392‡ |           1.71×‡ |       2.18×‡ |        0.68×‡ |      0.73×‡ |     0.71×‡ |            0.91×‡ |
| circular-dependency-3                          | failure        |     1 |            153,671 |           170.7× |       1.45×‡ |             — |           — |          — |             0.46× |
| ambiguous-multi-binding                        | failure        |     1 |           190,461‡ |           1.26×‡ |            — |             — |           — |          — |                 — |
| production-http-handler                        | production     |    50 |           900,411‡ |           14.2×‡ |       3.72×‡ |        1.97×‡ |           — |     0.60×‡ |                 — |
| production-unit-of-work                        | production     |   100 |           714,211‡ |           11.4×‡ |       4.34×‡ |        1.70×‡ |           — |     0.82×‡ |                 — |
| production-event-bus-dispatch                  | production     |   100 |        12,893,163‡ |           3.23×‡ |            — |        2.12×‡ |           — |    0.21×†‡ |           0.40×†‡ |
| to-resolved-3-deps                             | micro          |   200 |       122,358,492‡ |          2.46×†‡ |            — |             — |     24.0×†‡ |    0.71×†‡ |           1.58×†‡ |
| to-alias-redirect                              | micro          |   500 |         87,519,568 |           1.70×† |       4.94×† |        13.5×† |           — |          — |           1.02×†‡ |
| to-self-binding                                | micro          |   300 |       115,096,810‡ |          2.27×†‡ |            — |       7.05×†‡ |           — |          — |           2.23×†‡ |
| alias-chain-3                                  | micro          |   500 |         86,513,230 |           3.51×† |       11.2×† |        22.2×† |           — |          — |           1.08×†‡ |
| alias-parent-owned-terminal                    | micro          |   500 |         85,895,979 |           1.74×† |       5.73×† |        14.3×† |           — |          — |           0.97×†‡ |
| alias-cycle-detected                           | failure        |     1 |           253,864‡ |          722.7×‡ |       2.40×‡ |             — |           — |          — |            0.82×‡ |
| resolve-optional-hit                           | micro          |   500 |       107,606,426‡ |          3.53×†‡ |      2.99×†‡ |             — |     18.3×†‡ |    0.58×†‡ |           1.23×†‡ |
| resolve-optional-miss                          | micro          |   500 |        146,015,801 |           4.61×† |       2.79×† |             — |      3.74×† |     2.37×† |           1.65×†‡ |
| tagged-binding-resolve                         | micro          |   300 |        86,528,808‡ |          4.15×†‡ |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-1                         | micro          |   300 |        93,554,747‡ |          4.49×†‡ |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-4                         | micro          |   300 |        93,604,669‡ |          4.68×†‡ |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-16                        | micro          |   300 |        92,937,996‡ |          4.68×†‡ |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-64                        | micro          |   300 |        93,799,369‡ |          4.38×†‡ |            — |             — |           — |          — |                 — |
| conditional-injection-tagged                   | micro          |   300 |         56,676,426 |           2.03×† |            — |             — |      23.5×† |          — |                 — |
| rebind-hot-swap                                | lifecycle      |    50 |         3,389,211‡ |           9.51×‡ |       0.26×‡ |             — |           — |    0.04×†‡ |                 — |
| has-bound-check                                | introspection  |  1000 |        318,035,493 |           5.81×† |       1.25×† |        3.10×† |           — |     1.50×† |                 — |
| has-own-unbound-check                          | introspection  |  1000 |       619,700,114‡ |          6.61×†‡ |            — |       5.92×†‡ |           — |          — |                 — |
| container-level-activation-hook                | lifecycle      |   200 |        51,261,031‡ |          1.98×†‡ |            — |       5.39×†‡ |           — |          — |                 — |
| scoped-binding-per-child                       | scope          |   100 |          5,425,614 |           46.1×‡ |       2.72×‡ |         1.80× |       4.44× |      1.30× |                 — |
| rebind-parent-resolve-child-depth-3            | lifecycle      |    50 |         3,297,520‡ |           19.8×‡ |       0.37×‡ |             — |           — |     0.41×‡ |                 — |
| materialize-100-singletons                     | lifecycle      |     1 |            20,827‡ |           6.03×‡ |       4.19×‡ |        0.78×‡ |           — |     0.15×‡ |                 — |
| unbind-all-100-singletons                      | lifecycle      |     1 |            16,944‡ |           5.93×‡ |       3.75×‡ |        0.69×‡ |           — |     0.16×‡ |                 — |
| module-load-unload                             | boot           |     1 |            388,285 |           8.29×‡ |            — |             — |           — |          — |                 — |
| module-cold-from-modules                       | boot           |     1 |            575,594 |            10.6× |            — |             — |       0.64× |      0.39× |                 — |
| initialize-async-warmup                        | boot           |     1 |            226,502 |                — |            — |             — |           — |          — |                 — |
| inspect-snapshot                               | introspection  |    20 |          9,316,953 |                — |            — |             — |           — |          — |                 — |
| lookup-bindings                                | introspection  |   200 |         24,297,424 |                — |            — |             — |           — |          — |                 — |
| generate-dependency-graph                      | introspection  |    10 |            837,176 |                — |            — |             — |           — |          — |                 — |
| multi-tag-slot-resolve                         | micro          |   300 |         12,236,699 |                — |            — |             — |           — |          — |                 — |
| multi-tag-constraint-resolve                   | micro          |   200 |          3,454,922 |                — |            — |             — |           — |          — |                 — |
| multi-tag-select-32                            | micro          |   300 |          3,301,418 |                — |            — |             — |           — |          — |                 — |
| mask-reject-wide-catalog                       | slot-selection |   300 |        50,678,952‡ |                — |            — |             — |           — |          — |                 — |
| mask-accept-two-of-four                        | slot-selection |   300 |         17,081,739 |                — |            — |             — |           — |          — |                 — |
| mask-collision-same-bit                        | slot-selection |   300 |        50,665,518‡ |                — |            — |             — |           — |          — |                 — |
| slot-tag-array-hoisted                         | slot-selection |   300 |        86,442,098‡ |                — |            — |             — |           — |          — |                 — |
| slot-tag-shorthand-hoisted                     | slot-selection |   300 |        90,076,650‡ |                — |            — |             — |           — |          — |                 — |
| slot-tag-array-inline                          | slot-selection |   300 |        64,648,953‡ |                — |            — |             — |           — |          — |                 — |
| slot-tag-shorthand-inline                      | slot-selection |   300 |        74,751,887‡ |                — |            — |             — |           — |          — |                 — |
| slot-tag-zero-value                            | slot-selection |   300 |        86,967,691‡ |          4.18×†‡ |            — |             — |           — |          — |                 — |
| slot-name-and-tag                              | slot-selection |   300 |         10,841,773 |            0.61× |            — |             — |           — |          — |                 — |
| slot-tag-resolve-all                           | slot-selection |   300 |        50,451,946‡ |          4.13×†‡ |            — |             — |           — |          — |                 — |
| slot-tag-miss-optional                         | slot-selection |   300 |         15,510,387 |           0.66×‡ |            — |             — |           — |          — |                 — |
| slot-tag-parent-owned                          | slot-selection |   300 |        85,886,306‡ |          4.05×†‡ |            — |             — |           — |          — |                 — |
| slot-name-parent-owned                         | slot-selection |   300 |        82,758,816‡ |          3.51×†‡ |            — |             — |           — |          — |                 — |
| slot-injected-name-compiled                    | slot-selection |   300 |         22,878,470 |                — |            — |             — |           — |          — |                 — |
| slot-injected-name-interpreted                 | slot-selection |   300 |          4,225,881 |                — |            — |             — |           — |          — |                 — |
| slot-injected-tag-compiled                     | slot-selection |   300 |         23,170,141 |                — |            — |             — |           — |          — |                 — |
| slot-injected-tag-interpreted                  | slot-selection |   300 |          4,201,950 |                — |            — |             — |           — |          — |                 — |
| plan-deps-inlined                              | resolution     |   300 |         22,623,604 |                — |            — |             — |           — |          — |                 — |
| plan-escape-factory-dep                        | resolution     |   300 |          7,350,647 |                — |            — |             — |           — |          — |                 — |
| plan-escape-scoped-dep                         | resolution     |   300 |          9,542,918 |                — |            — |             — |           — |          — |                 — |
| plan-escape-hooked-dep                         | resolution     |   300 |          2,476,366 |                — |            — |             — |           — |          — |                 — |
| plan-escape-optional-dep                       | resolution     |   300 |          3,231,130 |                — |            — |             — |           — |          — |                 — |
| plan-escape-multi-dep                          | resolution     |   300 |           916,139‡ |                — |            — |             — |           — |          — |                 — |
| plan-class-chain-24                            | resolution     |     1 |          1,694,560 |                — |            — |             — |           — |          — |                 — |
| plan-class-chain-40                            | resolution     |     1 |            445,900 |                — |            — |             — |           — |          — |                 — |
| interpreted-class-chain-24                     | resolution     |     1 |            257,061 |                — |            — |             — |           — |          — |                 — |
| interpreted-class-chain-40                     | resolution     |     1 |            120,439 |                — |            — |             — |           — |          — |                 — |
| nested-context-resolve-in-factory              | resolution     |   300 |        42,997,773‡ |          1.82×†‡ |      3.59×†‡ |       5.99×†‡ |     18.1×†‡ |    2.13×†‡ |           0.95×†‡ |
| nested-container-resolve-in-factory            | resolution     |   300 |        35,813,264‡ |          1.49×†‡ |      2.55×†‡ |       5.04×†‡ |     14.6×†‡ |    1.05×†‡ |           0.87×†‡ |
| accessor-injection-construct                   | resolution     |   300 |          6,997,470 |            0.33× |            — |             — |           — |          — |                 — |

## Re-running this

```bash
pnpm bench:baseline                                             # from benchmarks/di — the full-profile pass above, read against the pinned baseline
pnpm bench:report                                               # derive report.md + report.json from the newest run
BENCH_MODE=full pnpm bench:isolate                              # the same pass, read against whatever run landed before
```

`bench:baseline` is `bench:isolate` with `BENCH_BASELINE` pinned to `baselines/2026-09-13T04-45-37-460Z`, the
pre-rewrite run whose observations are tracked in this repository, so every pass's `Δ` reads against the same run. It
runs 3 trials per library in its own subprocess — one invocation is one pass, not three. The run writes a timestamped
directory under `bench-results/` (gitignored) holding `observations.jsonl` with every per-trial `mean ms`, `p99 ms` and
IQR; `bench:report` turns the newest run into the `report.md` this page is transcribed from. Before quoting any single
loss as a factor rather than a direction, re-measure it paired and alternating on a quiet machine — a full pass carries
no between-run variance of its own. The rewrite's own protocol is in [`BENCH_GUIDE.md`](./BENCH_GUIDE.md): swap the
change's `src` files per side, `BENCH_ONLY` the target rows plus warm canaries, three alternating passes, and read the
per-pass spread, not one ratio. `BENCH_TIER=contract` runs the comparison without the 25 engine rows; `pnpm bench:list`
prints which rows each library implements and confirms there is no row a library's features allow that nobody wrote.
