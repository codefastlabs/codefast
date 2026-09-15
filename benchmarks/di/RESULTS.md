# Results

Where `@codefast/di` actually stands against the field right now, wins and losses given equal weight — the point of this
page is to know where the engine is slower so the next change knows what to aim at. One machine-derived snapshot, no
accreted ledger. The method is in [`BENCH_GUIDE.md`](./BENCH_GUIDE.md); re-run it with the recipe at the bottom.

**This is one full-profile pass, so read the aggregates, not the rows.** GC-exposed, one subprocess per scenario,
libraries interleaved with rotating order, 3 trials each — a single pass measures no between-run variance of its own,
200 of the comparable cells carry a per-trial IQR above 5%, and 124 rows sit above ~30M ops/s where the ratio moves
between runs of the same build whatever its IQR says. Ratios are worth more than the absolute `hz/op`; a single row is
worth less than the group it sits in. A loss highlighted below points at a direction — quote a precise factor only after
a paired re-run, except where a loss is a structural O(N) difference that reproduces by construction (called out as
such).

**This run reads against the pinned baseline.** Its id is `2026-09-14T23-41-04-932Z`, over the tree at `3db3447bf`; the
baseline it is compared to is `2026-09-13T04-45-37-460Z`, the last pass over the engine before the rewrite began, whose
observations are tracked under `baselines/` and pinned by `pnpm bench:baseline`. Every `Δ` on this page is that
comparison. The suite is unchanged between the two: 126 rows, 101 contract rows specified against the public API, 25
engine rows that name a lane of the resolver and enter no cross-library figure; every library implements every row its
declared features allow, so a `—` below is a feature the library lacks, never a row nobody wrote.

**Environment.** `@codefast/di` 0.9.0 from a `dist` the harness rebuilt first, on Node 26.1.0 / V8 14.6, Apple M3 Max ×
14, darwin/arm64, `--expose-gc` for every library. inversify 8.2.3 · awilix 13.0.5 · tsyringe 4.10.0 · brandi 5.1.0 ·
ditox 3.3.0 · injection-js 2.6.1. Each library runs at its canonical decorator mode (inversify legacy decorators +
`reflect-metadata`, codefast TC39 Stage 3 + `Symbol.metadata`); every inversify container uses `{ jitless: false }`, its
fastest documented configuration. Run 2026-09-14, 20m22s wall.

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
- **Last-wins displacement in a record is answered by index, not a list walk.** A record indexed its tagged slots but
  not the default one, so registering a binding walked the token's whole list to find the slot it displaces; building an
  _N_-member collection member by member was quadratic. The default slot now has an index entry beside the tagged ones,
  so an add finds its occupant directly and per-bind cost stays flat — the `resolve-all-cold` and
  `resolve-all-strategies` rows carry it.

## Summary — where we stand

Ratios are `@codefast/di ÷ competitor`; above 1× means codefast is faster. Win `>1.03×`, parity `0.97–1.03×`, loss
`<0.97×`. `Comparable` counts the rows both libraries ran, of 112 aggregate-eligible rows codefast measures; `†` is how
many of those the median and geomean carry from above the throughput ceiling — they stay in the aggregate but no reader
should cite one alone.

| Competitor     | Comparable | Win / parity / loss | Median | Geomean |   † |
| -------------- | ---------: | ------------------: | -----: | ------: | --: |
| InversifyJS 8  |  91 of 112 |          89 / 0 / 2 |  3.23× |   4.91× |  41 |
| Awilix 13      |  38 of 112 |          36 / 0 / 2 |  4.97× |   4.79× |  15 |
| tsyringe 4     |  43 of 112 |          36 / 1 / 6 |  4.61× |   3.83× |  17 |
| Brandi 5       |  29 of 112 |          28 / 0 / 1 |  14.4× |   10.9× |  15 |
| Ditox 3        |  44 of 112 |         23 / 7 / 14 |  1.06× |   1.39× |  17 |
| injection-js 2 |  31 of 112 |          23 / 1 / 7 |  1.49× |   1.43× |  19 |

**The headline, stated plainly: codefast sweeps inversify, awilix and brandi, wins tsyringe on the median by 4.6× while
still losing it six rows, and holds the wins against the two libraries it started this round losing to — ditox on the
median (1.06×, from 0.72× at the baseline) and the geomean (1.39×, from 0.66×) while still losing it 14 of 44 rows,
injection-js on both (1.49× and 1.43×, from 0.99× and 0.70×) while losing it 7 of 31.** Against the baseline, 58 of
codefast's 126 rows are more than 10% faster and 45 read as improved beyond noise; the rows that read down beyond noise
are named below, each with what a paired re-measure says. Inversify is down to two rows: the accessor lane and the async
collection. The two selection lanes no index served — a name beside a tag, a tagged request matching nothing — are wins,
and the stable-set collections that were ditox's are at parity. Every remaining loss is one of the same shapes —
**registration**, **cold collections**, **rebind**, the **accessor lane** — and where codefast wins it still wins on the
warm resolve, which is what a request pays after the container is built; this round moved the price of building a
container, of binding into it, of collecting from it, of running a plan among other plans, and of asking for a slot the
indexes had to scan for.

## The losses, foregrounded — where to improve

