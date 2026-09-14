# Results

Where `@codefast/di` actually stands against the field right now, wins and losses given equal weight — the point of this
page is to know where the engine is slower so the next change knows what to aim at. One machine-derived snapshot, no
accreted ledger. The method is in [`BENCH_GUIDE.md`](./BENCH_GUIDE.md); re-run it with the recipe at the bottom.

**This is one full-profile pass, so read the aggregates, not the rows.** GC-exposed, one subprocess per scenario,
libraries interleaved with rotating order, 3 trials each — a single pass measures no between-run variance of its own,
207 of the comparable cells carry a per-trial IQR above 5%, and 124 rows sit above ~30M ops/s where the ratio moves
between runs of the same build whatever its IQR says. Ratios are worth more than the absolute `hz/op`; a single row is
worth less than the group it sits in. A loss highlighted below points at a direction — quote a precise factor only after
a paired re-run, except where a loss is a structural O(N) difference that reproduces by construction (called out as
such).

**This run reads against the pinned baseline.** Its id is `2026-09-14T01-09-57-222Z`, over the tree at `5fbc3dea8`; the
baseline it is compared to is `2026-09-13T04-45-37-460Z`, the last pass over the engine before the rewrite began, whose
observations are tracked under `baselines/` and pinned by `pnpm bench:baseline`. Every `Δ` on this page is that
comparison. The suite is unchanged between the two: 126 rows, 101 contract rows specified against the public API, 25
engine rows that name a lane of the resolver and enter no cross-library figure; every library implements every row its
declared features allow, so a `—` below is a feature the library lacks, never a row nobody wrote.

**Environment.** `@codefast/di` 0.9.0 from a `dist` the harness rebuilt first, on Node 26.1.0 / V8 14.6, Apple M3 Max ×
14, darwin/arm64, `--expose-gc` for every library. inversify 8.2.3 · awilix 13.0.5 · tsyringe 4.10.0 · brandi 5.1.0 ·
ditox 3.3.0 · injection-js 2.6.1. Each library runs at its canonical decorator mode (inversify legacy decorators +
`reflect-metadata`, codefast TC39 Stage 3 + `Symbol.metadata`); every inversify container uses `{ jitless: false }`, its
fastest documented configuration. Run 2026-09-14, 18m53s wall.

## What changed since the baseline

Every step below landed as one commit on the rewrite branch, was measured in a paired A/B against the code before it
(`BENCH_ONLY` narrowed to its target rows plus warm canaries, each side's `src` swapped in and `dist` rebuilt — three
alternating passes for the early steps, a one-pass fast gate followed by one full pass per side once the harness could
filter the run to the subject), and was kept only when the canaries held. The per-step tables are in the pull request;
this page reads the whole suite once, against the pinned baseline.

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
- **The fluent chain is the binding it registers.** `bind().to*()` fills one object's fields in place and hands that
  object to the registry; a re-slot (`whenNamed`, `whenTagged`, a bare `when()`) takes the live binding out of its
  indexes, rewrites it and adds it back under the same identity. A plain bind is one allocation, not three plus a copy.
- **`many()` collection members** are the library's own form for a strategy set: several coexist on the default slot,
  `resolveAll` returns every member and a single `resolve` never picks one. The suite's codefast strategy rows use it
  where a predicate that always answered true stood in; the rivals keep their own idioms.
- **Class metadata is read once per reader.** The introspector's per-class caches are shared by every container that
  reads through the same metadata reader — a child takes its parent's caches by hand, a root looks them up on its first
  metadata question — and the activation-need cache is built by the first resolve that asks for it.
- **A plan that keeps running is generated as a function of its own.** Every compiled plan was a closure over the
  compiler's literals, and V8 keeps type feedback per literal, so one plan's dependency calls saw every plan's thunks
  and went polymorphic as soon as a second plan shape existed in the process. A plan that has run past a threshold is
  now rendered from its recorded shape through the `Function` constructor — one source text, one feedback vector — and
  takes the closure's place; below the threshold, which is all a cold container or a per-request child ever runs, a plan
  stays a closure, and so does every plan where a Content Security Policy refuses the constructor.
- **A root collection's cached list is handed out as a read-only array.** `resolveAll`, `resolveAllAsync` and an
  `injectAll` dependency deliver a `ReadonlyArray`, and a root-level read with no options hands out the engine's own
  list — the same array on every call while no registry in the chain has changed — instead of a copy per read; the list
  is kept once every member is a hook-free constant or a hook-free singleton whose instance is cached. Unfrozen on
  purpose: a frozen array iterates through a slow elements kind in V8.
- **An optional read of a lone default takes the plain resolve lane**, and a root that keeps no records answers an
  optional miss without the selection walk.
- **A one-criterion index miss is a registry miss.** Every one-criterion slot is in the simple index, so a request the
  index does not hold walks to the parent at once instead of scanning the token's bindings.
- **A request carrying a name and one tag has a memoized lane** — the exact two-criterion slot, in either declaration
  order, keyed by token, name criterion and tag under the chain version.
- **A root-level async collection of transient factories fans out on the factory lane**, skipping the per-member
  dispatch that has nothing left to decide for such a member.

## Summary — where we stand

Ratios are `@codefast/di ÷ competitor`; above 1× means codefast is faster. Win `>1.03×`, parity `0.97–1.03×`, loss
`<0.97×`. `Comparable` counts the rows both libraries ran, of 112 aggregate-eligible rows codefast measures; `†` is how
many of those the median and geomean carry from above the throughput ceiling — they stay in the aggregate but no reader
should cite one alone.

