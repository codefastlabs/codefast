# Results

Where `@codefast/di` actually stands against the field right now, wins and losses given equal weight — the point of this
page is to know where the engine is slower so the next change knows what to aim at. One machine-derived snapshot, no
accreted ledger. The method is in [`BENCH_GUIDE.md`](./BENCH_GUIDE.md); re-run it with the recipe at the bottom.

**This is one full-profile pass, so read the aggregates, not the rows.** GC-exposed for one collection between trials,
one subprocess per scenario, libraries interleaved with rotating order, 3 trials each — a single pass measures no
between-run variance of its own, 211 of the cells carry a per-trial IQR above 5%, and 133 rows sit above ~30M ops/s
where the ratio moves between runs of the same build whatever its IQR says. Ratios are worth more than the absolute
`hz/op`; a single row is worth less than the group it sits in. A loss highlighted below points at a direction — quote a
precise factor only after a paired re-run, except where a loss is a structural difference that reproduces by
construction (called out as such). The harness no longer forces a collection inside the measured loop; the pass this
page replaced did, and it read 23 codefast rows 15–150% lower for that alone (the plan rows most, since a generated
plan's short-lived shapes were what each forced collection cleared).

**This run reads against the pinned baseline.** It is `baselines/2026-09-20T11-25-38-194Z`, over the engine at
`ca59f4e44` — `main` after the cold-path redesign and the one-async-lane series — measured by the harness at
`41c3df3e8`; the baseline it is compared to is `baselines/2026-09-14T23-41-04-932Z`, the last full pass over the
previous engine (byte-identical to `0.10.0`), pinned by `pnpm bench:baseline`. Both runs' `observations.jsonl` are
committed under `baselines/`, so every `Δ` on this page is that comparison read from data in the repository, not from a
local `bench-results/` run only the author has. The suite grew by the 18 `plan-runs-*` rows that priced the codegen
tier's count, engine rows that enter no cross-library figure; the 126 rows the two runs share are compared one to one.
Every library implements every row its declared features allow, so a `—` below is a feature the library lacks, never a
row nobody wrote.

**Environment.** `@codefast/di` 0.10.1 (the pass ran on tree `41c3df3e8`, which carries the two series' unreleased
changes on top of `0.10.1`) from a `dist` the harness rebuilt first, on Node 26.1.0 / V8 14.6, Apple M3 Max × 14,
darwin/arm64, `--expose-gc` for every library. inversify 8.2.3 · awilix 13.0.5 · tsyringe 4.10.0 · brandi 5.1.0 · ditox
3.3.0 · injection-js 2.6.1. Each library runs at its canonical decorator mode (inversify legacy decorators +
`reflect-metadata`, codefast TC39 Stage 3 + `Symbol.metadata`); every inversify container uses `{ jitless: false }`, its
fastest documented configuration. Run 2026-09-20, 2m12s wall; the 1-minute load average read 2.60 at every child's
start, on fourteen cores.

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

## Summary — where we stand

Ratios are `@codefast/di ÷ competitor`; above 1× means codefast is faster. Win `>1.03×`, parity `0.97–1.03×`, loss
`<0.97×`. `Comparable` counts the rows both libraries ran, of 130 aggregate-eligible rows codefast measures; `†` is how
many of those the median and geomean carry from above the throughput ceiling — they stay in the aggregate but no reader
should cite one alone.

| Competitor     | Comparable | Win / parity / loss | Median | Geomean |   † |
| -------------- | ---------: | ------------------: | -----: | ------: | --: |
| InversifyJS 8  |  91 of 130 |          89 / 1 / 1 |  3.16× |   4.99× |  43 |
| Awilix 13      |  38 of 130 |          38 / 0 / 0 |  5.52× |   5.61× |  16 |
| tsyringe 4     |  43 of 130 |          38 / 1 / 4 |  4.25× |   3.53× |  18 |
| Brandi 5       |  29 of 130 |          28 / 0 / 1 |  14.2× |   11.1× |  16 |
| Ditox 3        |  44 of 130 |         28 / 0 / 16 |  1.28× |   1.52× |  20 |
| injection-js 2 |  31 of 130 |          20 / 3 / 8 |  1.19× |   1.42× |  20 |

**The headline, stated plainly: codefast sweeps inversify, awilix and brandi — awilix loses it no row now, the two
rebind rows it held having turned into 1.51× and 1.63× — wins tsyringe on the median by 4.3× while still losing it four
rows, and against the two libraries it is closest to holds both aggregates: ditox 1.28× on the median and 1.52× on the
geomean (from 1.06× and 1.39×), injection-js 1.19× and 1.42× (from 1.49× and 1.43×).** Against ditox the row count went
the other way — 16 losses now, 14 before — because the seven parities of the baseline pass split: the per-request rows
became wins (`production-http-handler` 1.19×, `production-unit-of-work` 1.15×,
`child-request-lifecycle-create-resolve-dispose` 1.64×), and the two stable-set collections became losses (0.71× and
0.60×), the price of the `resolveAll` copy named below. Against injection-js the median fell while the geomean held,
because three warm rows it is close on moved inside their band. Against the baseline, 54 of the 126 shared rows are more
than 10% faster and 2 are more than 10% slower; both are named below with the mechanism behind them. Every remaining
loss is one of the same shapes — **registration**, **cold collections**, the **accessor lane**, the **warm reads above
the ceiling** — plus two this round chose: the collection copy and the three allocations an async level owns.

## The losses, foregrounded — where to improve

Ordered by how much they matter, each marked as a **real deficit** (same work, codefast slower), a **work difference**
(codefast does more per op by design, so the row is a design cost to reconsider, not a bug) or a **chosen cost** (a
correctness fix this round took with its price known). Where the baseline is quoted, it is the same row in
`2026-09-14T23-41-04-932Z`.

- **Registration is still the biggest deficit, and it is a ditox-only one.** `bind-128-plain` — 128 transient factory
  bindings into a fresh container, no resolve — runs at 0.40× ditox, 0.99× tsyringe and 1.76× injection-js, where it ran
  0.42×, 1.02× and 2.21×: a fresh registration is one probe, one write and one version read now, and the row did not
  move against its baseline (1.00×), because what it pays is the object. The bind-floor probe in the redesign record
  puts a bare `Map.set` with a two-field literal at 13.4 ns and a probe-and-set with the twenty-field chain object at
  20.3 ns on this V8; ditox's whole `bindFactory` is 17.8 ns. The chain object is the fluent builder the contract
  returns, and the probe is last-wins; closing this row is a contract change (a lighter builder, or a bulk bind), not an
  optimisation. Everything that binds before it resolves sits on the same floor and moved where the redesign moved it:
  `create-child-empty` 1.63× ditox and 1.03× tsyringe (from 1.27× and 0.83×), `container-create-empty` 1.56× and 1.09×
  (from 1.57× and 1.09×), `realistic-graph-class-cold-resolve` 0.67× ditox and 1.06× tsyringe (from 0.49× and 0.76×),
  `boot-decorated-container-build-and-resolve` 0.86× tsyringe (from 0.75×), `module-cold-from-modules` 1.17× ditox (from
  1.05×). The two empty-container rows still lose injection-js above the ceiling (0.83×† and 0.67×†): a container is
  four objects now where it was seven, injection-js's injector is fewer. **Real deficit, structural** — one object per
  binding is the design, and the record says what it would cost to change.
- **The cold collection loses tsyringe and, at N=10, ditox.** `resolve-all-cold-N` builds a fresh container and reads
  the collection once: at N=100, 0.38× tsyringe (from 0.62×), ditox 1.30× and injection-js 1.19× stay wins; at N=10,
  0.47× tsyringe, 0.75× ditox and parity with injection-js (from 0.46×, 0.76× and 1.04×). A chain's own `.many()`
  re-slots without a probe now, which the hundred-member row shows against ditox and the ten-member row does not; what
  the pair still pays is the registration above, ten or a hundred times, and tsyringe's own hundred-member read got
  faster between the two passes. **Real deficit against tsyringe and at N=10 against ditox — the registration cost seen
  from the collection side.**
- **The stable-set collections are a chosen cost.** `resolve-all-strategies-10` 0.71×† ditox and 1.05× injection-js,
  `-100` 0.60×† and 0.90× (from 1.00×, 1.09×, 0.95× and 1.11×), the hundred-member row 0.87× of its baseline throughput:
  a root-level `resolveAll` hands each caller a copy of its memoized list, where it handed out the list itself, so no
  caller can mutate the engine's memo. A frozen list was measured and rejected — a frozen array iterates through a slow
  elements kind for every consumer. **Chosen cost**, its own commit, reversible alone.
- **Teardown at scale is a registration loss wearing a lifecycle label, and it narrowed.** `materialize-100-singletons`
  (bind and resolve 100 singletons, no teardown) is 0.52× ditox and 1.71× tsyringe (from 0.35× and 1.88×);
  `unbind-all-100-singletons` (the same, then dispose) 0.50× and 1.47× (from 0.35× and 1.50×) — 1.50× and 1.60× their
  baseline throughput, from the activation need stamped on the binding and a teardown that splices nothing. The two
  ratios against ditox are the same, so the teardown walk costs nothing the rivals do not pay — the loss is the 100
  bindings above. `lifecycle-pre-destroy-unbind` (one singleton, one hook) is 1.07× ditox now (from 0.82×) and 2.18×
  tsyringe. **Work difference on the hook, real deficit on the registration underneath.**
- **Rebind is a win against awilix now and still slow against ditox.** `rebind-hot-swap` 1.63× awilix (from 0.89×) and
  0.24×† ditox (from 0.14×†); `rebind-parent-resolve-child-depth-3` 1.51× awilix and 1.80× ditox (from 0.89× and 1.07×).
  A rebind of a lone token is one registration whose displaced binding is deactivated on the spot — 1.91× and 1.77× the
  baseline — and what it still pays against ditox's map write is the builder object and the deactivation walk. **Work
  difference**, above the ceiling against ditox.
- **The async rows carry the one-lane fix, and read it more exactly now.** With no collection forced into the loop, the
  fan-out rows read their baseline throughput within 8% (`async-fanout-concurrent-8/16/32/64` 1.02×, 1.01×, 0.99×, 0.92×
  of baseline, 1.33–1.48× inversify), `dynamic-async-chain-8` 1.00× of baseline and 1.58× inversify, and
  `async-init-single-hop` 1.34× its baseline while still 0.90× ditox and 0.87× injection-js (from 0.98× and 0.90×);
  `resolve-all-async-8` is at parity with inversify (0.99×, from 0.58× — 1.96× its baseline). The cascade lane — one
  shared frame stack, one context for every level — answered a factory that asked after an `await` from another chain's
  ancestors, a wrong value; every `resolveAsync` now runs on the branch lane, each level owning its frame, its context
  and, at a root, its array. In the fast profile that costs the fan-out a sixth; in this profile the forced collections
  that used to hide behind that number are gone, and the price reads as the record measured it standalone. **Chosen
  cost**: the rows stay wins where they were wins, and the value is right.
- **`accessor-injection-construct` 0.25×† inversify, from 0.42×.** codefast's own throughput on the row is 0.97× of its
  baseline; inversify's rose once the harness stopped collecting inside the loop, so the ratio fell. The row measures
  the benchmark's transpiler as much as the engine: esbuild lowers the scenario's own `accessor` field to
  `WeakMap`-backed privates (`__privateAdd`, `__accessCheck`), a third of the row's self time, and a `WeakMap` is what a
  forced collection punished most. What the engine pays is the ambient scope around construction and the accessor's own
  `resolve` through the container, where inversify's property injection is a metadata read on the same plan. **Work
  difference**, and a harness change proposed (a `tsc` compile of the codefast scenarios), not made.
- **Warm reads above the ceiling: 0.78×† and 0.70×† ditox on `constant-resolve` and `singleton-class-1-dep`**, the same
  shape on `to-resolved-3-deps` 0.73×†, `resolve-optional-hit` 0.77×† and `production-event-bus-dispatch` 0.71×† (from
  0.79×†, 0.71×†, 0.71×†, 0.78×† and 0.83×†). ditox's `get` is close to a map read; codefast still carries its binding
  and lifecycle shape on every resolve. In a standalone loop of the same scenario functions the two libraries read equal
  at 5 ns; the gap exists only inside the harness, and an inline warm answer was tried and reverted (it cost the
  non-warm paths and helped none). All five rows sit above 30M ops/s, inside the band that stops reproducing between
  runs. **Real deficit, ceiling-bound, harness-only so far.**
- **Failing fast costs more here: `misconfigured-missing-binding` 0.73× tsyringe, 0.78× ditox, 0.77× brandi, 0.89×
  injection-js**, from 0.63×, 0.69×, 0.68× and 0.86×, because each error class names itself with a literal instead of a
  constructor lookup per throw. codefast still builds a structured error with the resolution path; the rivals throw a
  string, and the stack capture both pay is most of the row. **Work difference** on a path a production request should
  never take.
- **Two rows read down against the baseline in this pass, and three moved on a rival's side.**
  `resolve-all-strategies-100` 0.87× is the chosen copy above. `production-event-bus-dispatch` 0.84× is a per-process
  mode this round found and could not attribute: the same source reads the dispatch, and the 32-level dynamic chain
  beside it, in one of two modes depending on the child process, on `main` before the round as after it; no commit, the
  frame carrier or the context pool moves it, and with the rows alone in the process the two builds read within 4%.
  `realistic-graph-resolve-root` reads 0.91× injection-js where the two passes before read 1.26× and 1.32×, with
  codefast's own throughput at 1.03× of baseline — the move is on injection-js's side and one pass cannot confirm it;
  `alias-parent-owned-terminal` 0.97×† and `nested-container-resolve-in-factory` 0.87×† injection-js are inside the
  ceiling band. **Open**: the mode on the two dispatch-shaped rows, and injection-js's warm graph row, to re-measure
  paired before the next change to either lane.

## The wins

- **inversify — 89 of 91 comparable rows, 3.16× median, 4.99× geomean.** Widest margins on `failure`'s
  `circular-dependency-3` and `alias-cycle-detected` (both excluded — inversify recurses to the stack limit rather than
  detecting either), then `boot` (19.7× geomean), `production` (17.2×), `scope` (13.7×), `lifecycle` (11.9×),
  `introspection` (6.68×), `realistic` (5.73×), `fan-out` (5.51×), `slot-selection` (3.53×); tightest on `async` (1.37×)
  and `resolution` (0.90×, the accessor row against the plan rows). `resolve-all-async-8` is at parity from 0.58×: the
  members of an async collection settle in declaration order through the one combinator every fan-out uses. Every
  fresh-child row is 31–49×, every production row 10–28×, `bind-128-plain` 22.6×, and the `child-depth` axis is flat at
  1.55–1.59×†.
- **Awilix 13 — 38 of 38, 5.52× median, no loss**, up to 12.8× on the deep child walk and 34× on `bind-128-plain`; the
  two rebind rows it held are 1.63× and 1.51× now, and `async-init-single-hop` 1.06×.
- **tsyringe 4 — 38 of 43, 4.25× median**, 9.94× on `micro` and 6.25× on `scope`; the stable-set collections read 15.8×
  at N=100 and 2.96× at N=10, `realistic-graph-class-cold-resolve` 1.06× (from 0.76×), `create-child-empty` 1.03× (from
  0.83×), `bind-128-plain` at parity (0.99×); it still wins the cold collections (0.38× and 0.47×), `boot-decorated-*`
  (0.86×) and the missing-binding throw (0.73×).
- **Brandi 5 — 28 of 29, 14.2× median**, 31× on transient micro and 48×† on the resolved-factory graph; loses only the
  missing-binding throw.
- **Against ditox codefast wins 28 rows to 16 and both aggregates (1.28× median, 1.52× geomean, from 1.06× and 1.39×).**
  The warm work — `transient-class-1-dep` 7.27×†, `realistic-graph-resolved-root` 5.12×†,
  `realistic-graph-class-resolve-root` 4.99× (from 2.09×), `resolve-optional-miss` 4.19×†,
  `realistic-graph-resolve-root` 1.56×, every `child-depth` row 4.18–31.4×† — and the cold and per-request work:
  `fresh-child-default-n4` 2.66×, `fresh-child-default-n1` 2.19× (from 1.84×), `rebind-parent-resolve-child-depth-3`
  1.80×, `child-request-lifecycle-create-resolve-dispose` 1.64× (from 1.34×), `create-child-empty` 1.63×,
  `container-create-empty` 1.56×, `scoped-binding-per-child` 1.48×, `scale-mid-transient-chain-32` 1.47×,
  `resolve-all-cold-100` 1.30×, `scale-deep-transient-chain-512` 1.25×, `production-http-handler` 1.19× and
  `production-unit-of-work` 1.15× (from 1.00× and 1.01×), `module-cold-from-modules` 1.17×,
  `realistic-graph-cold-resolve` 1.09× (from 0.98×), `lifecycle-pre-destroy-unbind` 1.07× (from 0.82×). It still loses
  every row that binds many things (`bind-128-plain` 0.40×, the two 100-singleton lifecycle rows 0.52× and 0.50×, the
  class-cold graph 0.67×), the cold collection at N=10 (0.75×), the two stable sets by choice, the missing-binding throw
  and the warm reads above the ceiling.
- **Against injection-js the geomean is 1.42× and the median 1.19×** (from 1.43× and 1.49×; 20 wins, 3 parities, 8
  losses). The warm rows are wins (`realistic-graph-resolved-root` 3.96×†, `realistic-graph-class-resolve-root` 3.13×,
  `singleton-class-1-dep` 2.46×†, `resolve-optional-miss` 2.74×†), so is registration (`bind-128-plain` 1.76×,
  `realistic-graph-cold-resolve` 2.18×, `boot-decorated-*` 1.76×, the class-cold graph 2.04×), and so is the cold
  collection at N=100 (1.19×); the losses are the two empty-container rows above the ceiling, the hundred-member stable
  set (0.90×), `async-init-single-hop` 0.87×, the missing-binding throw (0.89×), and three rows on which one pass moved
  the rival's side — the warm graph root at 0.91× and two nested-factory rows above the ceiling.
- **The selection axes are flat where they should be.** `named-resolve-slots-1/64` read 3.16× and 3.27× inversify and
  `tagged-resolve-slots-1/64` 4.81× and 4.83× with no trend across N: both lanes are indexed, and the axis proves it.
- **What this round moved, against the baseline.** The widest, on rows with a causal path: `plan-class-chain-40` 7.99×
  (flat plans to any depth, read without forced collections for the first time), `realistic-graph-class-resolve-root`
  3.28×, `plan-async-resolved-chain-8` 3.12× (one awaiting dependency is `Promise.resolve(p).then()`, not
  `Promise.all([p])`), `async-branch-chain-8` 2.73× and `async-branch-escape-mid-chain-8` 2.32× (one live context
  anchors the branch lane against the deopt loop a real collection still triggers), `plan-escape-multi-dep` 2.39× and
  `multi-tag-constraint-resolve` 2.26× (one constraint-context shape), `resolve-all-async-8` 1.96×,
  `plan-async-class-chain-8` 1.94×, `rebind-hot-swap` 1.91×, `plan-class-chain-24` 1.77×,
  `rebind-parent-resolve-child-depth-3` 1.77×, `unbind-all-100-singletons` 1.60×, `materialize-100-singletons` 1.50×,
  `lifecycle-pre-destroy-unbind` 1.50×, `realistic-graph-class-cold-resolve` 1.50×,
  `boot-decorated-container-build-and-resolve` 1.36×, `create-child-empty` 1.35×, `async-init-single-hop` 1.34×,
  `interpreted-class-chain-40` 1.30× and `-24` 1.23× (the flag-only cycle check), `module-cold-from-modules` 1.25×,
  `production-http-handler` 1.23×, `module-load-unload` 1.22×, `fresh-child-default-n1` 1.21× — 54 of 126 shared rows
  more than 10% faster, 70 within 10%, 2 slower, with the warm resolve rows (`constant-resolve` 1.02×,
  `singleton-class-1-dep` 1.06×, `realistic-graph-resolve-root` 1.03×, `transient-class-1-dep` 0.94×) at or near parity,
  which is what every slice's probe was gated on.

## Geomean by group

Geomean of the ratios in each group, comparable row count in parentheses. Read a group, not a cell.

| Group          | InversifyJS 8 | Awilix 13 | tsyringe 4 |  Brandi 5 |   Ditox 3 | injection-js 2 |
| -------------- | ------------: | --------: | ---------: | --------: | --------: | -------------: |
| micro          |    3.08× (22) | 5.37× (8) |  9.94× (7) | 18.8× (8) | 1.66× (7) |      1.58× (9) |
| realistic      |     5.73× (5) | 6.58× (4) |  3.46× (4) | 14.9× (5) | 1.96× (5) |      2.19× (5) |
| fan-out        |     5.51× (9) | 1.93× (1) |  1.92× (5) | 9.58× (1) | 0.97× (5) |      1.04× (4) |
| async          |    1.37× (10) | 1.06× (1) |  1.24× (1) | 2.38× (1) | 0.90× (1) |      0.87× (1) |
| lifecycle      |     11.9× (8) | 4.98× (5) |  2.20× (4) |         — | 0.65× (5) |              — |
| scope          |    13.7× (12) | 6.86× (8) |  6.25× (8) | 15.3× (5) | 4.63× (8) |      1.82× (4) |
| scale          |     2.50× (2) | 10.6× (2) |  3.57× (2) | 8.19× (2) | 1.36× (2) |              — |
| boot           |     19.7× (7) | 16.0× (3) |  0.99× (4) | 5.25× (4) | 1.04× (4) |      1.15× (4) |
| failure        |     1.54× (2) | 2.30× (1) |  0.73× (1) | 0.77× (1) | 0.78× (1) |      0.89× (1) |
| production     |     17.2× (3) | 7.26× (2) |  3.37× (3) |         — | 0.99× (3) |      1.09× (1) |
| introspection  |     6.68× (2) | 1.27× (1) |  4.51× (2) |         — | 1.54× (1) |              — |
| slot-selection |     3.53× (6) |         — |          — |         — |         — |              — |
| resolution     |     0.90× (3) | 3.14× (2) |  4.76× (2) | 15.8× (2) | 1.48× (2) |      0.93× (2) |

The `boot` group against tsyringe, ditox and injection-js (0.99×, 1.04×, 1.15×, from 0.92×, 0.97× and 1.11×) is the
registration deficit in one number: closed at the group level, and what remains of it is the single `bind-128-plain` row
against ditox. The `fan-out` group against ditox fell from 1.14× to 0.97× and against injection-js from 1.16× to 1.04×:
the two stable-set rows now pay the copy. `production` against ditox (0.99×, from 0.94×) is the event-bus row above the
ceiling, the two request rows being wins. `lifecycle` against ditox (0.65×, from 0.43×) is the two 100-singleton rows,
the registration deficit again, narrower. `async` against inversify (1.37×, from 1.42×) is the one-lane fix's three
allocations on the fan-out rows; against ditox and injection-js (0.90×, 0.87×) it is `async-init-single-hop`, the one
async row that is not a win. `realistic` against inversify (5.73×, from 5.20×) and against every rival is the generated
plans, plus a class graph that resolves its root 3.28× faster than at the baseline. `resolution` against inversify fell
to 0.90× (from 1.05×) on the accessor row alone. `failure` against inversify stays at 1.54× because
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
| constant-resolve                               | micro          |  1000 |       145,830,571‡ |          2.25×†‡ |      3.86×†‡ |       7.63×†‡ |     25.0×†‡ |    0.78×†‡ |           1.14×†‡ |
| singleton-class-1-dep                          | micro          |   200 |       130,130,278‡ |          2.55×†‡ |      3.15×†‡ |       7.42×†‡ |     23.2×†‡ |    0.70×†‡ |           2.46×†‡ |
| transient-class-1-dep                          | micro          |   200 |        70,879,431‡ |          1.89×†‡ |      8.01×†‡ |       12.7×†‡ |     30.6×†‡ |    7.27×†‡ |                 — |
| named-constant-get                             | micro          |   500 |        80,377,750‡ |          3.06×†‡ |            — |             — |           — |          — |                 — |
| named-resolve-slots-1                          | micro          |   500 |        84,583,930‡ |          3.16×†‡ |            — |             — |           — |          — |                 — |
| named-resolve-slots-4                          | micro          |   500 |        85,548,968‡ |          3.23×†‡ |            — |             — |           — |          — |                 — |
| named-resolve-slots-16                         | micro          |   500 |        85,039,480‡ |          3.16×†‡ |            — |             — |           — |          — |                 — |
| named-resolve-slots-64                         | micro          |   500 |        85,848,419‡ |          3.27×†‡ |            — |             — |           — |          — |                 — |
| optional-missing-transient                     | micro          |   200 |         51,820,921 |          1.13×†‡ |            — |             — |      12.2×† |     3.74×† |                 — |
| realistic-graph-resolve-root                   | realistic      |    20 |         18,137,719 |            2.66× |        2.61× |         5.05× |       14.6× |      1.56× |             0.91× |
| realistic-graph-cold-resolve                   | realistic      |     1 |           294,192‡ |           9.36×‡ |       4.39×‡ |        2.16×‡ |      4.91×‡ |     1.09×‡ |            2.18×‡ |
| realistic-graph-resolved-root                  | realistic      |    20 |        58,437,239‡ |          3.09×†‡ |            — |             — |     48.0×†‡ |    5.12×†‡ |           3.96×†‡ |
| realistic-graph-class-resolve-root             | realistic      |    20 |        55,623,223‡ |          3.07×†‡ |      9.32×†‡ |       12.3×†‡ |     43.8×†‡ |    4.99×†‡ |           3.13×†‡ |
| realistic-graph-class-cold-resolve             | realistic      |     1 |            475,062 |            26.2× |       17.5×‡ |         1.06× |       4.94× |      0.67× |             2.04× |
| realistic-graph-validate                       | realistic      |    10 |         20,075,758 |                — |            — |             — |           — |          — |                 — |
| fan-out-tree-depth-3-breadth-4                 | fan-out        |    20 |          1,833,763 |            1.64× |        1.93× |         3.11× |       9.58× |      2.05× |                 — |
| resolve-all-strategies-10                      | fan-out        |     1 |        26,773,943‡ |           7.12×‡ |            — |        2.96×‡ |           — |    0.71×†‡ |            1.05×‡ |
| resolve-all-strategies-100                     | fan-out        |     1 |         22,913,602 |            51.3× |            — |         15.8× |           — |    0.60×†‡ |            0.90×‡ |
| resolve-all-cold-10                            | fan-out        |     1 |          1,588,770 |           20.8×‡ |            — |         0.47× |           — |      0.75× |             1.02× |
| resolve-all-cold-100                           | fan-out        |     1 |            197,536 |           22.2×‡ |            — |        0.38×‡ |           — |      1.30× |             1.19× |
| resolve-all-named-8                            | fan-out        |     1 |         23,457,523 |            2.16× |            — |             — |           — |          — |                 — |
| resolve-all-named-16                           | fan-out        |     1 |         23,821,779 |            2.18× |            — |             — |           — |          — |                 — |
| resolve-all-named-32                           | fan-out        |     1 |         19,481,033 |            1.82× |            — |             — |           — |          — |                 — |
| resolve-all-named-64                           | fan-out        |     1 |         21,974,376 |            2.00× |            — |             — |           — |          — |                 — |
| resolve-async-single-hop                       | async          |     1 |          9,463,328 |            1.29× |            — |             — |           — |          — |                 — |
| async-init-single-hop                          | async          |     1 |          5,944,274 |            1.49× |        1.06× |         1.24× |       2.38× |      0.90× |             0.87× |
| dynamic-async-chain-8                          | async          |     1 |          2,082,817 |            1.58× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-8                      | async          |     1 |            953,160 |            1.33× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-16                     | async          |     1 |            514,638 |            1.36× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-32                     | async          |     1 |            257,320 |            1.46× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-64                     | async          |     1 |            123,525 |            1.48× |            — |             — |           — |          — |                 — |
| async-branch-chain-8                           | async          |     1 |          1,342,525 |                — |            — |             — |           — |          — |                 — |
| async-branch-escape-mid-chain-8                | async          |     1 |          1,710,070 |                — |            — |             — |           — |          — |                 — |
| async-diamond-shared-leaf                      | async          |     1 |          1,932,739 |            1.29× |            — |             — |           — |          — |                 — |
| plan-async-resolved-chain-8                    | async          |     1 |          2,758,702 |                — |            — |             — |           — |          — |                 — |
| plan-async-class-chain-8                       | async          |     1 |          5,445,677 |                — |            — |             — |           — |          — |                 — |
| resolve-all-async-8                            | async          |     1 |            949,833 |            0.99× |            — |             — |           — |          — |                 — |
| resolve-optional-async-miss                    | async          |     1 |          9,812,868 |            1.55× |            — |             — |           — |          — |                 — |
| lifecycle-post-construct-singleton             | lifecycle      |   250 |       135,912,742‡ |          2.79×†‡ |            — |             — |           — |          — |                 — |
| lifecycle-pre-destroy-unbind                   | lifecycle      |     1 |          3,182,176 |            23.1× |       7.78×‡ |         2.18× |           — |      1.07× |                 — |
| binding-level-activation-hook                  | lifecycle      |   200 |        55,870,540‡ |          2.11×†‡ |            — |             — |           — |          — |                 — |
| child-depth-1-resolve                          | scope          |   500 |         95,768,184 |          1.59×†‡ |       3.83×† |        6.23×† |      17.8×† |     4.18×† |           1.38×†‡ |
| child-depth-2-resolve                          | scope          |   500 |         95,912,358 |          1.51×†‡ |       4.95×† |        7.35×† |      18.3×† |     7.54×† |           1.60×†‡ |
| child-depth-4-resolve                          | scope          |   500 |         94,551,969 |          1.57×†‡ |       7.14×† |        9.48×† |      20.3×† |     15.3×† |           1.80×†‡ |
| child-depth-8-resolve                          | scope          |   500 |         95,876,251 |          1.55×†‡ |       12.7×† |        14.8×† |      24.7×† |     31.4×† |            2.74×† |
| child-request-lifecycle-create-resolve-dispose | scope          |   100 |          2,665,003 |           49.8×‡ |       12.9×‡ |        5.20×‡ |           — |      1.64× |                 — |
| fresh-child-default-n1                         | scope          |   100 |        11,766,508‡ |           42.5×‡ |       9.07×‡ |        7.53×‡ |           — |     2.19×‡ |                 — |
| fresh-child-default-n4                         | scope          |   100 |         7,817,586‡ |           31.1×‡ |       6.91×‡ |        7.16×‡ |           — |     2.66×‡ |                 — |
| fresh-child-name-n1                            | scope          |   100 |         11,289,100 |           45.5×‡ |            — |             — |           — |          — |                 — |
| fresh-child-name-n4                            | scope          |   100 |          7,690,023 |           31.9×‡ |            — |             — |           — |          — |                 — |
| fresh-child-tag-n1                             | scope          |   100 |         10,677,849 |           48.0×‡ |            — |             — |           — |          — |                 — |
| fresh-child-tag-n4                             | scope          |   100 |          7,492,419 |           34.0×‡ |            — |             — |           — |          — |                 — |
| scale-mid-transient-chain-32                   | scale          |     1 |          1,406,803 |            2.41× |        4.55× |         3.99× |       9.94× |      1.47× |                 — |
| scale-deep-transient-chain-512                 | scale          |     1 |             54,201 |            2.59× |        24.7× |         3.20× |       6.76× |      1.25× |                 — |
| boot-decorated-container-build-and-resolve     | boot           |     1 |           663,165‡ |           18.0×‡ |            — |        0.86×‡ |           — |          — |            1.76×‡ |
| container-create-empty                         | boot           |   100 |        26,934,385‡ |           43.5×‡ |       10.6×‡ |        1.09×‡ |      7.99×‡ |     1.56×‡ |           0.83×†‡ |
| create-child-empty                             | boot           |   100 |        23,622,415‡ |           53.4×‡ |       11.3×‡ |        1.03×‡ |      7.02×‡ |     1.63×‡ |           0.67×†‡ |
| bind-128-plain                                 | boot           |     1 |            185,099 |           22.6×‡ |       34.3×‡ |         0.99× |       8.77× |      0.40× |             1.76× |
| bind-128-refined                               | boot           |     1 |             29,154 |           3.76×‡ |            — |             — |           — |          — |                 — |
| misconfigured-missing-binding                  | failure        |     1 |           273,999‡ |           1.63×‡ |       2.30×‡ |        0.73×‡ |      0.77×‡ |     0.78×‡ |            0.89×‡ |
| circular-dependency-3                          | failure        |     1 |            159,988 |           178.7× |       1.45×‡ |             — |           — |          — |             0.48× |
| ambiguous-multi-binding                        | failure        |     1 |           221,748‡ |           1.45×‡ |            — |             — |           — |          — |                 — |
| production-http-handler                        | production     |    50 |          1,802,913 |           28.2×‡ |       7.88×‡ |        3.40×‡ |           — |      1.19× |                 — |
| production-unit-of-work                        | production     |   100 |           995,588‡ |           16.9×‡ |       6.69×‡ |        2.30×‡ |           — |     1.15×‡ |                 — |
| production-event-bus-dispatch                  | production     |   100 |         42,360,464 |           10.7×† |            — |        4.88×† |           — |    0.71×†‡ |           1.09×†‡ |
| to-resolved-3-deps                             | micro          |   200 |       135,554,243‡ |          2.66×†‡ |            — |             — |     23.2×†‡ |    0.73×†‡ |           1.83×†‡ |
| to-alias-redirect                              | micro          |   500 |         90,244,878 |           1.79×† |       5.10×† |        10.4×† |           — |          — |           1.01×†‡ |
| to-self-binding                                | micro          |   300 |       127,321,617‡ |          2.51×†‡ |            — |       5.64×†‡ |           — |          — |           2.39×†‡ |
| alias-chain-3                                  | micro          |   500 |         89,193,460 |           3.62×† |       11.9×† |        20.5×† |           — |          — |           1.11×†‡ |
| alias-parent-owned-terminal                    | micro          |   500 |         87,692,737 |          1.76×†‡ |       5.94×† |        11.1×† |           — |          — |           0.97×†‡ |
| alias-cycle-detected                           | failure        |     1 |           248,449‡ |          688.4×‡ |       2.68×‡ |             — |           — |          — |            0.87×‡ |
| resolve-optional-hit                           | micro          |   500 |       150,698,608‡ |          4.94×†‡ |      4.23×†‡ |             — |     26.1×†‡ |    0.77×†‡ |           1.68×†‡ |
| resolve-optional-miss                          | micro          |   500 |        246,993,357 |           7.83×† |       4.64×† |             — |      4.16×† |     4.19×† |           2.74×†‡ |
| tagged-binding-resolve                         | micro          |   300 |        90,907,626‡ |          4.51×†‡ |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-1                         | micro          |   300 |        99,386,505‡ |          4.81×†‡ |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-4                         | micro          |   300 |        98,549,701‡ |          4.73×†‡ |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-16                        | micro          |   300 |        99,159,828‡ |          4.83×†‡ |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-64                        | micro          |   300 |        98,884,701‡ |          4.83×†‡ |            — |             — |           — |          — |                 — |
| conditional-injection-tagged                   | micro          |   300 |        72,196,644‡ |          2.01×†‡ |            — |             — |     28.5×†‡ |          — |                 — |
| rebind-hot-swap                                | lifecycle      |    50 |        21,691,894‡ |           49.4×‡ |       1.63×‡ |             — |           — |    0.24×†‡ |                 — |
| has-bound-check                                | introspection  |  1000 |        336,369,813 |           6.37×† |       1.27×† |        3.25×† |           — |     1.54×† |                 — |
| has-own-unbound-check                          | introspection  |  1000 |       665,914,926‡ |          7.00×†‡ |            — |       6.28×†‡ |           — |          — |                 — |
| container-level-activation-hook                | lifecycle      |   200 |        49,465,466‡ |          1.95×†‡ |            — |       4.31×†‡ |           — |          — |                 — |
| scoped-binding-per-child                       | scope          |   100 |          6,177,023 |           48.2×‡ |       3.53×‡ |         1.28× |       5.11× |      1.48× |                 — |
| rebind-parent-resolve-child-depth-3            | lifecycle      |    50 |        13,620,375‡ |           76.2×‡ |       1.51×‡ |             — |           — |     1.80×‡ |                 — |
| materialize-100-singletons                     | lifecycle      |     1 |             71,218 |            20.3× |       13.6×‡ |         1.71× |           — |      0.52× |                 — |
| unbind-all-100-singletons                      | lifecycle      |     1 |            57,435‡ |           20.1×‡ |       11.8×‡ |        1.47×‡ |           — |     0.50×‡ |                 — |
| module-load-unload                             | boot           |     1 |         1,121,075‡ |           15.4×‡ |            — |             — |           — |          — |                 — |
| module-cold-from-modules                       | boot           |     1 |          1,960,578 |           20.7×‡ |            — |             — |       1.54× |      1.17× |                 — |
| initialize-async-warmup                        | boot           |     1 |            576,679 |                — |            — |             — |           — |          — |                 — |
| inspect-snapshot                               | introspection  |    20 |          9,299,212 |                — |            — |             — |           — |          — |                 — |
| lookup-bindings                                | introspection  |   200 |         23,511,100 |                — |            — |             — |           — |          — |                 — |
| generate-dependency-graph                      | introspection  |    10 |            755,071 |                — |            — |             — |           — |          — |                 — |
| multi-tag-slot-resolve                         | micro          |   300 |         14,032,540 |                — |            — |             — |           — |          — |                 — |
| multi-tag-constraint-resolve                   | micro          |   200 |          7,257,509 |                — |            — |             — |           — |          — |                 — |
| multi-tag-select-32                            | micro          |   300 |          2,856,651 |                — |            — |             — |           — |          — |                 — |
| mask-reject-wide-catalog                       | slot-selection |   300 |         47,383,582 |                — |            — |             — |           — |          — |                 — |
| mask-accept-two-of-four                        | slot-selection |   300 |         20,248,887 |                — |            — |             — |           — |          — |                 — |
| mask-collision-same-bit                        | slot-selection |   300 |         50,680,913 |                — |            — |             — |           — |          — |                 — |
| slot-tag-array-hoisted                         | slot-selection |   300 |        91,051,975‡ |                — |            — |             — |           — |          — |                 — |
| slot-tag-shorthand-hoisted                     | slot-selection |   300 |        94,677,571‡ |                — |            — |             — |           — |          — |                 — |
| slot-tag-array-inline                          | slot-selection |   300 |        66,317,050‡ |                — |            — |             — |           — |          — |                 — |
| slot-tag-shorthand-inline                      | slot-selection |   300 |        78,053,987‡ |                — |            — |             — |           — |          — |                 — |
| slot-tag-zero-value                            | slot-selection |   300 |        90,867,947‡ |          4.49×†‡ |            — |             — |           — |          — |                 — |
| slot-name-and-tag                              | slot-selection |   300 |        41,073,202‡ |          2.06×†‡ |            — |             — |           — |          — |                 — |
| slot-tag-resolve-all                           | slot-selection |   300 |         50,806,079 |           4.36×† |            — |             — |           — |          — |                 — |
| slot-tag-miss-optional                         | slot-selection |   300 |        66,905,791‡ |          2.74×†‡ |            — |             — |           — |          — |                 — |
| slot-tag-parent-owned                          | slot-selection |   300 |        90,768,075‡ |          4.51×†‡ |            — |             — |           — |          — |                 — |
| slot-name-parent-owned                         | slot-selection |   300 |        85,346,032‡ |          3.90×†‡ |            — |             — |           — |          — |                 — |
| slot-injected-name-compiled                    | slot-selection |   300 |         67,941,420 |                — |            — |             — |           — |          — |                 — |
| slot-injected-name-interpreted                 | slot-selection |   300 |          4,230,406 |                — |            — |             — |           — |          — |                 — |
| slot-injected-tag-compiled                     | slot-selection |   300 |         67,892,337 |                — |            — |             — |           — |          — |                 — |
| slot-injected-tag-interpreted                  | slot-selection |   300 |          4,372,493 |                — |            — |             — |           — |          — |                 — |
| plan-deps-inlined                              | resolution     |   300 |         55,941,790 |                — |            — |             — |           — |          — |                 — |
| plan-escape-factory-dep                        | resolution     |   300 |          7,511,407 |                — |            — |             — |           — |          — |                 — |
| plan-escape-scoped-dep                         | resolution     |   300 |         11,689,808 |                — |            — |             — |           — |          — |                 — |
| plan-escape-hooked-dep                         | resolution     |   300 |          2,713,531 |                — |            — |             — |           — |          — |                 — |
| plan-escape-optional-dep                       | resolution     |   300 |          3,828,811 |                — |            — |             — |           — |          — |                 — |
| plan-escape-multi-dep                          | resolution     |   300 |          2,262,323 |                — |            — |             — |           — |          — |                 — |
| plan-class-chain-24                            | resolution     |     1 |          7,129,380 |                — |            — |             — |           — |          — |                 — |
| plan-class-chain-40                            | resolution     |     1 |          4,220,835 |                — |            — |             — |           — |          — |                 — |
| interpreted-class-chain-24                     | resolution     |     1 |            373,109 |                — |            — |             — |           — |          — |                 — |
| interpreted-class-chain-40                     | resolution     |     1 |            190,911 |                — |            — |             — |           — |          — |                 — |
| plan-runs-1                                    | resolution     |     1 |            747,977 |                — |            — |             — |           — |          — |                 — |
| plan-runs-256                                  | resolution     |     1 |             14,655 |                — |            — |             — |           — |          — |                 — |
| plan-runs-512                                  | resolution     |     1 |              7,447 |                — |            — |             — |           — |          — |                 — |
| plan-runs-1024                                 | resolution     |     1 |              3,850 |                — |            — |             — |           — |          — |                 — |
| plan-runs-2048                                 | resolution     |     1 |              1,919 |                — |            — |             — |           — |          — |                 — |
| plan-runs-4096                                 | resolution     |     1 |              1,138 |                — |            — |             — |           — |          — |                 — |
| plan-runs-8192                                 | resolution     |     1 |                639 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-1                               | resolution     |     1 |            193,361 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-256                             | resolution     |     1 |              4,620 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-512                             | resolution     |     1 |              2,511 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-1024                            | resolution     |     1 |              1,253 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-2048                            | resolution     |     1 |                657 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-8192                            | resolution     |     1 |                214 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-1                              | resolution     |     1 |            721,948 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-512                            | resolution     |     1 |              7,461 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-1024                           | resolution     |     1 |              3,830 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-2048                           | resolution     |     1 |              1,891 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-8192                           | resolution     |     1 |                628 |                — |            — |             — |           — |          — |                 — |
| nested-context-resolve-in-factory              | resolution     |   300 |         45,094,224 |           1.89×† |       3.74×† |        5.33×† |      17.5×† |     2.34×† |           0.98×†‡ |
| nested-container-resolve-in-factory            | resolution     |   300 |         36,319,771 |           1.57×† |       2.63×† |        4.25×† |      14.2×† |     0.93×† |           0.87×†‡ |
| accessor-injection-construct                   | resolution     |   300 |         8,048,640‡ |          0.25×†‡ |            — |             — |           — |          — |                 — |

## Re-running this

```bash
pnpm bench:baseline                                             # from benchmarks/di — the full-profile pass above, read against the pinned baseline
pnpm bench:report                                               # derive report.md + report.json from the newest run
BENCH_MODE=full pnpm bench                                      # the same pass, read against whatever run landed before
```

`bench:baseline` is `bench` in the full profile with `BENCH_BASELINE` pinned to `baselines/2026-09-14T23-41-04-932Z`,
the last full pass over the previous engine, whose observations are tracked in this repository, so every pass's `Δ`
reads against the same run. It runs 3 trials per library in its own subprocess — one invocation is one pass, not three —
and the whole suite takes a little over two minutes on this machine. `baselines/` holds exactly the committed runs the
repository cites: the pinned baseline, `baselines/2026-09-20T11-25-38-194Z`, the run this page is transcribed from, and
the two contract-tier runs the cold-path redesign's decision record reads its before and after from
(`2026-09-20T02-07-56-518Z`, `2026-09-20T05-28-49-997Z`). A run under `baselines/` that nothing cites any more is
deleted; re-anchoring the ledger (re-pinning `bench:baseline` to a newer run once an engine epoch closes, as this page
did with the pre-rewrite run) is what makes an older baseline unreferenced and removable. The run writes a timestamped
directory under `bench-results/` (gitignored) holding `observations.jsonl` with every per-trial `mean ms`, `p99 ms` and
IQR; `bench:report` turns the newest run into the `report.md` this page is transcribed from, whose Environment section
prints the load average each child started under. Before quoting any single loss as a factor rather than a direction,
re-measure it paired and alternating on a quiet machine — a full pass carries no between-run variance of its own. The
rewrite's own protocol is in [`BENCH_GUIDE.md`](./BENCH_GUIDE.md): swap the change's `src` files per side,
`BENCH_LIBRARY=@codefast/di` and `BENCH_ONLY` the target rows plus warm canaries, a `BENCH_MODE=fast` gate first and one
full pass per side only when it wins, and read the per-trial spread, not one ratio; the redesign's record adds the
cheaper gate that came first, a standalone probe of the scenario's own function for time, bytes and objects per op.
`BENCH_TIER=contract` runs the comparison without the engine rows; `pnpm bench:list` prints which rows each library
implements and confirms there is no row a library's features allow that nobody wrote.
