# Results

Where `@codefast/di` actually stands against the field right now, wins and losses given equal weight — the point of this
page is to know where the engine is slower so the next change knows what to aim at. One machine-derived snapshot, no
accreted ledger. The method is in [`BENCH_GUIDE.md`](./BENCH_GUIDE.md); re-run it with the recipe at the bottom.

**This is one full-profile pass, so read the aggregates, not the rows.** GC-exposed, one subprocess per scenario,
libraries interleaved with rotating order, 3 trials each — a single pass measures no between-run variance of its own,
206 of the comparable cells carry a per-trial IQR above 5%, and 122 rows sit above ~30M ops/s where the ratio moves
between runs of the same build whatever its IQR says. Ratios are worth more than the absolute `hz/op`; a single row is
worth less than the group it sits in. A loss highlighted below points at a direction — quote a precise factor only after
a paired re-run, except where a loss is a structural O(N) difference that reproduces by construction (called out as
such).

**This run reads against the pinned baseline.** Its id is `2026-09-13T20-54-17-404Z`, over the tree at `0506f046e`; the
baseline it is compared to is `2026-09-13T04-45-37-460Z`, the last pass over the engine before the rewrite began, whose
observations are tracked under `baselines/` and pinned by `pnpm bench:baseline`. Every `Δ` on this page is that
comparison. The suite is unchanged between the two: 126 rows, 101 contract rows specified against the public API, 25
engine rows that name a lane of the resolver and enter no cross-library figure; every library implements every row its
declared features allow, so a `—` below is a feature the library lacks, never a row nobody wrote.

**Environment.** `@codefast/di` 0.9.0 from a `dist` the harness rebuilt first, on Node 26.1.0 / V8 14.6, Apple M3 Max ×
14, darwin/arm64, `--expose-gc` for every library. inversify 8.2.3 · awilix 13.0.5 · tsyringe 4.10.0 · brandi 5.1.0 ·
ditox 3.3.0 · injection-js 2.6.1. Each library runs at its canonical decorator mode (inversify legacy decorators +
`reflect-metadata`, codefast TC39 Stage 3 + `Symbol.metadata`); every inversify container uses `{ jitless: false }`, its
fastest documented configuration. Run 2026-09-13, 18m18s wall.

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

## Summary — where we stand

Ratios are `@codefast/di ÷ competitor`; above 1× means codefast is faster. Win `>1.03×`, parity `0.97–1.03×`, loss
`<0.97×`. `Comparable` counts the rows both libraries ran, of 112 aggregate-eligible rows codefast measures; `†` is how
many of those the median and geomean carry from above the throughput ceiling — they stay in the aggregate but no reader
should cite one alone.

| Competitor     | Comparable | Win / parity / loss | Median | Geomean |   † |
| -------------- | ---------: | ------------------: | -----: | ------: | --: |
| InversifyJS 8  |  91 of 112 |          87 / 0 / 4 |  3.14× |   4.58× |  39 |
| Awilix 13      |  38 of 112 |          35 / 1 / 2 |  4.81× |   4.75× |  15 |
| tsyringe 4     |  43 of 112 |          36 / 0 / 7 |  4.36× |   3.73× |  17 |
| Brandi 5       |  29 of 112 |          28 / 0 / 1 |  14.7× |   10.7× |  15 |
| Ditox 3        |  44 of 112 |         25 / 2 / 17 |  1.10× |   1.33× |  17 |
| injection-js 2 |  31 of 112 |         19 / 2 / 10 |  1.25× |   1.31× |  19 |

**The headline, stated plainly: codefast sweeps inversify, awilix and brandi, wins tsyringe on the median by 4.4× while
still losing it seven rows, and holds the wins against the two libraries it started this round losing to — ditox on the
median (1.10×, from 0.72× at the baseline) and the geomean (1.33×, from 0.66×) while still losing it 17 of 44 rows,
injection-js on both (1.25× and 1.31×, from 0.99× and 0.70×) while losing it 10 of 31.** Against the baseline, 61 of
codefast's 126 rows are more than 10% faster and 51 read as improved beyond noise; the seven that read down beyond noise
are named below, each with what a paired re-measure says. Every remaining loss is still one of the same shapes —
**registration**, **cold collections**, **rebind**, the **two selection lanes**, the **accessor lane** — but the
registration deficit that headed this list is a fraction of itself (`bind-128-plain` 8.6× its baseline), the cold
collections are five to ten times theirs, the per-request child rows against ditox are wins, and the compiled-plan lane
that the last pass read down is two to three times faster than it was, generated plans having given every hot plan call
sites of its own. Where codefast wins it still wins on the warm resolve, which is what a request pays after the
container is built; this round moved the price of building a container, of binding into it, of collecting from it, and
of running a plan among other plans.

## The losses, foregrounded — where to improve

Ordered by how much they matter, each marked as a **real deficit** (same work, codefast slower) or a **work difference**
(codefast does more per op by design, so the row is a design cost to reconsider, not a bug). Where the baseline is
quoted, it is the same row in `2026-09-13T04-45-37-460Z`.