| Competitor     | Comparable | Win / parity / loss | Median | Geomean |   † |
| -------------- | ---------: | ------------------: | -----: | ------: | --: |
| InversifyJS 8  |  91 of 112 |          89 / 0 / 2 |  3.14× |   4.82× |  41 |
| Awilix 13      |  38 of 112 |          36 / 1 / 1 |  5.09× |   4.95× |  15 |
| tsyringe 4     |  43 of 112 |          36 / 1 / 6 |  4.89× |   3.91× |  17 |
| Brandi 5       |  29 of 112 |          28 / 0 / 1 |  14.8× |   11.0× |  15 |
| Ditox 3        |  44 of 112 |         24 / 3 / 17 |  1.12× |   1.39× |  17 |
| injection-js 2 |  31 of 112 |          21 / 2 / 8 |  1.34× |   1.38× |  19 |

**The headline, stated plainly: codefast sweeps inversify, awilix and brandi, wins tsyringe on the median by 4.9× while
still losing it six rows, and holds the wins against the two libraries it started this round losing to — ditox on the
median (1.12×, from 0.72× at the baseline) and the geomean (1.39×, from 0.66×) while still losing it 17 of 44 rows,
injection-js on both (1.34× and 1.38×, from 0.99× and 0.70×) while losing it 8 of 31.** Against the baseline, 64 of
codefast's 126 rows are more than 10% faster and 49 read as improved beyond noise; the six that read down beyond noise
are named below, each with what a paired re-measure says. Inversify is down to two rows: the accessor lane and the async
collection. The two selection lanes no index served — a name beside a tag, a tagged request matching nothing — were the
other two inversify rows one pass ago and are wins now, and the stable-set collections that were ditox's are at parity.
Every remaining loss is one of the same shapes — **registration**, **cold collections**, **rebind**, the **accessor
lane** — and where codefast wins it still wins on the warm resolve, which is what a request pays after the container is
built; this round moved the price of building a container, of binding into it, of collecting from it, of running a plan
among other plans, and of asking for a slot the indexes had to scan for.

## The losses, foregrounded — where to improve

Ordered by how much they matter, each marked as a **real deficit** (same work, codefast slower) or a **work difference**
(codefast does more per op by design, so the row is a design cost to reconsider, not a bug). Where the baseline is
quoted, it is the same row in `2026-09-13T04-45-37-460Z`.

- **Registration is still the biggest deficit, and it is a ditox-only one.** `bind-128-plain` — 128 transient factory
  bindings into a fresh container, no resolve — runs at 0.43× ditox, 1.01× tsyringe and 2.22× injection-js, from 0.05×,
  0.12× and 0.28×: the row is 8.5× faster than the baseline, because the fluent chain is now the binding it registers
  (one allocation per bind, a numeric id, one map write). Everything that binds before it resolves moved with it —
  `container-create-empty` 1.10× tsyringe and 1.58× ditox (from 0.30× and 0.45×), `create-child-empty` 0.83× and 1.29×
  (from 0.36× and 0.48×), `realistic-graph-cold-resolve` 1.00× ditox and 2.43× tsyringe (from 0.37× and 0.90×),
  `realistic-graph-class-cold-resolve` 0.52× ditox, 0.82× tsyringe and 1.59× injection-js (from 0.16×, 0.24× and 0.49×),
  `boot-decorated-container-build-and-resolve` 0.77× tsyringe and 1.65× injection-js (from 0.19× and 0.41×),
  `module-cold-from-modules` 1.12× ditox and 1.80× brandi (from 0.27× and 0.42×). The two empty-container rows still
  lose injection-js above the ceiling (0.82×† and 0.53×†). What the registration path still pays is the binding object
  with every kind's fields on one hidden class, and the registry write; ditox's `bindFactory` is a map write and a
  closure. Making a child's scope and lifecycle managers lazy was measured and rejected: the warm interpreted lanes lost
  more than the empty-child rows gained. **Real deficit, structural** — one object per binding is the design.
- **Cold collections still lose; stable ones are at parity or wins.** `resolve-all-cold-N` builds a fresh container and
  reads the collection once: 0.20× tsyringe, 0.47× ditox and 0.53× injection-js at N=100 (from 0.03×, 0.08× and 0.09×),
  0.63×, 0.69× and 0.89× at N=10 — six to ten times the baseline, because a hundred `many()` members on one token append
  to one list and evaluate no predicate. The stable rows moved again: `resolve-all-strategies-100` reads 36.1× tsyringe,
  0.97× ditox and 1.03× injection-js (from 1.29×, 0.03× and 0.04×), `resolve-all-strategies-10` 3.88×, 0.95× and 1.32×
  (from 0.97×, 0.24× and 0.28×), because a root-level read with no options hands out its memoized list itself — the same
  read-only array on every call while the chain is unchanged — which is what ditox's `bindMultiValue` does. What the
  cold pair still pays is the registration above. **Real deficit on the cold pair, a registration cost seen from the
  collection side.**
- **Teardown at scale is a registration loss wearing a lifecycle label.** `materialize-100-singletons` (bind and resolve
  100 singletons, no teardown) is 0.41× ditox and 2.18× tsyringe; `unbind-all-100-singletons` (the same, then dispose)
  is 0.40× and 1.62×. The two ratios against ditox are the same, so the teardown walk costs nothing the rivals do not
  pay — the loss is the 100 bindings above. `lifecycle-pre-destroy-unbind` (one singleton, one hook) at 0.81× ditox and
  1.78× tsyringe is the same story at N=1. **Work difference on the hook, real deficit on the registration underneath.**