Ordered by how much they matter, each marked as a **real deficit** (same work, codefast slower) or a **work difference**
(codefast does more per op by design, so the row is a design cost to reconsider, not a bug). Where the baseline is
quoted, it is the same row in `2026-09-13T04-45-37-460Z`.

- **Registration is still the biggest deficit, and it is a ditox-only one.** `bind-128-plain` — 128 transient factory
  bindings into a fresh container, no resolve — runs at 0.42× ditox, 1.02× tsyringe and 2.21× injection-js, from 0.05×,
  0.12× and 0.28×: the row is 8.3× faster than the baseline, because the fluent chain is now the binding it registers
  (one allocation per bind, a numeric id, one map write). Everything that binds before it resolves moved with it —
  `container-create-empty` 1.09× tsyringe and 1.57× ditox (from 0.30× and 0.45×), `create-child-empty` 0.83× and 1.27×
  (from 0.36× and 0.48×), `realistic-graph-cold-resolve` 0.98× ditox and 2.47× tsyringe (from 0.37× and 0.90×),
  `realistic-graph-class-cold-resolve` 0.49× ditox, 0.76× tsyringe and 1.55× injection-js (from 0.16×, 0.24× and 0.49×),
  `boot-decorated-container-build-and-resolve` 0.75× tsyringe and 1.62× injection-js (from 0.19× and 0.41×),
  `module-cold-from-modules` 1.05× ditox and 1.68× brandi (from 0.27× and 0.42×). The two empty-container rows still
  lose injection-js above the ceiling (0.82×† and 0.51×†). What the registration path still pays is the binding object
  with every kind's fields on one hidden class, and the registry write; ditox's `bindFactory` is a map write and a
  closure. Making a child's scope and lifecycle managers lazy was measured and rejected: the warm interpreted lanes lost
  more than the empty-child rows gained. **Real deficit, structural** — one object per binding is the design.
- **The cold collection loses only tsyringe now; the rest are parity or wins.** `resolve-all-cold-N` builds a fresh
  container and reads the collection once: at N=100, 0.62× tsyringe, but ditox 1.29× and injection-js 1.46× are wins now
  (from 0.08× and 0.09×), and at N=10, 0.46× tsyringe, 0.76× ditox and 1.04× injection-js — ten to fifteen times the
  baseline, because a hundred `many()` members on one token append to one list, evaluate no predicate, and a member no
  longer walks the list to find who it displaces. The stable rows: `resolve-all-strategies-100` reads 20.8× tsyringe,
  0.95× ditox and 1.11× injection-js (from 1.29×, 0.03× and 0.04×), `resolve-all-strategies-10` 3.75×, 1.00× and 1.09×
  (from 0.97×, 0.24× and 0.28×), because a root-level read with no options hands out its memoized list itself — the same
  read-only array on every call while the chain is unchanged — which is what ditox's `bindMultiValue` does. What the
  cold pair still pays against tsyringe is the registration above. **Real deficit against tsyringe on the cold pair, a
  registration cost seen from the collection side.**
- **Teardown at scale is a registration loss wearing a lifecycle label.** `materialize-100-singletons` (bind and resolve
  100 singletons, no teardown) is 0.35× ditox and 1.88× tsyringe; `unbind-all-100-singletons` (the same, then dispose)
  is 0.35× and 1.50×. The two ratios against ditox are the same, so the teardown walk costs nothing the rivals do not
  pay — the loss is the 100 bindings above. `lifecycle-pre-destroy-unbind` (one singleton, one hook) at 0.82× ditox and
  1.69× tsyringe is the same story at N=1. **Work difference on the hook, real deficit on the registration underneath.**
- **Rebind is a small loss against awilix and still slow against ditox.** `rebind-hot-swap` 0.89× awilix (from 0.18×)
  and 0.14×† ditox; `rebind-parent-resolve-child-depth-3` 0.89× awilix and 1.07× ditox (from 0.24× and 0.29×). Both rows
  are four to five times their baseline; the shape is unchanged: a rebind unbinds, re-registers and bumps the chain's
  version. An in-place rebind was weighed and left: it would save the new binding object but keep the map writes, for a
  row that sits near parity with awilix and above the ceiling against ditox. **Work difference.**
- **`accessor-injection-construct` 0.42× inversify, from 0.30×.** A class with one `@inject` accessor compiles as a plan
  root and its plan is generated like any other; what it still pays is the ambient scope around construction and the
  accessor's own `resolve` through the container, where inversify's property injection is a metadata read on the same
  plan. **Work difference**, and the row that says what property injection costs relative to constructor injection.
- **`resolve-all-async-8` 0.58× inversify, from 0.45×.** Every member takes the non-`async` factory lane a single
  `resolveAsync` takes; what remains is the branch array, the level context and the promise each member needs against
  inversify's plain `Promise.all` — skipping the dispatch in front of them was measured and read as no change. **Real
  deficit** on a row that is otherwise codefast's own territory (every other async row is a win).
- **Per-request child work against ditox is a win now.** `production-http-handler` 1.00× (from 0.42×),
  `production-unit-of-work` 1.01× (from 0.48×), `child-request-lifecycle-create-resolve-dispose` 1.34× (from 0.53×),
  `scoped-binding-per-child` 1.35×, `fresh-child-default-n1` 1.84×; `production-event-bus-dispatch` sits at 0.83×†,
  above the ceiling now that a dispatch is one lookup and a loop. Every one is a registration into a fresh child, so
  what is left of the first bullet seen from the request side.