- **Registration is still the biggest deficit, and it is now a ditox-only one.** `bind-128-plain` — 128 transient
  factory bindings into a fresh container, no resolve — runs at 0.44× ditox, 0.97× tsyringe and 2.29× injection-js, from
  0.05×, 0.12× and 0.28×: the row is 8.6× faster than the baseline, because the fluent chain is now the binding it
  registers (one allocation per bind, a numeric id, one map write). Everything that binds before it resolves moved with
  it — `container-create-empty` 1.11× tsyringe and 1.61× ditox (from 0.30× and 0.45×), `create-child-empty` 0.86× and
  1.27× (from 0.36× and 0.48×), `realistic-graph-cold-resolve` 1.00× ditox and 2.39× tsyringe (from 0.37× and 0.90×),
  `realistic-graph-class-cold-resolve` 0.52× ditox, 0.81× tsyringe and 1.63× injection-js (from 0.16×, 0.24× and 0.49×),
  `boot-decorated-container-build-and-resolve` 0.84× tsyringe and 1.67× injection-js (from 0.19× and 0.41×),
  `module-cold-from-modules` 1.11× ditox and 1.79× brandi (from 0.27× and 0.42×). The two empty-container rows still
  lose injection-js above the ceiling (0.84×† and 0.53×†). What the registration path still pays is the binding object
  with every kind's fields on one hidden class, and the registry write; ditox's `bindFactory` is a map write and a
  closure. **Real deficit, structural** — one object per binding is the design.
- **Cold collections still lose; stable ones no longer do.** `resolve-all-cold-N` builds a fresh container and reads the
  collection once: 0.19× tsyringe, 0.46× ditox and 0.49× injection-js at N=100 (from 0.03×, 0.08× and 0.09×), 0.64×,
  0.71× and 0.89× at N=10 — five to ten times the baseline, because a hundred `many()` members on one token append to
  one list and evaluate no predicate. The stable rows crossed over: `resolve-all-strategies-100` reads 14.6× tsyringe,
  0.70× ditox and 0.80× injection-js (from 1.29×, 0.03× and 0.04×), `resolve-all-strategies-10` 3.07×, 0.78× and 0.91×
  (from 0.97×, 0.24× and 0.28×), because a root-level read with no options memoizes its candidate list until the chain
  changes and its value list while every member is a hook-free constant. What the cold pair still pays is the
  registration above. **Real deficit on the cold pair, a registration cost seen from the collection side.**
- **Teardown at scale is a registration loss wearing a lifecycle label.** `materialize-100-singletons` (bind and resolve
  100 singletons, no teardown) is 0.39× ditox and 2.02× tsyringe; `unbind-all-100-singletons` (the same, then dispose)
  is 0.37× and 1.55×. The two ratios against ditox are the same, so the teardown walk costs nothing the rivals do not
  pay — the loss is the 100 bindings above. `lifecycle-pre-destroy-unbind` (one singleton, one hook) at 0.87× ditox and
  1.76× tsyringe is the same story at N=1. **Work difference on the hook, real deficit on the registration underneath.**
- **Rebind is at parity with awilix and still slow against ditox.** `rebind-hot-swap` 0.95× awilix (from 0.18×) and
  0.15×† ditox; `rebind-parent-resolve-child-depth-3` 1.01× awilix and 1.01× ditox (from 0.24× and 0.29×). Both rows are
  four to five times their baseline; the shape is unchanged: a rebind unbinds, re-registers and bumps the chain's
  version. **Work difference**; a rebind that patches the existing slot in place would close what is left.
- **The two selection lanes no index serves: three times faster, and still losses.** `slot-name-and-tag` — a request
  carrying a name and a tag — is 0.57× inversify (from 0.19×) and `slot-tag-miss-optional` — a tagged request matching
  nothing over a populated token — is 0.62× (from 0.25×). Both get an allocation-free first pass over the token's
  candidates before full selection; what remains is the scan itself against inversify's single constraint pass. **Real
  deficit**, narrow: a combined name-plus-tag index entry would make the first lane an index hit, and a negative memo
  keyed on the chain version would make the second one.
- **`accessor-injection-construct` 0.44× inversify, from 0.30×.** A class with one `@inject` accessor compiles as a plan
  root and its plan is generated like any other; what it still pays is the ambient scope around construction and the
  accessor's own `resolve` through the container, where inversify's property injection is a metadata read on the same
  plan. **Work difference**, and the row that says what property injection costs relative to constructor injection.
- **`resolve-all-async-8` 0.61× inversify, from 0.45×.** Every member takes the non-`async` factory lane a single
  `resolveAsync` takes; what remains is a branch stack and a level context per member against inversify's plain
  `Promise.all`. **Real deficit** on a row that is otherwise codefast's own territory (every other async row is a win).
- **Per-request child work against ditox is a win now.** `production-http-handler` 1.03× (from 0.42×),
  `production-unit-of-work` 1.10× (from 0.48×), `child-request-lifecycle-create-resolve-dispose` 1.33× (from 0.53×),
  `scoped-binding-per-child` 1.30×, `fresh-child-default-n1` 1.89×. Every one is a registration into a fresh child, so
  what is left of the first bullet seen from the request side.
- **Warm singleton reads: 0.79×† and 0.72×† ditox on `constant-resolve` and `singleton-class-1-dep`**, unchanged.
  ditox's `get` is close to a map read; codefast still carries its binding and lifecycle shape on every resolve. Both
  rows sit above 120M ops/s, inside the band that stops reproducing between runs. **Real deficit, ceiling-bound.**
