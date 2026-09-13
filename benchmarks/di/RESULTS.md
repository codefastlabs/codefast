# Results

Where `@codefast/di` actually stands against the field right now, wins and losses given equal weight — the point of this
page is to know where the engine is slower so the next change knows what to aim at. One machine-derived snapshot, no
accreted ledger. The method is in [`BENCH_GUIDE.md`](./BENCH_GUIDE.md); re-run it with the recipe at the bottom.

**This is one full-profile pass, so read the aggregates, not the rows.** GC-exposed, one subprocess per scenario,
libraries interleaved with rotating order, 3 trials each — a single pass measures no between-run variance of its own,
222 of the comparable cells carry a per-trial IQR above 5%, and 118 rows sit above ~30M ops/s where the ratio moves
between runs of the same build whatever its IQR says. Ratios are worth more than the absolute `hz/op`; a single row is
worth less than the group it sits in. A loss highlighted below points at a direction — quote a precise factor only after
a paired re-run, except where a loss is a structural O(N) difference that reproduces by construction (called out as
such).

**This run reads against the pinned baseline.** Its id is `2026-09-13T19-40-32-903Z`, over the tree at `5e57752b2`; the
baseline it is compared to is `2026-09-13T04-45-37-460Z`, the last pass over the engine before the rewrite began, whose
observations are tracked under `baselines/` and pinned by `pnpm bench:baseline`. Every `Δ` on this page is that
comparison. The suite is unchanged between the two: 126 rows, 101 contract rows specified against the public API, 25
engine rows that name a lane of the resolver and enter no cross-library figure; every library implements every row its
declared features allow, so a `—` below is a feature the library lacks, never a row nobody wrote.

**Environment.** `@codefast/di` 0.9.0 from a `dist` the harness rebuilt first, on Node 26.1.0 / V8 14.6, Apple M3 Max ×
14, darwin/arm64, `--expose-gc` for every library. inversify 8.2.3 · awilix 13.0.5 · tsyringe 4.10.0 · brandi 5.1.0 ·
ditox 3.3.0 · injection-js 2.6.1. Each library runs at its canonical decorator mode (inversify legacy decorators +
`reflect-metadata`, codefast TC39 Stage 3 + `Symbol.metadata`); every inversify container uses `{ jitless: false }`, its
fastest documented configuration. Run 2026-09-13, 17m41s wall.

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

## Summary — where we stand

Ratios are `@codefast/di ÷ competitor`; above 1× means codefast is faster. Win `>1.03×`, parity `0.97–1.03×`, loss
`<0.97×`. `Comparable` counts the rows both libraries ran, of 112 aggregate-eligible rows codefast measures; `†` is how
many of those the median and geomean carry from above the throughput ceiling — they stay in the aggregate but no reader
should cite one alone.

| Competitor     | Comparable | Win / parity / loss | Median | Geomean |   † |
| -------------- | ---------: | ------------------: | -----: | ------: | --: |
| InversifyJS 8  |  91 of 112 |          86 / 0 / 5 |  3.11× |   4.48× |  38 |
| Awilix 13      |  38 of 112 |          36 / 1 / 1 |  4.91× |   4.72× |  15 |
| tsyringe 4     |  43 of 112 |          36 / 1 / 6 |  4.28× |   3.62× |  17 |
| Brandi 5       |  29 of 112 |          28 / 0 / 1 |  14.4× |   10.2× |  14 |
| Ditox 3        |  44 of 112 |         25 / 1 / 18 |  1.14× |   1.29× |  16 |
| injection-js 2 |  31 of 112 |          20 / 2 / 9 |  1.22× |   1.28× |  18 |

**The headline, stated plainly: codefast sweeps inversify, awilix and brandi, wins tsyringe on the median by 4.3× while
still losing it six rows, and has crossed to wins against the two libraries it was losing to — ditox on the median
(1.14×, from 0.72× at the baseline) and the geomean (1.29×, from 0.66×) while still losing it 18 of 44 rows,
injection-js on both (1.22× and 1.28×, from 0.99× and 0.70×) while losing it 9 of 31.** Against the baseline, 49 of
codefast's 126 rows are more than 10% faster and 41 read as improved beyond noise; the seven that read down beyond noise
are named below, each with what a paired re-measure says. Every remaining loss is still one of the same shapes —
**registration**, **cold collections**, **rebind**, the **two selection lanes**, the **accessor lane** — but the
registration deficit that headed this list is now a fraction of itself (`bind-128-plain` 8.4× its baseline), the cold
collections are three to ten times theirs, and the per-request child rows against ditox are at parity or wins. Where
codefast wins it still wins on the warm resolve, which is what a request pays after the container is built; what this
round moved is the price of building a container, of binding into it, and of collecting from it.

## The losses, foregrounded — where to improve

Ordered by how much they matter, each marked as a **real deficit** (same work, codefast slower) or a **work difference**
(codefast does more per op by design, so the row is a design cost to reconsider, not a bug). Where the baseline is
quoted, it is the same row in `2026-09-13T04-45-37-460Z`.

