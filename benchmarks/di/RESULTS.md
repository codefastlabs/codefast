# Results

Where `@codefast/di` actually stands against the field right now, wins and losses given equal weight — the point of this
page is to know where the engine is slower so the next change knows what to aim at. One machine-derived snapshot, no
accreted ledger. The method is in [`BENCH_GUIDE.md`](./BENCH_GUIDE.md); re-run it with the recipe at the bottom.

**This is one full-profile pass, so read the aggregates, not the rows.** GC-exposed for one collection between trials,
one subprocess per scenario, libraries interleaved with rotating order, 3 trials each over the one closure a scenario
builds before its first trial — a single pass measures no between-run variance of its own, 92 of the cells carry a
per-trial IQR above 5%, and 145 rows sit above ~30M ops/s where the ratio moves between runs of the same build whatever
its IQR says. Ratios are worth more than the absolute `hz/op`; a single row is worth less than the group it sits in. A
loss highlighted below points at a direction — quote a precise factor only after a paired re-run, except where a loss is
a structural difference that reproduces by construction (called out as such). Two things the harness used to do are
gone: it forced a collection into the measured loop every hundred samples, and it built a fresh closure from each
scenario for every trial, which turns off V8's function-context specialization from the second closure on — so two of
every three trials read unspecialized code, and the median was that. Every trial now reads the closure an application's
call site would.

**This run reads against the pinned baseline.** It is `results-source/2026-09-20T14-35-20-579Z`, over `main` at
`2076c0338` — the cold-path redesign, the one-async-lane series, a transient factory root's kept context and the lookup
memo's inlined hit — measured by the harness at the same commit; the baseline it is compared to is
`baselines/2026-09-14T23-41-04-932Z`, the last full pass over the previous engine (byte-identical to `0.10.0`), pinned
by `pnpm bench:baseline`. Both runs' `observations.jsonl` are committed — the baseline under `baselines/`, this run
under `results-source/` — so every `Δ` on this page is that comparison read from data in the repository, not from a
local `bench-results/` run only the author has. The suite grew by the 18 `plan-runs-*` rows that priced the codegen
tier's count, engine rows that enter no cross-library figure; the 126 rows the two runs share are compared one to one.
Every library implements every row its declared features allow, so a `—` below is a feature the library lacks, never a
row nobody wrote.

**Environment.** `@codefast/di` 0.10.1 (the pass ran on tree `2076c0338`, which carries the round's unreleased changes
on top of `0.10.1`) from a `dist` the harness rebuilt first, on Node 26.1.0 / V8 14.6, Apple M3 Max × 14, darwin/arm64,
`--expose-gc` for every library. inversify 8.2.3 · awilix 13.0.5 · tsyringe 4.10.0 · brandi 5.1.0 · ditox 3.3.0 ·
injection-js 2.6.1. Each library runs at its canonical decorator mode (inversify legacy decorators + `reflect-metadata`,
codefast TC39 Stage 3 + `Symbol.metadata`); every inversify container uses `{ jitless: false }`, its fastest documented
configuration. Run 2026-09-20, 2m10s wall; the 1-minute load average read 2.05 at every child's start, on fourteen
cores.

## What changed since the baseline

Two series landed between the baseline pass and this one, each step one commit, each measured before it was kept — a
standalone probe of the scenario's own function for time, bytes and objects per op, a paired A/B in the harness at the
end of a group, and the differential test at a hundred runs before any engine commit. The records are
[`docs/decisions/di-cold-path-redesign.md`](../../docs/decisions/di-cold-path-redesign.md),
[`docs/decisions/di-resolution-engine-thresholds.md`](../../docs/decisions/di-resolution-engine-thresholds.md) and
[`docs/decisions/di-unified-resolution-pipeline.md`](../../docs/decisions/di-unified-resolution-pipeline.md); this page
reads the whole suite once, against the pinned baseline.

- **A container allocates nothing it has not used.** The lookup memo, the class introspector, the sync context pool and
  the registry's lone map are built by the first request that needs them; the plan host holds the introspector it was
  built with. A per-request child that is created, asked one parent-owned token and disposed allocates four objects
  where it allocated seven.
- **A root's plan is compiled on the request that repeats it.** The first resolve of a root interprets; a container that
  resolves a root once never runs the compiler, whose closures were a quarter of the allocation on a cold class graph.
- **A binding's activation need is stamped on the binding**, under the version pair it was computed for, instead of
  memoized in a per-resolver map that a container resolving each binding once built and never read again.
- **Teardown walks the singleton list once** and clears in place — no splice per removal, no pair object per binding.
- **A rebind of a lone token is one registration** whose displaced binding is deactivated on the spot, not an unbind
  followed by a bind.
- **A fresh registration is one probe, one write and one version read**, and a chain's own `.many()` re-slots its
  binding without probing the registry for it.
- **Each error class names itself with a literal** instead of a constructor lookup per throw.
- **Four size thresholds are gone, each replaced by the algorithm it approximated.** Alias chains fold exactly to any
  length; a generated plan is one statement per node and inlines to any depth; every synchronous lane checks a cycle by
  the binding's in-flight flag at any depth, with a seeded path marked around the call; a multi-criterion request is one
  scan at any binding count, the index union having cost more than the scan at every count measured. The one count left,
  the plan's codegen trigger, is 1024 runs — the measured break-even of generating a plan against running its closure —
  and `codefast audit constants` now refuses a numeric constant under `packages/di/src` that does not name its kind.
- **The resolution frame stays a bare literal.** Two carriers for the binding link a seeded path needs were measured and
  rejected: a weak map beside the frames cost every cold container an ephemeron insert per binding, and a class instance
  cost the dynamic chain a few nanoseconds per level; the binding rides under a module-private symbol.
- **Every lane answers a graph identically.** A `fast-check` differential test resolves random graphs through every
  entry point and holds them to one snapshot; the three divergences it found in the shipped engine — a child's miss
  classified against its own registry, a sibling on the async interpreted lane selected against the earlier sibling's
  frame, a dynamic factory run twice before a self-cycle was reported — are fixed and pinned.
- **An async level reports its first failing dependency in declaration order**, as the sync lanes do; the happy path is
  still `Promise.all` and one `then`.
