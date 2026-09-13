# Results

Where `@codefast/di` actually stands against the field right now, wins and losses given equal weight — the point of this
page is to know where the engine is slower so the next change knows what to aim at. One machine-derived snapshot, no
accreted ledger. The method is in [`BENCH_GUIDE.md`](./BENCH_GUIDE.md); re-run it with the recipe at the bottom.

**This is one full-profile pass, so read the aggregates, not the rows.** GC-exposed, one subprocess per scenario,
libraries interleaved with rotating order, 3 trials each — a single pass measures no between-run variance of its own,
215 of the comparable cells carry a per-trial IQR above 5%, and 118 rows sit above ~30M ops/s where the ratio moves
between runs of the same build whatever its IQR says. Ratios are worth more than the absolute `hz/op`; a single row is
worth less than the group it sits in. A loss highlighted below points at a direction — quote a precise factor only after
a paired re-run, except where a loss is a structural O(N) difference that reproduces by construction (called out as
such).

**This run reads against the pinned baseline.** Its id is `2026-09-13T15-30-05-364Z`; the baseline it is compared to is
`2026-09-13T04-45-37-460Z`, the last pass over the engine before the rewrite began, whose observations are tracked under
`baselines/` and pinned by `pnpm bench:baseline`. Every `Δ` on this page is that comparison. The suite is unchanged
between the two: 126 rows, 101 contract rows specified against the public API, 25 engine rows that name a lane of the
resolver and enter no cross-library figure; every library implements every row its declared features allow, so a `—`
below is a feature the library lacks, never a row nobody wrote.

**Environment.** `@codefast/di` 0.9.0 from a `dist` the harness rebuilt first, on Node 26.1.0 / V8 14.6, Apple M3 Max ×
14, darwin/arm64, `--expose-gc` for every library. inversify 8.2.3 · awilix 13.0.5 · tsyringe 4.10.0 · brandi 5.1.0 ·
ditox 3.3.0 · injection-js 2.6.1. Each library runs at its canonical decorator mode (inversify legacy decorators +
`reflect-metadata`, codefast TC39 Stage 3 + `Symbol.metadata`); every inversify container uses `{ jitless: false }`, its
fastest documented configuration. Run 2026-09-13, 17m21s wall.

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
- **`BindingIdentifier` is a branded number** minted from a counter, so a plain bind allocates no string for it. A
  breaking change to the type, cleared with the maintainer; the id stays opaque.
- **A root-level, options-less `resolveAll` is memoized** until any registry in the chain changes — its candidate list
  always, its value list while every member is a hook-free constant — which the contract's purity rule for `when()`
  predicates makes sound. Reads with options, or from inside a factory, still gather afresh.
- **An accessor-injected class compiles as a plan root**, its own frame on the path while its accessors resolve, so a
  cycle through an accessor is still caught.

## Summary — where we stand

Ratios are `@codefast/di ÷ competitor`; above 1× means codefast is faster. Win `>1.03×`, parity `0.97–1.03×`, loss
`<0.97×`. `Comparable` counts the rows both libraries ran, of 112 aggregate-eligible rows codefast measures; `†` is how
many of those the median and geomean carry from above the throughput ceiling — they stay in the aggregate but no reader
should cite one alone.

| Competitor     | Comparable | Win / parity / loss | Median | Geomean |   † |
| -------------- | ---------: | ------------------: | -----: | ------: | --: |
| InversifyJS 8  |  91 of 112 |          87 / 0 / 4 |  3.07× |   3.84× |  38 |
| Awilix 13      |  38 of 112 |          36 / 0 / 2 |  4.40× |   3.77× |  15 |
| tsyringe 4     |  43 of 112 |         32 / 1 / 10 |  4.55× |   2.93× |  17 |
| Brandi 5       |  29 of 112 |          27 / 0 / 2 |  14.2× |   8.72× |  14 |
| Ditox 3        |  44 of 112 |         20 / 2 / 22 |  0.94× |   0.99× |  16 |
| injection-js 2 |  31 of 112 |         14 / 1 / 16 |  0.96× |   1.01× |  18 |

**The headline, stated plainly: codefast sweeps inversify, awilix and brandi, wins tsyringe on the median by 4.6× while
still losing it a quarter of the rows, sits at parity with injection-js on both the median (0.96×) and the geomean
(1.01×), and has closed the gap to ditox to parity on the geomean (0.99×, from 0.66× at the baseline) while still losing
it half the rows (0.94× median, from 0.72×).** Against the baseline, 54 of codefast's 126 rows are more than 10% faster
and 47 read as improved beyond noise; the rows that read down are named below, with what a paired re-measure says about
each. Every loss is still one of the same shapes — **registration**, **cold collections**, **rebind**, the **two
selection lanes**, the **accessor lane** — but each is a smaller number than it was, the stable-set collection deficit
is gone against tsyringe and down to 0.7–0.9× against ditox and injection-js, and the parent walk's slope is gone. Where
codefast wins it still wins on the warm resolve, which is what a request pays after the container is built; what this
round moved is the price of building it, of collecting, and of walking a chain.