- **Registration is still the biggest deficit, and it is now a ditox-only one.** `bind-128-plain` — 128 transient
  factory bindings into a fresh container, no resolve — runs at 0.42× ditox, 1.02× tsyringe and 2.27× injection-js, from
  0.05×, 0.12× and 0.28×: the row is 8.4× faster than the baseline, because the fluent chain is now the binding it
  registers (one allocation per bind, a numeric id, one map write). Everything that binds before it resolves moved with
  it — `container-create-empty` 1.11× tsyringe and 1.61× ditox (from 0.30× and 0.45×), `create-child-empty` 0.89× and
  1.25× (from 0.36× and 0.48×), `realistic-graph-cold-resolve` 1.01× ditox and 2.39× tsyringe (from 0.37× and 0.90×),
  `realistic-graph-class-cold-resolve` 0.54× ditox, 0.80× tsyringe and 1.61× injection-js (from 0.16×, 0.24× and 0.49×),
  `boot-decorated-container-build-and-resolve` 0.78× tsyringe and 1.61× injection-js (from 0.19× and 0.41×),
  `module-cold-from-modules` 1.10× ditox and 1.77× brandi (from 0.27× and 0.42×). The two empty-container rows still
  lose injection-js above the ceiling (0.83×† and 0.53×†). What the registration path still pays is the binding object
  with every kind's fields on one hidden class, and the registry write; ditox's `bindFactory` is a map write and a
  closure. **Real deficit, structural** — one object per binding is the design.
- **Cold collections still lose; stable ones no longer do.** `resolve-all-cold-N` builds a fresh container and reads the
  collection once: 0.19× tsyringe, 0.46× ditox and 0.53× injection-js at N=100 (from 0.03×, 0.08× and 0.09×), 0.43×,
  0.68× and 0.91× at N=10 — five to ten times the baseline, because a hundred `many()` members on one token append to
  one list and evaluate no predicate. The stable rows crossed over: `resolve-all-strategies-100` reads 15.0× tsyringe,
  0.68× ditox and 0.80× injection-js (from 1.29×, 0.03× and 0.04×), `resolve-all-strategies-10` 3.13×, 0.77× and 0.93×
  (from 0.97×, 0.24× and 0.28×), because a root-level read with no options memoizes its candidate list until the chain
  changes and its value list while every member is a hook-free constant. What the cold pair still pays is the
  registration above. **Real deficit on the cold pair, a registration cost seen from the collection side.**
- **Teardown at scale is a registration loss wearing a lifecycle label.** `materialize-100-singletons` (bind and resolve
  100 singletons, no teardown) is 0.39× ditox and 2.04× tsyringe; `unbind-all-100-singletons` (the same, then dispose)
  is 0.37× and 1.57×. The two ratios against ditox are the same, so the teardown walk costs nothing the rivals do not
  pay — the loss is the 100 bindings above. `lifecycle-pre-destroy-unbind` (one singleton, one hook) at 0.83× ditox and
  1.66× tsyringe is the same story at N=1. **Work difference on the hook, real deficit on the registration underneath.**
- **Rebind is at parity with awilix and still slow against ditox.** `rebind-hot-swap` 0.90× awilix (from 0.18×) and
  0.15×† ditox; `rebind-parent-resolve-child-depth-3` 0.99× awilix and 1.18× ditox (from 0.24× and 0.29×). Both rows are
  four to five times their baseline; the shape is unchanged: a rebind unbinds, re-registers and bumps the chain's
  version. **Work difference**; a rebind that patches the existing slot in place would close what is left.
- **The two selection lanes no index serves: three times faster, and still losses.** `slot-name-and-tag` — a request
  carrying a name and a tag — is 0.56× inversify (from 0.19×) and `slot-tag-miss-optional` — a tagged request matching
  nothing over a populated token — is 0.61× (from 0.25×). Both get an allocation-free first pass over the token's
  candidates before full selection; what remains is the scan itself against inversify's single constraint pass. **Real
  deficit**, narrow: a combined name-plus-tag index entry would make the first lane an index hit, and a negative memo
  keyed on the chain version would make the second one.
- **`accessor-injection-construct` 0.40× inversify, from 0.30×.** A class with one `@inject` accessor compiles as a plan
  root, its own frame on the path while the accessors resolve; what it still pays is the ambient scope around
  construction and the accessor's own `resolve` through the container, where inversify's property injection is a
  metadata read on the same plan. **Work difference**, and the row that says what property injection costs relative to
  constructor injection.
- **`resolve-all-async-8` 0.59× inversify, from 0.45×.** Every member takes the non-`async` factory lane a single
  `resolveAsync` takes; what remains is a branch stack and a level context per member against inversify's plain
  `Promise.all`. **Real deficit** on a row that is otherwise codefast's own territory (every other async row is a win).
- **Per-request child work against ditox is at parity now.** `production-http-handler` 0.96× (from 0.42×),
  `production-unit-of-work` 1.05× (from 0.48×), `child-request-lifecycle-create-resolve-dispose` 1.35× (from 0.53×),
  `scoped-binding-per-child` 1.34×, `fresh-child-default-n1` 1.90×. Every one is a registration into a fresh child, so
  what is left of the first bullet seen from the request side.