- **One async lane.** The cascade — a shared frame stack pushed on factory entry, popped when the factory returned its
  promise, one context for every level — answered a factory that asked after an `await` from another chain's ancestors,
  a wrong value the differential probes found. Every `resolveAsync` now runs on the branch lane, each level owning its
  prefix for as long as its factory holds the context; the price is the three allocations a level owns, and the async
  rows below carry it.
- **Every predicate reads one constraint-context shape**, whatever lane built it.
- **A root-level `resolveAll` hands each caller a copy** of its memoized list, so no caller can mutate the engine's
  memo; the stable-set collection rows pay the copy.
- **A transient factory root keeps one context.** Resolved with `resolveAsync()` and no options, its path is its own
  frame alone, so the context is built on the first resolve and reused by every later one; the root allocates nothing
  per resolve where it minted an array and a context.
- **A repeated lookup through the chain-versioned memo is one inlined compare.** The memo's hit — same token, same chain
  version — is the whole of `defaultEntry()`, small enough for its callers to inline; the fill is a separate miss. An
  alias resolve and a parent-owned resolve from a child, the two shapes that reach the memo, pay one compare where they
  paid a call.

## Summary — where we stand

Ratios are `@codefast/di ÷ competitor`; above 1× means codefast is faster. Win `>1.03×`, parity `0.97–1.03×`, loss
`<0.97×`. `Comparable` counts the rows both libraries ran, of 130 aggregate-eligible rows codefast measures; `†` is how
many of those the median and geomean carry from above the throughput ceiling — they stay in the aggregate but no reader
should cite one alone.

| Competitor     | Comparable | Win / parity / loss | Median | Geomean |   † |
| -------------- | ---------: | ------------------: | -----: | ------: | --: |
| InversifyJS 8  |  91 of 130 |          88 / 2 / 1 |  4.00× |   5.47× |  45 |
| Awilix 13      |  38 of 130 |          38 / 0 / 0 |  6.39× |   6.06× |  18 |
| tsyringe 4     |  43 of 130 |          37 / 2 / 4 |  4.46× |   3.86× |  20 |
| Brandi 5       |  29 of 130 |          28 / 0 / 1 |  15.7× |   12.5× |  18 |
| Ditox 3        |  44 of 130 |         31 / 1 / 12 |  1.26× |   1.62× |  22 |
| injection-js 2 |  31 of 130 |         19 / 2 / 10 |  1.49× |   1.44× |  22 |

**The headline, stated plainly: codefast sweeps inversify, awilix and brandi — awilix loses it no row, the two rebind
rows it held having turned into 1.38× and 1.43× — wins tsyringe on the median by 4.5× while still losing it four rows,
and against the two libraries it is closest to holds both aggregates: ditox 1.26× on the median and 1.62× on the geomean
(from 1.06× and 1.39×), injection-js 1.49× and 1.44× (from 1.49× and 1.43×).** Against ditox two warm reads sit on the
parity line's wrong side by a hair — `singleton-class-1-dep` 0.97×†, `to-resolved-3-deps` 0.95×† — where the page two
passes ago read 0.70× and 0.73× and filed the gap as harness-only; it was the harness's own second closure. The losses
that remain are the same shapes as at the start of the round — **registration**, **cold collections**, the **accessor
lane**, two **nested-factory** rows and the event bus against injection-js above the ceiling — plus two this round
chose: the collection copy and the three allocations an async level owns. The alias lane, which the previous page named
as the one deficit its fixed harness uncovered, is at parity with injection-js on the same-container rows now and 0.84×†
on the parent-owned one. Against the baseline, 95 of the 126 shared rows are more than 10% faster and 1 is slower, the
`resolveAll` copy.

## The losses, foregrounded — where to improve

Ordered by how much they matter, each marked as a **real deficit** (same work, codefast slower), a **work difference**
(codefast does more per op by design, so the row is a design cost to reconsider, not a bug) or a **chosen cost** (a
correctness fix this round took with its price known). Where the baseline is quoted, it is the same row in
`2026-09-14T23-41-04-932Z`.

- **Registration is still the biggest deficit, and it is a ditox-only one.** `bind-128-plain` — 128 transient factory
  bindings into a fresh container, no resolve — runs at 0.40× ditox, 1.00× tsyringe and 1.79× injection-js, where it ran
  0.42×, 1.02× and 2.21×: a fresh registration is one probe, one write and one version read now, and the row did not
  move against its baseline (1.03×), because what it pays is the object. The bind-floor probe in the redesign record
  puts a bare `Map.set` with a two-field literal at 13.4 ns and a probe-and-set with the twenty-field chain object at
  20.3 ns on this V8; ditox's whole `bindFactory` is 17.8 ns. The chain object is the fluent builder the contract
  returns, and the probe is last-wins; closing this row is a contract change (a lighter builder, or a bulk bind), not an
  optimisation. Everything that binds before it resolves sits on the same floor and moved where the redesign moved it:
  `create-child-empty` 2.24× ditox and 1.29× tsyringe (from 1.27× and 0.83×), `container-create-empty` 1.73× and 1.21×
  (from 1.57× and 1.09×), `realistic-graph-class-cold-resolve` 0.65× ditox and 1.02× tsyringe (from 0.49× and 0.76×),
  `boot-decorated-container-build-and-resolve` 0.87× tsyringe (from 0.75×), `module-cold-from-modules` 1.20× ditox (from
  1.05×). The two empty-container rows still lose injection-js above the ceiling (0.68×† and 0.69×†): a container is
  four objects now where it was seven, injection-js's injector is fewer. **Real deficit, structural** — one object per
  binding is the design, and the record says what it would cost to change.
- **The cold collection loses tsyringe and, at N=10, ditox.** `resolve-all-cold-N` builds a fresh container and reads
  the collection once: at N=100, 0.38× tsyringe (from 0.62×), ditox 1.31× and injection-js 1.24× stay wins; at N=10,
  0.46× tsyringe, 0.76× ditox and 0.96× injection-js (from 0.46×, 0.76× and 1.04×). A chain's own `.many()` re-slots
  without a probe now, which the hundred-member row shows against ditox and the ten-member row does not; what the pair
  still pays is the registration above, ten or a hundred times. **Real deficit against tsyringe and at N=10 against
  ditox — the registration cost seen from the collection side.**