- **Warm singleton reads: 0.79×† and 0.71×† ditox on `constant-resolve` and `singleton-class-1-dep`**, unchanged, and
  the same shape on `to-resolved-3-deps` 0.71×† and `resolve-optional-hit` 0.78×†. ditox's `get` is close to a map read;
  codefast still carries its binding and lifecycle shape on every resolve. All four rows sit above 120M ops/s, inside
  the band that stops reproducing between runs. **Real deficit, ceiling-bound.**
- **Failing fast costs more here: `misconfigured-missing-binding` 0.63× tsyringe, 0.69× ditox, 0.68× brandi, 0.86×
  injection-js**, unchanged in shape. codefast builds a structured error with the resolution path; the rivals throw a
  string. **Work difference** on a path a production request should never take.
- **Rows that read down against the baseline in this pass.** The indexed collections first: `resolve-all-named-16`,
  `-64` and `-8` read 0.78×, 0.89× and 0.83× of their baseline throughput, `-32` 0.80×. The four rows sit at 15–17M
  ops/s, the band this page flags as unstable; across the last passes the same rows have read anywhere from 0.66× to
  1.00× of baseline, and 0.91–0.98× paired and alternating against the pre-rewrite source with overlapping spreads.
  **Open**: a small loss on the indexed collection lane that no pass has yet pinned to a figure, to re-measure before
  the next change to `resolveAll` or the tagged index. Then a cluster of async rows — `async-fanout-concurrent-8`
  (0.88×), `async-diamond-shared-leaf` and `dynamic-async-chain-8` (0.91×), `async-branch-escape-mid-chain-8` (0.94×),
  `plan-async-resolved-chain-8` (0.90×) — and `generate-dependency-graph` (0.90×): the async lane shares no code with
  the generated sync tier and swings between processes run to run, which the ledger already carries as open; this
  registration-path pass touched none of it.

One retraction against the baseline ledger stands. **The parent walk had a slope and no longer does.**
`child-depth-N-resolve` against inversify read 1.42× at depth 1 and 0.94×† at depth 8 at the baseline; it now reads
1.43×† at depth 1 and 1.50×† at depth 8, because the summed chain version a descendant's memo is stamped with is
re-walked only when the process-wide state epoch has moved. Against ditox and awilix the slope still runs the other way
(3.96× → 27.0×, 3.61× → 12.1×). Above the ceiling at every depth, so the flatness is the finding, not any one cell.

## The wins

- **inversify — 89 of 91 comparable rows, 3.23× median, 4.91× geomean.** Widest margins on `failure`'s
  `circular-dependency-3` and `alias-cycle-detected` (both excluded — inversify recurses to the stack limit rather than
  detecting either), then `boot` (22.1× geomean), `production` (17.3×), `scope` (12.5×), `lifecycle` (9.98×),
  `introspection` (6.29×), `fan-out` (6.03×), `realistic` (5.20×), `slot-selection` (3.58×); tightest on `resolution`
  (1.05×, the accessor row) and `async` (1.42×). The two selection lanes it won one pass ago are codefast's:
  `slot-name-and-tag` 2.24×† (from 0.19× at the baseline) through a memoized lookup of the exact two-criterion slot, and
  `slot-tag-miss-optional` 3.25×† (from 0.25×) because a one-criterion index miss is declared a registry miss without a
  scan. Every fresh-child row is 35–38×, every production row 15–27×, `bind-128-plain` 31×, and the `child-depth` axis
  is flat at 1.43–1.50×†.
- **Awilix 13 — 36 of 38, 4.97× median**, up to 12× on the deep child walk and 37× on `bind-128-plain`; loses only the
  two rebind rows (`rebind-hot-swap` and `rebind-parent-resolve-child-depth-3`, both 0.89×).
- **tsyringe 4 — 36 of 43, 4.61× median**, 12.4× on `micro` and 6.74× on `scope`; the stable-set collections that were
  its rows are now codefast's by a wide margin (20.8× at N=100, 3.75× at N=10), `bind-128-plain` is at parity (1.02×,
  from 0.12×) and `realistic-graph-cold-resolve` 2.47×; it still wins the cold collections (0.62× and 0.46×),
  `boot-decorated-*` (0.75×), the class-cold graph (0.76×), `create-child-empty` (0.83×) and the missing-binding throw
  (0.63×).
- **Brandi 5 — 28 of 29, 14.4× median**, 36× on transient micro and 56×† on the resolved-factory graph; loses only the
  missing-binding throw.
- **Against ditox codefast wins more rows than it loses (23 to 14) and both aggregates (1.06× median, 1.39× geomean,
  from 0.72× and 0.66×).** The warm work — `transient-class-1-dep` 7.85×†, `realistic-graph-resolved-root` 5.34×†,
  `resolve-optional-miss` 4.08×†, `realistic-graph-class-resolve-root` 2.09×, `realistic-graph-resolve-root` 1.71×,
  every `child-depth` row 3.96–27.0×† — and the cold and per-request work: `fresh-child-default-n1` 1.84×,
  `container-create-empty` 1.57×, `scoped-binding-per-child` 1.35×, `child-request-lifecycle-create-resolve-dispose`
  1.34×, `resolve-all-cold-100` 1.29×, `create-child-empty` 1.27×, `module-cold-from-modules` 1.05×,
  `production-unit-of-work` 1.01×, `production-http-handler` 1.00×, `realistic-graph-cold-resolve` 0.98×; the stable
  collections are at parity (1.00× and 0.95×, from 0.24× and 0.03×). It still loses every row that binds many things
  (`bind-128-plain` 0.42×, the two 100-singleton lifecycle rows 0.35×, the class-cold graph 0.49×), the cold collection
  at N=10 (0.76×), the missing-binding throw and the warm singleton reads above the ceiling.