- **Warm singleton reads: 0.78×† and 0.72×† ditox on `constant-resolve` and `singleton-class-1-dep`**, unchanged.
  ditox's `get` is close to a map read; codefast still carries its binding and lifecycle shape on every resolve. Both
  rows sit above 120M ops/s, inside the band that stops reproducing between runs. **Real deficit, ceiling-bound.**
- **Failing fast costs more here: `misconfigured-missing-binding` 0.68× tsyringe, 0.71× ditox, 0.73× brandi, 0.91×
  injection-js**, unchanged. codefast builds a structured error with the resolution path; the rivals throw a string.
  **Work difference** on a path a production request should never take.
- **Rows that read down against the baseline in this pass.** Two families, each traced.
  - The indexed collections: `resolve-all-named-16` and `-32` read 0.78× and 0.79× of their baseline throughput (0.94×
    and 0.95× at N=8 and N=64). Paired and alternating against the pre-rewrite source the same rows read 0.91–0.98× with
    overlapping spreads, localised to the half of the branch holding the numeric id, the collection memo's container
    routing and the accessor plan root. The rows sit at 15–19M ops/s, the band this page flags as unstable. **Open**: a
    small loss on the indexed collection lane, to re-measure before the next change to `resolveAll` or the tagged index.
  - The compiled-plan engine rows: `plan-deps-inlined` 0.80× of its baseline and 0.76× of the previous pass,
    `slot-injected-name-compiled` and `slot-injected-tag-compiled` 0.81×, `plan-escape-factory-dep` 0.90×, the optional,
    hooked and scoped escape rows 0.85–0.89× of the previous pass. A bisect over the branch's last three commits placed
    the whole move in the shared metadata caches, and a replay of the bench process against the built `dist` found the
    mechanism: it is not a per-resolve cost — the same container alone runs its plan at the same speed either way, one
    plan compiled — but every compiled plan is a closure over the plan compiler's literals, so plans share their
    call-site feedback, and the inlined root's four dependency calls go polymorphic once a factory-leaf, a scoped-leaf
    and a hooked-leaf sibling have compiled theirs (36 → 53 ns/op; the old caches reproduce the same figure when the
    siblings are forced to compile). Sharing the caches only lets a sibling compile on its first resolve instead of its
    second, which is what the isolated subprocess used to be spared. A process with several plan shapes is what an
    application is, so the rows now read that; per-plan function identity — generated code per plan — is the change that
    would give every plan its own monomorphic sites. **Open, engine rows only**: none enters a cross-library figure.
  - `realistic-graph-resolved-root` 0.93× and `generate-dependency-graph` 0.94× read 1.00× and 1.04× paired against the
    pre-step commit; `plan-class-chain-40` 0.94× is the plan-feedback family above at depth.

One retraction against the baseline ledger stands. **The parent walk had a slope and no longer does.**
`child-depth-N-resolve` against inversify read 1.42× at depth 1 and 0.94×† at depth 8 at the baseline; it now reads
1.56×† at depth 1 and 1.53×† at depth 8, because the summed chain version a descendant's memo is stamped with is
re-walked only when the process-wide state epoch has moved. Against ditox and awilix the slope still runs the other way
(4.15× → 25.3×, 3.71× → 12.4×). Above the ceiling at every depth, so the flatness is the finding, not any one cell.

## The wins

- **inversify — 86 of 91 comparable rows, 3.11× median, 4.48× geomean.** Widest margins on `failure`'s
  `circular-dependency-3` and `alias-cycle-detected` (both excluded — inversify recurses to the stack limit rather than
  detecting either), then `boot` (21.0× geomean), `production` (14.6×), `scope` (11.9×), `lifecycle` (9.95×),
  `introspection` (6.18×), `fan-out` (5.33×); tightest on `resolution` (1.05×, the accessor row) and `async` (1.39×).
  Every fresh-child row is 34–37×, every production row 15–24×, `bind-128-plain` 33×, and the `child-depth` axis is flat
  at 1.5–1.6×†.
- **Awilix 13 — 36 of 38, 4.91× median**, up to 12× on the deep child walk and 37× on `bind-128-plain`; loses only
  `rebind-hot-swap` (0.90×) and sits at parity on the other rebind row.
- **tsyringe 4 — 36 of 43, 4.28× median**, 11.8× on `micro` and 6.65× on `scope`; the stable-set collections that were
  its rows are now codefast's (15.0× at N=100), `bind-128-plain` is at parity (1.02×, from 0.12×) and
  `realistic-graph-cold-resolve` 2.39×; it still wins the cold collections (0.19× and 0.43×), `boot-decorated-*`
  (0.78×), the class-cold graph (0.80×), `create-child-empty` (0.89×) and the missing-binding throw (0.68×).
- **Brandi 5 — 28 of 29, 14.4× median**, 36× on transient micro; loses only the missing-binding throw
  (`module-cold-from-modules`, its other row at the baseline, is 1.77× now).