- **Rebind is at parity with awilix and still slow against ditox.** `rebind-hot-swap` 0.97× awilix (from 0.18×) and
  0.15×† ditox; `rebind-parent-resolve-child-depth-3` 1.00× awilix and 1.06× ditox (from 0.24× and 0.29×). Both rows are
  four to five times their baseline; the shape is unchanged: a rebind unbinds, re-registers and bumps the chain's
  version. An in-place rebind was weighed and left: it would save the new binding object but keep the map writes, for a
  row that sits at parity with awilix and above the ceiling against ditox. **Work difference.**
- **`accessor-injection-construct` 0.41× inversify, from 0.30×.** A class with one `@inject` accessor compiles as a plan
  root and its plan is generated like any other; what it still pays is the ambient scope around construction and the
  accessor's own `resolve` through the container, where inversify's property injection is a metadata read on the same
  plan. **Work difference**, and the row that says what property injection costs relative to constructor injection.
- **`resolve-all-async-8` 0.61× inversify, from 0.45×.** Every member takes the non-`async` factory lane a single
  `resolveAsync` takes; what remains is the branch array, the level context and the promise each member needs against
  inversify's plain `Promise.all` — skipping the dispatch in front of them was measured and read as no change. **Real
  deficit** on a row that is otherwise codefast's own territory (every other async row is a win).
- **Per-request child work against ditox is a win now.** `production-http-handler` 1.03× (from 0.42×),
  `production-unit-of-work` 1.13× (from 0.48×), `child-request-lifecycle-create-resolve-dispose` 1.33× (from 0.53×),
  `scoped-binding-per-child` 1.34×, `fresh-child-default-n1` 1.87×; `production-event-bus-dispatch` sits at 0.77×†,
  above the ceiling now that a dispatch is one lookup and a loop. Every one is a registration into a fresh child, so
  what is left of the first bullet seen from the request side.
- **Warm singleton reads: 0.79×† and 0.71×† ditox on `constant-resolve` and `singleton-class-1-dep`**, unchanged, and
  the same shape on `to-resolved-3-deps` 0.72×† and `resolve-optional-hit` 0.78×†. ditox's `get` is close to a map read;
  codefast still carries its binding and lifecycle shape on every resolve. All four rows sit above 120M ops/s, inside
  the band that stops reproducing between runs. **Real deficit, ceiling-bound.**
- **Failing fast costs more here: `misconfigured-missing-binding` 0.67× tsyringe, 0.72× ditox, 0.73× brandi, 0.93×
  injection-js**, unchanged. codefast builds a structured error with the resolution path; the rivals throw a string.
  **Work difference** on a path a production request should never take.
- **Rows that read down against the baseline in this pass.** The indexed collections first: `resolve-all-named-16`,
  `-64` and `-8` read 0.83×, 0.86× and 0.87× of their baseline throughput, `-32` 0.92×. The four rows sit at 16–19M
  ops/s, the band this page flags as unstable; across the last three passes the same rows have read anywhere from 0.66×
  to 1.00× of baseline, and 0.91–0.98× paired and alternating against the pre-rewrite source with overlapping spreads.
  **Open**: a small loss on the indexed collection lane that no pass has yet pinned to a figure, to re-measure before
  the next change to `resolveAll` or the tagged index. Then three rows that read 0.91–0.95× of baseline here and
  0.96–1.11× of the pass before — `scale-mid-transient-chain-32`, `generate-dependency-graph`, `async-init-single-hop` —
  which is this pass's own swing, not a change's.

One retraction against the baseline ledger stands. **The parent walk had a slope and no longer does.**
`child-depth-N-resolve` against inversify read 1.42× at depth 1 and 0.94×† at depth 8 at the baseline; it now reads
1.46×† at both, because the summed chain version a descendant's memo is stamped with is re-walked only when the
process-wide state epoch has moved. Against ditox and awilix the slope still runs the other way (4.09× → 25.4×, 3.77× →
12.4×). Above the ceiling at every depth, so the flatness is the finding, not any one cell.

## The wins

- **inversify — 89 of 91 comparable rows, 3.14× median, 4.82× geomean.** Widest margins on `failure`'s
  `circular-dependency-3` and `alias-cycle-detected` (both excluded — inversify recurses to the stack limit rather than
  detecting either), then `boot` (21.6× geomean), `production` (16.6×), `scope` (11.8×), `lifecycle` (9.95×),
  `introspection` (6.20×), `realistic` (5.75×), `fan-out` (5.54×), `slot-selection` (3.53×); tightest on `resolution`
  (1.04×, the accessor row) and `async` (1.40×). The two selection lanes it won one pass ago are codefast's:
  `slot-name-and-tag` 2.10×† (from 0.19× at the baseline) through a memoized lookup of the exact two-criterion slot, and
  `slot-tag-miss-optional` 3.58×† (from 0.25×) because a one-criterion index miss is declared a registry miss without a
  scan. Every fresh-child row is 35–36×, every production row 15–25×, `bind-128-plain` 32×, and the `child-depth` axis
  is flat at 1.46×†.
- **Awilix 13 — 36 of 38, 5.09× median**, up to 12× on the deep child walk and 36× on `bind-128-plain`; loses only
  `rebind-hot-swap` (0.97×, inside the parity band's edge).
- **tsyringe 4 — 36 of 43, 4.89× median**, 12.3× on `micro` and 6.68× on `scope`; the stable-set collections that were
  its rows are now codefast's by a wide margin (36.1× at N=100, 3.88× at N=10), `bind-128-plain` is at parity (1.01×,
  from 0.12×) and `realistic-graph-cold-resolve` 2.43×; it still wins the cold collections (0.20× and 0.63×),
  `boot-decorated-*` (0.77×), the class-cold graph (0.82×), `create-child-empty` (0.83×) and the missing-binding throw
  (0.67×).