## The losses, foregrounded — where to improve

Ordered by how much they matter, each marked as a **real deficit** (same work, codefast slower) or a **work difference**
(codefast does more per op by design, so the row is a design cost to reconsider, not a bug). Where the baseline is
quoted, it is the same row in `2026-09-13T04-45-37-460Z`.

- **Registration is still the biggest deficit, at roughly half its old size.** `bind-128-plain` — 128 transient factory
  bindings into a fresh container, no resolve — runs at 0.10× ditox, 0.24× tsyringe and 0.55× injection-js, from 0.05×,
  0.12× and 0.28×: the row is 2.06× faster than the baseline. Everything that binds before it resolves moved with it —
  `container-create-empty` 0.76× tsyringe and 1.01× ditox (from 0.30× and 0.45×), `create-child-empty` 0.80× and 1.23×
  (from 0.36× and 0.48×), `realistic-graph-cold-resolve` 0.45× ditox and 1.09× tsyringe (from 0.37× and 0.90×),
  `realistic-graph-class-cold-resolve` 0.20× ditox, 0.31× tsyringe and 0.63× injection-js (from 0.16×, 0.24× and 0.49×),
  `boot-decorated-container-build-and-resolve` 0.26× tsyringe and 0.54× injection-js (from 0.19× and 0.41×),
  `module-cold-from-modules` 0.40× ditox and 0.65× brandi (from 0.27× and 0.42×). What the registration path still pays
  is the binding object and the fluent chain object; the string id is gone, `BindingIdentifier` being a branded number
  now. **Real deficit, structural** — one hidden class for every binding kind and one builder per `bind()` are the
  design, and the ledger prices them at about ten times a map write.
- **Cold collections still lose; stable ones no longer do.** `resolve-all-cold-N` builds a fresh container and reads the
  collection once: 0.10× tsyringe, 0.24× ditox and 0.25× injection-js at N=100 (from 0.03×, 0.08× and 0.09×), 0.09×,
  0.14× and 0.17× at N=10 — three times the baseline, because a hundred predicate-only bindings on one token no longer
  copy the token's list a hundred times and a bare `when()` no longer re-registers the binding. The stable rows crossed
  over: `resolve-all-strategies-100` reads 26.4× tsyringe, 0.70× ditox and 0.81× injection-js (from 1.29×, 0.03× and
  0.04×), `resolve-all-strategies-10` 3.11×, 0.77× and 0.89× (from 0.97×, 0.24× and 0.28×), because a root-level read
  with no options memoizes its candidate list until the chain changes and its value list while every member is a
  hook-free constant — which the contract's purity rule for `when()` predicates makes sound. What the cold pair still
  pays is the registration above and one predicate evaluation per member per fresh container. **Real deficit on the cold
  pair, a registration cost seen from the collection side.**
- **Teardown at scale is a registration loss wearing a lifecycle label.** `materialize-100-singletons` (bind and resolve
  100 singletons, no teardown) is 0.20× ditox and 1.02× tsyringe; `unbind-all-100-singletons` (the same, then dispose)
  is 0.20× and 0.78×. The two ratios against ditox are the same, so the teardown walk costs nothing the rivals do not
  pay — the loss is the 100 bindings above. `lifecycle-pre-destroy-unbind` (one singleton, one hook) at 0.41× ditox and
  0.90× tsyringe is the same story at N=1, with container construction inside the row. **Work difference on the hook,
  real deficit on the registration underneath.**
- **Rebind is smaller and still slow.** `rebind-hot-swap` 0.33× awilix (from 0.18×) and 0.05×† ditox;
  `rebind-parent-resolve-child-depth-3` 0.40× awilix and 0.47× ditox (from 0.24× and 0.29×). Both rows are about 1.7×
  their baseline from the cheaper registration, the numeric id and a teardown that no longer allocates when nothing is
  owed, and the shape is unchanged: a rebind unbinds, re-registers and bumps the chain's version. **Work difference**; a
  rebind that patches the existing slot in place would close most of what is left.
- **The two selection lanes no index serves: three times faster, and still losses.** `slot-name-and-tag` — a request
  carrying a name and a tag — is 0.55× inversify (from 0.19×) and `slot-tag-miss-optional` — a tagged request matching
  nothing over a populated token — is 0.67× (from 0.25×). Both now get an allocation-free first pass over the token's
  candidates before full selection; what remains is the scan itself against inversify's single constraint pass. **Real
  deficit**, narrow: a combined name-plus-tag index entry would make the first lane an index hit, and a negative memo
  keyed on the chain version would make the second one.