- **Against ditox codefast now wins more rows than it loses (25 to 18) and both aggregates (1.14× median, 1.29× geomean,
  from 0.72× and 0.66×).** The warm work — `transient-class-1-dep` 7.91×†, `realistic-graph-resolve-root` 1.72×,
  `realistic-graph-class-resolve-root` 1.92×, every `child-depth` row 4.15–25.3×† — and now the cold and per-request
  work too: `container-create-empty` 1.61×, `fresh-child-default-n1` 1.90×,
  `child-request-lifecycle-create-resolve-dispose` 1.35×, `scoped-binding-per-child` 1.34×, `create-child-empty` 1.25×,
  `module-cold-from-modules` 1.10×, `production-unit-of-work` 1.05×, `realistic-graph-cold-resolve` 1.01×. It still
  loses every row that binds many things (`bind-128-plain` 0.42×, the two 100-singleton lifecycle rows 0.37–0.39×, the
  class-cold graph 0.54×), the cold collections (0.46–0.68×), the stable collections (0.68–0.77×) and the two warm
  singleton reads above the ceiling.
- **Against injection-js the geomean crossed to 1.28× and the median to 1.22×** (from 0.70× and 0.99×; 20 wins, 2
  parity, 9 losses). The warm rows are wins (`singleton-class-1-dep` 2.67×†, `realistic-graph-class-resolve-root` 1.56×,
  `realistic-graph-resolve-root` 1.34×) and so, now, is registration (`bind-128-plain` 2.27×,
  `realistic-graph-cold-resolve` 2.11×, `boot-decorated-*` 1.61×, the class-cold graph 1.61×); the losses are the
  collections (cold 0.53× and 0.91×, stable 0.80× and 0.93×), the two empty-container rows above the ceiling,
  `async-init-single-hop` 0.90× and the missing-binding throw 0.91×.
- **The selection axes are flat where they should be.** `named-resolve-slots-1/64` read 3.08× and 3.14× inversify and
  `tagged-resolve-slots-1/64` 4.64× and 4.36× with no trend across N: both lanes are indexed, and the axis proves it.
- **What this round moved, against the baseline.** `resolve-all-strategies-100` 21×, `resolve-all-cold-10` 10×,
  `bind-128-plain` 8.4×, `resolve-all-cold-100` 5.7×, `rebind-hot-swap` 5.0×, `rebind-parent-resolve-child-depth-3`
  4.1×, `boot-decorated-container-build-and-resolve` 4.1×, `module-cold-from-modules` 4.0×, `container-create-empty`
  3.9×, `realistic-graph-class-cold-resolve` 3.4×, `slot-name-and-tag` 3.0×, `materialize-100-singletons` 3.0×,
  `resolve-all-strategies-10` 3.0×, `production-event-bus-dispatch` 2.9×, `slot-tag-miss-optional` 2.9×,
  `multi-tag-slot-resolve` 2.8×, `realistic-graph-cold-resolve` 2.8×, `bind-128-refined` 2.8×, `module-load-unload`
  2.7×, `has-own-unbound-check` 2.7×, `create-child-empty` 2.7×, `child-request-lifecycle-create-resolve-dispose` 2.6×,
  `lifecycle-pre-destroy-unbind` 2.6×, `production-http-handler` 2.6×, `unbind-all-100-singletons` 2.5×, the
  `fresh-child-*-n1` rows 2.2–2.4×, `production-unit-of-work` 2.3×, `initialize-async-warmup` 2.1×, the
  `fresh-child-*-n4` rows 1.9–2.1×, `scoped-binding-per-child` 1.8×, `inspect-snapshot` 1.7×, `child-depth-8-resolve`
  1.6×, `resolve-optional-miss` 1.5×, `accessor-injection-construct` 1.4×, `resolve-all-async-8` 1.3× — 49 of 126 rows
  more than 10% faster, with the warm resolve rows (`constant-resolve` 1.04×, `singleton-class-1-dep` 1.00×,
  `transient-class-1-dep` 1.10×, `realistic-graph-resolve-root` 1.01×, `plan-class-chain-24` 1.02×) at parity, which is
  what every step's paired check was gated on.

## Geomean by group

Geomean of the ratios in each group, comparable row count in parentheses. Read a group, not a cell.

| Group          | InversifyJS 8 | Awilix 13 | tsyringe 4 |  Brandi 5 |   Ditox 3 | injection-js 2 |
| -------------- | ------------: | --------: | ---------: | --------: | --------: | -------------: |
| micro          |    2.84× (22) | 4.71× (8) |  11.8× (7) | 16.8× (8) | 1.43× (7) |      1.43× (9) |
| realistic      |     4.21× (5) | 4.82× (4) |  2.96× (4) | 10.4× (5) | 1.26× (5) |      1.60× (5) |
| fan-out        |     5.33× (9) | 2.20× (1) |  1.74× (5) | 11.8× (1) | 0.82× (5) |      0.77× (4) |
| async          |    1.39× (10) | 1.06× (1) |  1.19× (1) | 2.24× (1) | 0.96× (1) |      0.90× (1) |
| lifecycle      |     9.95× (8) | 3.41× (5) |  2.37× (4) |         — | 0.46× (5) |              — |
| scope          |    11.9× (12) | 5.87× (8) |  6.65× (8) | 14.6× (5) | 4.19× (8) |      2.06× (4) |
| scale          |     1.93× (2) | 10.8× (2) |  3.98× (2) | 9.47× (2) | 1.37× (2) |              — |
| boot           |     21.0× (7) | 13.0× (3) |  0.94× (4) | 5.09× (4) | 0.98× (4) |      1.13× (4) |
| failure        |     1.47× (2) | 2.14× (1) |  0.68× (1) | 0.73× (1) | 0.71× (1) |      0.91× (1) |
| production     |     14.6× (3) | 5.92× (2) |  3.49× (3) |         — | 0.85× (3) |      1.06× (1) |
| introspection  |     6.18× (2) | 1.16× (1) |  4.30× (2) |         — | 1.50× (1) |              — |
| slot-selection |     2.13× (6) |         — |          — |         — |         — |              — |
| resolution     |     1.05× (3) | 3.03× (2) |  5.44× (2) | 16.3× (2) | 1.54× (2) |      0.91× (2) |