- **Brandi 5 — 28 of 29, 14.8× median**, 35× on transient micro and 53×† on the resolved-factory graph; loses only the
  missing-binding throw.
- **Against ditox codefast wins more rows than it loses (24 to 17) and both aggregates (1.12× median, 1.39× geomean,
  from 0.72× and 0.66×).** The warm work — `transient-class-1-dep` 7.45×†, `realistic-graph-resolved-root` 4.93×†,
  `resolve-optional-miss` 4.46×†, `realistic-graph-class-resolve-root` 3.33×, `realistic-graph-resolve-root` 1.66×,
  every `child-depth` row 4.09–25.4×† — and the cold and per-request work: `fresh-child-default-n1` 1.87×,
  `container-create-empty` 1.58×, `scoped-binding-per-child` 1.34×, `child-request-lifecycle-create-resolve-dispose`
  1.33×, `create-child-empty` 1.29×, `production-unit-of-work` 1.13×, `module-cold-from-modules` 1.12×,
  `production-http-handler` 1.03×, `realistic-graph-cold-resolve` 1.00×; the stable collections are at parity (0.95× and
  0.97×, from 0.24× and 0.03×). It still loses every row that binds many things (`bind-128-plain` 0.43×, the two
  100-singleton lifecycle rows 0.40–0.41×, the class-cold graph 0.52×), the cold collections (0.47–0.69×), the
  missing-binding throw and the warm singleton reads above the ceiling.
- **Against injection-js the geomean is 1.38× and the median 1.34×** (from 0.70× and 0.99×; 21 wins, 2 parity, 8
  losses). The warm rows are wins (`realistic-graph-resolved-root` 3.96×†, `realistic-graph-class-resolve-root` 2.89×,
  `singleton-class-1-dep` 2.40×†, `realistic-graph-resolve-root` 1.34×), so is registration (`bind-128-plain` 2.22×,
  `realistic-graph-cold-resolve` 2.11×, `boot-decorated-*` 1.65×, the class-cold graph 1.59×) and so are the stable
  collections now (1.32× and 1.03×, from 0.28× and 0.04×); the losses are the cold collections (0.53× and 0.89×), the
  two empty-container rows above the ceiling, `async-init-single-hop` 0.88× and the missing-binding throw 0.93×.
- **The selection axes are flat where they should be.** `named-resolve-slots-1/64` read 3.12× inversify at both ends and
  `tagged-resolve-slots-1/64` 4.53× and 4.55× with no trend across N: both lanes are indexed, and the axis proves it.
- **What this round moved, against the baseline.** `resolve-all-strategies-100` 29×, `slot-tag-miss-optional` 16×,
  `slot-name-and-tag` 11×, `resolve-all-cold-10` 10×, `bind-128-plain` 8.5×, `resolve-all-cold-100` 6.0×,
  `rebind-hot-swap` 5.3×, `rebind-parent-resolve-child-depth-3` 4.4×, `boot-decorated-container-build-and-resolve` 4.1×,
  `module-cold-from-modules` 4.1×, `production-event-bus-dispatch` 3.9×, `container-create-empty` 3.8×,
  `resolve-all-strategies-10` 3.7×, `realistic-graph-class-cold-resolve` 3.4×, `multi-tag-slot-resolve` 3.2×,
  `materialize-100-singletons` 3.1×, `module-load-unload` 2.8×, `realistic-graph-cold-resolve` 2.8×, `bind-128-refined`
  2.8×, `production-http-handler` 2.7×, `has-own-unbound-check` 2.7×, `create-child-empty` 2.7×,
  `child-request-lifecycle-create-resolve-dispose` 2.7×, `unbind-all-100-singletons` 2.6×, `slot-injected-tag-compiled`
  2.6×, `lifecycle-pre-destroy-unbind` 2.5×, `realistic-graph-resolved-root` 2.5×, `resolve-optional-miss` 2.4×,
  `production-unit-of-work` 2.4×, the `fresh-child-*-n1` rows 2.2–2.4×, `plan-class-chain-24` 2.3×, `plan-deps-inlined`
  2.3×, `slot-injected-name-compiled` 2.3×, `initialize-async-warmup` 2.1×, the `fresh-child-*-n4` rows 2.0–2.1×,
  `realistic-graph-class-resolve-root` 1.9×, `scoped-binding-per-child` 1.8×, `inspect-snapshot` 1.7×,
  `resolve-optional-hit` 1.7×, `child-depth-8-resolve` 1.6×, `accessor-injection-construct` 1.4×, `resolve-all-async-8`
  1.4× — 64 of 126 rows more than 10% faster, with the warm resolve rows (`constant-resolve` 1.02×,
  `singleton-class-1-dep` 1.00×, `transient-class-1-dep` 1.09×, `realistic-graph-resolve-root` 1.00×) at parity, which
  is what every step's paired check was gated on.

## Geomean by group

Geomean of the ratios in each group, comparable row count in parentheses. Read a group, not a cell.