- **`accessor-injection-construct` 0.40× inversify, from 0.30×.** A class with one `@inject` accessor now compiles as a
  plan root, its own frame on the path while the accessors resolve, so the row moved from the interpreted lane to a
  plan; what it still pays is the ambient scope around construction and the accessor's own `resolve` through the
  container, where inversify's property injection is a metadata read on the same plan. **Work difference**, and the row
  that says what property injection costs relative to constructor injection.
- **`resolve-all-async-8` 0.61× inversify, from 0.45×.** Every member takes the non-`async` factory lane a single
  `resolveAsync` takes; what remains is a branch stack and a level context per member against inversify's plain
  `Promise.all`. **Real deficit** on a row that is otherwise codefast's own territory (every other async row is a win).
- **Per-request child work loses to ditox and nobody else, and by less.** `production-http-handler` 0.61× (from 0.42×),
  `production-unit-of-work` 0.88× (from 0.48×), `child-request-lifecycle-create-resolve-dispose` 0.90× (from 0.53×);
  `scoped-binding-per-child` (1.37×) and `fresh-child-default-n1` (1.84×) crossed into wins. Every one is a registration
  into a fresh child, so the same deficit as the first bullet seen from the request side.
- **Warm singleton reads: 0.79×† and 0.72×† ditox on `constant-resolve` and `singleton-class-1-dep`**, unchanged.
  ditox's `get` is close to a map read; codefast still carries its binding and lifecycle shape on every resolve. Both
  rows sit above 120M ops/s, inside the band that stops reproducing between runs. **Real deficit, ceiling-bound.**
- **Failing fast costs more here: `misconfigured-missing-binding` 0.69× tsyringe, 0.73× ditox, 0.74× brandi**,
  unchanged. codefast builds a structured error with the resolution path; the rivals throw a string. **Work difference**
  on a path a production request should never take.
- **Rows that read down against the baseline in this pass.** The three `resolve-all-named-N` rows read 0.75–0.78× of
  their baseline throughput here, and 0.93× at N=32; paired and alternating against the pre-rewrite source, subject
  only, the same rows read 0.91–0.98× with both sides' trial spreads overlapping, and the half of the branch that
  carries the difference is the one holding the numeric id, the collection memo's container routing and the accessor
  plan root. The rows sit at 15–17M ops/s, the band this page flags as unstable, and the paired figure is the one to
  believe: a small, open loss on the indexed collection lane. `generate-dependency-graph` 0.92× is the id rendered as a
  string at the graph boundary, an introspection path. `dynamic-async-chain-8` 0.92× and `plan-class-chain-40` 0.94×
  read 0.97–0.98× and at parity when paired. **Open**: the named collections, to re-measure before the next change to
  the container's `resolveAll` or the tagged index.

One retraction against the baseline ledger. **The parent walk had a slope and no longer does.** `child-depth-N-resolve`
against inversify read 1.42× at depth 1 and 0.94×† at depth 8; it now reads 1.49× at depth 1 and 1.43× at depth 8,
because the summed chain version a descendant's memo is stamped with is re-walked only when the process-wide state epoch
has moved. Against ditox and awilix the slope still runs the other way (4.40× → 27.5×, 3.66× → 12.4×). Above the ceiling
at every depth, so the flatness is the finding, not any one cell.

## The wins

- **inversify — 87 of 91 comparable rows, 3.07× median, 3.84× geomean.** Widest margins on `failure`'s
  `circular-dependency-3` and `alias-cycle-detected` (both excluded — inversify recurses to the stack limit rather than
  detecting either), then `production` (12.2× geomean), `scope` (11.6×), `boot` (10.0×), `lifecycle` (6.04×), `fan-out`
  (3.96×); tightest on `resolution` (1.04×, the accessor row) and `async` (1.40×). Every fresh-child row is 14–48×,
  every production row 12–15×, and the `child-depth` axis is flat at 1.4–1.5×.
- **Awilix 13 — 36 of 38, 4.40× median**, up to 12× on the deep child walk; loses only the two rebind rows.
- **tsyringe 4 — 32 of 43, 4.55× median**, 12.2× on `micro` and 6.35× on `scope`; the stable-set collections that were
  its rows are now codefast's (26.4× at N=100); it still wins `boot`, the cold collections and the registration-heavy
  lifecycle rows, all by less than at the baseline.
- **Brandi 5 — 27 of 29, 14.2× median**, 35× on transient micro; loses only `module-cold-from-modules` and the
  missing-binding throw.
- **Against ditox codefast wins the warm work and now some of the cold** — `transient-class-1-dep` 7.56×†,
  `realistic-graph-resolve-root` 1.68×, `realistic-graph-class-resolve-root` 1.89×, `fan-out-tree` 2.16×, every
  `child-depth` row 4.40–27.5×†, `fresh-child-default-n1` 1.84×, `scoped-binding-per-child` 1.37×, `create-child-empty`
  1.23×, `container-create-empty` at parity — and still loses every row that binds many things, the cold collections and
  the stable collections by 0.70–0.77×.