The `boot` group against tsyringe, ditox and injection-js (0.94×, 0.98×, 1.13×) is the registration deficit in one
number, from 0.22–0.27× at the baseline: at the group level it is closed, and what remains of it is the single
`bind-128-plain` row against ditox and the class-cold graph. The `fan-out` group against tsyringe went from 0.37× to
1.74× and against ditox and injection-js from 0.16× and 0.10× to 0.82× and 0.77×: the stable-set collection rows are
memoized and the cold pair is `many()` members now, and only the cold pair still loses. `production` against ditox
(0.85×, from 0.34×) and injection-js (1.06×, from 0.30×) is the per-request child rows. `lifecycle` against ditox
(0.46×) is the two 100-singleton rows, the registration deficit again. `resolution` against inversify stays at 1.05×,
the accessor row against the plan rows. `failure` against inversify stays at 1.47× because `alias-cycle-detected` is
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
| constant-resolve                               | micro          |  1000 |       146,100,227‡ |          2.10×†‡ |      3.68×†‡ |       9.27×†‡ |     25.0×†‡ |    0.78×†‡ |           1.13×†‡ |
| singleton-class-1-dep                          | micro          |   200 |       121,765,698‡ |          2.48×†‡ |      2.98×†‡ |       8.74×†‡ |     22.8×†‡ |    0.72×†‡ |           2.67×†‡ |
| transient-class-1-dep                          | micro          |   200 |         75,124,629 |          2.05×†‡ |       8.30×† |        15.3×† |      35.7×† |     7.91×† |                 — |
| named-constant-get                             | micro          |   500 |        78,838,203‡ |          3.04×†‡ |            — |             — |           — |          — |                 — |
| named-resolve-slots-1                          | micro          |   500 |        82,795,352‡ |          3.08×†‡ |            — |             — |           — |          — |                 — |
| named-resolve-slots-4                          | micro          |   500 |        83,412,320‡ |          3.13×†‡ |            — |             — |           — |          — |                 — |
| named-resolve-slots-16                         | micro          |   500 |        83,214,965‡ |          3.11×†‡ |            — |             — |           — |          — |                 — |
| named-resolve-slots-64                         | micro          |   500 |        83,301,677‡ |          3.14×†‡ |            — |             — |           — |          — |                 — |
| optional-missing-transient                     | micro          |   200 |         31,211,943 |           0.96×† |            — |             — |      8.26×† |     2.39×† |                 — |
| realistic-graph-resolve-root                   | realistic      |    20 |         18,608,373 |            2.62× |        2.90× |        8.61×‡ |       18.1× |      1.72× |            1.34×‡ |
| realistic-graph-cold-resolve                   | realistic      |     1 |           265,796‡ |           12.1×‡ |       4.19×‡ |        2.39×‡ |      5.26×‡ |     1.01×‡ |            2.11×‡ |
| realistic-graph-resolved-root                  | realistic      |    20 |         20,230,118 |            1.38× |            — |             — |       19.3× |      1.79× |            1.46×‡ |
| realistic-graph-class-resolve-root             | realistic      |    20 |        14,892,261‡ |           1.39×‡ |       3.09×‡ |        4.64×‡ |      14.8×‡ |     1.92×‡ |            1.56×‡ |
| realistic-graph-class-cold-resolve             | realistic      |     1 |           341,111‡ |           21.9×‡ |       14.3×‡ |        0.80×‡ |      4.56×‡ |     0.54×‡ |            1.61×‡ |
| realistic-graph-validate                       | realistic      |    10 |         18,572,252 |                — |            — |             — |           — |          — |                 — |
| fan-out-tree-depth-3-breadth-4                 | fan-out        |    20 |          1,998,573 |            1.81× |        2.20× |         4.15× |       11.8× |      2.27× |                 — |
| resolve-all-strategies-10                      | fan-out        |     1 |        21,610,737‡ |           6.68×‡ |            — |        3.13×‡ |           — |     0.77×‡ |            0.93×‡ |
| resolve-all-strategies-100                     | fan-out        |     1 |        19,349,377‡ |           46.9×‡ |            — |        15.0×‡ |           — |     0.68×‡ |            0.80×‡ |
| resolve-all-cold-10                            | fan-out        |     1 |          1,311,824 |           28.9×‡ |            — |         0.43× |           — |      0.68× |            0.91×‡ |
| resolve-all-cold-100                           | fan-out        |     1 |             67,125 |           9.07×‡ |            — |        0.19×‡ |           — |      0.46× |             0.53× |
| resolve-all-named-8                            | fan-out        |     1 |        19,029,789‡ |           2.47×‡ |            — |             — |           — |          — |                 — |
| resolve-all-named-16                           | fan-out        |     1 |        17,200,704‡ |           2.15×‡ |            — |             — |           — |          — |                 — |
| resolve-all-named-32                           | fan-out        |     1 |        14,612,404‡ |           1.81×‡ |            — |             — |           — |          — |                 — |
| resolve-all-named-64                           | fan-out        |     1 |        18,367,028‡ |           2.43×‡ |            — |             — |           — |          — |                 — |
| resolve-async-single-hop                       | async          |     1 |          9,482,225 |            1.35× |            — |             — |           — |          — |                 — |
| async-init-single-hop                          | async          |     1 |          4,370,157 |            1.29× |        1.06× |         1.19× |       2.24× |      0.96× |             0.90× |
| dynamic-async-chain-8                          | async          |     1 |          2,185,933 |            1.56× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-8                      | async          |     1 |          1,092,575 |            1.62× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-16                     | async          |     1 |            558,680 |            1.72× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-32                     | async          |     1 |            263,443 |            1.63× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-64                     | async          |     1 |            139,790 |            1.79× |            — |             — |           — |          — |                 — |
| async-branch-chain-8                           | async          |     1 |            477,157 |                — |            — |             — |           — |          — |                 — |
| async-branch-escape-mid-chain-8                | async          |     1 |            817,109 |                — |            — |             — |           — |          — |                 — |
| async-diamond-shared-leaf                      | async          |     1 |          1,953,308 |            1.37× |            — |             — |           — |          — |                 — |
| plan-async-resolved-chain-8                    | async          |     1 |            974,441 |                — |            — |             — |           — |          — |                 — |
| plan-async-class-chain-8                       | async          |     1 |          2,502,266 |                — |            — |             — |           — |          — |                 — |
| resolve-all-async-8                            | async          |     1 |           565,647‡ |           0.59×‡ |            — |             — |           — |          — |                 — |
| resolve-optional-async-miss                    | async          |     1 |          9,176,077 |            1.53× |            — |             — |           — |          — |                 — |
| lifecycle-post-construct-singleton             | lifecycle      |   250 |       121,775,897‡ |          2.49×†‡ |            — |             — |           — |          — |                 — |
| lifecycle-pre-destroy-unbind                   | lifecycle      |     1 |          2,119,227 |            24.1× |       5.51×‡ |        1.66×‡ |           — |      0.83× |                 — |
| binding-level-activation-hook                  | lifecycle      |   200 |        51,871,067‡ |          2.00×†‡ |            — |             — |           — |          — |                 — |
| child-depth-1-resolve                          | scope          |   500 |         92,881,012 |          1.56×†‡ |       3.71×† |        7.06×† |      17.1×† |     4.15×† |           2.11×†‡ |
| child-depth-2-resolve                          | scope          |   500 |         92,206,024 |          1.43×†‡ |       4.94×† |        8.19×† |      17.8×† |     6.82×† |           1.88×†‡ |
| child-depth-4-resolve                          | scope          |   500 |         91,665,343 |          1.43×†‡ |       6.84×† |        10.7×† |      19.6×† |     15.0×† |           1.88×†‡ |
| child-depth-8-resolve                          | scope          |   500 |         92,584,308 |          1.53×†‡ |       12.4×† |        15.5×† |      24.4×† |     25.3×† |           2.43×†‡ |
| child-request-lifecycle-create-resolve-dispose | scope          |   100 |          2,261,546 |            41.1× |       8.82×‡ |        4.28×‡ |           — |      1.35× |                 — |
| fresh-child-default-n1                         | scope          |   100 |         10,200,569 |           34.6×‡ |       6.37×‡ |         7.20× |           — |      1.90× |                 — |
| fresh-child-default-n4                         | scope          |   100 |          7,447,976 |           26.2×‡ |       5.58×‡ |         7.26× |           — |      2.57× |                 — |
| fresh-child-name-n1                            | scope          |   100 |          9,928,149 |           36.7×‡ |            — |             — |           — |          — |                 — |
| fresh-child-name-n4                            | scope          |   100 |          6,602,976 |           25.2×‡ |            — |             — |           — |          — |                 — |
| fresh-child-tag-n1                             | scope          |   100 |          9,628,608 |           36.0×‡ |            — |             — |           — |          — |                 — |
| fresh-child-tag-n4                             | scope          |   100 |          7,129,255 |           29.6×‡ |            — |             — |           — |          — |                 — |
| scale-mid-transient-chain-32                   | scale          |     1 |          1,417,340 |            2.49× |        4.77× |         4.28× |       12.3× |      1.57× |                 — |
| scale-deep-transient-chain-512                 | scale          |     1 |             54,626 |            1.49× |        24.3× |         3.69× |       7.32× |      1.20× |                 — |
| boot-decorated-container-build-and-resolve     | boot           |     1 |            503,151 |           16.8×‡ |            — |         0.78× |           — |          — |            1.61×‡ |
| container-create-empty                         | boot           |   100 |        26,524,453‡ |           37.2×‡ |       8.95×‡ |        1.11×‡ |      7.43×‡ |     1.61×‡ |           0.83×†‡ |
| create-child-empty                             | boot           |   100 |        18,238,488‡ |           32.9×‡ |       6.65×‡ |        0.89×‡ |      5.13×‡ |     1.25×‡ |           0.53×†‡ |
| bind-128-plain                                 | boot           |     1 |            187,892 |           33.4×‡ |       36.9×‡ |         1.02× |       9.92× |      0.42× |             2.27× |
| bind-128-refined                               | boot           |     1 |             28,389 |           4.98×‡ |            — |             — |           — |          — |                 — |
| misconfigured-missing-binding                  | failure        |     1 |           282,749‡ |           1.75×‡ |       2.14×‡ |        0.68×‡ |      0.73×‡ |     0.71×‡ |            0.91×‡ |
| circular-dependency-3                          | failure        |     1 |            154,090 |           172.5× |       1.46×‡ |             — |           — |          — |             0.46× |
| ambiguous-multi-binding                        | failure        |     1 |           189,218‡ |           1.24×‡ |            — |             — |           — |          — |                 — |
| production-http-handler                        | production     |    50 |          1,495,680 |           23.6×‡ |       6.17×‡ |        3.23×‡ |           — |      0.96× |                 — |
| production-unit-of-work                        | production     |   100 |           924,931‡ |           14.8×‡ |       5.68×‡ |        2.22×‡ |           — |     1.05×‡ |                 — |
| production-event-bus-dispatch                  | production     |   100 |        36,149,956‡ |          9.00×†‡ |            — |       5.90×†‡ |           — |    0.60×†‡ |           1.06×†‡ |
| to-resolved-3-deps                             | micro          |   200 |       122,930,085‡ |          2.52×†‡ |            — |             — |     24.2×†‡ |    0.71×†‡ |           1.60×†‡ |
| to-alias-redirect                              | micro          |   500 |         87,096,509 |          1.72×†‡ |       4.88×† |        13.4×† |           — |          — |           1.01×†‡ |
| to-self-binding                                | micro          |   300 |       116,634,301‡ |          2.32×†‡ |            — |       7.32×†‡ |           — |          — |           2.27×†‡ |
| alias-chain-3                                  | micro          |   500 |         86,140,039 |           3.53×† |       11.5×† |        21.7×† |           — |          — |           1.08×†‡ |
| alias-parent-owned-terminal                    | micro          |   500 |         85,595,361 |          1.61×†‡ |       5.74×† |       12.0×†‡ |           — |          — |           1.05×†‡ |
| alias-cycle-detected                           | failure        |     1 |           259,264‡ |          729.3×‡ |       2.55×‡ |             — |           — |          — |            0.83×‡ |
| resolve-optional-hit                           | micro          |   500 |       107,192,894‡ |          3.53×†‡ |      3.00×†‡ |             — |     18.6×†‡ |    0.58×†‡ |           1.22×†‡ |
| resolve-optional-miss                          | micro          |   500 |        146,173,492 |           4.63×† |       2.78×† |             — |     3.72×†‡ |     2.77×† |           1.65×†‡ |
| tagged-binding-resolve                         | micro          |   300 |        86,502,073‡ |          4.18×†‡ |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-1                         | micro          |   300 |        93,891,805‡ |          4.64×†‡ |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-4                         | micro          |   300 |        93,864,553‡ |          4.47×†‡ |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-16                        | micro          |   300 |        94,300,023‡ |          4.52×†‡ |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-64                        | micro          |   300 |        93,674,208‡ |          4.36×†‡ |            — |             — |           — |          — |                 — |
| conditional-injection-tagged                   | micro          |   300 |         53,194,003 |           1.92×† |            — |             — |      22.4×† |          — |                 — |
| rebind-hot-swap                                | lifecycle      |    50 |         11,696,903 |           34.2×‡ |        0.90× |             — |           — |     0.15×† |                 — |
| has-bound-check                                | introspection  |  1000 |        317,677,090 |           5.78×† |       1.16×† |        3.11×† |           — |     1.50×† |                 — |
| has-own-unbound-check                          | introspection  |  1000 |       620,093,766‡ |          6.61×†‡ |            — |       5.94×†‡ |           — |          — |                 — |
| container-level-activation-hook                | lifecycle      |   200 |        56,571,189‡ |          2.19×†‡ |            — |       5.88×†‡ |           — |          — |                 — |
| scoped-binding-per-child                       | scope          |   100 |          5,497,865 |           45.0×‡ |        2.90× |         1.78× |       4.61× |      1.34× |                 — |
| rebind-parent-resolve-child-depth-3            | lifecycle      |    50 |          8,375,504 |            50.1× |        0.99× |             — |           — |      1.18× |                 — |
| materialize-100-singletons                     | lifecycle      |     1 |            54,271‡ |           15.8×‡ |       11.1×‡ |        2.04×‡ |           — |     0.39×‡ |                 — |
| unbind-all-100-singletons                      | lifecycle      |     1 |            39,012‡ |           13.5×‡ |       8.48×‡ |        1.57×‡ |           — |     0.37×‡ |                 — |
| module-load-unload                             | boot           |     1 |            916,812 |            19.0× |            — |             — |           — |          — |                 — |
| module-cold-from-modules                       | boot           |     1 |          1,633,053 |           27.9×‡ |            — |             — |       1.77× |      1.10× |                 — |
| initialize-async-warmup                        | boot           |     1 |            408,119 |                — |            — |             — |           — |          — |                 — |
| inspect-snapshot                               | introspection  |    20 |          9,064,646 |                — |            — |             — |           — |          — |                 — |
| lookup-bindings                                | introspection  |   200 |         23,216,932 |                — |            — |             — |           — |          — |                 — |
| generate-dependency-graph                      | introspection  |    10 |            756,952 |                — |            — |             — |           — |          — |                 — |
| multi-tag-slot-resolve                         | micro          |   300 |         11,793,139 |                — |            — |             — |           — |          — |                 — |
| multi-tag-constraint-resolve                   | micro          |   200 |          3,310,447 |                — |            — |             — |           — |          — |                 — |
| multi-tag-select-32                            | micro          |   300 |          3,228,828 |                — |            — |             — |           — |          — |                 — |
| mask-reject-wide-catalog                       | slot-selection |   300 |         37,542,553 |                — |            — |             — |           — |          — |                 — |
| mask-accept-two-of-four                        | slot-selection |   300 |         17,524,976 |                — |            — |             — |           — |          — |                 — |
| mask-collision-same-bit                        | slot-selection |   300 |         49,895,797 |                — |            — |             — |           — |          — |                 — |
| slot-tag-array-hoisted                         | slot-selection |   300 |        87,161,364‡ |                — |            — |             — |           — |          — |                 — |
| slot-tag-shorthand-hoisted                     | slot-selection |   300 |        91,136,185‡ |                — |            — |             — |           — |          — |                 — |
| slot-tag-array-inline                          | slot-selection |   300 |        64,928,892‡ |                — |            — |             — |           — |          — |                 — |
| slot-tag-shorthand-inline                      | slot-selection |   300 |        74,968,946‡ |                — |            — |             — |           — |          — |                 — |
| slot-tag-zero-value                            | slot-selection |   300 |        86,416,539‡ |          4.26×†‡ |            — |             — |           — |          — |                 — |
| slot-name-and-tag                              | slot-selection |   300 |         10,892,592 |            0.56× |            — |             — |           — |          — |                 — |
| slot-tag-resolve-all                           | slot-selection |   300 |         50,328,351 |           4.20×† |            — |             — |           — |          — |                 — |
| slot-tag-miss-optional                         | slot-selection |   300 |        15,139,453‡ |           0.61×‡ |            — |             — |           — |          — |                 — |
| slot-tag-parent-owned                          | slot-selection |   300 |        86,154,565‡ |          4.18×†‡ |            — |             — |           — |          — |                 — |
| slot-name-parent-owned                         | slot-selection |   300 |        82,683,982‡ |          3.64×†‡ |            — |             — |           — |          — |                 — |
| slot-injected-name-compiled                    | slot-selection |   300 |         18,294,973 |                — |            — |             — |           — |          — |                 — |
| slot-injected-name-interpreted                 | slot-selection |   300 |          4,253,945 |                — |            — |             — |           — |          — |                 — |
| slot-injected-tag-compiled                     | slot-selection |   300 |         18,098,497 |                — |            — |             — |           — |          — |                 — |
| slot-injected-tag-interpreted                  | slot-selection |   300 |          4,174,424 |                — |            — |             — |           — |          — |                 — |
| plan-deps-inlined                              | resolution     |   300 |         17,150,134 |                — |            — |             — |           — |          — |                 — |
| plan-escape-factory-dep                        | resolution     |   300 |          6,320,734 |                — |            — |             — |           — |          — |                 — |
| plan-escape-scoped-dep                         | resolution     |   300 |          8,062,066 |                — |            — |             — |           — |          — |                 — |
| plan-escape-hooked-dep                         | resolution     |   300 |          2,247,270 |                — |            — |             — |           — |          — |                 — |
| plan-escape-optional-dep                       | resolution     |   300 |          2,867,461 |                — |            — |             — |           — |          — |                 — |
| plan-escape-multi-dep                          | resolution     |   300 |           870,365‡ |                — |            — |             — |           — |          — |                 — |
| plan-class-chain-24                            | resolution     |     1 |          1,684,285 |                — |            — |             — |           — |          — |                 — |
| plan-class-chain-40                            | resolution     |     1 |            404,336 |                — |            — |             — |           — |          — |                 — |
| interpreted-class-chain-24                     | resolution     |     1 |            311,975 |                — |            — |             — |           — |          — |                 — |
| interpreted-class-chain-40                     | resolution     |     1 |            153,397 |                — |            — |             — |           — |          — |                 — |
| nested-context-resolve-in-factory              | resolution     |   300 |        43,979,932‡ |          1.88×†‡ |      3.68×†‡ |       5.99×†‡ |     18.6×†‡ |    2.25×†‡ |           0.98×†‡ |
| nested-container-resolve-in-factory            | resolution     |   300 |        34,771,232‡ |          1.52×†‡ |      2.50×†‡ |       4.94×†‡ |     14.4×†‡ |    1.06×†‡ |           0.85×†‡ |
| accessor-injection-construct                   | resolution     |   300 |          8,640,426 |            0.40× |            — |             — |           — |          — |                 — |

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