| Group          | InversifyJS 8 | Awilix 13 | tsyringe 4 |  Brandi 5 |   Ditox 3 | injection-js 2 |
| -------------- | ------------: | --------: | ---------: | --------: | --------: | -------------: |
| micro          |    2.97× (22) | 5.22× (8) |  12.3× (7) | 19.1× (8) | 1.62× (7) |      1.55× (9) |
| realistic      |     5.75× (5) | 5.56× (4) |  3.49× (4) | 14.4× (5) | 1.70× (5) |      2.20× (5) |
| fan-out        |     5.54× (9) | 2.18× (1) |  2.35× (5) | 11.0× (1) | 0.92× (5) |      0.89× (4) |
| async          |    1.40× (10) | 1.07× (1) |  1.17× (1) | 2.17× (1) | 0.96× (1) |      0.88× (1) |
| lifecycle      |     9.95× (8) | 3.49× (5) |  2.41× (4) |         — | 0.46× (5) |              — |
| scope          |    11.8× (12) | 5.92× (8) |  6.68× (8) | 14.5× (5) | 4.20× (8) |      1.67× (4) |
| scale          |     2.02× (2) | 10.7× (2) |  4.85× (2) | 8.44× (2) | 1.38× (2) |              — |
| boot           |     21.6× (7) | 12.9× (3) |  0.92× (4) | 5.09× (4) | 0.99× (4) |      1.12× (4) |
| failure        |     1.57× (2) | 2.21× (1) |  0.67× (1) | 0.73× (1) | 0.72× (1) |      0.93× (1) |
| production     |     16.6× (3) | 6.38× (2) |  3.95× (3) |         — | 0.96× (3) |      1.36× (1) |
| introspection  |     6.20× (2) | 1.16× (1) |  4.29× (2) |         — | 1.50× (1) |              — |
| slot-selection |     3.53× (6) |         — |          — |         — |         — |              — |
| resolution     |     1.04× (3) | 3.10× (2) |  5.67× (2) | 16.5× (2) | 1.49× (2) |      0.93× (2) |