- **Against injection-js** the warm rows are wins (`singleton-class-1-dep` 2.41×†, `realistic-graph-class-resolve-root`
  1.52×, `realistic-graph-resolve-root` 1.32×) and the losses are the same registration and collection rows as ditox's,
  each smaller than it was; the geomean crossed to 1.01×.
- **The selection axes are flat where they should be.** `named-resolve-slots-1/64` read 3.15× and 3.07× inversify and
  `tagged-resolve-slots-1/64` 4.51× and 4.42× with no trend across N: both lanes are indexed, and the axis proves it.
- **What this round moved, against the baseline.** `resolve-all-strategies-100` 21×, `resolve-all-strategies-10` 3.0×,
  `slot-name-and-tag` 3.0×, `slot-tag-miss-optional` 2.9×, `multi-tag-slot-resolve` 2.9×, `resolve-all-cold-100` 3.0×,
  `has-own-unbound-check` 2.7×, `create-child-empty` 2.6×, `container-create-empty` 2.4×, the `fresh-child-*-n1` rows
  2.2–2.3×, `resolve-all-cold-10` 2.1×, `bind-128-plain` 2.1×, `production-unit-of-work` 1.9×, `rebind-hot-swap` 1.8×,
  `rebind-parent-resolve-child-depth-3` 1.7×, `child-depth-8-resolve` 1.6×, `production-http-handler` 1.6×,
  `materialize-100-singletons` 1.5×, `bind-128-refined` 1.5×, `module-cold-from-modules` 1.5×,
  `accessor-injection-construct` 1.4×, `resolve-all-async-8` 1.4×, `lifecycle-pre-destroy-unbind` 1.3× — 54 of 126 rows
  more than 10% faster, with the warm resolve rows (`constant-resolve`, `singleton-class-1-dep`,
  `transient-class-1-dep`, `realistic-graph-resolve-root`, `plan-class-chain-24`) at parity, which is what every step's
  paired check was gated on.

## Geomean by group

Geomean of the ratios in each group, comparable row count in parentheses. Read a group, not a cell.

| Group          | InversifyJS 8 | Awilix 13 | tsyringe 4 |  Brandi 5 |   Ditox 3 | injection-js 2 |
| -------------- | ------------: | --------: | ---------: | --------: | --------: | -------------: |
| micro          |    2.88× (22) | 4.71× (8) |  12.2× (7) | 17.3× (8) | 1.43× (7) |      1.47× (9) |
| realistic      |     2.94× (5) | 3.06× (4) |  1.91× (4) | 7.33× (5) | 0.89× (5) |      1.13× (5) |
| fan-out        |     3.96× (9) | 2.22× (1) |  1.23× (5) | 10.7× (1) | 0.52× (5) |      0.42× (4) |
| async          |    1.40× (10) | 1.05× (1) |  1.19× (1) | 2.25× (1) | 0.98× (1) |      0.91× (1) |
| lifecycle      |     6.04× (8) | 1.56× (5) |  1.44× (4) |         — | 0.21× (5) |              — |
| scope          |    11.6× (12) | 5.54× (8) |  6.35× (8) | 14.7× (5) | 4.03× (8) |      2.01× (4) |
| scale          |     2.03× (2) | 11.0× (2) |  4.13× (2) | 9.53× (2) | 1.34× (2) |              — |
| boot           |     10.0× (7) | 6.97× (3) |  0.44× (4) | 2.47× (4) | 0.47× (4) |      0.54× (4) |
| failure        |     1.50× (2) | 2.21× (1) |  0.69× (1) | 0.74× (1) | 0.73× (1) |      0.92× (1) |
| production     |     12.2× (3) | 4.45× (2) |  2.90× (3) |         — | 0.70× (3) |      0.80× (1) |
| introspection  |     6.19× (2) | 1.17× (1) |  4.28× (2) |         — | 1.50× (1) |              — |
| slot-selection |     2.18× (6) |         — |          — |         — |         — |              — |
| resolution     |     1.04× (3) | 3.03× (2) |  5.41× (2) | 16.1× (2) | 1.52× (2) |      0.92× (2) |