- **The stable-set collections are a chosen cost.** `resolve-all-strategies-10` 0.68×† ditox and 0.75×† injection-js,
  `-100` 0.61×† and 0.77×† (from 1.00×, 1.09×, 0.95× and 1.11×), the hundred-member row 0.89× of its baseline
  throughput: a root-level `resolveAll` hands each caller a copy of its memoized list, where it handed out the list
  itself, so no caller can mutate the engine's memo. A frozen list was measured and rejected — a frozen array iterates
  through a slow elements kind for every consumer. **Chosen cost**, its own commit, reversible alone.
- **Teardown at scale is a registration loss wearing a lifecycle label, and it narrowed.** `materialize-100-singletons`
  (bind and resolve 100 singletons, no teardown) is 0.52× ditox and 1.77× tsyringe (from 0.35× and 1.88×);
  `unbind-all-100-singletons` (the same, then dispose) 0.51× and 1.45× (from 0.35× and 1.50×) — 1.53× and 1.62× their
  baseline throughput, from the activation need stamped on the binding and a teardown that splices nothing. The two
  ratios against ditox are the same, so the teardown walk costs nothing the rivals do not pay — the loss is the 100
  bindings above. `lifecycle-pre-destroy-unbind` (one singleton, one hook) is 1.04× ditox (from 0.82×) and 2.14×
  tsyringe. **Work difference on the hook, real deficit on the registration underneath.**
- **Rebind is a win against awilix now and still slow against ditox.** `rebind-hot-swap` 1.43× awilix (from 0.89×) and
  0.21×† ditox (from 0.14×†); `rebind-parent-resolve-child-depth-3` 1.38× awilix and 1.68× ditox (from 0.89× and 1.07×).
  A rebind of a lone token is one registration whose displaced binding is deactivated on the spot — 1.70× and 1.61× the
  baseline — and what it still pays against ditox's map write is the builder object and the deactivation walk. **Work
  difference**, above the ceiling against ditox.
- **Two nested-factory rows and the event bus lose injection-js above the ceiling.** `nested-context-resolve-in-factory`
  0.84×† and `nested-container-resolve-in-factory` 0.84×† (from 0.95× and 0.89×), `production-event-bus-dispatch` 0.82×†
  injection-js and 0.74×† ditox (from 1.56× and 0.83×†): a factory that resolves from its context or from the container
  mid-construction, and a dispatch that is one lookup and a loop. codefast's own throughput on the three rows is 1.13×,
  1.13× and 0.95× of its baseline; injection-js's read specialized well once the harness stopped rebuilding closures,
  and its `get` inside a factory is the same call as at the root. `alias-parent-owned-terminal` 0.84×† sits beside them:
  the same-container alias rows are at parity now (1.01×†, 0.99×†, from 0.75×† and 0.82×† on the page before) since the
  memo's hit became a compare its callers inline, and the parent-owned one moved from 0.68×† to 0.84×† on the same
  change — what it still pays is the chain-version sum a child reads before it trusts the memo. **Real deficit**, four
  rows above the ceiling, with the parent-owned alias the one that names its own next step.
- **The async rows are wins, including the one that was not.** `async-init-single-hop` reads 1.05× ditox and 1.09×
  injection-js (from 0.98× and 0.90×), 1.66× its baseline: a transient factory root keeps the one context its binding
  builds. The fan-out rows read 1.63–1.90× inversify, `dynamic-async-chain-8` 1.48×, `resolve-all-async-8` at parity
  (1.02×, from 0.58× — 2.04× its baseline). The one-lane fix that retired the cascade still costs each level its own
  frame, context and, at a root, its array; in this profile the rows carry it and win. **Chosen cost**, paid and
  covered.
- **`accessor-injection-construct` 0.25×† inversify, from 0.42×.** codefast's own throughput on the row is 1.07× its
  baseline; inversify's rose more once the harness stopped collecting inside the loop and stopped rebuilding closures.
  The row measures the benchmark's transpiler as much as the engine: esbuild lowers the scenario's own `accessor` field
  to `WeakMap`-backed privates (`__privateAdd`, `__accessCheck`), a third of the row's self time. What the engine pays
  is the ambient scope around construction and the accessor's own `resolve` through the container, where inversify's
  property injection is a metadata read on the same plan. **Work difference**, and a harness change proposed (a `tsc`
  compile of the codefast scenarios), not made.
- **Failing fast costs more here: `misconfigured-missing-binding` 0.73× tsyringe, 0.78× ditox, 0.79× brandi, 0.93×
  injection-js**, from 0.63×, 0.69×, 0.68× and 0.86×. codefast still builds a structured error with the resolution path;
  the rivals throw a string, and the stack capture both pay is most of the row. **Work difference** on a path a
  production request should never take.
- **One row reads down against the baseline in this pass.** `resolve-all-strategies-100` 0.89× is the chosen copy above.
  The two warm reads at the parity line against ditox, `singleton-class-1-dep` 0.97×† and `to-resolved-3-deps` 0.95×†,
  are 1.53× and 1.51× their baseline and read equal to ditox in a standalone loop; the per-process mode the earlier
  pages carried on the dispatch and the 32-level chain does not appear in this profile. **Open**: the four rows above
  the ceiling against injection-js, to re-measure paired before the next change to the nested-factory or alias lanes.

## The wins

- **inversify — 88 of 91 comparable rows, 4.00× median, 5.47× geomean.** Widest margins on `failure`'s
  `circular-dependency-3` and `alias-cycle-detected` (both excluded — inversify recurses to the stack limit rather than
  detecting either), then `boot` (19.2× geomean), `production` (17.2×), `scope` (13.1×), `lifecycle` (11.4×),
  `introspection` (7.62×), `realistic` (5.72×), `fan-out` (5.49×), `slot-selection` (4.33×), `micro` (4.16×); tightest
  on `async` (1.51×) and `resolution` (0.95×, the accessor row against the plan rows). `resolve-all-async-8` is at
  parity from 0.58×, and so is `optional-missing-transient` (1.02×†). Every fresh-child row is 29–56×, every production
  row 12–26×, `bind-128-plain` 22.7×, and the `child-depth` axis is flat at 1.54–1.60×†.
- **Awilix 13 — 38 of 38, 6.39× median, no loss**, up to 15× on the deep child walk and 35× on `bind-128-plain`; the two
  rebind rows it held are 1.43× and 1.38× now, and `async-init-single-hop` 1.39× (from parity).