The `boot` group against tsyringe, ditox and injection-js (0.92×, 0.99×, 1.12×) is the registration deficit in one
number, from 0.22–0.27× at the baseline: at the group level it is closed, and what remains of it is the single
`bind-128-plain` row against ditox and the class-cold graph. The `fan-out` group against tsyringe went from 0.37× to
2.35× and against ditox and injection-js from 0.16× and 0.10× to 0.92× and 0.89×: the stable-set collection rows hand
out their memoized list and the cold pair is `many()` members now, and only the cold pair still loses. `production`
against ditox (0.96×, from 0.34×) and injection-js (1.36×, from 0.30×) is the per-request child rows. `lifecycle`
against ditox (0.46×) is the two 100-singleton rows, the registration deficit again. `slot-selection` against inversify
(3.53×, from 2.12× one pass earlier) is the two lanes that stopped scanning. `realistic` against inversify (5.75×) and
against every rival is the generated plans. `async` against ditox and injection-js (0.96×, 0.88×) is
`async-init-single-hop`, the one async row that is not a win. `resolution` against inversify stays at 1.04×, the
accessor row against the plan rows. `failure` against inversify stays at 1.57× because `alias-cycle-detected` is
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
| constant-resolve                               | micro          |  1000 |       143,373,817‡ |          2.15×†‡ |      3.78×†‡ |       9.55×†‡ |     24.8×†‡ |    0.79×†‡ |           1.14×†‡ |
| singleton-class-1-dep                          | micro          |   200 |       122,075,433‡ |          2.49×†‡ |      3.13×†‡ |       9.20×†‡ |     23.7×†‡ |    0.71×†‡ |           2.40×†‡ |
| transient-class-1-dep                          | micro          |   200 |         74,485,513 |          2.03×†‡ |       8.57×† |        15.3×† |      35.2×† |     7.45×† |                 — |
| named-constant-get                             | micro          |   500 |        78,956,783‡ |          3.03×†‡ |            — |             — |           — |          — |                 — |
| named-resolve-slots-1                          | micro          |   500 |        83,741,404‡ |          3.12×†‡ |            — |             — |           — |          — |                 — |
| named-resolve-slots-4                          | micro          |   500 |        83,281,246‡ |          3.14×†‡ |            — |             — |           — |          — |                 — |
| named-resolve-slots-16                         | micro          |   500 |        83,071,689‡ |          3.12×†‡ |            — |             — |           — |          — |                 — |
| named-resolve-slots-64                         | micro          |   500 |        83,575,063‡ |          3.12×†‡ |            — |             — |           — |          — |                 — |
| optional-missing-transient                     | micro          |   200 |        35,473,481‡ |          1.09×†‡ |            — |             — |     9.77×†‡ |    2.79×†‡ |                 — |
| realistic-graph-resolve-root                   | realistic      |    20 |         18,510,601 |            2.64× |        2.70× |         8.61× |       18.0× |      1.66× |            1.34×‡ |
| realistic-graph-cold-resolve                   | realistic      |     1 |           265,664‡ |           11.1×‡ |       4.27×‡ |        2.43×‡ |      5.20×‡ |     1.00×‡ |            2.11×‡ |
| realistic-graph-resolved-root                  | realistic      |    20 |         55,157,999 |           3.72×† |            — |             — |      52.7×† |     4.93×† |           3.96×†‡ |
| realistic-graph-class-resolve-root             | realistic      |    20 |         27,439,019 |            2.59× |        5.69× |         8.71× |       27.2× |      3.33× |            2.89×‡ |
| realistic-graph-class-cold-resolve             | realistic      |     1 |           342,247‡ |           22.5×‡ |       14.6×‡ |        0.82×‡ |      4.59×‡ |     0.52×‡ |            1.59×‡ |
| realistic-graph-validate                       | realistic      |    10 |         18,071,377 |                — |            — |             — |           — |          — |                 — |
| fan-out-tree-depth-3-breadth-4                 | fan-out        |    20 |          1,926,057 |            1.69× |        2.18× |         4.14× |       11.0× |      2.24× |                 — |
| resolve-all-strategies-10                      | fan-out        |     1 |         26,951,175 |            8.52× |            — |         3.88× |           — |      0.95× |            1.32×‡ |
| resolve-all-strategies-100                     | fan-out        |     1 |         26,880,517 |            65.8× |            — |        36.1×‡ |           — |      0.97× |             1.03× |
| resolve-all-cold-10                            | fan-out        |     1 |          1,315,409 |           25.6×‡ |            — |         0.63× |           — |      0.69× |            0.89×‡ |
| resolve-all-cold-100                           | fan-out        |     1 |             70,009 |           8.71×‡ |            — |        0.20×‡ |           — |      0.47× |             0.53× |
| resolve-all-named-8                            | fan-out        |     1 |        17,455,341‡ |           2.17×‡ |            — |             — |           — |          — |                 — |
| resolve-all-named-16                           | fan-out        |     1 |        18,375,842‡ |           2.34×‡ |            — |             — |           — |          — |                 — |
| resolve-all-named-32                           | fan-out        |     1 |        17,136,869‡ |           2.21×‡ |            — |             — |           — |          — |                 — |
| resolve-all-named-64                           | fan-out        |     1 |        16,585,585‡ |           2.07×‡ |            — |             — |           — |          — |                 — |
| resolve-async-single-hop                       | async          |     1 |          9,535,364 |            1.36× |            — |             — |           — |          — |                 — |
| async-init-single-hop                          | async          |     1 |          4,316,059 |            1.30× |        1.07× |        1.17×‡ |       2.17× |     0.96×‡ |             0.88× |
| dynamic-async-chain-8                          | async          |     1 |          2,178,605 |            1.54× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-8                      | async          |     1 |          1,070,083 |            1.61× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-16                     | async          |     1 |            544,468 |            1.67× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-32                     | async          |     1 |            262,352 |            1.62× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-64                     | async          |     1 |            138,696 |            1.81× |            — |             — |           — |          — |                 — |
| async-branch-chain-8                           | async          |     1 |            489,816 |                — |            — |             — |           — |          — |                 — |
| async-branch-escape-mid-chain-8                | async          |     1 |            805,877 |                — |            — |             — |           — |          — |                 — |
| async-diamond-shared-leaf                      | async          |     1 |          1,980,758 |            1.41× |            — |             — |           — |          — |                 — |
| plan-async-resolved-chain-8                    | async          |     1 |          1,009,239 |                — |            — |             — |           — |          — |                 — |
| plan-async-class-chain-8                       | async          |     1 |         2,751,552‡ |                — |            — |             — |           — |          — |                 — |
| resolve-all-async-8                            | async          |     1 |           572,633‡ |           0.61×‡ |            — |             — |           — |          — |                 — |
| resolve-optional-async-miss                    | async          |     1 |          9,293,250 |            1.61× |            — |             — |           — |          — |                 — |
| lifecycle-post-construct-singleton             | lifecycle      |   250 |       122,936,700‡ |          2.44×†‡ |            — |             — |           — |          — |                 — |
| lifecycle-pre-destroy-unbind                   | lifecycle      |     1 |         2,059,647‡ |           23.3×‡ |       5.30×‡ |        1.78×‡ |           — |     0.81×‡ |                 — |
| binding-level-activation-hook                  | lifecycle      |   200 |        51,117,173‡ |          1.96×†‡ |            — |             — |           — |          — |                 — |
| child-depth-1-resolve                          | scope          |   500 |         92,184,981 |           1.46×† |       3.77×† |        7.05×† |      16.8×† |     4.09×† |           1.23×†‡ |
| child-depth-2-resolve                          | scope          |   500 |         91,939,578 |          1.42×†‡ |       4.66×† |        8.06×† |      17.8×† |     7.31×† |           1.42×†‡ |
| child-depth-4-resolve                          | scope          |   500 |         92,557,793 |          1.42×†‡ |       6.99×† |        10.8×† |      19.8×† |     15.3×† |           1.76×†‡ |
| child-depth-8-resolve                          | scope          |   500 |         92,325,995 |          1.46×†‡ |       12.4×† |        15.3×† |      23.8×† |     25.4×† |           2.55×†‡ |
| child-request-lifecycle-create-resolve-dispose | scope          |   100 |          2,302,108 |            41.0× |       9.21×‡ |        4.37×‡ |           — |      1.33× |                 — |
| fresh-child-default-n1                         | scope          |   100 |         10,244,698 |           35.0×‡ |       6.50×‡ |         7.01× |           — |      1.87× |                 — |
| fresh-child-default-n4                         | scope          |   100 |          7,492,822 |           26.2×‡ |       5.67×‡ |         7.40× |           — |      2.49× |                 — |
| fresh-child-name-n1                            | scope          |   100 |          9,981,812 |           36.8×‡ |            — |             — |           — |          — |                 — |
| fresh-child-name-n4                            | scope          |   100 |          6,877,718 |           25.7×‡ |            — |             — |           — |          — |                 — |
| fresh-child-tag-n1                             | scope          |   100 |          9,556,126 |           37.2×‡ |            — |             — |           — |          — |                 — |
| fresh-child-tag-n4                             | scope          |   100 |          7,133,274 |           28.5×‡ |            — |             — |           — |          — |                 — |
| scale-mid-transient-chain-32                   | scale          |     1 |          1,325,879 |            2.44× |        4.46× |        6.20×‡ |      9.43×‡ |      1.45× |                 — |
| scale-deep-transient-chain-512                 | scale          |     1 |             56,907 |            1.67× |        25.8× |         3.80× |       7.54× |      1.31× |                 — |
| boot-decorated-container-build-and-resolve     | boot           |     1 |            504,308 |           16.6×‡ |            — |         0.77× |           — |          — |            1.65×‡ |
| container-create-empty                         | boot           |   100 |        26,109,659‡ |           36.7×‡ |       8.84×‡ |        1.10×‡ |      7.30×‡ |     1.58×‡ |           0.82×†‡ |
| create-child-empty                             | boot           |   100 |         18,365,091 |           35.9×‡ |        6.68× |         0.83× |       5.17× |      1.29× |           0.53×†‡ |
| bind-128-plain                                 | boot           |     1 |            188,546 |           32.1×‡ |       36.5×‡ |         1.01× |       9.89× |      0.43× |             2.22× |
| bind-128-refined                               | boot           |     1 |             28,108 |           4.87×‡ |            — |             — |           — |          — |                 — |
| misconfigured-missing-binding                  | failure        |     1 |           282,947‡ |           1.72×‡ |       2.21×‡ |        0.67×‡ |      0.73×‡ |     0.72×‡ |            0.93×‡ |
| circular-dependency-3                          | failure        |     1 |            155,917 |           172.2× |       1.48×‡ |             — |           — |          — |             0.47× |
| ambiguous-multi-binding                        | failure        |     1 |           221,155‡ |           1.43×‡ |            — |             — |           — |          — |                 — |
| production-http-handler                        | production     |    50 |          1,594,276 |           25.2×‡ |       6.74×‡ |        3.44×‡ |           — |      1.03× |                 — |
| production-unit-of-work                        | production     |   100 |            978,281 |            15.5× |       6.03×‡ |        2.35×‡ |           — |      1.13× |                 — |
| production-event-bus-dispatch                  | production     |   100 |        47,641,310‡ |          11.8×†‡ |            — |       7.62×†‡ |           — |    0.77×†‡ |           1.36×†‡ |
| to-resolved-3-deps                             | micro          |   200 |       121,868,174‡ |          2.44×†‡ |            — |             — |     23.9×†‡ |    0.72×†‡ |           1.88×†‡ |
| to-alias-redirect                              | micro          |   500 |         86,777,224 |           1.69×† |       4.88×† |        13.3×† |           — |          — |           0.99×†‡ |
| to-self-binding                                | micro          |   300 |       118,704,966‡ |          2.37×†‡ |            — |       7.41×†‡ |           — |          — |           2.29×†‡ |
| alias-chain-3                                  | micro          |   500 |         85,630,754 |           3.42×† |       11.1×† |        22.4×† |           — |          — |           1.07×†‡ |
| alias-parent-owned-terminal                    | micro          |   500 |         85,675,926 |           1.66×† |       5.67×† |        13.9×† |           — |          — |           0.96×†‡ |
| alias-cycle-detected                           | failure        |     1 |           258,679‡ |          728.5×‡ |       2.48×‡ |             — |           — |          — |            0.83×‡ |
| resolve-optional-hit                           | micro          |   500 |       143,434,801‡ |          4.65×†‡ |      4.00×†‡ |             — |     24.5×†‡ |    0.78×†‡ |           1.63×†‡ |
| resolve-optional-miss                          | micro          |   500 |        233,180,989 |           7.46×† |       4.44×† |             — |     6.02×†‡ |     4.46×† |           2.64×†‡ |
| tagged-binding-resolve                         | micro          |   300 |        86,789,890‡ |          4.13×†‡ |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-1                         | micro          |   300 |        93,089,700‡ |          4.53×†‡ |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-4                         | micro          |   300 |        94,221,296‡ |          4.60×†‡ |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-16                        | micro          |   300 |        93,303,748‡ |          4.53×†‡ |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-64                        | micro          |   300 |        93,151,629‡ |          4.55×†‡ |            — |             — |           — |          — |                 — |
| conditional-injection-tagged                   | micro          |   300 |         59,659,972 |           2.13×† |            — |             — |      24.6×† |          — |                 — |
| rebind-hot-swap                                | lifecycle      |    50 |         12,493,986 |           35.4×‡ |        0.97× |             — |           — |     0.15×† |                 — |
| has-bound-check                                | introspection  |  1000 |        317,539,518 |           5.78×† |       1.16×† |        3.10×† |           — |     1.50×† |                 — |
| has-own-unbound-check                          | introspection  |  1000 |       621,836,216‡ |          6.64×†‡ |            — |       5.92×†‡ |           — |          — |                 — |
| container-level-activation-hook                | lifecycle      |   200 |        51,354,777‡ |          1.97×†‡ |            — |       5.34×†‡ |           — |          — |                 — |
| scoped-binding-per-child                       | scope          |   100 |          5,487,632 |           47.3×‡ |       2.91×‡ |         1.87× |       4.55× |      1.34× |                 — |
| rebind-parent-resolve-child-depth-3            | lifecycle      |    50 |          8,930,836 |            55.0× |        1.00× |             — |           — |      1.06× |                 — |
| materialize-100-singletons                     | lifecycle      |     1 |            55,829‡ |           16.1×‡ |       10.9×‡ |        2.18×‡ |           — |     0.41×‡ |                 — |
| unbind-all-100-singletons                      | lifecycle      |     1 |            40,902‡ |           14.0×‡ |       9.22×‡ |        1.62×‡ |           — |     0.40×‡ |                 — |
| module-load-unload                             | boot           |     1 |            945,092 |           21.2×‡ |            — |             — |           — |          — |                 — |
| module-cold-from-modules                       | boot           |     1 |          1,651,166 |           30.6×‡ |            — |             — |       1.80× |      1.12× |                 — |
| initialize-async-warmup                        | boot           |     1 |            415,217 |                — |            — |             — |           — |          — |                 — |
| inspect-snapshot                               | introspection  |    20 |          9,091,366 |                — |            — |             — |           — |          — |                 — |
| lookup-bindings                                | introspection  |   200 |         23,655,460 |                — |            — |             — |           — |          — |                 — |
| generate-dependency-graph                      | introspection  |    10 |            742,716 |                — |            — |             — |           — |          — |                 — |
| multi-tag-slot-resolve                         | micro          |   300 |         13,476,996 |                — |            — |             — |           — |          — |                 — |
| multi-tag-constraint-resolve                   | micro          |   200 |          3,511,510 |                — |            — |             — |           — |          — |                 — |
| multi-tag-select-32                            | micro          |   300 |          3,322,278 |                — |            — |             — |           — |          — |                 — |
| mask-reject-wide-catalog                       | slot-selection |   300 |         46,438,481 |                — |            — |             — |           — |          — |                 — |
| mask-accept-two-of-four                        | slot-selection |   300 |         18,861,284 |                — |            — |             — |           — |          — |                 — |
| mask-collision-same-bit                        | slot-selection |   300 |         52,650,001 |                — |            — |             — |           — |          — |                 — |
| slot-tag-array-hoisted                         | slot-selection |   300 |        86,055,445‡ |                — |            — |             — |           — |          — |                 — |
| slot-tag-shorthand-hoisted                     | slot-selection |   300 |        90,058,596‡ |                — |            — |             — |           — |          — |                 — |
| slot-tag-array-inline                          | slot-selection |   300 |        64,307,855‡ |                — |            — |             — |           — |          — |                 — |
| slot-tag-shorthand-inline                      | slot-selection |   300 |        74,876,313‡ |                — |            — |             — |           — |          — |                 — |
| slot-tag-zero-value                            | slot-selection |   300 |        86,487,352‡ |          4.17×†‡ |            — |             — |           — |          — |                 — |
| slot-name-and-tag                              | slot-selection |   300 |         40,566,873 |           2.10×† |            — |             — |           — |          — |                 — |
| slot-tag-resolve-all                           | slot-selection |   300 |         48,953,325 |           4.14×† |            — |             — |           — |          — |                 — |
| slot-tag-miss-optional                         | slot-selection |   300 |         84,976,050 |           3.58×† |            — |             — |           — |          — |                 — |
| slot-tag-parent-owned                          | slot-selection |   300 |        86,449,985‡ |          4.15×†‡ |            — |             — |           — |          — |                 — |
| slot-name-parent-owned                         | slot-selection |   300 |        82,262,311‡ |          3.59×†‡ |            — |             — |           — |          — |                 — |
| slot-injected-name-compiled                    | slot-selection |   300 |         51,185,508 |                — |            — |             — |           — |          — |                 — |
| slot-injected-name-interpreted                 | slot-selection |   300 |          3,997,711 |                — |            — |             — |           — |          — |                 — |
| slot-injected-tag-compiled                     | slot-selection |   300 |         57,635,623 |                — |            — |             — |           — |          — |                 — |
| slot-injected-tag-interpreted                  | slot-selection |   300 |          4,149,696 |                — |            — |             — |           — |          — |                 — |
| plan-deps-inlined                              | resolution     |   300 |         49,399,678 |                — |            — |             — |           — |          — |                 — |
| plan-escape-factory-dep                        | resolution     |   300 |          7,474,726 |                — |            — |             — |           — |          — |                 — |
| plan-escape-scoped-dep                         | resolution     |   300 |         10,114,341 |                — |            — |             — |           — |          — |                 — |
| plan-escape-hooked-dep                         | resolution     |   300 |          2,817,874 |                — |            — |             — |           — |          — |                 — |
| plan-escape-optional-dep                       | resolution     |   300 |          3,293,830 |                — |            — |             — |           — |          — |                 — |
| plan-escape-multi-dep                          | resolution     |   300 |            957,738 |                — |            — |             — |           — |          — |                 — |
| plan-class-chain-24                            | resolution     |     1 |         3,879,340‡ |                — |            — |             — |           — |          — |                 — |
| plan-class-chain-40                            | resolution     |     1 |            523,185 |                — |            — |             — |           — |          — |                 — |
| interpreted-class-chain-24                     | resolution     |     1 |            301,144 |                — |            — |             — |           — |          — |                 — |
| interpreted-class-chain-40                     | resolution     |     1 |            150,946 |                — |            — |             — |           — |          — |                 — |
| nested-context-resolve-in-factory              | resolution     |   300 |        44,275,322‡ |          1.83×†‡ |      3.77×†‡ |       6.57×†‡ |     18.3×†‡ |    2.21×†‡ |           0.97×†‡ |
| nested-container-resolve-in-factory            | resolution     |   300 |        35,883,101‡ |          1.50×†‡ |      2.55×†‡ |       4.89×†‡ |     14.8×†‡ |    1.01×†‡ |           0.88×†‡ |
| accessor-injection-construct                   | resolution     |   300 |          8,830,457 |            0.41× |            — |             — |           — |          — |                 — |

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
change's `src` files per side, `BENCH_LIBRARY=@codefast/di` and `BENCH_ONLY` the target rows plus warm canaries, a
`BENCH_MODE=fast` gate first and one full pass per side only when it wins, and read the per-trial spread, not one ratio.
`BENCH_TIER=contract` runs the comparison without the 25 engine rows; `pnpm bench:list` prints which rows each library
implements and confirms there is no row a library's features allow that nobody wrote.