The `boot` group against tsyringe, ditox and injection-js (0.44×, 0.47×, 0.54×) is the registration deficit in one
number, from 0.22–0.27× at the baseline. The `fan-out` group against tsyringe went from 0.37× to 1.23× and against ditox
and injection-js from 0.16× and 0.10× to 0.52× and 0.42×: the stable-set collection rows are memoized now, and only the
cold pair still loses. `production` against ditox (0.70×, from 0.34×) and injection-js (0.80×, from 0.30×) is the
per-request child rows. `resolution` against inversify crossed to 1.04× as the accessor row moved. `failure` against
inversify stays at 1.50× because `alias-cycle-detected` is excluded, which is why it was.

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
| constant-resolve                               | micro          |  1000 |       143,706,410‡ |          2.15×†‡ |      3.79×†‡ |       9.47×†‡ |     24.4×†‡ |    0.79×†‡ |           1.55×†‡ |
| singleton-class-1-dep                          | micro          |   200 |       122,309,133‡ |          2.45×†‡ |      3.04×†‡ |       8.76×†‡ |     23.2×†‡ |    0.72×†‡ |           2.41×†‡ |
| transient-class-1-dep                          | micro          |   200 |         73,325,726 |          1.98×†‡ |       8.11×† |        14.9×† |      35.0×† |     7.56×† |                 — |
| named-constant-get                             | micro          |   500 |        78,585,324‡ |          2.98×†‡ |            — |             — |           — |          — |                 — |
| named-resolve-slots-1                          | micro          |   500 |        83,699,277‡ |          3.15×†‡ |            — |             — |           — |          — |                 — |
| named-resolve-slots-4                          | micro          |   500 |        83,455,821‡ |          3.07×†‡ |            — |             — |           — |          — |                 — |
| named-resolve-slots-16                         | micro          |   500 |        83,188,503‡ |          3.08×†‡ |            — |             — |           — |          — |                 — |
| named-resolve-slots-64                         | micro          |   500 |        83,216,135‡ |          3.07×†‡ |            — |             — |           — |          — |                 — |
| optional-missing-transient                     | micro          |   200 |         35,111,651 |           1.09×† |            — |             — |      9.79×† |     2.63×† |                 — |
| realistic-graph-resolve-root                   | realistic      |    20 |         18,423,482 |            2.68× |        2.68× |         8.25× |       17.5× |      1.68× |            1.32×‡ |
| realistic-graph-cold-resolve                   | realistic      |     1 |           120,237‡ |           4.82×‡ |       1.93×‡ |        1.09×‡ |      2.39×‡ |     0.45×‡ |            0.95×‡ |
| realistic-graph-resolved-root                  | realistic      |    20 |         21,682,902 |            1.45× |            — |             — |       21.2× |      1.91× |            1.57×‡ |
| realistic-graph-class-resolve-root             | realistic      |    20 |         14,476,387 |            1.35× |        3.03× |         4.69× |       14.2× |      1.89× |            1.52×‡ |
| realistic-graph-class-cold-resolve             | realistic      |     1 |            132,510 |           8.63×‡ |        5.57× |         0.31× |       1.68× |      0.20× |             0.63× |
| realistic-graph-validate                       | realistic      |    10 |         18,558,644 |                — |            — |             — |           — |          — |                 — |
| fan-out-tree-depth-3-breadth-4                 | fan-out        |    20 |          1,885,949 |            1.67× |        2.22× |         3.96× |       10.7× |      2.16× |                 — |
| resolve-all-strategies-10                      | fan-out        |     1 |        21,435,311‡ |           6.61×‡ |            — |        3.11×‡ |           — |     0.77×‡ |            0.89×‡ |
| resolve-all-strategies-100                     | fan-out        |     1 |        19,527,796‡ |           47.5×‡ |            — |        26.4×‡ |           — |     0.70×‡ |            0.81×‡ |
| resolve-all-cold-10                            | fan-out        |     1 |            260,519 |           5.38×‡ |            — |         0.09× |           — |      0.14× |            0.17×‡ |
| resolve-all-cold-100                           | fan-out        |     1 |            34,710‡ |           4.63×‡ |            — |        0.10×‡ |           — |     0.24×‡ |            0.25×‡ |
| resolve-all-named-8                            | fan-out        |     1 |        15,821,061‡ |           2.00×‡ |            — |             — |           — |          — |                 — |
| resolve-all-named-16                           | fan-out        |     1 |        16,712,027‡ |           2.29×‡ |            — |             — |           — |          — |                 — |
| resolve-all-named-32                           | fan-out        |     1 |        17,304,260‡ |           2.24×‡ |            — |             — |           — |          — |                 — |
| resolve-all-named-64                           | fan-out        |     1 |        14,459,126‡ |           1.78×‡ |            — |             — |           — |          — |                 — |
| resolve-async-single-hop                       | async          |     1 |          9,440,887 |            1.35× |            — |             — |           — |          — |                 — |
| async-init-single-hop                          | async          |     1 |          4,418,171 |            1.34× |        1.05× |        1.19×‡ |       2.25× |      0.98× |             0.91× |
| dynamic-async-chain-8                          | async          |     1 |          2,109,081 |            1.49× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-8                      | async          |     1 |          1,072,226 |            1.58× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-16                     | async          |     1 |            562,146 |            1.70× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-32                     | async          |     1 |            265,870 |            1.64× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-64                     | async          |     1 |            137,713 |            1.84× |            — |             — |           — |          — |                 — |
| async-branch-chain-8                           | async          |     1 |            475,116 |                — |            — |             — |           — |          — |                 — |
| async-branch-escape-mid-chain-8                | async          |     1 |            800,656 |                — |            — |             — |           — |          — |                 — |
| async-diamond-shared-leaf                      | async          |     1 |          1,991,431 |            1.39× |            — |             — |           — |          — |                 — |
| plan-async-resolved-chain-8                    | async          |     1 |            986,966 |                — |            — |             — |           — |          — |                 — |
| plan-async-class-chain-8                       | async          |     1 |          2,492,985 |                — |            — |             — |           — |          — |                 — |
| resolve-all-async-8                            | async          |     1 |           576,108‡ |           0.61×‡ |            — |             — |           — |          — |                 — |
| resolve-optional-async-miss                    | async          |     1 |          9,121,011 |            1.53× |            — |             — |           — |          — |                 — |
| lifecycle-post-construct-singleton             | lifecycle      |   250 |       122,566,863‡ |          2.42×†‡ |            — |             — |           — |          — |                 — |
| lifecycle-pre-destroy-unbind                   | lifecycle      |     1 |          1,095,825 |            12.5× |       2.85×‡ |        0.90×‡ |           — |      0.41× |                 — |
| binding-level-activation-hook                  | lifecycle      |   200 |        49,368,620‡ |          1.90×†‡ |            — |             — |           — |          — |                 — |
| child-depth-1-resolve                          | scope          |   500 |         92,652,203 |          1.49×†‡ |       3.66×† |        7.06×† |      17.2×† |     4.40×† |           1.67×†‡ |
| child-depth-2-resolve                          | scope          |   500 |         92,765,055 |          1.45×†‡ |       4.71×† |        8.11×† |      17.8×† |     7.11×† |           1.69×†‡ |
| child-depth-4-resolve                          | scope          |   500 |         91,947,903 |          1.41×†‡ |       6.95×† |        10.7×† |      19.9×† |     14.5×† |           1.88×†‡ |
| child-depth-8-resolve                          | scope          |   500 |         92,927,770 |          1.43×†‡ |       12.4×† |        15.4×† |      24.4×† |     27.5×† |           3.05×†‡ |
| child-request-lifecycle-create-resolve-dispose | scope          |   100 |         1,574,115‡ |           28.1×‡ |       6.26×‡ |        2.99×‡ |           — |     0.90×‡ |                 — |
| fresh-child-default-n1                         | scope          |   100 |         10,027,596 |           34.7×‡ |       6.10×‡ |         7.02× |           — |      1.84× |                 — |
| fresh-child-default-n4                         | scope          |   100 |          7,237,258 |           25.9×‡ |       5.37×‡ |         6.94× |           — |      2.45× |                 — |
| fresh-child-name-n1                            | scope          |   100 |          9,714,009 |           37.1×‡ |            — |             — |           — |          — |                 — |
| fresh-child-name-n4                            | scope          |   100 |          6,462,284 |           26.0×‡ |            — |             — |           — |          — |                 — |
| fresh-child-tag-n1                             | scope          |   100 |          9,415,029 |           36.4×‡ |            — |             — |           — |          — |                 — |
| fresh-child-tag-n4                             | scope          |   100 |          7,084,909 |           31.6×‡ |            — |             — |           — |          — |                 — |
| scale-mid-transient-chain-32                   | scale          |     1 |          1,417,961 |            2.59× |        4.83× |         4.55× |       12.4× |      1.51× |                 — |
| scale-deep-transient-chain-512                 | scale          |     1 |             55,154 |            1.60× |        24.9× |         3.75× |       7.32× |      1.19× |                 — |
| boot-decorated-container-build-and-resolve     | boot           |     1 |            167,973 |           5.74×‡ |            — |         0.26× |           — |          — |            0.54×‡ |
| container-create-empty                         | boot           |   100 |         16,722,886 |           24.3×‡ |        5.75× |         0.76× |       4.72× |      1.01× |           0.53×†‡ |
| create-child-empty                             | boot           |   100 |         17,871,959 |           34.4×‡ |        6.62× |         0.80× |       5.09× |      1.23× |           0.52×†‡ |
| bind-128-plain                                 | boot           |     1 |            45,829‡ |           7.74×‡ |       8.90×‡ |        0.24×‡ |      2.38×‡ |     0.10×‡ |            0.55×‡ |
| bind-128-refined                               | boot           |     1 |            14,950‡ |           2.55×‡ |            — |             — |           — |          — |                 — |
| misconfigured-missing-binding                  | failure        |     1 |           285,605‡ |           1.75×‡ |       2.21×‡ |        0.69×‡ |      0.74×‡ |     0.73×‡ |            0.92×‡ |
| circular-dependency-3                          | failure        |     1 |            155,635 |           173.1× |       1.49×‡ |             — |           — |          — |             0.47× |
| ambiguous-multi-binding                        | failure        |     1 |           195,899‡ |           1.28×‡ |            — |             — |           — |          — |                 — |
| production-http-handler                        | production     |    50 |            933,755 |           15.3×‡ |       4.13×‡ |        2.03×‡ |           — |      0.61× |                 — |
| production-unit-of-work                        | production     |   100 |           759,892‡ |           12.1×‡ |       4.80×‡ |        1.82×‡ |           — |     0.88×‡ |                 — |
| production-event-bus-dispatch                  | production     |   100 |        39,347,124‡ |          9.88×†‡ |            — |       6.59×†‡ |           — |    0.65×†‡ |           0.80×†‡ |
| to-resolved-3-deps                             | micro          |   200 |       123,205,719‡ |          2.48×†‡ |            — |             — |     23.9×†‡ |    0.73×†‡ |           1.61×†‡ |
| to-alias-redirect                              | micro          |   500 |         87,726,691 |           1.71×† |       4.89×† |        13.8×† |           — |          — |           1.02×†‡ |
| to-self-binding                                | micro          |   300 |       118,214,250‡ |          2.45×†‡ |            — |       7.78×†‡ |           — |          — |           2.28×†‡ |
| alias-chain-3                                  | micro          |   500 |         86,871,215 |           3.51×† |       11.3×† |        21.6×† |           — |          — |           1.08×†‡ |
| alias-parent-owned-terminal                    | micro          |   500 |         84,826,073 |           1.69×† |       5.78×† |        14.1×† |           — |          — |           0.96×†‡ |
| alias-cycle-detected                           | failure        |     1 |           251,586‡ |          705.0×‡ |       2.38×‡ |             — |           — |          — |            0.80×‡ |
| resolve-optional-hit                           | micro          |   500 |       107,475,607‡ |          3.53×†‡ |      3.00×†‡ |             — |     18.4×†‡ |    0.58×†‡ |           1.34×†‡ |
| resolve-optional-miss                          | micro          |   500 |        145,476,643 |           4.61×† |       2.72×† |             — |      3.68×† |     2.54×† |           1.65×†‡ |
| tagged-binding-resolve                         | micro          |   300 |        86,487,825‡ |          4.28×†‡ |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-1                         | micro          |   300 |        93,102,555‡ |          4.51×†‡ |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-4                         | micro          |   300 |        92,886,916‡ |          4.71×†‡ |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-16                        | micro          |   300 |        92,693,251‡ |          4.65×†‡ |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-64                        | micro          |   300 |        92,241,216‡ |          4.42×†‡ |            — |             — |           — |          — |                 — |
| conditional-injection-tagged                   | micro          |   300 |         60,123,898 |           2.14×† |            — |             — |      25.6×† |          — |                 — |
| rebind-hot-swap                                | lifecycle      |    50 |         4,184,824‡ |           12.0×‡ |       0.33×‡ |             — |           — |    0.05×†‡ |                 — |
| has-bound-check                                | introspection  |  1000 |        317,881,176 |           5.78×† |       1.17×† |        3.11×† |           — |     1.50×† |                 — |
| has-own-unbound-check                          | introspection  |  1000 |       620,186,330‡ |          6.63×†‡ |            — |       5.90×†‡ |           — |          — |                 — |
| container-level-activation-hook                | lifecycle      |   200 |        56,411,478‡ |          2.14×†‡ |            — |       5.93×†‡ |           — |          — |                 — |
| scoped-binding-per-child                       | scope          |   100 |          5,674,314 |           48.0×‡ |       2.91×‡ |         1.92× |       4.68× |      1.37× |                 — |
| rebind-parent-resolve-child-depth-3            | lifecycle      |    50 |         3,489,106‡ |           21.0×‡ |       0.40×‡ |             — |           — |     0.47×‡ |                 — |
| materialize-100-singletons                     | lifecycle      |     1 |            27,815‡ |           7.98×‡ |       5.42×‡ |        1.02×‡ |           — |     0.20×‡ |                 — |
| unbind-all-100-singletons                      | lifecycle      |     1 |            21,032‡ |           7.19×‡ |       4.66×‡ |        0.78×‡ |           — |     0.20×‡ |                 — |
| module-load-unload                             | boot           |     1 |            458,379 |           10.2×‡ |            — |             — |           — |          — |                 — |
| module-cold-from-modules                       | boot           |     1 |            595,163 |            10.5× |            — |             — |       0.65× |      0.40× |                 — |
| initialize-async-warmup                        | boot           |     1 |            245,758 |                — |            — |             — |           — |          — |                 — |
| inspect-snapshot                               | introspection  |    20 |          9,394,020 |                — |            — |             — |           — |          — |                 — |
| lookup-bindings                                | introspection  |   200 |         24,323,393 |                — |            — |             — |           — |          — |                 — |
| generate-dependency-graph                      | introspection  |    10 |            740,484 |                — |            — |             — |           — |          — |                 — |
| multi-tag-slot-resolve                         | micro          |   300 |         12,244,517 |                — |            — |             — |           — |          — |                 — |
| multi-tag-constraint-resolve                   | micro          |   200 |          3,438,644 |                — |            — |             — |           — |          — |                 — |
| multi-tag-select-32                            | micro          |   300 |          3,273,051 |                — |            — |             — |           — |          — |                 — |
| mask-reject-wide-catalog                       | slot-selection |   300 |        35,732,309‡ |                — |            — |             — |           — |          — |                 — |
| mask-accept-two-of-four                        | slot-selection |   300 |         17,506,812 |                — |            — |             — |           — |          — |                 — |
| mask-collision-same-bit                        | slot-selection |   300 |         49,268,957 |                — |            — |             — |           — |          — |                 — |
| slot-tag-array-hoisted                         | slot-selection |   300 |        86,586,128‡ |                — |            — |             — |           — |          — |                 — |
| slot-tag-shorthand-hoisted                     | slot-selection |   300 |        90,622,443‡ |                — |            — |             — |           — |          — |                 — |
| slot-tag-array-inline                          | slot-selection |   300 |        64,600,593‡ |                — |            — |             — |           — |          — |                 — |
| slot-tag-shorthand-inline                      | slot-selection |   300 |        74,868,575‡ |                — |            — |             — |           — |          — |                 — |
| slot-tag-zero-value                            | slot-selection |   300 |        86,715,137‡ |          4.54×†‡ |            — |             — |           — |          — |                 — |
| slot-name-and-tag                              | slot-selection |   300 |         10,717,895 |            0.55× |            — |             — |           — |          — |                 — |
| slot-tag-resolve-all                           | slot-selection |   300 |         50,444,827 |           4.32×† |            — |             — |           — |          — |                 — |
| slot-tag-miss-optional                         | slot-selection |   300 |         15,475,150 |            0.67× |            — |             — |           — |          — |                 — |
| slot-tag-parent-owned                          | slot-selection |   300 |        84,797,173‡ |          4.09×†‡ |            — |             — |           — |          — |                 — |
| slot-name-parent-owned                         | slot-selection |   300 |        82,847,878‡ |          3.59×†‡ |            — |             — |           — |          — |                 — |
| slot-injected-name-compiled                    | slot-selection |   300 |         23,551,981 |                — |            — |             — |           — |          — |                 — |
| slot-injected-name-interpreted                 | slot-selection |   300 |          4,157,533 |                — |            — |             — |           — |          — |                 — |
| slot-injected-tag-compiled                     | slot-selection |   300 |         23,428,537 |                — |            — |             — |           — |          — |                 — |
| slot-injected-tag-interpreted                  | slot-selection |   300 |          4,476,227 |                — |            — |             — |           — |          — |                 — |
| plan-deps-inlined                              | resolution     |   300 |         22,694,174 |                — |            — |             — |           — |          — |                 — |
| plan-escape-factory-dep                        | resolution     |   300 |          7,519,976 |                — |            — |             — |           — |          — |                 — |
| plan-escape-scoped-dep                         | resolution     |   300 |          9,050,996 |                — |            — |             — |           — |          — |                 — |
| plan-escape-hooked-dep                         | resolution     |   300 |          2,587,646 |                — |            — |             — |           — |          — |                 — |
| plan-escape-optional-dep                       | resolution     |   300 |          3,390,705 |                — |            — |             — |           — |          — |                 — |
| plan-escape-multi-dep                          | resolution     |   300 |           891,567‡ |                — |            — |             — |           — |          — |                 — |
| plan-class-chain-24                            | resolution     |     1 |          1,703,475 |                — |            — |             — |           — |          — |                 — |
| plan-class-chain-40                            | resolution     |     1 |            405,751 |                — |            — |             — |           — |          — |                 — |
| interpreted-class-chain-24                     | resolution     |     1 |            301,806 |                — |            — |             — |           — |          — |                 — |
| interpreted-class-chain-40                     | resolution     |     1 |            156,167 |                — |            — |             — |           — |          — |                 — |
| nested-context-resolve-in-factory              | resolution     |   300 |        42,892,341‡ |          1.91×†‡ |      3.55×†‡ |       5.84×†‡ |     17.7×†‡ |    2.20×†‡ |           0.96×†‡ |
| nested-container-resolve-in-factory            | resolution     |   300 |        36,095,759‡ |          1.48×†‡ |      2.60×†‡ |       5.01×†‡ |     14.6×†‡ |    1.06×†‡ |           0.88×†‡ |
| accessor-injection-construct                   | resolution     |   300 |          8,663,137 |            0.40× |            — |             — |           — |          — |                 — |

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