- **tsyringe 4 — 37 of 43, 4.46× median**, 12.8× on `micro` and 6.92× on `scope`; the stable-set collections read 17.4×
  at N=100 and 3.16× at N=10, `realistic-graph-class-cold-resolve` at parity (1.02×, from 0.76×), `create-child-empty`
  1.29× (from 0.83×), `bind-128-plain` 1.00×; it still wins the cold collections (0.38× and 0.46×), `boot-decorated-*`
  (0.87×, from 0.75×) and the missing-binding throw (0.73×).
- **Brandi 5 — 28 of 29, 15.7× median**, 33× on transient micro and 49×† on the resolved-factory graph; loses only the
  missing-binding throw.
- **Against ditox codefast wins 31 rows to 12 and both aggregates (1.26× median, 1.62× geomean, from 1.06× and 1.39×).**
  The warm reads are level or ahead — `constant-resolve` 1.09×, `resolve-optional-hit` 1.07×, `singleton-class-1-dep`
  0.97×†, `to-resolved-3-deps` 0.95×† (from 0.79×†, 0.78×†, 0.71×† and 0.71×†) — and the warm work above them is a
  sweep: `transient-class-1-dep` 8.09×†, `realistic-graph-resolved-root` 5.59×†, `realistic-graph-class-resolve-root`
  5.57× (from 2.09×), `resolve-optional-miss` 4.42×†, `optional-missing-transient` 3.84×†,
  `nested-context-resolve-in-factory` 2.40×†, `realistic-graph-resolve-root` 1.72×, every `child-depth` row 4.81–31.4×†.
  The cold and per-request work: `fresh-child-default-n4` 2.79×, `create-child-empty` 2.24×, `fresh-child-default-n1`
  2.13× (from 1.84×), `container-create-empty` 1.73×, `rebind-parent-resolve-child-depth-3` 1.68×,
  `scale-mid-transient-chain-32` 1.62×, `has-bound-check` 1.60×, `child-request-lifecycle-create-resolve-dispose` 1.55×
  (from 1.34×), `scoped-binding-per-child` 1.48×, `resolve-all-cold-100` 1.31×, `module-cold-from-modules` 1.20×,
  `production-http-handler` 1.20× and `production-unit-of-work` 1.17× (from 1.00× and 1.01×),
  `scale-deep-transient-chain-512` 1.09×, `nested-container-resolve-in-factory` 1.09×, `async-init-single-hop` 1.05×,
  `lifecycle-pre-destroy-unbind` 1.04× (from 0.82×), `realistic-graph-cold-resolve` at parity (1.01×, from 0.98×). It
  still loses every row that binds many things (`bind-128-plain` 0.40×, the two 100-singleton lifecycle rows 0.52× and
  0.51×, the class-cold graph 0.65×), the cold collection at N=10 (0.76×), the two stable sets by choice, the
  missing-binding throw, the event-bus dispatch above the ceiling and the two warm reads at the parity line.
- **Against injection-js the median is 1.49× and the geomean 1.44×** (from 1.49× and 1.43×; 19 wins, 2 parities, 10
  losses). The warm rows are wins (`singleton-class-1-dep` 4.50×†, `realistic-graph-resolved-root` 3.99×†,
  `realistic-graph-class-resolve-root` 3.27×, `to-self-binding` 2.99×†, `resolve-optional-miss` 1.93×†,
  `constant-resolve` 1.84×†, `to-resolved-3-deps` 1.64×†, `realistic-graph-resolve-root` 1.27×), so is registration
  (`bind-128-plain` 1.79×, `realistic-graph-cold-resolve` 2.16×, `boot-decorated-*` 1.76×, the class-cold graph 2.02×),
  so are the cold collection at N=100 (1.24×), the async hop (1.09×) and the `child-depth` axis (1.89–2.54×†); the
  same-container alias rows are at parity (1.01×†, 0.99×†); the losses are the parent-owned alias, the two
  nested-factory rows and the event bus above the ceiling, the two stable sets, the two empty-container rows, the
  missing-binding throw (0.93×) and the cold ten (0.96×).
- **The selection axes are flat where they should be.** `named-resolve-slots-1/64` read 4.88× and 4.89× inversify and
  `tagged-resolve-slots-1/64` 10.3× and 10.4× with no trend across N: both lanes are indexed, and the axis proves it.