- **Against injection-js the geomean is 1.43× and the median 1.49×** (from 0.70× and 0.99×; 23 wins, 1 parity, 7
  losses). The warm rows are wins (`realistic-graph-resolved-root` 4.44×†, `singleton-class-1-dep` 2.74×†,
  `realistic-graph-class-resolve-root` 1.80×, `realistic-graph-resolve-root` 1.26×), so is registration
  (`bind-128-plain` 2.21×, `realistic-graph-cold-resolve` 2.21×, `boot-decorated-*` 1.62×, the class-cold graph 1.55×),
  and so are the collections now (`resolve-all-cold-100` 1.46×, `resolve-all-cold-10` 1.04×, the stable set 1.09× and
  1.11×, from 0.28× and 0.04×); the losses are the two empty-container rows above the ceiling, `async-init-single-hop`
  0.90× and the missing-binding throw 0.86×.
- **The selection axes are flat where they should be.** `named-resolve-slots-1/64` read 3.13× and 3.23× inversify and
  `tagged-resolve-slots-1/64` 4.53× and 4.50× with no trend across N: both lanes are indexed, and the axis proves it.
- **What this round moved, against the baseline.** The widest, all confirmed as improvements beyond noise:
  `resolve-all-strategies-100` 28.5×, `resolve-all-cold-100` 15.8×, `slot-tag-miss-optional` 13×, `resolve-all-cold-10`
  11.3×, `slot-name-and-tag` 11×, `bind-128-plain` 8.3×, `rebind-hot-swap` 4.9×, `production-event-bus-dispatch` 4.1×,
  `boot-decorated-container-build-and-resolve` 3.9×, `module-cold-from-modules` 3.9×,
  `rebind-parent-resolve-child-depth-3` 3.8×, `container-create-empty` 3.7×, `resolve-all-strategies-10` 3.6×,
  `realistic-graph-class-cold-resolve` 3.1×, `multi-tag-slot-resolve` 3.1×, `bind-128-refined` 2.9×,
  `module-load-unload` 2.7×, `realistic-graph-cold-resolve` 2.7×, `child-request-lifecycle-create-resolve-dispose` 2.7×,
  `materialize-100-singletons` 2.6×, `create-child-empty` 2.6×, `lifecycle-pre-destroy-unbind` 2.6×,
  `realistic-graph-resolved-root` 2.6×, `production-http-handler` 2.5×, `plan-class-chain-24` 2.4×,
  `resolve-optional-miss` 2.4×, `unbind-all-100-singletons` 2.3×, `fresh-child-default-n1` 2.3×,
  `production-unit-of-work` 2.2×, `plan-deps-inlined` 2.2×, `scoped-binding-per-child` 1.7×, `inspect-snapshot` 1.7×,
  `resolve-optional-hit` 1.7×, `child-depth-8-resolve` 1.6×, `accessor-injection-construct` 1.4× — 58 of 126 rows more
  than 10% faster, 45 improved beyond noise, with the warm resolve rows (`constant-resolve`, `singleton-class-1-dep`,
  `realistic-graph-resolve-root` all within 1% of baseline, `transient-class-1-dep` 1.10×) at parity, which is what
  every step's paired check was gated on.

## Geomean by group

Geomean of the ratios in each group, comparable row count in parentheses. Read a group, not a cell.

| Group          | InversifyJS 8 | Awilix 13 | tsyringe 4 |  Brandi 5 |   Ditox 3 | injection-js 2 |
| -------------- | ------------: | --------: | ---------: | --------: | --------: | -------------: |
| micro          |    3.02× (22) | 5.31× (8) |  12.4× (7) | 19.5× (8) | 1.61× (7) |      1.61× (9) |
| realistic      |     5.20× (5) | 4.86× (4) |  3.06× (4) | 13.1× (5) | 1.56× (5) |      2.03× (5) |
| fan-out        |     6.03× (9) | 2.04× (1) |  2.47× (5) | 10.6× (1) | 1.14× (5) |      1.16× (4) |
| async          |    1.42× (10) | 1.09× (1) |  1.20× (1) | 2.25× (1) | 0.98× (1) |      0.90× (1) |
| lifecycle      |     9.98× (8) | 3.28× (5) |  2.29× (4) |         — | 0.43× (5) |              — |
| scope          |    12.5× (12) | 5.82× (8) |  6.74× (8) | 14.9× (5) | 4.20× (8) |      1.75× (4) |
| scale          |     1.93× (2) | 10.5× (2) |  4.02× (2) | 9.33× (2) | 1.24× (2) |              — |
| boot           |     22.1× (7) | 12.9× (3) |  0.92× (4) | 4.90× (4) | 0.97× (4) |      1.11× (4) |
| failure        |     1.56× (2) | 2.08× (1) |  0.63× (1) | 0.68× (1) | 0.69× (1) |      0.86× (1) |
| production     |     17.3× (3) | 5.92× (2) |  3.86× (3) |         — | 0.94× (3) |      1.56× (1) |
| introspection  |     6.29× (2) | 1.17× (1) |  4.31× (2) |         — | 1.51× (1) |              — |
| slot-selection |     3.58× (6) |         — |          — |         — |         — |              — |
| resolution     |     1.05× (3) | 2.96× (2) |  5.44× (2) | 16.3× (2) | 1.48× (2) |      0.92× (2) |