- **Failing fast costs more here: `misconfigured-missing-binding` 0.68× tsyringe, 0.71× ditox, 0.73× brandi, 0.91×
  injection-js**, unchanged. codefast builds a structured error with the resolution path; the rivals throw a string.
  **Work difference** on a path a production request should never take.
- **Rows that read down against the baseline in this pass.** Two families, each traced.
  - The indexed collections: `resolve-all-named-16` reads 0.66× of its baseline throughput here, `-32` 0.85× and `-8`
    0.92×, while `-64` reads 1.00× — the four rows sit at 15–19M ops/s, the band this page flags as unstable, and the
    same rows have read 0.78×, 0.79× and 0.94× one pass earlier and 0.91–0.98× paired and alternating against the
    pre-rewrite source with overlapping spreads. **Open**: a small loss on the indexed collection lane that no pass has
    yet pinned to a figure, to re-measure before the next change to `resolveAll` or the tagged index.
  - The async rows: `async-init-single-hop` reads 0.85× of its baseline here (0.96× one pass earlier),
    `dynamic-async-chain-8` 0.93× and `plan-async-class-chain-8` 0.92×. Paired and alternating against the commit before
    the generated plans landed, the same rows read 0.97×, 0.99× and 0.95× with the spreads touching, and the async lane
    shares no code with the generated tier — its plans are still closures, its escapes replay the async dispatch as
    before. The rows sit at 2–4M ops/s and are bound by the microtask queue, which is where a pass-to-pass swing of this
    size comes from. **Open**: to re-read on the next pass before it is a figure; nothing to aim a change at yet.
  - `generate-dependency-graph` 0.90× is the id rendered as a string at the graph boundary, an introspection path that
    reads 0.96–1.04× paired.

One retraction against the baseline ledger stands, and one loss from the last pass is gone. **The parent walk had a
slope and no longer does.** `child-depth-N-resolve` against inversify read 1.42× at depth 1 and 0.94×† at depth 8 at the
baseline; it now reads 1.43×† at both, because the summed chain version a descendant's memo is stamped with is re-walked
only when the process-wide state epoch has moved. Against ditox and awilix the slope still runs the other way (4.23× →
29.8×, 3.78× → 12.2×). Above the ceiling at every depth, so the flatness is the finding, not any one cell. **The
compiled-plan engine rows that read 0.76–0.89× of the pass before last are two to three times faster than that pass
now** — `plan-deps-inlined` 2.8×, `slot-injected-name-compiled` and `slot-injected-tag-compiled` 3.1–3.2×,
`plan-class-chain-24` 2.4×, `realistic-graph-resolved-root` 2.8×, the escape rows 1.1–1.2× — because a plan that keeps
running is generated as a function of its own, with call-site feedback nothing else feeds; the loss they measured was
that feedback shared between every plan a process had compiled.

## The wins

- **inversify — 87 of 91 comparable rows, 3.14× median, 4.58× geomean.** Widest margins on `failure`'s
  `circular-dependency-3` and `alias-cycle-detected` (both excluded — inversify recurses to the stack limit rather than
  detecting either), then `boot` (21.5× geomean), `production` (15.5×), `scope` (12.0×), `lifecycle` (9.95×),
  `introspection` (6.14×), `realistic` (5.40×), `fan-out` (5.19×); tightest on `resolution` (1.06×, the accessor row)
  and `async` (1.44×). Every fresh-child row is 35–37×, every production row 15–25×, `bind-128-plain` 32×, and the
  `child-depth` axis is flat at 1.43×†.
- **Awilix 13 — 35 of 38, 4.81× median**, up to 12× on the deep child walk and 37× on `bind-128-plain`; loses only
  `rebind-hot-swap` (0.95×) and `async-init-single-hop` (0.97×), both inside the parity band's edge.
- **tsyringe 4 — 36 of 43, 4.36× median**, 12.2× on `micro` and 6.70× on `scope`; the stable-set collections that were
  its rows are now codefast's (14.6× at N=100), `bind-128-plain` is at parity (0.97×, from 0.12×) and
  `realistic-graph-cold-resolve` 2.39×; it still wins the cold collections (0.19× and 0.64×), `boot-decorated-*`
  (0.84×), the class-cold graph (0.81×), `create-child-empty` (0.86×) and the missing-binding throw (0.68×).
- **Brandi 5 — 28 of 29, 14.7× median**, 36× on transient micro and 54×† on the resolved-factory graph; loses only the
  missing-binding throw.
- **Against ditox codefast wins more rows than it loses (25 to 17) and both aggregates (1.10× median, 1.33× geomean,
  from 0.72× and 0.66×).** The warm work — `transient-class-1-dep` 7.70×†, `realistic-graph-resolved-root` 5.33×†,
  `realistic-graph-class-resolve-root` 2.44×, `realistic-graph-resolve-root` 1.64×, every `child-depth` row 4.23–29.8×†
  — and the cold and per-request work too: `fresh-child-default-n1` 1.89×, `container-create-empty` 1.61×,
  `child-request-lifecycle-create-resolve-dispose` 1.33×, `scoped-binding-per-child` 1.30×, `create-child-empty` 1.27×,
  `module-cold-from-modules` 1.11×, `production-unit-of-work` 1.10×, `production-http-handler` 1.03×,
  `realistic-graph-cold-resolve` 1.00×. It still loses every row that binds many things (`bind-128-plain` 0.44×, the two
  100-singleton lifecycle rows 0.37–0.39×, the class-cold graph 0.52×), the cold collections (0.46–0.71×), the stable
  collections (0.70–0.78×), `async-init-single-hop` (0.90×) and the two warm singleton reads above the ceiling.