- **What this round moved, against the baseline.** The widest, on rows with a causal path: `plan-class-chain-40` 8.44×
  (flat plans to any depth), `realistic-graph-class-resolve-root` 3.64×, `plan-async-resolved-chain-8` 2.71× (one
  awaiting dependency is `Promise.resolve(p).then()`, not `Promise.all([p])`), `async-branch-chain-8` 2.69× and
  `async-branch-escape-mid-chain-8` 2.38× (one live context anchors the branch lane against the deopt loop a real
  collection still triggers), `plan-escape-multi-dep` 2.55× and `multi-tag-constraint-resolve` 2.24× (one
  constraint-context shape), the four `tagged-resolve-slots-*` rows 2.37–2.44× and the four `named-resolve-slots-*` rows
  1.69–1.70× (the indexed lanes, read specialized), `resolve-all-async-8` 2.04×, `plan-async-class-chain-8` 1.98×,
  `plan-class-chain-24` 1.83×, `create-child-empty` 1.72×, `rebind-hot-swap` 1.70×, `async-init-single-hop` 1.66× (the
  root's context kept), `unbind-all-100-singletons` 1.62×, `rebind-parent-resolve-child-depth-3` 1.61×,
  `lifecycle-post-construct-singleton` 1.55×, `resolve-optional-hit` 1.55×, `to-self-binding` 1.53×,
  `singleton-class-1-dep` 1.53×, `materialize-100-singletons` 1.53×, `to-resolved-3-deps` 1.51×, `constant-resolve`
  1.50×, `alias-chain-3` 1.32×, `to-alias-redirect` 1.29×, `alias-parent-owned-terminal` 1.29× and every `child-depth`
  row 1.28–1.29× (the memo's hit inlined) — 95 of 126 shared rows more than 10% faster, 30 within 10%, 1 slower.

## Geomean by group

Geomean of the ratios in each group, comparable row count in parentheses. Read a group, not a cell.

| Group          | InversifyJS 8 | Awilix 13 | tsyringe 4 |  Brandi 5 |   Ditox 3 | injection-js 2 |
| -------------- | ------------: | --------: | ---------: | --------: | --------: | -------------: |
| micro          |    4.16× (22) | 6.78× (8) |  12.8× (7) | 22.9× (8) | 2.04× (7) |      1.68× (9) |
| realistic      |     5.72× (5) | 6.72× (4) |  3.49× (4) | 15.3× (5) | 2.04× (5) |      2.36× (5) |
| fan-out        |     5.49× (9) | 2.05× (1) |  1.95× (5) | 9.16× (1) | 0.97× (5) |      0.91× (4) |
| async          |    1.51× (10) | 1.39× (1) |  1.49× (1) | 2.88× (1) | 1.05× (1) |      1.09× (1) |
| lifecycle      |     11.4× (8) | 4.75× (5) |  2.22× (4) |         — | 0.63× (5) |              — |
| scope          |    13.1× (12) | 7.37× (8) |  6.92× (8) | 17.9× (5) | 4.85× (8) |      2.03× (4) |
| scale          |     2.66× (2) | 10.9× (2) |  3.70× (2) | 8.70× (2) | 1.33× (2) |              — |
| boot           |     19.2× (7) | 17.2× (3) |  1.08× (4) | 5.71× (4) | 1.17× (4) |      1.10× (4) |
| failure        |     1.51× (2) | 2.31× (1) |  0.73× (1) | 0.79× (1) | 0.78× (1) |      0.93× (1) |
| production     |     17.2× (3) | 7.21× (2) |  3.50× (3) |         — | 1.02× (3) |      0.82× (1) |
| introspection  |     7.62× (2) | 1.20× (1) |  5.21× (2) |         — | 1.60× (1) |              — |
| slot-selection |     4.33× (6) |         — |          — |         — |         — |              — |
| resolution     |     0.95× (3) | 3.31× (2) |  4.97× (2) | 17.2× (2) | 1.62× (2) |      0.84× (2) |

The `boot` group against tsyringe, ditox and injection-js (1.08×, 1.17×, 1.10×, from 0.92×, 0.97× and 1.11×) is the
registration deficit in one number: closed at the group level, and what remains of it is the single `bind-128-plain` row
against ditox. The `fan-out` group against ditox is 0.97× (from 1.14×) and against injection-js 0.91× (from 1.16×): the
two stable-set rows pay the copy. `production` against ditox (1.02×, from 0.94×) is two request rows won and the
event-bus row above the ceiling lost; against injection-js (0.82×) it is that one row. `lifecycle` against ditox (0.63×,
from 0.43×) is the two 100-singleton rows, the registration deficit again, narrower. `async` is a win against every
rival (1.05× ditox, 1.09× injection-js, 1.51× inversify). `micro` against ditox rose from 1.61× to 2.04× as the warm
reads stopped losing, and against injection-js from 1.61× to 1.68× as the alias rows reached parity. `scope` against
injection-js (2.03×, from 1.75×) is the `child-depth` axis read through the inlined memo hit. `realistic` against
inversify (5.72×, from 5.20×) and against every rival is the generated plans, plus a class graph that resolves its root
3.64× faster than at the baseline. `resolution` against inversify (0.95×, from 1.05×) is the accessor row alone, and
against injection-js (0.84×) the two nested-factory rows. `failure` against inversify stays at 1.51× because
`alias-cycle-detected` is excluded, which is why it was.

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
| constant-resolve                               | micro          |  1000 |        215,013,477 |           2.72×† |       5.58×† |        11.5×† |      34.9×† |     1.09×† |            1.84×† |
| singleton-class-1-dep                          | micro          |   200 |        187,469,373 |           3.39×† |       4.43×† |        10.8×† |      31.9×† |     0.97×† |            4.50×† |
| transient-class-1-dep                          | micro          |   200 |         79,216,685 |           1.87×† |       9.04×† |        13.1×† |      32.9×† |     8.09×† |                 — |
| named-constant-get                             | micro          |   500 |         99,397,577 |           3.60×† |            — |             — |           — |          — |                 — |
| named-resolve-slots-1                          | micro          |   500 |        140,252,574 |          4.88×†‡ |            — |             — |           — |          — |                 — |
| named-resolve-slots-4                          | micro          |   500 |        140,183,804 |           4.93×† |            — |             — |           — |          — |                 — |
| named-resolve-slots-16                         | micro          |   500 |        139,965,308 |           4.81×† |            — |             — |           — |          — |                 — |
| named-resolve-slots-64                         | micro          |   500 |        140,514,264 |           4.89×† |            — |             — |           — |          — |                 — |
| optional-missing-transient                     | micro          |   200 |         51,866,322 |           1.02×† |            — |             — |      12.0×† |     3.84×† |                 — |
| realistic-graph-resolve-root                   | realistic      |    20 |         20,356,081 |            2.92× |        2.77× |         5.45× |       15.8× |      1.72× |             1.27× |
| realistic-graph-cold-resolve                   | realistic      |     1 |           301,952‡ |           8.06×‡ |       4.30×‡ |        2.02×‡ |      4.62×‡ |     1.01×‡ |            2.16×‡ |
| realistic-graph-resolved-root                  | realistic      |    20 |         62,887,918 |           3.23×† |            — |             — |      49.4×† |     5.59×† |            3.99×† |
| realistic-graph-class-resolve-root             | realistic      |    20 |         61,615,659 |           3.10×† |       10.3×† |        13.3×† |      47.6×† |     5.57×† |            3.27×† |
| realistic-graph-class-cold-resolve             | realistic      |     1 |            470,910 |            26.0× |       16.7×‡ |         1.02× |       4.92× |      0.65× |             2.02× |
| realistic-graph-validate                       | realistic      |    10 |         19,933,465 |                — |            — |             — |           — |          — |                 — |
| fan-out-tree-depth-3-breadth-4                 | fan-out        |    20 |          1,803,637 |            1.65× |        2.05× |         2.96× |       9.16× |      2.04× |                 — |
| resolve-all-strategies-10                      | fan-out        |     1 |        28,781,354‡ |           7.46×‡ |            — |        3.16×‡ |           — |    0.68×†‡ |           0.75×†‡ |
| resolve-all-strategies-100                     | fan-out        |     1 |         23,646,991 |            51.8× |            — |        17.4×‡ |           — |    0.61×†‡ |           0.77×†‡ |
| resolve-all-cold-10                            | fan-out        |     1 |          1,615,441 |           21.2×‡ |            — |         0.46× |           — |      0.76× |             0.96× |
| resolve-all-cold-100                           | fan-out        |     1 |            199,507 |           20.7×‡ |            — |        0.38×‡ |           — |      1.31× |             1.24× |
| resolve-all-named-8                            | fan-out        |     1 |         22,218,772 |            1.93× |            — |             — |           — |          — |                 — |
| resolve-all-named-16                           | fan-out        |     1 |         22,790,696 |            2.03× |            — |             — |           — |          — |                 — |
| resolve-all-named-32                           | fan-out        |     1 |         21,382,543 |            1.95× |            — |             — |           — |          — |                 — |
| resolve-all-named-64                           | fan-out        |     1 |         24,078,222 |            2.10× |            — |             — |           — |          — |                 — |
| resolve-async-single-hop                       | async          |     1 |          9,942,578 |            1.28× |            — |             — |           — |          — |                 — |
| async-init-single-hop                          | async          |     1 |          7,343,735 |            1.69× |        1.39× |         1.49× |       2.88× |      1.05× |            1.09×‡ |
| dynamic-async-chain-8                          | async          |     1 |          2,120,893 |            1.48× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-8                      | async          |     1 |          1,223,765 |            1.63× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-16                     | async          |     1 |            661,907 |            1.64× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-32                     | async          |     1 |            353,167 |            1.89× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-64                     | async          |     1 |            164,034 |            1.90× |            — |             — |           — |          — |                 — |
| async-branch-chain-8                           | async          |     1 |          1,324,081 |                — |            — |             — |           — |          — |                 — |
| async-branch-escape-mid-chain-8                | async          |     1 |          1,751,066 |                — |            — |             — |           — |          — |                 — |
| async-diamond-shared-leaf                      | async          |     1 |          1,889,361 |            1.28× |            — |             — |           — |          — |                 — |
| plan-async-resolved-chain-8                    | async          |     1 |         2,397,636‡ |                — |            — |             — |           — |          — |                 — |
| plan-async-class-chain-8                       | async          |     1 |          5,551,433 |                — |            — |             — |           — |          — |                 — |
| resolve-all-async-8                            | async          |     1 |            985,821 |            1.02× |            — |             — |           — |          — |                 — |
| resolve-optional-async-miss                    | async          |     1 |          9,689,033 |            1.52× |            — |             — |           — |          — |                 — |
| lifecycle-post-construct-singleton             | lifecycle      |   250 |        190,387,108 |           3.27×† |            — |             — |           — |          — |                 — |
| lifecycle-pre-destroy-unbind                   | lifecycle      |     1 |          3,211,363 |           21.3×‡ |       7.81×‡ |         2.14× |           — |      1.04× |                 — |
| binding-level-activation-hook                  | lifecycle      |   200 |         60,985,287 |           2.19×† |            — |             — |           — |          — |                 — |
| child-depth-1-resolve                          | scope          |   500 |        116,341,430 |           1.59×† |       4.58×† |        7.57×† |      21.7×† |     4.81×† |            1.89×† |
| child-depth-2-resolve                          | scope          |   500 |        116,531,972 |           1.66×† |       5.93×† |        8.99×† |      22.3×† |     8.49×† |            1.49×† |
| child-depth-4-resolve                          | scope          |   500 |        116,295,718 |           1.60×† |       8.60×† |        11.6×† |      24.4×† |     17.5×† |            2.35×† |
| child-depth-8-resolve                          | scope          |   500 |        116,584,698 |           1.54×† |       15.3×† |        17.9×† |      30.0×† |     31.4×† |            2.54×† |
| child-request-lifecycle-create-resolve-dispose | scope          |   100 |          2,666,288 |           46.7×‡ |       11.5×‡ |        5.04×‡ |           — |      1.55× |                 — |
| fresh-child-default-n1                         | scope          |   100 |        11,848,120‡ |           42.4×‡ |       8.32×‡ |        7.63×‡ |           — |     2.13×‡ |                 — |
| fresh-child-default-n4                         | scope          |   100 |          8,271,962 |           29.4×‡ |       6.95×‡ |         7.28× |           — |      2.79× |                 — |
| fresh-child-name-n1                            | scope          |   100 |         11,072,117 |           39.3×‡ |            — |             — |           — |          — |                 — |
| fresh-child-name-n4                            | scope          |   100 |          7,720,904 |           31.3×‡ |            — |             — |           — |          — |                 — |
| fresh-child-tag-n1                             | scope          |   100 |         11,437,039 |           41.5×‡ |            — |             — |           — |          — |                 — |
| fresh-child-tag-n4                             | scope          |   100 |          7,399,316 |           30.5×‡ |            — |             — |           — |          — |                 — |
| scale-mid-transient-chain-32                   | scale          |     1 |          1,564,402 |            2.65× |        4.91× |         4.25× |       11.2× |      1.62× |                 — |
| scale-deep-transient-chain-512                 | scale          |     1 |             55,891 |            2.66× |        24.3× |         3.22× |       6.77× |      1.09× |                 — |
| boot-decorated-container-build-and-resolve     | boot           |     1 |            673,826 |           15.3×‡ |            — |         0.87× |           — |          — |             1.76× |
| container-create-empty                         | boot           |   100 |         30,536,423 |          45.2×†‡ |      10.9×†‡ |        1.21×† |      8.72×† |     1.73×† |            0.68×† |
| create-child-empty                             | boot           |   100 |         30,074,581 |          56.5×†‡ |      13.2×†‡ |        1.29×† |      8.80×† |     2.24×† |            0.69×† |
| bind-128-plain                                 | boot           |     1 |            190,797 |           22.7×‡ |       35.3×‡ |         1.00× |       8.84× |      0.40× |             1.79× |
| bind-128-refined                               | boot           |     1 |             29,640 |           3.57×‡ |            — |             — |           — |          — |                 — |
| misconfigured-missing-binding                  | failure        |     1 |           281,095‡ |           1.54×‡ |       2.31×‡ |        0.73×‡ |      0.79×‡ |     0.78×‡ |            0.93×‡ |
| circular-dependency-3                          | failure        |     1 |           166,890‡ |          186.2×‡ |       1.50×‡ |             — |           — |          — |            0.51×‡ |
| ambiguous-multi-binding                        | failure        |     1 |           225,646‡ |           1.49×‡ |            — |             — |           — |          — |                 — |
| production-http-handler                        | production     |    50 |          1,835,908 |           26.2×‡ |       7.78×‡ |        3.35×‡ |           — |      1.20× |                 — |
| production-unit-of-work                        | production     |   100 |          1,039,916 |           16.3×‡ |       6.68×‡ |         2.33× |           — |      1.17× |                 — |
| production-event-bus-dispatch                  | production     |   100 |         48,148,650 |           11.8×† |            — |        5.50×† |           — |     0.74×† |            0.82×† |
| to-resolved-3-deps                             | micro          |   200 |        184,760,426 |           3.21×† |            — |             — |      31.0×† |     0.95×† |            1.64×† |
| to-alias-redirect                              | micro          |   500 |        110,903,817 |           1.95×† |       6.11×† |        12.5×† |           — |          — |            1.01×† |
| to-self-binding                                | micro          |   300 |        177,969,295 |           2.90×† |            — |        7.98×† |           — |          — |            2.99×† |
| alias-chain-3                                  | micro          |   500 |        111,519,973 |           4.31×† |       14.5×† |        25.4×† |           — |          — |            0.99×† |
| alias-parent-owned-terminal                    | micro          |   500 |        108,549,253 |           1.98×† |       7.37×† |        13.6×† |           — |          — |            0.84×† |
| alias-cycle-detected                           | failure        |     1 |           253,150‡ |          708.5×‡ |       2.75×‡ |             — |           — |          — |            0.84×‡ |
| resolve-optional-hit                           | micro          |   500 |        221,675,264 |           6.61×† |       6.10×† |             — |      36.8×† |     1.07×† |            1.66×† |
| resolve-optional-miss                          | micro          |   500 |        266,957,253 |           7.80×† |       5.00×† |             — |      4.57×† |     4.42×† |            1.93×† |
| tagged-binding-resolve                         | micro          |   300 |        144,965,277 |           6.55×† |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-1                         | micro          |   300 |        223,011,242 |           10.3×† |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-4                         | micro          |   300 |        222,367,205 |           10.0×† |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-16                        | micro          |   300 |        222,811,225 |           10.0×† |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-64                        | micro          |   300 |        220,928,829 |           10.4×† |            — |             — |           — |          — |                 — |
| conditional-injection-tagged                   | micro          |   300 |         80,094,783 |           2.04×† |            — |             — |      32.4×† |          — |                 — |
| rebind-hot-swap                                | lifecycle      |    50 |         19,248,630 |           43.0×‡ |        1.43× |             — |           — |     0.21×† |                 — |
| has-bound-check                                | introspection  |  1000 |        373,060,182 |           6.63×† |       1.20×† |        3.39×† |           — |     1.60×† |                 — |
| has-own-unbound-check                          | introspection  |  1000 |        884,047,190 |           8.77×† |            — |        8.02×† |           — |          — |                 — |
| container-level-activation-hook                | lifecycle      |   200 |         52,790,535 |           1.86×† |            — |        4.46×† |           — |          — |                 — |
| scoped-binding-per-child                       | scope          |   100 |         6,404,695‡ |           45.0×‡ |       3.68×‡ |        1.33×‡ |      5.21×‡ |     1.48×‡ |                 — |
| rebind-parent-resolve-child-depth-3            | lifecycle      |    50 |         12,408,742 |           70.6×‡ |        1.38× |             — |           — |      1.68× |                 — |
| materialize-100-singletons                     | lifecycle      |     1 |             72,835 |           17.3×‡ |       13.8×‡ |         1.77× |           — |      0.52× |                 — |
| unbind-all-100-singletons                      | lifecycle      |     1 |            57,933‡ |           19.0×‡ |       11.4×‡ |        1.45×‡ |           — |     0.51×‡ |                 — |
| module-load-unload                             | boot           |     1 |          1,134,330 |           15.2×‡ |            — |             — |           — |          — |                 — |
| module-cold-from-modules                       | boot           |     1 |          1,979,314 |           20.3×‡ |            — |             — |       1.56× |      1.20× |                 — |
| initialize-async-warmup                        | boot           |     1 |            622,996 |                — |            — |             — |           — |          — |                 — |
| inspect-snapshot                               | introspection  |    20 |          9,562,299 |                — |            — |             — |           — |          — |                 — |
| lookup-bindings                                | introspection  |   200 |         24,286,489 |                — |            — |             — |           — |          — |                 — |
| generate-dependency-graph                      | introspection  |    10 |            771,688 |                — |            — |             — |           — |          — |                 — |
| multi-tag-slot-resolve                         | micro          |   300 |         14,256,496 |                — |            — |             — |           — |          — |                 — |
| multi-tag-constraint-resolve                   | micro          |   200 |          7,184,451 |                — |            — |             — |           — |          — |                 — |
| multi-tag-select-32                            | micro          |   300 |          2,887,484 |                — |            — |             — |           — |          — |                 — |
| mask-reject-wide-catalog                       | slot-selection |   300 |         39,221,707 |                — |            — |             — |           — |          — |                 — |
| mask-accept-two-of-four                        | slot-selection |   300 |         20,288,411 |                — |            — |             — |           — |          — |                 — |
| mask-collision-same-bit                        | slot-selection |   300 |         49,842,460 |                — |            — |             — |           — |          — |                 — |
| slot-tag-array-hoisted                         | slot-selection |   300 |        147,626,475 |                — |            — |             — |           — |          — |                 — |
| slot-tag-shorthand-hoisted                     | slot-selection |   300 |        160,438,698 |                — |            — |             — |           — |          — |                 — |
| slot-tag-array-inline                          | slot-selection |   300 |         96,280,576 |                — |            — |             — |           — |          — |                 — |
| slot-tag-shorthand-inline                      | slot-selection |   300 |        116,407,144 |                — |            — |             — |           — |          — |                 — |
| slot-tag-zero-value                            | slot-selection |   300 |        146,928,567 |           6.69×† |            — |             — |           — |          — |                 — |
| slot-name-and-tag                              | slot-selection |   300 |         50,569,471 |           2.52×† |            — |             — |           — |          — |                 — |
| slot-tag-resolve-all                           | slot-selection |   300 |         49,726,278 |           4.00×† |            — |             — |           — |          — |                 — |
| slot-tag-miss-optional                         | slot-selection |   300 |         82,753,649 |           3.31×† |            — |             — |           — |          — |                 — |
| slot-tag-parent-owned                          | slot-selection |   300 |        139,568,134 |           6.34×† |            — |             — |           — |          — |                 — |
| slot-name-parent-owned                         | slot-selection |   300 |        115,504,591 |           4.62×† |            — |             — |           — |          — |                 — |
| slot-injected-name-compiled                    | slot-selection |   300 |         70,078,964 |                — |            — |             — |           — |          — |                 — |
| slot-injected-name-interpreted                 | slot-selection |   300 |          4,227,099 |                — |            — |             — |           — |          — |                 — |
| slot-injected-tag-compiled                     | slot-selection |   300 |         71,118,872 |                — |            — |             — |           — |          — |                 — |
| slot-injected-tag-interpreted                  | slot-selection |   300 |          4,376,284 |                — |            — |             — |           — |          — |                 — |
| plan-deps-inlined                              | resolution     |   300 |         63,498,499 |                — |            — |             — |           — |          — |                 — |
| plan-escape-factory-dep                        | resolution     |   300 |          7,838,590 |                — |            — |             — |           — |          — |                 — |
| plan-escape-scoped-dep                         | resolution     |   300 |         11,182,710 |                — |            — |             — |           — |          — |                 — |
| plan-escape-hooked-dep                         | resolution     |   300 |          2,750,929 |                — |            — |             — |           — |          — |                 — |
| plan-escape-optional-dep                       | resolution     |   300 |          3,784,777 |                — |            — |             — |           — |          — |                 — |
| plan-escape-multi-dep                          | resolution     |   300 |          2,418,123 |                — |            — |             — |           — |          — |                 — |
| plan-class-chain-24                            | resolution     |     1 |          7,391,504 |                — |            — |             — |           — |          — |                 — |
| plan-class-chain-40                            | resolution     |     1 |          4,458,333 |                — |            — |             — |           — |          — |                 — |
| interpreted-class-chain-24                     | resolution     |     1 |            368,019 |                — |            — |             — |           — |          — |                 — |
| interpreted-class-chain-40                     | resolution     |     1 |            201,102 |                — |            — |             — |           — |          — |                 — |
| plan-runs-1                                    | resolution     |     1 |            729,769 |                — |            — |             — |           — |          — |                 — |
| plan-runs-256                                  | resolution     |     1 |             14,933 |                — |            — |             — |           — |          — |                 — |
| plan-runs-512                                  | resolution     |     1 |              7,988 |                — |            — |             — |           — |          — |                 — |
| plan-runs-1024                                 | resolution     |     1 |              4,071 |                — |            — |             — |           — |          — |                 — |
| plan-runs-2048                                 | resolution     |     1 |              1,969 |                — |            — |             — |           — |          — |                 — |
| plan-runs-4096                                 | resolution     |     1 |              1,132 |                — |            — |             — |           — |          — |                 — |
| plan-runs-8192                                 | resolution     |     1 |                652 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-1                               | resolution     |     1 |           202,117‡ |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-256                             | resolution     |     1 |              4,705 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-512                             | resolution     |     1 |              2,474 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-1024                            | resolution     |     1 |              1,287 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-2048                            | resolution     |     1 |                663 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-8192                            | resolution     |     1 |                216 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-1                              | resolution     |     1 |           740,272‡ |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-512                            | resolution     |     1 |              7,798 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-1024                           | resolution     |     1 |             4,021‡ |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-2048                           | resolution     |     1 |              2,000 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-8192                           | resolution     |     1 |                650 |                — |            — |             — |           — |          — |                 — |
| nested-context-resolve-in-factory              | resolution     |   300 |         46,881,454 |           1.94×† |       3.85×† |       5.36×†‡ |      18.9×† |     2.40×† |            0.84×† |
| nested-container-resolve-in-factory            | resolution     |   300 |         40,140,780 |           1.75×† |       2.85×† |       4.60×†‡ |      15.7×† |     1.09×† |            0.84×† |
| accessor-injection-construct                   | resolution     |   300 |         8,839,855‡ |          0.25×†‡ |            — |             — |           — |          — |                 — |

## Re-running this

```bash
pnpm bench:baseline                                             # from benchmarks/di — the full-profile pass above, read against the pinned baseline
pnpm bench:report                                               # derive report.md + report.json from the newest run
BENCH_MODE=full pnpm bench                                      # the same pass, read against whatever run landed before
```

`bench:baseline` is `bench` in the full profile with `BENCH_BASELINE` pinned to `baselines/2026-09-14T23-41-04-932Z`,
the last full pass over the previous engine, whose observations are tracked in this repository, so every pass's `Δ`
reads against the same run. It runs 3 trials per library in its own subprocess, every trial over the one closure the
scenario built before the first — one invocation is one pass, not three — and the whole suite takes a little over two
minutes on this machine. `baselines/` holds one thing, the pinned anchor every `Δ` reads against, exactly as its name
says. The other end of the `Δ` — the run this page is transcribed from — is not a baseline, so it lives under
`results-source/`, this page's own; every document keeps its committed runs beside itself, the way the cold-path
redesign's before and after live under `docs/decisions/di-cold-path-redesign/`, and nothing reaches into `baselines/`
but `bench:baseline`. Re-anchoring the ledger (re-pinning `bench:baseline` to a newer run once an engine epoch closes,
as this page did with the pre-rewrite run) is what retires an anchor; the old one is then deleted. The run writes a
timestamped directory under `bench-results/` (gitignored) holding `observations.jsonl` with every per-trial `mean ms`,
`p99 ms` and IQR; `bench:report` turns the newest run into the `report.md` this page is transcribed from, whose
Environment section prints the load average each child started under. Before quoting any single loss as a factor rather
than a direction, re-measure it paired and alternating on a quiet machine — a full pass carries no between-run variance
of its own. The rewrite's own protocol is in [`BENCH_GUIDE.md`](./BENCH_GUIDE.md): swap the change's `src` files per
side, `BENCH_LIBRARY=@codefast/di` and `BENCH_ONLY` the target rows plus warm canaries, a `BENCH_MODE=fast` gate first
and one full pass per side only when it wins, and read the per-trial spread, not one ratio; the redesign's record adds
the cheaper gate that came first, a standalone probe of the scenario's own function for time, bytes and objects per op.
`BENCH_TIER=contract` runs the comparison without the engine rows; `pnpm bench:list` prints which rows each library
implements and confirms there is no row a library's features allow that nobody wrote.