The `boot` group against tsyringe, ditox and injection-js (0.92×, 0.97×, 1.11×) is the registration deficit in one
number, from 0.22–0.27× at the baseline: at the group level it is closed, and what remains of it is the single
`bind-128-plain` row against ditox and the class-cold graph. The `fan-out` group against tsyringe went from 0.37× to
2.47× and against ditox and injection-js from 0.16× and 0.10× to 1.14× and 1.16× — both wins now: the stable-set
collection rows hand out their memoized list and the cold pair is `many()` members that no longer walk the list, and
only the cold pair against tsyringe still loses. `production` against ditox (0.94×, from 0.34×) and injection-js (1.56×,
from 0.30×) is the per-request child rows. `lifecycle` against ditox (0.43×) is the two 100-singleton rows, the
registration deficit again. `slot-selection` against inversify (3.58×, from 2.12× two passes earlier) is the two lanes
that stopped scanning. `realistic` against inversify (5.20×) and against every rival is the generated plans. `async`
against ditox and injection-js (0.98×, 0.90×) is `async-init-single-hop`, the one async row that is not a win.
`resolution` against inversify stays at 1.05×, the accessor row against the plan rows. `failure` against inversify stays
at 1.56× because `alias-cycle-detected` is excluded, which is why it was.

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
| constant-resolve                               | micro          |  1000 |       143,265,689‡ |          2.19×†‡ |      3.87×†‡ |       9.95×†‡ |     25.5×†‡ |    0.79×†‡ |           1.54×†‡ |
| singleton-class-1-dep                          | micro          |   200 |       122,882,781‡ |          2.52×†‡ |      3.12×†‡ |       9.25×†‡ |     23.8×†‡ |    0.71×†‡ |           2.74×†‡ |
| transient-class-1-dep                          | micro          |   200 |         75,143,519 |          2.12×†‡ |       8.65×† |        15.9×† |      36.3×† |     7.85×† |                 — |
| named-constant-get                             | micro          |   500 |        77,294,579‡ |          3.03×†‡ |            — |             — |           — |          — |                 — |
| named-resolve-slots-1                          | micro          |   500 |        82,714,646‡ |          3.13×†‡ |            — |             — |           — |          — |                 — |
| named-resolve-slots-4                          | micro          |   500 |        82,532,743‡ |          3.14×†‡ |            — |             — |           — |          — |                 — |
| named-resolve-slots-16                         | micro          |   500 |        82,640,130‡ |          3.19×†‡ |            — |             — |           — |          — |                 — |
| named-resolve-slots-64                         | micro          |   500 |        82,502,991‡ |          3.23×†‡ |            — |             — |           — |          — |                 — |
| optional-missing-transient                     | micro          |   200 |         36,862,105 |           1.26×† |            — |             — |      10.4×† |     2.83×† |                 — |
| realistic-graph-resolve-root                   | realistic      |    20 |         17,614,227 |            2.59× |        2.69× |         8.31× |       17.5× |      1.71× |            1.26×‡ |
| realistic-graph-cold-resolve                   | realistic      |     1 |           256,498‡ |           10.7×‡ |       4.31×‡ |        2.47×‡ |      5.16×‡ |     0.98×‡ |            2.21×‡ |
| realistic-graph-resolved-root                  | realistic      |    20 |         57,433,397 |           3.87×† |            — |             — |      55.8×† |     5.34×† |           4.44×†‡ |
| realistic-graph-class-resolve-root             | realistic      |    20 |         16,942,345 |            1.60× |        3.49× |         5.62× |       17.3× |      2.09× |             1.80× |
| realistic-graph-class-cold-resolve             | realistic      |     1 |           317,436‡ |           22.1×‡ |       13.7×‡ |        0.76×‡ |      4.34×‡ |     0.49×‡ |            1.55×‡ |
| realistic-graph-validate                       | realistic      |    10 |         18,564,048 |                — |            — |             — |           — |          — |                 — |
| fan-out-tree-depth-3-breadth-4                 | fan-out        |    20 |          1,841,636 |            1.66× |        2.04× |         4.11× |       10.6× |      2.06× |                 — |
| resolve-all-strategies-10                      | fan-out        |     1 |         26,207,743 |            7.99× |            — |         3.75× |           — |      1.00× |            1.09×‡ |
| resolve-all-strategies-100                     | fan-out        |     1 |         26,477,297 |            64.6× |            — |        20.8×‡ |           — |      0.95× |            1.11×‡ |
| resolve-all-cold-10                            | fan-out        |     1 |          1,419,106 |           30.8×‡ |            — |         0.46× |           — |      0.76× |            1.04×‡ |
| resolve-all-cold-100                           | fan-out        |     1 |            185,647 |           25.5×‡ |            — |         0.62× |           — |      1.29× |             1.46× |
| resolve-all-named-8                            | fan-out        |     1 |        16,835,054‡ |           2.02×‡ |            — |             — |           — |          — |                 — |
| resolve-all-named-16                           | fan-out        |     1 |        17,205,641‡ |           2.25×‡ |            — |             — |           — |          — |                 — |
| resolve-all-named-32                           | fan-out        |     1 |        14,892,752‡ |           1.76×‡ |            — |             — |           — |          — |                 — |
| resolve-all-named-64                           | fan-out        |     1 |        17,099,746‡ |           1.96×‡ |            — |             — |           — |          — |                 — |
| resolve-async-single-hop                       | async          |     1 |          9,783,390 |            1.29× |            — |             — |           — |          — |                 — |
| async-init-single-hop                          | async          |     1 |          4,427,524 |            1.36× |        1.09× |         1.20× |       2.25× |      0.98× |             0.90× |
| dynamic-async-chain-8                          | async          |     1 |          2,089,261 |            1.64× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-8                      | async          |     1 |           932,565‡ |           1.68×‡ |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-16                     | async          |     1 |           509,805‡ |           1.75×‡ |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-32                     | async          |     1 |            259,007 |            1.58× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-64                     | async          |     1 |            133,811 |            1.81× |            — |             — |           — |          — |                 — |
| async-branch-chain-8                           | async          |     1 |           491,813‡ |                — |            — |             — |           — |          — |                 — |
| async-branch-escape-mid-chain-8                | async          |     1 |            736,698 |                — |            — |             — |           — |          — |                 — |
| async-diamond-shared-leaf                      | async          |     1 |          1,773,047 |            1.39× |            — |             — |           — |          — |                 — |
| plan-async-resolved-chain-8                    | async          |     1 |            883,517 |                — |            — |             — |           — |          — |                 — |
| plan-async-class-chain-8                       | async          |     1 |         2,802,048‡ |                — |            — |             — |           — |          — |                 — |
| resolve-all-async-8                            | async          |     1 |           483,435‡ |           0.58×‡ |            — |             — |           — |          — |                 — |
| resolve-optional-async-miss                    | async          |     1 |         10,169,059 |            1.65× |            — |             — |           — |          — |                 — |
| lifecycle-post-construct-singleton             | lifecycle      |   250 |       123,097,493‡ |          2.47×†‡ |            — |             — |           — |          — |                 — |
| lifecycle-pre-destroy-unbind                   | lifecycle      |     1 |          2,115,645 |            26.4× |       5.72×‡ |        1.69×‡ |           — |      0.82× |                 — |
| binding-level-activation-hook                  | lifecycle      |   200 |        49,745,538‡ |          1.93×†‡ |            — |             — |           — |          — |                 — |
| child-depth-1-resolve                          | scope          |   500 |         90,364,978 |          1.43×†‡ |       3.61×† |        7.06×† |      17.5×† |     3.96×† |           1.49×†‡ |
| child-depth-2-resolve                          | scope          |   500 |         91,720,419 |          1.44×†‡ |       4.76×† |        8.14×† |      18.4×† |     7.34×† |           1.44×†‡ |
| child-depth-4-resolve                          | scope          |   500 |         90,878,151 |          1.43×†‡ |       6.86×† |        10.6×† |      19.8×† |     14.8×† |           1.75×†‡ |
| child-depth-8-resolve                          | scope          |   500 |         91,278,828 |          1.50×†‡ |       12.1×† |        15.4×† |      24.5×† |     27.0×† |           2.52×†‡ |
| child-request-lifecycle-create-resolve-dispose | scope          |   100 |          2,279,202 |           44.6×‡ |       9.54×‡ |        4.61×‡ |           — |      1.34× |                 — |
| fresh-child-default-n1                         | scope          |   100 |          9,757,430 |           38.0×‡ |       6.41×‡ |         7.27× |           — |      1.84× |                 — |
| fresh-child-default-n4                         | scope          |   100 |          7,062,321 |            27.2× |       5.48×‡ |         7.28× |           — |      2.48× |                 — |
| fresh-child-name-n1                            | scope          |   100 |          9,521,965 |            41.6× |            — |             — |           — |          — |                 — |
| fresh-child-name-n4                            | scope          |   100 |          6,698,334 |            28.6× |            — |             — |           — |          — |                 — |
| fresh-child-tag-n1                             | scope          |   100 |          9,286,159 |            39.8× |            — |             — |           — |          — |                 — |
| fresh-child-tag-n4                             | scope          |   100 |          6,785,931 |           31.1×‡ |            — |             — |           — |          — |                 — |
| scale-mid-transient-chain-32                   | scale          |     1 |          1,445,168 |            2.63× |        4.87× |         4.57× |       12.8× |      1.55× |                 — |
| scale-deep-transient-chain-512                 | scale          |     1 |             50,381 |            1.41× |        22.6× |         3.54× |       6.80× |      1.00× |                 — |
| boot-decorated-container-build-and-resolve     | boot           |     1 |            487,407 |           16.7×‡ |            — |         0.75× |           — |          — |            1.62×‡ |
| container-create-empty                         | boot           |   100 |        25,334,789‡ |           40.4×‡ |       8.83×‡ |        1.09×‡ |      7.06×‡ |     1.57×‡ |           0.82×†‡ |
| create-child-empty                             | boot           |   100 |         17,464,605 |           37.4×‡ |        6.52× |         0.83× |       5.02× |      1.27× |           0.51×†‡ |
| bind-128-plain                                 | boot           |     1 |            184,961 |           30.6×‡ |       36.9×‡ |         1.02× |       9.68× |      0.42× |             2.21× |
| bind-128-refined                               | boot           |     1 |             28,883 |           4.89×‡ |            — |             — |           — |          — |                 — |
| misconfigured-missing-binding                  | failure        |     1 |           263,932‡ |           1.62×‡ |       2.08×‡ |        0.63×‡ |      0.68×‡ |     0.69×‡ |            0.86×‡ |
| circular-dependency-3                          | failure        |     1 |            154,459 |           174.2× |       1.50×‡ |             — |           — |          — |             0.45× |
| ambiguous-multi-binding                        | failure        |     1 |           225,134‡ |           1.50×‡ |            — |             — |           — |          — |                 — |
| production-http-handler                        | production     |    50 |          1,470,664 |           27.0×‡ |       6.47×‡ |         3.28× |           — |      1.00× |                 — |
| production-unit-of-work                        | production     |   100 |           872,243‡ |           14.8×‡ |       5.41×‡ |        2.08×‡ |           — |     1.01×‡ |                 — |
| production-event-bus-dispatch                  | production     |   100 |        50,473,653‡ |          13.0×†‡ |            — |       8.44×†‡ |           — |    0.83×†‡ |           1.56×†‡ |
| to-resolved-3-deps                             | micro          |   200 |       122,174,167‡ |          2.47×†‡ |            — |             — |     23.7×†‡ |    0.71×†‡ |           1.62×†‡ |
| to-alias-redirect                              | micro          |   500 |         86,096,772 |          1.71×†‡ |       5.07×† |        13.3×† |           — |          — |           1.01×†‡ |
| to-self-binding                                | micro          |   300 |       116,631,701‡ |          2.39×†‡ |            — |       7.55×†‡ |           — |          — |           2.27×†‡ |
| alias-chain-3                                  | micro          |   500 |         84,450,969 |           3.44×† |       11.2×† |        21.8×† |           — |          — |           1.05×†‡ |
| alias-parent-owned-terminal                    | micro          |   500 |         84,237,092 |           1.69×† |       5.86×† |        14.2×† |           — |          — |           0.95×†‡ |
| alias-cycle-detected                           | failure        |     1 |           250,468‡ |          722.4×‡ |       2.45×‡ |             — |           — |          — |            0.80×‡ |
| resolve-optional-hit                           | micro          |   500 |       143,035,322‡ |          4.79×†‡ |      4.06×†‡ |             — |     25.2×†‡ |    0.78×†‡ |           1.65×†‡ |
| resolve-optional-miss                          | micro          |   500 |        232,053,030 |           7.59×† |       4.45×† |             — |     5.89×†‡ |     4.08×† |           2.91×†‡ |
| tagged-binding-resolve                         | micro          |   300 |        86,212,680‡ |          4.18×†‡ |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-1                         | micro          |   300 |        92,990,130‡ |          4.53×†‡ |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-4                         | micro          |   300 |        94,009,688‡ |          4.57×†‡ |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-16                        | micro          |   300 |        91,236,907‡ |          4.42×†‡ |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-64                        | micro          |   300 |        92,846,992‡ |          4.50×†‡ |            — |             — |           — |          — |                 — |
| conditional-injection-tagged                   | micro          |   300 |         58,431,314 |           2.20×† |            — |             — |      25.5×† |          — |                 — |
| rebind-hot-swap                                | lifecycle      |    50 |         11,350,450 |           39.0×‡ |        0.89× |             — |           — |     0.14×† |                 — |
| has-bound-check                                | introspection  |  1000 |        317,589,612 |           5.94×† |       1.17×† |        3.14×† |           — |     1.51×† |                 — |
| has-own-unbound-check                          | introspection  |  1000 |       620,608,933‡ |          6.65×†‡ |            — |       5.92×†‡ |           — |          — |                 — |
| container-level-activation-hook                | lifecycle      |   200 |        53,738,279‡ |          2.07×†‡ |            — |       5.78×†‡ |           — |          — |                 — |
| scoped-binding-per-child                       | scope          |   100 |          5,346,203 |           50.1×‡ |       2.75×‡ |         1.85× |       4.67× |      1.35× |                 — |
| rebind-parent-resolve-child-depth-3            | lifecycle      |    50 |          7,696,711 |            49.7× |        0.89× |             — |           — |      1.07× |                 — |
| materialize-100-singletons                     | lifecycle      |     1 |             47,549 |            14.3× |       9.84×‡ |         1.88× |           — |      0.35× |                 — |
| unbind-all-100-singletons                      | lifecycle      |     1 |            35,818‡ |           13.7×‡ |       8.56×‡ |        1.50×‡ |           — |     0.35×‡ |                 — |
| module-load-unload                             | boot           |     1 |            919,399 |            22.1× |            — |             — |           — |          — |                 — |
| module-cold-from-modules                       | boot           |     1 |          1,563,723 |           31.1×‡ |            — |             — |       1.68× |      1.05× |                 — |
| initialize-async-warmup                        | boot           |     1 |           412,694‡ |                — |            — |             — |           — |          — |                 — |
| inspect-snapshot                               | introspection  |    20 |          8,751,567 |                — |            — |             — |           — |          — |                 — |
| lookup-bindings                                | introspection  |   200 |         22,489,619 |                — |            — |             — |           — |          — |                 — |
| generate-dependency-graph                      | introspection  |    10 |            725,956 |                — |            — |             — |           — |          — |                 — |
| multi-tag-slot-resolve                         | micro          |   300 |         13,028,283 |                — |            — |             — |           — |          — |                 — |
| multi-tag-constraint-resolve                   | micro          |   200 |          3,205,330 |                — |            — |             — |           — |          — |                 — |
| multi-tag-select-32                            | micro          |   300 |          3,071,884 |                — |            — |             — |           — |          — |                 — |
| mask-reject-wide-catalog                       | slot-selection |   300 |         36,706,782 |                — |            — |             — |           — |          — |                 — |
| mask-accept-two-of-four                        | slot-selection |   300 |         17,900,506 |                — |            — |             — |           — |          — |                 — |
| mask-collision-same-bit                        | slot-selection |   300 |         50,595,588 |                — |            — |             — |           — |          — |                 — |
| slot-tag-array-hoisted                         | slot-selection |   300 |        86,194,798‡ |                — |            — |             — |           — |          — |                 — |
| slot-tag-shorthand-hoisted                     | slot-selection |   300 |        90,645,649‡ |                — |            — |             — |           — |          — |                 — |
| slot-tag-array-inline                          | slot-selection |   300 |        62,734,124‡ |                — |            — |             — |           — |          — |                 — |
| slot-tag-shorthand-inline                      | slot-selection |   300 |        73,398,065‡ |                — |            — |             — |           — |          — |                 — |
| slot-tag-zero-value                            | slot-selection |   300 |        84,748,902‡ |          4.18×†‡ |            — |             — |           — |          — |                 — |
| slot-name-and-tag                              | slot-selection |   300 |         38,380,727 |          2.24×†‡ |            — |             — |           — |          — |                 — |
| slot-tag-resolve-all                           | slot-selection |   300 |         47,858,907 |           3.96×† |            — |             — |           — |          — |                 — |
| slot-tag-miss-optional                         | slot-selection |   300 |         68,647,142 |          3.25×†‡ |            — |             — |           — |          — |                 — |
| slot-tag-parent-owned                          | slot-selection |   300 |        85,771,563‡ |          4.55×†‡ |            — |             — |           — |          — |                 — |
| slot-name-parent-owned                         | slot-selection |   300 |        82,884,390‡ |          3.86×†‡ |            — |             — |           — |          — |                 — |
| slot-injected-name-compiled                    | slot-selection |   300 |         55,328,632 |                — |            — |             — |           — |          — |                 — |
| slot-injected-name-interpreted                 | slot-selection |   300 |          4,196,387 |                — |            — |             — |           — |          — |                 — |
| slot-injected-tag-compiled                     | slot-selection |   300 |         49,382,660 |                — |            — |             — |           — |          — |                 — |
| slot-injected-tag-interpreted                  | slot-selection |   300 |          3,732,338 |                — |            — |             — |           — |          — |                 — |
| plan-deps-inlined                              | resolution     |   300 |         48,051,764 |                — |            — |             — |           — |          — |                 — |
| plan-escape-factory-dep                        | resolution     |   300 |          6,622,298 |                — |            — |             — |           — |          — |                 — |
| plan-escape-scoped-dep                         | resolution     |   300 |          9,794,520 |                — |            — |             — |           — |          — |                 — |
| plan-escape-hooked-dep                         | resolution     |   300 |          2,472,302 |                — |            — |             — |           — |          — |                 — |
| plan-escape-optional-dep                       | resolution     |   300 |          3,187,208 |                — |            — |             — |           — |          — |                 — |
| plan-escape-multi-dep                          | resolution     |   300 |            948,136 |                — |            — |             — |           — |          — |                 — |
| plan-class-chain-24                            | resolution     |     1 |          4,028,261 |                — |            — |             — |           — |          — |                 — |
| plan-class-chain-40                            | resolution     |     1 |           528,436‡ |                — |            — |             — |           — |          — |                 — |
| interpreted-class-chain-24                     | resolution     |     1 |            303,958 |                — |            — |             — |           — |          — |                 — |
| interpreted-class-chain-40                     | resolution     |     1 |            147,021 |                — |            — |             — |           — |          — |                 — |
| nested-context-resolve-in-factory              | resolution     |   300 |        41,375,094‡ |          1.79×†‡ |      3.50×†‡ |       6.18×†‡ |     18.5×†‡ |    2.17×†‡ |           0.95×†‡ |
| nested-container-resolve-in-factory            | resolution     |   300 |        35,415,865‡ |          1.52×†‡ |      2.69×†‡ |       4.78×†‡ |     14.4×†‡ |    1.01×†‡ |           0.89×†‡ |
| accessor-injection-construct                   | resolution     |   300 |          8,300,054 |           0.42×‡ |            — |             — |           — |          — |                 — |

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