- **Against injection-js the geomean is 1.31× and the median 1.25×** (from 0.70× and 0.99×; 19 wins, 2 parity, 10
  losses). The warm rows are wins (`singleton-class-1-dep` 2.93×†, `realistic-graph-resolved-root` 4.10×†,
  `realistic-graph-class-resolve-root` 1.98×, `realistic-graph-resolve-root` 1.35×) and so is registration
  (`bind-128-plain` 2.29×, `realistic-graph-cold-resolve` 2.05×, `boot-decorated-*` 1.67×, the class-cold graph 1.63×);
  the losses are the collections (cold 0.49× and 0.89×, stable 0.80× and 0.91×), the two empty-container rows above the
  ceiling, `async-init-single-hop` 0.84× and the missing-binding throw 0.91×.
- **The selection axes are flat where they should be.** `named-resolve-slots-1/64` read 3.14× and 3.09× inversify and
  `tagged-resolve-slots-1/64` 4.44× and 4.50× with no trend across N: both lanes are indexed, and the axis proves it.
- **What this round moved, against the baseline.** `resolve-all-strategies-100` 21×, `resolve-all-cold-10` 11×,
  `bind-128-plain` 8.6×, `resolve-all-cold-100` 5.7×, `rebind-hot-swap` 5.2×, `rebind-parent-resolve-child-depth-3`
  4.3×, `boot-decorated-container-build-and-resolve` 4.3×, `module-cold-from-modules` 4.1×, `container-create-empty`
  3.9×, `realistic-graph-class-cold-resolve` 3.3×, `production-event-bus-dispatch` 3.3×, `slot-name-and-tag` 3.0×,
  `resolve-all-strategies-10` 3.0×, `slot-tag-miss-optional` 2.9×, `multi-tag-slot-resolve` 2.9×,
  `materialize-100-singletons` 2.9×, `realistic-graph-cold-resolve` 2.8×, `bind-128-refined` 2.8×, `module-load-unload`
  2.8×, `lifecycle-pre-destroy-unbind` 2.7×, `create-child-empty` 2.7×, `production-http-handler` 2.7×,
  `has-own-unbound-check` 2.7×, `child-request-lifecycle-create-resolve-dispose` 2.6×, `realistic-graph-resolved-root`
  2.6×, `slot-injected-tag-compiled` 2.6×, `slot-injected-name-compiled` 2.5×, `plan-class-chain-24` 2.4×,
  `unbind-all-100-singletons` 2.4×, `production-unit-of-work` 2.4×, the `fresh-child-*-n1` rows 2.2–2.4×,
  `plan-deps-inlined` 2.2×, `initialize-async-warmup` 2.2×, the `fresh-child-*-n4` rows 1.9–2.1×,
  `scoped-binding-per-child` 1.8×, `inspect-snapshot` 1.8×, `child-depth-8-resolve` 1.6×, `resolve-optional-miss` 1.5×,
  `accessor-injection-construct` 1.5×, `resolve-all-async-8` 1.3×, `realistic-graph-class-resolve-root` 1.3× — 61 of 126
  rows more than 10% faster, with the warm resolve rows (`constant-resolve` 1.02×, `singleton-class-1-dep` 1.01×,
  `transient-class-1-dep` 1.10×, `realistic-graph-resolve-root` 1.00×) at parity, which is what every step's paired
  check was gated on.

## Geomean by group

Geomean of the ratios in each group, comparable row count in parentheses. Read a group, not a cell.

| Group          | InversifyJS 8 | Awilix 13 | tsyringe 4 |  Brandi 5 |   Ditox 3 | injection-js 2 |
| -------------- | ------------: | --------: | ---------: | --------: | --------: | -------------: |
| micro          |    2.88× (22) | 4.75× (8) |  12.2× (7) | 17.2× (8) | 1.42× (7) |      1.51× (9) |
| realistic      |     5.40× (5) | 5.07× (4) |  3.21× (4) | 13.4× (5) | 1.62× (5) |      2.06× (5) |
| fan-out        |     5.19× (9) | 2.23× (1) |  1.88× (5) | 11.5× (1) | 0.84× (5) |      0.75× (4) |
| async          |    1.44× (10) | 0.97× (1) |  1.05× (1) | 2.23× (1) | 0.90× (1) |      0.84× (1) |
| lifecycle      |     9.95× (8) | 3.45× (5) |  2.43× (4) |         — | 0.45× (5) |              — |
| scope          |    12.0× (12) | 5.83× (8) |  6.70× (8) | 14.6× (5) | 4.25× (8) |      1.68× (4) |
| scale          |     2.01× (2) | 10.2× (2) |  4.10× (2) | 9.53× (2) | 1.34× (2) |              — |
| boot           |     21.5× (7) | 13.3× (3) |  0.94× (4) | 5.11× (4) | 1.00× (4) |      1.14× (4) |
| failure        |     1.41× (2) | 2.18× (1) |  0.68× (1) | 0.73× (1) | 0.71× (1) |      0.91× (1) |
| production     |     15.5× (3) | 6.26× (2) |  3.75× (3) |         — | 0.90× (3) |      1.04× (1) |
| introspection  |     6.14× (2) | 1.17× (1) |  4.28× (2) |         — | 1.50× (1) |              — |
| slot-selection |     2.12× (6) |         — |          — |         — |         — |              — |
| resolution     |     1.06× (3) | 3.00× (2) |  5.48× (2) | 16.1× (2) | 1.54× (2) |      0.91× (2) |

The `boot` group against tsyringe, ditox and injection-js (0.94×, 1.00×, 1.14×) is the registration deficit in one
number, from 0.22–0.27× at the baseline: at the group level it is closed, and what remains of it is the single
`bind-128-plain` row against ditox and the class-cold graph. The `fan-out` group against tsyringe went from 0.37× to
1.88× and against ditox and injection-js from 0.16× and 0.10× to 0.84× and 0.75×: the stable-set collection rows are
memoized and the cold pair is `many()` members now, and only the cold pair still loses. `production` against ditox
(0.90×, from 0.34×) and injection-js (1.04×, from 0.30×) is the per-request child rows. `lifecycle` against ditox
(0.45×) is the two 100-singleton rows, the registration deficit again. `realistic` against inversify (5.40×, from 4.21×
one pass earlier) and against every rival is the generated plans: the class and resolved-factory graphs run as functions
of their own now. `async` against awilix, ditox and injection-js (0.97×, 0.90×, 0.84×) is `async-init-single-hop`, the
one async row that is not a win, read down in this pass. `resolution` against inversify stays at 1.06×, the accessor row
against the plan rows. `failure` against inversify stays at 1.41× because `alias-cycle-detected` is excluded, which is
why it was.

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
| constant-resolve                               | micro          |  1000 |       143,360,656‡ |          2.16×†‡ |      3.78×†‡ |       9.19×†‡ |     24.7×†‡ |    0.79×†‡ |           1.69×†‡ |
| singleton-class-1-dep                          | micro          |   200 |       123,284,849‡ |          2.62×†‡ |      3.11×†‡ |       8.99×†‡ |     23.6×†‡ |    0.72×†‡ |           2.93×†‡ |
| transient-class-1-dep                          | micro          |   200 |         75,519,902 |          2.05×†‡ |       8.49×† |        14.8×† |      35.5×† |     7.70×† |                 — |
| named-constant-get                             | micro          |   500 |        79,019,052‡ |          2.98×†‡ |            — |             — |           — |          — |                 — |
| named-resolve-slots-1                          | micro          |   500 |        83,398,122‡ |          3.14×†‡ |            — |             — |           — |          — |                 — |
| named-resolve-slots-4                          | micro          |   500 |        82,963,868‡ |          3.18×†‡ |            — |             — |           — |          — |                 — |
| named-resolve-slots-16                         | micro          |   500 |        83,056,194‡ |          3.08×†‡ |            — |             — |           — |          — |                 — |
| named-resolve-slots-64                         | micro          |   500 |        83,146,139‡ |          3.09×†‡ |            — |             — |           — |          — |                 — |
| optional-missing-transient                     | micro          |   200 |         33,775,052 |           1.04×† |            — |             — |      9.04×† |     2.53×† |                 — |
| realistic-graph-resolve-root                   | realistic      |    20 |         18,559,837 |            2.71× |        2.72× |         8.36× |       18.1× |      1.64× |            1.35×‡ |
| realistic-graph-cold-resolve                   | realistic      |     1 |           265,189‡ |           11.0×‡ |       4.29×‡ |        2.39×‡ |      5.21×‡ |     1.00×‡ |            2.05×‡ |
| realistic-graph-resolved-root                  | realistic      |    20 |         56,842,017 |           3.86×† |            — |             — |      54.0×† |     5.33×† |           4.10×†‡ |
| realistic-graph-class-resolve-root             | realistic      |    20 |         19,101,923 |            1.75× |        3.98× |         6.49× |       19.1× |      2.44× |            1.98×‡ |
| realistic-graph-class-cold-resolve             | realistic      |     1 |           339,511‡ |           22.8×‡ |       14.2×‡ |        0.81×‡ |      4.37×‡ |     0.52×‡ |            1.63×‡ |
| realistic-graph-validate                       | realistic      |    10 |         17,183,379 |                — |            — |             — |           — |          — |                 — |
| fan-out-tree-depth-3-breadth-4                 | fan-out        |    20 |          2,036,656 |            1.90× |        2.23× |         4.36× |       11.5× |      2.34× |                 — |
| resolve-all-strategies-10                      | fan-out        |     1 |        21,996,777‡ |           6.75×‡ |            — |        3.07×‡ |           — |     0.78×‡ |            0.91×‡ |
| resolve-all-strategies-100                     | fan-out        |     1 |        19,275,911‡ |           46.8×‡ |            — |        14.6×‡ |           — |     0.70×‡ |            0.80×‡ |
| resolve-all-cold-10                            | fan-out        |     1 |          1,326,390 |           29.6×‡ |            — |        0.64×‡ |           — |      0.71× |            0.89×‡ |
| resolve-all-cold-100                           | fan-out        |     1 |             67,101 |           9.02×‡ |            — |        0.19×‡ |           — |      0.46× |             0.49× |
| resolve-all-named-8                            | fan-out        |     1 |        18,603,526‡ |           2.28×‡ |            — |             — |           — |          — |                 — |
| resolve-all-named-16                           | fan-out        |     1 |        14,722,707‡ |           1.86×‡ |            — |             — |           — |          — |                 — |
| resolve-all-named-32                           | fan-out        |     1 |        15,832,851‡ |           1.88×‡ |            — |             — |           — |          — |                 — |
| resolve-all-named-64                           | fan-out        |     1 |        19,324,099‡ |           2.14×‡ |            — |             — |           — |          — |                 — |
| resolve-async-single-hop                       | async          |     1 |         10,091,739 |            1.51× |            — |             — |           — |          — |                 — |
| async-init-single-hop                          | async          |     1 |          3,885,013 |            1.28× |        0.97× |         1.05× |       2.23× |      0.90× |             0.84× |
| dynamic-async-chain-8                          | async          |     1 |          2,122,068 |            1.67× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-8                      | async          |     1 |          1,019,609 |           1.71×‡ |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-16                     | async          |     1 |            549,943 |            1.74× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-32                     | async          |     1 |            264,717 |            1.64× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-64                     | async          |     1 |            140,926 |            1.90× |            — |             — |           — |          — |                 — |
| async-branch-chain-8                           | async          |     1 |            474,559 |                — |            — |             — |           — |          — |                 — |
| async-branch-escape-mid-chain-8                | async          |     1 |            813,471 |                — |            — |             — |           — |          — |                 — |
| async-diamond-shared-leaf                      | async          |     1 |          1,984,880 |            1.41× |            — |             — |           — |          — |                 — |
| plan-async-resolved-chain-8                    | async          |     1 |            992,141 |                — |            — |             — |           — |          — |                 — |
| plan-async-class-chain-8                       | async          |     1 |          2,307,498 |                — |            — |             — |           — |          — |                 — |
| resolve-all-async-8                            | async          |     1 |           565,003‡ |           0.61×‡ |            — |             — |           — |          — |                 — |
| resolve-optional-async-miss                    | async          |     1 |          9,730,050 |            1.52× |            — |             — |           — |          — |                 — |
| lifecycle-post-construct-singleton             | lifecycle      |   250 |       123,273,325‡ |          2.48×†‡ |            — |             — |           — |          — |                 — |
| lifecycle-pre-destroy-unbind                   | lifecycle      |     1 |          2,220,179 |            24.9× |       5.86×‡ |        1.76×‡ |           — |      0.87× |                 — |
| binding-level-activation-hook                  | lifecycle      |   200 |        51,515,815‡ |          2.02×†‡ |            — |             — |           — |          — |                 — |
| child-depth-1-resolve                          | scope          |   500 |         92,119,814 |          1.43×†‡ |       3.78×† |        7.01×† |      16.9×† |     4.23×† |           1.25×†‡ |
| child-depth-2-resolve                          | scope          |   500 |         92,464,274 |          1.61×†‡ |       4.77×† |        8.21×† |      17.8×† |     7.09×† |           1.40×†‡ |
| child-depth-4-resolve                          | scope          |   500 |         93,105,227 |          1.47×†‡ |       6.98×† |        10.8×† |      20.2×† |     14.2×† |           1.75×†‡ |
| child-depth-8-resolve                          | scope          |   500 |         92,942,013 |          1.43×†‡ |       12.2×† |        15.5×† |      24.4×† |     29.8×† |           2.57×†‡ |
| child-request-lifecycle-create-resolve-dispose | scope          |   100 |          2,259,041 |            40.6× |       8.86×‡ |        4.31×‡ |           — |      1.33× |                 — |
| fresh-child-default-n1                         | scope          |   100 |         10,184,326 |           34.8×‡ |       6.37×‡ |         7.15× |           — |      1.89× |                 — |
| fresh-child-default-n4                         | scope          |   100 |          7,525,184 |           28.2×‡ |       5.65×‡ |         7.44× |           — |      2.55× |                 — |
| fresh-child-name-n1                            | scope          |   100 |          9,426,933 |           34.7×‡ |            — |             — |           — |          — |                 — |
| fresh-child-name-n4                            | scope          |   100 |          6,680,778 |           27.3×‡ |            — |             — |           — |          — |                 — |
| fresh-child-tag-n1                             | scope          |   100 |          9,479,477 |           36.8×‡ |            — |             — |           — |          — |                 — |
| fresh-child-tag-n4                             | scope          |   100 |          7,211,960 |           29.3×‡ |            — |             — |           — |          — |                 — |
| scale-mid-transient-chain-32                   | scale          |     1 |          1,382,052 |            2.55× |        4.69× |         4.34× |       12.1× |      1.48× |                 — |
| scale-deep-transient-chain-512                 | scale          |     1 |             56,295 |            1.58× |        22.0× |         3.87× |       7.51× |      1.21× |                 — |
| boot-decorated-container-build-and-resolve     | boot           |     1 |            526,350 |           17.7×‡ |            — |         0.84× |           — |          — |            1.67×‡ |
| container-create-empty                         | boot           |   100 |        26,501,524‡ |           37.9×‡ |       8.95×‡ |        1.11×‡ |      7.35×‡ |     1.61×‡ |           0.84×†‡ |
| create-child-empty                             | boot           |   100 |        18,398,367‡ |           35.8×‡ |       6.97×‡ |        0.86×‡ |      5.19×‡ |     1.27×‡ |           0.53×†‡ |
| bind-128-plain                                 | boot           |     1 |            191,172 |           31.6×‡ |       37.3×‡ |         0.97× |      10.00× |      0.44× |             2.29× |
| bind-128-refined                               | boot           |     1 |             28,259 |           4.81×‡ |            — |             — |           — |          — |                 — |
| misconfigured-missing-binding                  | failure        |     1 |           282,870‡ |           1.75×‡ |       2.18×‡ |        0.68×‡ |      0.73×‡ |     0.71×‡ |            0.91×‡ |
| circular-dependency-3                          | failure        |     1 |            154,744 |           188.5× |       1.48×‡ |             — |           — |          — |             0.46× |
| ambiguous-multi-binding                        | failure        |     1 |           172,547‡ |           1.13×‡ |            — |             — |           — |          — |                 — |
| production-http-handler                        | production     |    50 |          1,573,446 |           24.7×‡ |       6.55×‡ |        3.35×‡ |           — |      1.03× |                 — |
| production-unit-of-work                        | production     |   100 |            957,218 |           15.1×‡ |       5.98×‡ |        2.26×‡ |           — |      1.10× |                 — |
| production-event-bus-dispatch                  | production     |   100 |        40,121,478‡ |          10.1×†‡ |            — |       6.96×†‡ |           — |    0.65×†‡ |           1.04×†‡ |
| to-resolved-3-deps                             | micro          |   200 |       121,908,340‡ |          2.47×†‡ |            — |             — |     23.0×†‡ |    0.71×†‡ |           1.59×†‡ |
| to-alias-redirect                              | micro          |   500 |         87,108,223 |          1.73×†‡ |       4.86×† |        13.5×† |           — |          — |           1.01×†‡ |
| to-self-binding                                | micro          |   300 |       118,575,783‡ |          2.38×†‡ |            — |       7.72×†‡ |           — |          — |           2.31×†‡ |
| alias-chain-3                                  | micro          |   500 |         87,240,454 |           3.53×† |       11.3×† |        22.0×† |           — |          — |           1.10×†‡ |
| alias-parent-owned-terminal                    | micro          |   500 |         85,546,026 |          1.67×†‡ |       5.68×† |        14.0×† |           — |          — |           0.97×†‡ |
| alias-cycle-detected                           | failure        |     1 |           256,042‡ |          717.9×‡ |       2.36×‡ |             — |           — |          — |            0.81×‡ |
| resolve-optional-hit                           | micro          |   500 |       108,012,069‡ |          3.52×†‡ |      3.05×†‡ |             — |     18.6×†‡ |    0.58×†‡ |           1.24×†‡ |
| resolve-optional-miss                          | micro          |   500 |        145,502,189 |           4.62×† |       2.73×† |             — |     3.70×†‡ |     2.56×† |           1.65×†‡ |
| tagged-binding-resolve                         | micro          |   300 |        86,345,286‡ |          4.14×†‡ |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-1                         | micro          |   300 |        93,236,743‡ |          4.44×†‡ |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-4                         | micro          |   300 |        94,096,094‡ |          4.52×†‡ |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-16                        | micro          |   300 |        93,597,514‡ |          4.73×†‡ |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-64                        | micro          |   300 |        94,025,856‡ |          4.50×†‡ |            — |             — |           — |          — |                 — |
| conditional-injection-tagged                   | micro          |   300 |         59,829,730 |           2.17×† |            — |             — |      25.4×† |          — |                 — |
| rebind-hot-swap                                | lifecycle      |    50 |         12,152,920 |           34.5×‡ |        0.95× |             — |           — |     0.15×† |                 — |
| has-bound-check                                | introspection  |  1000 |        318,561,941 |           5.78×† |       1.17×† |        3.13×† |           — |     1.50×† |                 — |
| has-own-unbound-check                          | introspection  |  1000 |       612,633,591‡ |          6.53×†‡ |            — |       5.84×†‡ |           — |          — |                 — |
| container-level-activation-hook                | lifecycle      |   200 |         56,047,165 |           2.13×† |            — |       6.35×†‡ |           — |          — |                 — |
| scoped-binding-per-child                       | scope          |   100 |          5,455,400 |           44.5×‡ |       2.72×‡ |         1.83× |       4.49× |      1.30× |                 — |
| rebind-parent-resolve-child-depth-3            | lifecycle      |    50 |          8,832,052 |            53.6× |        1.01× |             — |           — |      1.01× |                 — |
| materialize-100-singletons                     | lifecycle      |     1 |             52,688 |            15.0× |       10.2×‡ |         2.02× |           — |      0.39× |                 — |
| unbind-all-100-singletons                      | lifecycle      |     1 |             38,176 |            13.1× |       8.51×‡ |        1.55×‡ |           — |      0.37× |                 — |
| module-load-unload                             | boot           |     1 |            937,235 |           19.4×‡ |            — |             — |           — |          — |                 — |
| module-cold-from-modules                       | boot           |     1 |          1,645,751 |            30.2× |            — |             — |       1.79× |      1.11× |                 — |
| initialize-async-warmup                        | boot           |     1 |            427,947 |                — |            — |             — |           — |          — |                 — |
| inspect-snapshot                               | introspection  |    20 |          9,086,002 |                — |            — |             — |           — |          — |                 — |
| lookup-bindings                                | introspection  |   200 |         23,366,299 |                — |            — |             — |           — |          — |                 — |
| generate-dependency-graph                      | introspection  |    10 |            726,793 |                — |            — |             — |           — |          — |                 — |
| multi-tag-slot-resolve                         | micro          |   300 |         12,140,531 |                — |            — |             — |           — |          — |                 — |
| multi-tag-constraint-resolve                   | micro          |   200 |          3,332,317 |                — |            — |             — |           — |          — |                 — |
| multi-tag-select-32                            | micro          |   300 |          3,338,888 |                — |            — |             — |           — |          — |                 — |
| mask-reject-wide-catalog                       | slot-selection |   300 |         39,956,269 |                — |            — |             — |           — |          — |                 — |
| mask-accept-two-of-four                        | slot-selection |   300 |         17,245,788 |                — |            — |             — |           — |          — |                 — |
| mask-collision-same-bit                        | slot-selection |   300 |         49,188,300 |                — |            — |             — |           — |          — |                 — |
| slot-tag-array-hoisted                         | slot-selection |   300 |        86,991,050‡ |                — |            — |             — |           — |          — |                 — |
| slot-tag-shorthand-hoisted                     | slot-selection |   300 |        90,439,984‡ |                — |            — |             — |           — |          — |                 — |
| slot-tag-array-inline                          | slot-selection |   300 |        64,849,232‡ |                — |            — |             — |           — |          — |                 — |
| slot-tag-shorthand-inline                      | slot-selection |   300 |        74,454,537‡ |                — |            — |             — |           — |          — |                 — |
| slot-tag-zero-value                            | slot-selection |   300 |        86,214,371‡ |          4.15×†‡ |            — |             — |           — |          — |                 — |
| slot-name-and-tag                              | slot-selection |   300 |         10,918,195 |            0.57× |            — |             — |           — |          — |                 — |
| slot-tag-resolve-all                           | slot-selection |   300 |         49,847,300 |           4.24×† |            — |             — |           — |          — |                 — |
| slot-tag-miss-optional                         | slot-selection |   300 |        15,429,080‡ |           0.62×‡ |            — |             — |           — |          — |                 — |
| slot-tag-parent-owned                          | slot-selection |   300 |        86,074,198‡ |          4.19×†‡ |            — |             — |           — |          — |                 — |
| slot-name-parent-owned                         | slot-selection |   300 |        82,696,014‡ |          3.45×†‡ |            — |             — |           — |          — |                 — |
| slot-injected-name-compiled                    | slot-selection |   300 |         57,279,794 |                — |            — |             — |           — |          — |                 — |
| slot-injected-name-interpreted                 | slot-selection |   300 |          4,373,870 |                — |            — |             — |           — |          — |                 — |
| slot-injected-tag-compiled                     | slot-selection |   300 |         57,772,823 |                — |            — |             — |           — |          — |                 — |
| slot-injected-tag-interpreted                  | slot-selection |   300 |          4,122,241 |                — |            — |             — |           — |          — |                 — |
| plan-deps-inlined                              | resolution     |   300 |         48,008,929 |                — |            — |             — |           — |          — |                 — |
| plan-escape-factory-dep                        | resolution     |   300 |          7,640,335 |                — |            — |             — |           — |          — |                 — |
| plan-escape-scoped-dep                         | resolution     |   300 |          9,692,713 |                — |            — |             — |           — |          — |                 — |
| plan-escape-hooked-dep                         | resolution     |   300 |          2,652,021 |                — |            — |             — |           — |          — |                 — |
| plan-escape-optional-dep                       | resolution     |   300 |          3,396,149 |                — |            — |             — |           — |          — |                 — |
| plan-escape-multi-dep                          | resolution     |   300 |           961,884‡ |                — |            — |             — |           — |          — |                 — |
| plan-class-chain-24                            | resolution     |     1 |          4,053,420 |                — |            — |             — |           — |          — |                 — |
| plan-class-chain-40                            | resolution     |     1 |            509,351 |                — |            — |             — |           — |          — |                 — |
| interpreted-class-chain-24                     | resolution     |     1 |            300,795 |                — |            — |             — |           — |          — |                 — |
| interpreted-class-chain-40                     | resolution     |     1 |            147,225 |                — |            — |             — |           — |          — |                 — |
| nested-context-resolve-in-factory              | resolution     |   300 |        42,523,088‡ |          1.73×†‡ |      3.51×†‡ |       5.96×†‡ |     17.7×†‡ |    2.24×†‡ |           0.93×†‡ |
| nested-container-resolve-in-factory            | resolution     |   300 |        36,083,616‡ |          1.56×†‡ |      2.57×†‡ |       5.04×†‡ |     14.7×†‡ |    1.06×†‡ |           0.88×†‡ |
| accessor-injection-construct                   | resolution     |   300 |          9,291,005 |            0.44× |            — |             — |           — |          — |                 — |

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
