# Results

Where `@codefast/di` actually stands against the field right now, wins and losses given equal weight — the point of this
page is to know where the engine is slower so the next change knows what to aim at. One machine-derived snapshot, no
accreted ledger. The method is in [`BENCH_GUIDE.md`](./BENCH_GUIDE.md); re-run it with the recipe at the bottom.

**This is one full-profile pass, so read the aggregates, not the rows.** GC-exposed for one collection between trials,
one subprocess per scenario, libraries interleaved with rotating order, 3 trials each over the one closure a scenario
builds before its first trial — a single pass measures no between-run variance of its own, 100 of the cells carry a
per-trial IQR above 5%, and 140 rows sit above ~30M ops/s where the ratio moves between runs of the same build whatever
its IQR says. Ratios are worth more than the absolute `hz/op`; a single row is worth less than the group it sits in. A
loss highlighted below points at a direction — quote a precise factor only after a paired re-run, except where a loss is
a structural difference that reproduces by construction (called out as such). Two things the harness used to do are
gone, and the page this one replaces measured both: it forced a collection into the measured loop every hundred samples,
and it built a fresh closure from each scenario for every trial, which turns off V8's function-context specialization
from the second closure on — so two of every three trials read unspecialized code, and the median was that. Every trial
now reads the closure an application's call site would; 43 of codefast's rows moved by more than 10% for that alone,
every one of them up, and the rivals moved with them.

**This run reads against the pinned baseline.** It is `baselines/2026-09-20T14-04-41-396Z`, over the engine at
`ca59f4e44` plus the async root context that landed after it — `main` at `871106879` — measured by the harness at the
same commit; the baseline it is compared to is `baselines/2026-09-14T23-41-04-932Z`, the last full pass over the
previous engine (byte-identical to `0.10.0`), pinned by `pnpm bench:baseline`. Both runs' `observations.jsonl` are
committed under `baselines/`, so every `Δ` on this page is that comparison read from data in the repository, not from a
local `bench-results/` run only the author has. The suite grew by the 18 `plan-runs-*` rows that priced the codegen
tier's count, engine rows that enter no cross-library figure; the 126 rows the two runs share are compared one to one.
Every library implements every row its declared features allow, so a `—` below is a feature the library lacks, never a
row nobody wrote.

**Environment.** `@codefast/di` 0.10.1 (the pass ran on tree `871106879`, which carries the two series' unreleased
changes on top of `0.10.1`) from a `dist` the harness rebuilt first, on Node 26.1.0 / V8 14.6, Apple M3 Max × 14,
darwin/arm64, `--expose-gc` for every library. inversify 8.2.3 · awilix 13.0.5 · tsyringe 4.10.0 · brandi 5.1.0 · ditox
3.3.0 · injection-js 2.6.1. Each library runs at its canonical decorator mode (inversify legacy decorators +
`reflect-metadata`, codefast TC39 Stage 3 + `Symbol.metadata`); every inversify container uses `{ jitless: false }`, its
fastest documented configuration. Run 2026-09-20, 2m13s wall; the 1-minute load average read 4.35 at every child's
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
- **A transient factory root keeps one context.** Resolved with `resolveAsync()` and no options, its path is its own
  frame alone, so the context is built on the first resolve and reused by every later one; the root allocates nothing
  per resolve where it minted an array and a context.

## Summary — where we stand

Ratios are `@codefast/di ÷ competitor`; above 1× means codefast is faster. Win `>1.03×`, parity `0.97–1.03×`, loss
`<0.97×`. `Comparable` counts the rows both libraries ran, of 130 aggregate-eligible rows codefast measures; `†` is how
many of those the median and geomean carry from above the throughput ceiling — they stay in the aggregate but no reader
should cite one alone.

| Competitor     | Comparable | Win / parity / loss | Median | Geomean |   † |
| -------------- | ---------: | ------------------: | -----: | ------: | --: |
| InversifyJS 8  |  91 of 130 |          89 / 1 / 1 |  3.82× |   5.48× |  44 |
| Awilix 13      |  38 of 130 |          38 / 0 / 0 |  6.06× |   5.85× |  17 |
| tsyringe 4     |  43 of 130 |          38 / 1 / 4 |  4.72× |   3.77× |  19 |
| Brandi 5       |  29 of 130 |          28 / 0 / 1 |  15.8× |   12.2× |  17 |
| Ditox 3        |  44 of 130 |         31 / 2 / 11 |  1.27× |   1.60× |  21 |
| injection-js 2 |  31 of 130 |         19 / 0 / 12 |  1.31× |   1.37× |  22 |

**The headline, stated plainly: codefast sweeps inversify, awilix and brandi — awilix loses it no row, the two rebind
rows it held having turned into 1.42× and 1.47× — wins tsyringe on the median by 4.7× while still losing it four rows,
and against the two libraries it is closest to holds both aggregates: ditox 1.27× on the median and 1.60× on the geomean
(from 1.06× and 1.39×), injection-js 1.31× and 1.37× (from 1.49× and 1.43×).** Against ditox the losses are eleven now,
fourteen at the baseline and sixteen on the page before this one, because the warm reads stopped losing once both sides
read specialized code: `constant-resolve` 1.10×, `resolve-optional-hit` 1.05×, `to-resolved-3-deps` 0.97×†,
`singleton-class-1-dep` 0.96×† — where the previous page read 0.78×, 0.77×, 0.73× and 0.70× and filed the gap as
harness-only. It was: the harness's own second closure. Against injection-js the same change cut the other way — twelve
losses now, seven at the baseline: injection-js's alias and nested-factory rows gain more from specialization than
codefast's, and the page names them below as the one deficit this round uncovered rather than closed. Against the
baseline, 92 of the 126 shared rows are more than 10% faster and 1 is slower, the `resolveAll` copy; every remaining
loss is one of the same shapes — **registration**, **cold collections**, the **accessor lane**, the **alias lane against
injection-js** — plus two this round chose: the collection copy and the three allocations an async level owns.

## The losses, foregrounded — where to improve

Ordered by how much they matter, each marked as a **real deficit** (same work, codefast slower), a **work difference**
(codefast does more per op by design, so the row is a design cost to reconsider, not a bug) or a **chosen cost** (a
correctness fix this round took with its price known). Where the baseline is quoted, it is the same row in
`2026-09-14T23-41-04-932Z`.

- **Registration is still the biggest deficit, and it is a ditox-only one.** `bind-128-plain` — 128 transient factory
  bindings into a fresh container, no resolve — runs at 0.39× ditox, 0.98× tsyringe and 1.82× injection-js, where it ran
  0.42×, 1.02× and 2.21×: a fresh registration is one probe, one write and one version read now, and the row did not
  move against its baseline (1.01×), because what it pays is the object. The bind-floor probe in the redesign record
  puts a bare `Map.set` with a two-field literal at 13.4 ns and a probe-and-set with the twenty-field chain object at
  20.3 ns on this V8; ditox's whole `bindFactory` is 17.8 ns. The chain object is the fluent builder the contract
  returns, and the probe is last-wins; closing this row is a contract change (a lighter builder, or a bulk bind), not an
  optimisation. Everything that binds before it resolves sits on the same floor and moved where the redesign moved it:
  `create-child-empty` 2.00× ditox and 1.30× tsyringe (from 1.27× and 0.83×), `container-create-empty` 1.72× and 1.21×
  (from 1.57× and 1.09×), `realistic-graph-class-cold-resolve` 0.67× ditox and 1.05× tsyringe (from 0.49× and 0.76×),
  `boot-decorated-container-build-and-resolve` 0.91× tsyringe (from 0.75×), `module-cold-from-modules` 1.18× ditox (from
  1.05×). The two empty-container rows still lose injection-js above the ceiling (0.68×† and 0.63×†): a container is
  four objects now where it was seven, injection-js's injector is fewer. **Real deficit, structural** — one object per
  binding is the design, and the record says what it would cost to change.
- **The alias lane loses injection-js, and this pass is the first to see it.** `to-alias-redirect` 0.75×†,
  `alias-chain-3` 0.82×†, `alias-parent-owned-terminal` 0.68×† — read 1.01×, 1.11× and 0.97× on the page before, and
  1.01×, 1.05× and 0.95× at the baseline, every one against a second closure that had cost injection-js more than it
  cost codefast. With both sides specialized, codefast's alias resolve is a fast-default probe that finds an alias and
  falls back to the chain-versioned memo, one more lookup than the terminal token pays, where injection-js's
  `useExisting` provider resolves to its target's record in one step. The two nested-factory rows sit beside it, 0.83×†
  and 0.87×†, and `production-event-bus-dispatch` 0.84×† (0.75×† ditox). All six rows are above the ceiling. **Real
  deficit**, newly visible, with a causal path: the alias fast lane.
- **The cold collection loses tsyringe and, at N=10, ditox.** `resolve-all-cold-N` builds a fresh container and reads
  the collection once: at N=100, 0.38× tsyringe (from 0.62×), ditox 1.30× and injection-js 1.25× stay wins; at N=10,
  0.46× tsyringe, 0.74× ditox and 0.97× injection-js (from 0.46×, 0.76× and 1.04×). A chain's own `.many()` re-slots
  without a probe now, which the hundred-member row shows against ditox and the ten-member row does not; what the pair
  still pays is the registration above, ten or a hundred times. **Real deficit against tsyringe and at N=10 against
  ditox — the registration cost seen from the collection side.**
- **The stable-set collections are a chosen cost.** `resolve-all-strategies-10` 0.77×† ditox and 0.82×† injection-js,
  `-100` 0.62×† and 0.65×† (from 1.00×, 1.09×, 0.95× and 1.11×), the hundred-member row 0.88× of its baseline
  throughput: a root-level `resolveAll` hands each caller a copy of its memoized list, where it handed out the list
  itself, so no caller can mutate the engine's memo. A frozen list was measured and rejected — a frozen array iterates
  through a slow elements kind for every consumer. **Chosen cost**, its own commit, reversible alone.
- **Teardown at scale is a registration loss wearing a lifecycle label, and it narrowed.** `materialize-100-singletons`
  (bind and resolve 100 singletons, no teardown) is 0.49× ditox and 1.72× tsyringe (from 0.35× and 1.88×);
  `unbind-all-100-singletons` (the same, then dispose) 0.50× and 1.43× (from 0.35× and 1.50×) — 1.46× and 1.61× their
  baseline throughput, from the activation need stamped on the binding and a teardown that splices nothing. The two
  ratios against ditox are the same, so the teardown walk costs nothing the rivals do not pay — the loss is the 100
  bindings above. `lifecycle-pre-destroy-unbind` (one singleton, one hook) is at parity with ditox (1.01×, from 0.82×)
  and 2.12× tsyringe. **Work difference on the hook, real deficit on the registration underneath.**
- **Rebind is a win against awilix now and still slow against ditox.** `rebind-hot-swap` 1.47× awilix (from 0.89×) and
  0.22×† ditox (from 0.14×†); `rebind-parent-resolve-child-depth-3` 1.42× awilix and 1.72× ditox (from 0.89× and 1.07×).
  A rebind of a lone token is one registration whose displaced binding is deactivated on the spot — 1.72× and 1.65× the
  baseline — and what it still pays against ditox's map write is the builder object and the deactivation walk. **Work
  difference**, above the ceiling against ditox.
- **The async rows are wins, including the one that was not.** `async-init-single-hop` reads 1.08× ditox and 1.12×
  injection-js (from 0.98× and 0.90×), 1.61× its baseline: a transient factory root keeps the one context its binding
  builds, where it minted an array and a context per resolve. The fan-out rows read 1.57–2.01× inversify,
  `dynamic-async-chain-8` 1.47×, `resolve-all-async-8` at parity (1.01×, from 0.58× — 2.02× its baseline). The one-lane
  fix that retired the cascade still costs each level its own frame, context and, at a root, its array; in this profile
  the rows carry it and win. **Chosen cost**, paid and covered.
- **`accessor-injection-construct` 0.25×† inversify, from 0.42×.** codefast's own throughput on the row is 1.10× its
  baseline; inversify's rose more once the harness stopped collecting inside the loop and stopped rebuilding closures.
  The row measures the benchmark's transpiler as much as the engine: esbuild lowers the scenario's own `accessor` field
  to `WeakMap`-backed privates (`__privateAdd`, `__accessCheck`), a third of the row's self time. What the engine pays
  is the ambient scope around construction and the accessor's own `resolve` through the container, where inversify's
  property injection is a metadata read on the same plan. **Work difference**, and a harness change proposed (a `tsc`
  compile of the codefast scenarios), not made.
- **Failing fast costs more here: `misconfigured-missing-binding` 0.72× tsyringe, 0.75× ditox, 0.77× brandi, 0.91×
  injection-js**, from 0.63×, 0.69×, 0.68× and 0.86×. codefast still builds a structured error with the resolution path;
  the rivals throw a string, and the stack capture both pay is most of the row. **Work difference** on a path a
  production request should never take.
- **One row reads down against the baseline in this pass.** `resolve-all-strategies-100` 0.88× is the chosen copy above.
  The per-process mode the previous pages carried on `production-event-bus-dispatch` and the 32-level chain does not
  appear in this profile: the dispatch reads 0.97× of its baseline throughput and the chain 1.07×, both with three
  trials in agreement. **Open**: the alias lane above, to re-measure paired before the next change to it.

## The wins

- **inversify — 89 of 91 comparable rows, 3.82× median, 5.48× geomean.** Widest margins on `failure`'s
  `circular-dependency-3` and `alias-cycle-detected` (both excluded — inversify recurses to the stack limit rather than
  detecting either), then `boot` (20.3× geomean), `production` (18.3×), `scope` (12.8×), `lifecycle` (11.6×),
  `introspection` (7.58×), `realistic` (5.90×), `fan-out` (5.61×), `slot-selection` (4.34×), `micro` (4.08×); tightest
  on `async` (1.49×) and `resolution` (0.94×, the accessor row against the plan rows). `resolve-all-async-8` is at
  parity from 0.58×. Every fresh-child row is 29–62×, every production row 12–28×, `bind-128-plain` 23.6×, and the
  `child-depth` axis is flat at 1.29–1.31×†.
- **Awilix 13 — 38 of 38, 6.06× median, no loss**, up to 13× on the deep child walk and 35× on `bind-128-plain`; the two
  rebind rows it held are 1.47× and 1.42× now, and `async-init-single-hop` 1.31× (from parity).
- **tsyringe 4 — 38 of 43, 4.72× median**, 11.7× on `micro` and 6.30× on `scope`; the stable-set collections read 17.5×
  at N=100 and 3.26× at N=10, `realistic-graph-class-cold-resolve` 1.05× (from 0.76×), `create-child-empty` 1.30× (from
  0.83×), `bind-128-plain` at parity (0.98×); it still wins the cold collections (0.38× and 0.46×), `boot-decorated-*`
  (0.91×, from 0.75×) and the missing-binding throw (0.72×).
- **Brandi 5 — 28 of 29, 15.8× median**, 34× on transient micro and 51×† on the resolved-factory graph; loses only the
  missing-binding throw.
- **Against ditox codefast wins 31 rows to 11 and both aggregates (1.27× median, 1.60× geomean, from 1.06× and 1.39×).**
  The warm reads are level or ahead now — `constant-resolve` 1.10×, `resolve-optional-hit` 1.05×, `to-resolved-3-deps`
  0.97×†, `singleton-class-1-dep` 0.96×† (from 0.79×†, 0.78×†, 0.71×† and 0.71×†) — and the warm work above them is a
  sweep: `transient-class-1-dep` 7.88×†, `realistic-graph-class-resolve-root` 5.77× (from 2.09×),
  `realistic-graph-resolved-root` 5.46×†, `resolve-optional-miss` 4.85×†, `optional-missing-transient` 3.93×†,
  `realistic-graph-resolve-root` 1.68×, every `child-depth` row 4.29–28.6×†. The cold and per-request work:
  `fresh-child-default-n4` 2.71×, `fresh-child-default-n1` 2.09× (from 1.84×), `create-child-empty` 2.00×,
  `container-create-empty` 1.72×, `rebind-parent-resolve-child-depth-3` 1.72×, `has-bound-check` 1.59×,
  `child-request-lifecycle-create-resolve-dispose` 1.57× (from 1.34×), `scale-mid-transient-chain-32` 1.57×,
  `scoped-binding-per-child` 1.54×, `resolve-all-cold-100` 1.30×, `scale-deep-transient-chain-512` 1.24×,
  `module-cold-from-modules` 1.18×, `production-http-handler` 1.17× and `production-unit-of-work` 1.17× (from 1.00× and
  1.01×), `nested-container-resolve-in-factory` 1.10×, `async-init-single-hop` 1.08×, `realistic-graph-cold-resolve`
  1.05× (from 0.98×). It still loses every row that binds many things (`bind-128-plain` 0.39×, the two 100-singleton
  lifecycle rows 0.49× and 0.50×, the class-cold graph 0.67×), the cold collection at N=10 (0.74×), the two stable sets
  by choice, the missing-binding throw and the event-bus dispatch above the ceiling.
- **Against injection-js the median is 1.31× and the geomean 1.37×** (from 1.49× and 1.43×; 19 wins, 12 losses). The
  warm rows are wins (`realistic-graph-class-resolve-root` 4.30×, `realistic-graph-resolved-root` 4.15×†,
  `singleton-class-1-dep` 3.31×†, `to-self-binding` 3.00×†, `constant-resolve` 2.36×†, `resolve-optional-miss` 1.93×†,
  `realistic-graph-resolve-root` 1.31×), so is registration (`bind-128-plain` 1.82×, `realistic-graph-cold-resolve`
  2.24×, `boot-decorated-*` 1.85×, the class-cold graph 1.99×), so is the cold collection at N=100 (1.25×) and the async
  hop (1.12×); the losses are the alias lane (0.68–0.82×†), the two nested-factory rows and the event bus above the
  ceiling, the two stable sets, the two empty-container rows, the missing-binding throw (0.91×) and the cold ten
  (0.97×).
- **The selection axes are flat where they should be.** `named-resolve-slots-1/64` read 4.92× and 4.84× inversify and
  `tagged-resolve-slots-1/64` 10.1× and 9.90× with no trend across N: both lanes are indexed, and the axis proves it.
- **What this round moved, against the baseline.** The widest, on rows with a causal path: `plan-class-chain-40` 8.38×
  (flat plans to any depth), `realistic-graph-class-resolve-root` 3.62×, `plan-async-resolved-chain-8` 3.13× (one
  awaiting dependency is `Promise.resolve(p).then()`, not `Promise.all([p])`), `async-branch-chain-8` 2.77× and
  `async-branch-escape-mid-chain-8` 2.34× (one live context anchors the branch lane against the deopt loop a real
  collection still triggers), `plan-escape-multi-dep` 2.52× and `multi-tag-constraint-resolve` 2.37× (one
  constraint-context shape), the four `tagged-resolve-slots-*` rows 2.33–2.43× and the four `named-resolve-slots-*` rows
  1.64–1.69× (the indexed lanes, read specialized), `resolve-all-async-8` 2.02×, `plan-async-class-chain-8` 2.00×,
  `plan-class-chain-24` 1.81×, `rebind-hot-swap` 1.72×, `create-child-empty` 1.70×,
  `rebind-parent-resolve-child-depth-3` 1.65×, `unbind-all-100-singletons` 1.61×, `async-init-single-hop` 1.61× (the
  root's context kept), `to-resolved-3-deps` 1.54×, `lifecycle-post-construct-singleton` 1.54×, `to-self-binding` 1.53×,
  `resolve-optional-hit` 1.52×, `singleton-class-1-dep` 1.51×, `constant-resolve` 1.50× — 92 of 126 shared rows more
  than 10% faster, 33 within 10%, 1 slower. The warm resolve rows that were the round's canaries moved this pass for the
  harness reason above, not the engine's: `transient-class-1-dep` 1.04× and `realistic-graph-resolve-root` 1.15× of
  baseline are the engine's figures on rows the second closure hurt least.

## Geomean by group

Geomean of the ratios in each group, comparable row count in parentheses. Read a group, not a cell.

| Group          | InversifyJS 8 | Awilix 13 | tsyringe 4 |  Brandi 5 |   Ditox 3 | injection-js 2 |
| -------------- | ------------: | --------: | ---------: | --------: | --------: | -------------: |
| micro          |    4.08× (22) | 6.32× (8) |  11.7× (7) | 23.2× (8) | 2.07× (7) |      1.55× (9) |
| realistic      |     5.90× (5) | 6.88× (4) |  3.62× (4) | 15.7× (5) | 2.06× (5) |      2.53× (5) |
| fan-out        |     5.61× (9) | 2.00× (1) |  1.98× (5) | 9.36× (1) | 0.99× (5) |      0.90× (4) |
| async          |    1.49× (10) | 1.31× (1) |  1.48× (1) | 2.78× (1) | 1.08× (1) |      1.12× (1) |
| lifecycle      |     11.6× (8) | 4.82× (5) |  2.24× (4) |         — | 0.62× (5) |              — |
| scope          |    12.8× (12) | 6.83× (8) |  6.30× (8) | 15.6× (5) | 4.57× (8) |      1.57× (4) |
| scale          |     2.65× (2) | 10.3× (2) |  3.73× (2) | 8.70× (2) | 1.39× (2) |              — |
| boot           |     20.3× (7) | 17.3× (3) |  1.09× (4) | 5.72× (4) | 1.12× (4) |      1.10× (4) |
| failure        |     1.50× (2) | 2.25× (1) |  0.72× (1) | 0.77× (1) | 0.75× (1) |      0.91× (1) |
| production     |     18.3× (3) | 7.06× (2) |  3.52× (3) |         — | 1.01× (3) |      0.84× (1) |
| introspection  |     7.58× (2) | 1.20× (1) |  5.20× (2) |         — | 1.59× (1) |              — |
| slot-selection |     4.34× (6) |         — |          — |         — |         — |              — |
| resolution     |     0.94× (3) | 3.29× (2) |  4.92× (2) | 16.9× (2) | 1.55× (2) |      0.85× (2) |

The `boot` group against tsyringe, ditox and injection-js (1.09×, 1.12×, 1.10×, from 0.92×, 0.97× and 1.11×) is the
registration deficit in one number: closed at the group level, and what remains of it is the single `bind-128-plain` row
against ditox. The `fan-out` group against ditox is 0.99× (from 1.14×) and against injection-js 0.90× (from 1.16×): the
two stable-set rows pay the copy, and injection-js's read specialized well. `production` against ditox (1.01×, from
0.94×) is two request rows won and the event-bus row above the ceiling lost; against injection-js (0.84×) it is that one
row. `lifecycle` against ditox (0.62×, from 0.43×) is the two 100-singleton rows, the registration deficit again,
narrower. `async` is a win against every rival now (1.08× ditox, 1.12× injection-js, 1.49× inversify). `micro` against
ditox rose from 1.61× to 2.07× as the warm reads stopped losing; against injection-js it fell from 1.61× to 1.55× on the
alias rows. `realistic` against inversify (5.90×, from 5.20×) and against every rival is the generated plans, plus a
class graph that resolves its root 3.62× faster than at the baseline. `resolution` against inversify (0.94×, from 1.05×)
is the accessor row alone, and against injection-js (0.85×) the two nested-factory rows. `failure` against inversify
stays at 1.50× because `alias-cycle-detected` is excluded, which is why it was.

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
| constant-resolve                               | micro          |  1000 |        214,809,408 |           2.75×† |       5.72×† |        11.2×† |      34.7×† |     1.10×† |            2.36×† |
| singleton-class-1-dep                          | micro          |   200 |        185,312,734 |           3.37×† |       4.41×† |        10.6×† |      33.1×† |     0.96×† |            3.31×† |
| transient-class-1-dep                          | micro          |   200 |         78,377,334 |           1.87×† |       8.78×† |        13.6×† |      33.5×† |     7.88×† |                 — |
| named-constant-get                             | micro          |   500 |         99,880,314 |           3.62×† |            — |             — |           — |          — |                 — |
| named-resolve-slots-1                          | micro          |   500 |        135,864,146 |           4.92×† |            — |             — |           — |          — |                 — |
| named-resolve-slots-4                          | micro          |   500 |        139,828,978 |           4.90×† |            — |             — |           — |          — |                 — |
| named-resolve-slots-16                         | micro          |   500 |        138,890,307 |           4.84×† |            — |             — |           — |          — |                 — |
| named-resolve-slots-64                         | micro          |   500 |        138,704,302 |           4.84×† |            — |             — |           — |          — |                 — |
| optional-missing-transient                     | micro          |   200 |         53,789,672 |           1.13×† |            — |             — |      12.3×† |     3.93×† |                 — |
| realistic-graph-resolve-root                   | realistic      |    20 |         20,175,197 |            2.70× |        2.91× |         5.72× |       15.8× |      1.68× |             1.31× |
| realistic-graph-cold-resolve                   | realistic      |     1 |           293,738‡ |           9.08×‡ |       4.42×‡ |        2.04×‡ |      4.72×‡ |     1.05×‡ |            2.24×‡ |
| realistic-graph-resolved-root                  | realistic      |    20 |         64,971,968 |           3.36×† |            — |             — |      51.4×† |     5.46×† |            4.15×† |
| realistic-graph-class-resolve-root             | realistic      |    20 |         61,334,425 |           3.15×† |       10.3×† |        14.1×† |      48.8×† |     5.77×† |            4.30×† |
| realistic-graph-class-cold-resolve             | realistic      |     1 |            471,088 |            27.6× |       16.9×‡ |         1.05× |       5.04× |     0.67×‡ |             1.99× |
| realistic-graph-validate                       | realistic      |    10 |         19,664,222 |                — |            — |             — |           — |          — |                 — |
| fan-out-tree-depth-3-breadth-4                 | fan-out        |    20 |          1,818,499 |            1.64× |        2.00× |         3.04× |       9.36× |      2.06× |                 — |
| resolve-all-strategies-10                      | fan-out        |     1 |        29,315,805‡ |           7.76×‡ |            — |        3.26×‡ |           — |    0.77×†‡ |           0.82×†‡ |
| resolve-all-strategies-100                     | fan-out        |     1 |         23,364,765 |            51.9× |            — |        17.5×‡ |           — |    0.62×†‡ |           0.65×†‡ |
| resolve-all-cold-10                            | fan-out        |     1 |          1,575,606 |           21.7×‡ |            — |         0.46× |           — |      0.74× |             0.97× |
| resolve-all-cold-100                           | fan-out        |     1 |            197,815 |           20.9×‡ |            — |        0.38×‡ |           — |      1.30× |             1.25× |
| resolve-all-named-8                            | fan-out        |     1 |         24,285,962 |            2.17× |            — |             — |           — |          — |                 — |
| resolve-all-named-16                           | fan-out        |     1 |         22,787,430 |            2.07× |            — |             — |           — |          — |                 — |
| resolve-all-named-32                           | fan-out        |     1 |         23,259,099 |            2.09× |            — |             — |           — |          — |                 — |
| resolve-all-named-64                           | fan-out        |     1 |         21,607,456 |            1.95× |            — |             — |           — |          — |                 — |
| resolve-async-single-hop                       | async          |     1 |          9,245,270 |            1.19× |            — |             — |           — |          — |                 — |
| async-init-single-hop                          | async          |     1 |          7,110,223 |            1.64× |        1.31× |         1.48× |       2.78× |      1.08× |             1.12× |
| dynamic-async-chain-8                          | async          |     1 |          2,079,325 |            1.47× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-8                      | async          |     1 |          1,205,756 |            1.57× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-16                     | async          |     1 |            699,324 |            1.70× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-32                     | async          |     1 |            346,429 |            1.85× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-64                     | async          |     1 |            161,308 |            2.01× |            — |             — |           — |          — |                 — |
| async-branch-chain-8                           | async          |     1 |          1,362,760 |                — |            — |             — |           — |          — |                 — |
| async-branch-escape-mid-chain-8                | async          |     1 |          1,723,635 |                — |            — |             — |           — |          — |                 — |
| async-diamond-shared-leaf                      | async          |     1 |          1,947,557 |            1.32× |            — |             — |           — |          — |                 — |
| plan-async-resolved-chain-8                    | async          |     1 |         2,764,436‡ |                — |            — |             — |           — |          — |                 — |
| plan-async-class-chain-8                       | async          |     1 |          5,605,630 |                — |            — |             — |           — |          — |                 — |
| resolve-all-async-8                            | async          |     1 |            974,172 |            1.01× |            — |             — |           — |          — |                 — |
| resolve-optional-async-miss                    | async          |     1 |          9,941,394 |            1.47× |            — |             — |           — |          — |                 — |
| lifecycle-post-construct-singleton             | lifecycle      |   250 |        189,082,893 |           3.42×† |            — |             — |           — |          — |                 — |
| lifecycle-pre-destroy-unbind                   | lifecycle      |     1 |          3,123,454 |           22.6×‡ |       7.93×‡ |         2.12× |           — |      1.01× |                 — |
| binding-level-activation-hook                  | lifecycle      |   200 |        60,821,652‡ |          2.19×†‡ |            — |             — |           — |          — |                 — |
| child-depth-1-resolve                          | scope          |   500 |         96,713,945 |           1.31×† |       3.91×† |        6.35×† |      18.2×† |     4.29×† |            1.58×† |
| child-depth-2-resolve                          | scope          |   500 |         96,523,987 |           1.32×† |       5.01×† |        7.42×† |      18.6×† |     7.18×† |            1.25×† |
| child-depth-4-resolve                          | scope          |   500 |         96,055,513 |           1.29×† |       7.27×† |        9.61×† |      20.4×† |     15.9×† |            1.45×† |
| child-depth-8-resolve                          | scope          |   500 |         95,584,226 |           1.29×† |       13.0×† |        14.9×† |      25.1×† |     28.6×† |           2.10×†‡ |
| child-request-lifecycle-create-resolve-dispose | scope          |   100 |         2,633,275‡ |           49.8×‡ |       11.7×‡ |        5.17×‡ |           — |     1.57×‡ |                 — |
| fresh-child-default-n1                         | scope          |   100 |         11,349,279 |           42.2×‡ |       8.19×‡ |         7.56× |           — |      2.09× |                 — |
| fresh-child-default-n4                         | scope          |   100 |          7,984,344 |           28.9×‡ |       7.12×‡ |        7.15×‡ |           — |      2.71× |                 — |
| fresh-child-name-n1                            | scope          |   100 |         11,193,759 |           46.3×‡ |            — |             — |           — |          — |                 — |
| fresh-child-name-n4                            | scope          |   100 |         7,382,877‡ |           31.2×‡ |            — |             — |           — |          — |                 — |
| fresh-child-tag-n1                             | scope          |   100 |         10,813,552 |           44.2×‡ |            — |             — |           — |          — |                 — |
| fresh-child-tag-n4                             | scope          |   100 |         7,532,393‡ |           31.0×‡ |            — |             — |           — |          — |                 — |
| scale-mid-transient-chain-32                   | scale          |     1 |          1,544,920 |            2.64× |        4.88× |         4.21× |       10.9× |      1.57× |                 — |
| scale-deep-transient-chain-512                 | scale          |     1 |             55,635 |            2.66× |        21.5× |         3.31× |       6.95× |      1.24× |                 — |
| boot-decorated-container-build-and-resolve     | boot           |     1 |            671,663 |           16.5×‡ |            — |         0.91× |           — |          — |             1.85× |
| container-create-empty                         | boot           |   100 |         30,116,449 |          47.5×†‡ |      10.9×†‡ |        1.21×† |      8.92×† |     1.72×† |            0.68×† |
| create-child-empty                             | boot           |   100 |         29,650,812 |           61.7×‡ |       13.5×‡ |         1.30× |       8.81× |      2.00× |            0.63×† |
| bind-128-plain                                 | boot           |     1 |            187,157 |           23.6×‡ |       35.1×‡ |         0.98× |       8.73× |      0.39× |             1.82× |
| bind-128-refined                               | boot           |     1 |             29,414 |           3.70×‡ |            — |             — |           — |          — |                 — |
| misconfigured-missing-binding                  | failure        |     1 |           271,250‡ |           1.51×‡ |       2.25×‡ |        0.72×‡ |      0.77×‡ |     0.75×‡ |            0.91×‡ |
| circular-dependency-3                          | failure        |     1 |           165,905‡ |          184.9×‡ |       1.49×‡ |             — |           — |          — |            0.50×‡ |
| ambiguous-multi-binding                        | failure        |     1 |           221,359‡ |           1.49×‡ |            — |             — |           — |          — |                 — |
| production-http-handler                        | production     |    50 |          1,771,931 |           28.4×‡ |       7.74×‡ |        3.31×‡ |           — |      1.17× |                 — |
| production-unit-of-work                        | production     |   100 |         1,033,430‡ |           18.1×‡ |       6.44×‡ |        2.36×‡ |           — |     1.17×‡ |                 — |
| production-event-bus-dispatch                  | production     |   100 |         48,782,060 |           12.0×† |            — |        5.57×† |           — |    0.75×†‡ |            0.84×† |
| to-resolved-3-deps                             | micro          |   200 |        187,749,776 |           3.24×† |            — |             — |      32.8×† |     0.97×† |            1.67×† |
| to-alias-redirect                              | micro          |   500 |         92,619,548 |           1.61×† |       5.23×† |        10.6×† |           — |          — |            0.75×† |
| to-self-binding                                | micro          |   300 |        178,817,733 |           2.98×† |            — |        8.17×† |           — |          — |            3.00×† |
| alias-chain-3                                  | micro          |   500 |         91,984,190 |           3.82×† |       12.0×† |        20.2×† |           — |          — |            0.82×† |
| alias-parent-owned-terminal                    | micro          |   500 |         90,248,056 |           1.66×† |       6.10×† |        11.0×† |           — |          — |            0.68×† |
| alias-cycle-detected                           | failure        |     1 |           246,840‡ |          691.5×‡ |       2.70×‡ |             — |           — |          — |            0.83×‡ |
| resolve-optional-hit                           | micro          |   500 |        217,879,254 |           6.60×† |       6.03×† |             — |      37.5×† |     1.05×† |            1.65×† |
| resolve-optional-miss                          | micro          |   500 |        265,452,351 |           7.80×† |       4.93×† |             — |      4.37×† |     4.85×† |            1.93×† |
| tagged-binding-resolve                         | micro          |   300 |        143,155,628 |           6.50×† |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-1                         | micro          |   300 |        221,688,404 |           10.1×† |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-4                         | micro          |   300 |        218,866,171 |           9.98×† |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-16                        | micro          |   300 |        221,730,642 |           9.92×† |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-64                        | micro          |   300 |        221,231,308 |           9.90×† |            — |             — |           — |          — |                 — |
| conditional-injection-tagged                   | micro          |   300 |         81,194,948 |           2.06×† |            — |             — |      33.2×† |          — |                 — |
| rebind-hot-swap                                | lifecycle      |    50 |         19,546,011 |           43.1×‡ |        1.47× |             — |           — |     0.22×† |                 — |
| has-bound-check                                | introspection  |  1000 |        369,633,281 |           6.59×† |       1.20×† |        3.37×† |           — |     1.59×† |                 — |
| has-own-unbound-check                          | introspection  |  1000 |        876,161,347 |           8.73×† |            — |        8.01×† |           — |          — |                 — |
| container-level-activation-hook                | lifecycle      |   200 |         57,211,797 |           2.05×† |            — |        4.86×† |           — |          — |                 — |
| scoped-binding-per-child                       | scope          |   100 |         6,401,395‡ |           53.6×‡ |       3.73×‡ |        1.33×‡ |      5.27×‡ |     1.54×‡ |                 — |
| rebind-parent-resolve-child-depth-3            | lifecycle      |    50 |         12,691,158 |            70.2× |        1.42× |             — |           — |      1.72× |                 — |
| materialize-100-singletons                     | lifecycle      |     1 |             69,188 |            17.0× |       13.3×‡ |         1.72× |           — |      0.49× |                 — |
| unbind-all-100-singletons                      | lifecycle      |     1 |            57,537‡ |           18.6×‡ |       11.8×‡ |        1.43×‡ |           — |     0.50×‡ |                 — |
| module-load-unload                             | boot           |     1 |         1,141,403‡ |           15.3×‡ |            — |             — |           — |          — |                 — |
| module-cold-from-modules                       | boot           |     1 |          1,977,011 |           22.2×‡ |            — |             — |       1.56× |      1.18× |                 — |
| initialize-async-warmup                        | boot           |     1 |            603,746 |                — |            — |             — |           — |          — |                 — |
| inspect-snapshot                               | introspection  |    20 |          9,471,594 |                — |            — |             — |           — |          — |                 — |
| lookup-bindings                                | introspection  |   200 |         23,517,726 |                — |            — |             — |           — |          — |                 — |
| generate-dependency-graph                      | introspection  |    10 |            719,062 |                — |            — |             — |           — |          — |                 — |
| multi-tag-slot-resolve                         | micro          |   300 |         14,163,927 |                — |            — |             — |           — |          — |                 — |
| multi-tag-constraint-resolve                   | micro          |   200 |          7,592,109 |                — |            — |             — |           — |          — |                 — |
| multi-tag-select-32                            | micro          |   300 |          2,856,625 |                — |            — |             — |           — |          — |                 — |
| mask-reject-wide-catalog                       | slot-selection |   300 |         44,974,348 |                — |            — |             — |           — |          — |                 — |
| mask-accept-two-of-four                        | slot-selection |   300 |         20,296,531 |                — |            — |             — |           — |          — |                 — |
| mask-collision-same-bit                        | slot-selection |   300 |         52,632,494 |                — |            — |             — |           — |          — |                 — |
| slot-tag-array-hoisted                         | slot-selection |   300 |        147,484,755 |                — |            — |             — |           — |          — |                 — |
| slot-tag-shorthand-hoisted                     | slot-selection |   300 |        157,412,039 |                — |            — |             — |           — |          — |                 — |
| slot-tag-array-inline                          | slot-selection |   300 |         94,902,311 |                — |            — |             — |           — |          — |                 — |
| slot-tag-shorthand-inline                      | slot-selection |   300 |        115,540,257 |                — |            — |             — |           — |          — |                 — |
| slot-tag-zero-value                            | slot-selection |   300 |        145,862,643 |           6.66×† |            — |             — |           — |          — |                 — |
| slot-name-and-tag                              | slot-selection |   300 |        50,658,432‡ |          2.46×†‡ |            — |             — |           — |          — |                 — |
| slot-tag-resolve-all                           | slot-selection |   300 |         49,226,226 |           4.27×† |            — |             — |           — |          — |                 — |
| slot-tag-miss-optional                         | slot-selection |   300 |         82,164,984 |           3.34×† |            — |             — |           — |          — |                 — |
| slot-tag-parent-owned                          | slot-selection |   300 |        138,644,676 |           6.12×† |            — |             — |           — |          — |                 — |
| slot-name-parent-owned                         | slot-selection |   300 |        114,172,136 |           4.67×† |            — |             — |           — |          — |                 — |
| slot-injected-name-compiled                    | slot-selection |   300 |         68,104,318 |                — |            — |             — |           — |          — |                 — |
| slot-injected-name-interpreted                 | slot-selection |   300 |          4,119,397 |                — |            — |             — |           — |          — |                 — |
| slot-injected-tag-compiled                     | slot-selection |   300 |         72,376,847 |                — |            — |             — |           — |          — |                 — |
| slot-injected-tag-interpreted                  | slot-selection |   300 |          4,175,110 |                — |            — |             — |           — |          — |                 — |
| plan-deps-inlined                              | resolution     |   300 |         60,627,564 |                — |            — |             — |           — |          — |                 — |
| plan-escape-factory-dep                        | resolution     |   300 |          7,413,303 |                — |            — |             — |           — |          — |                 — |
| plan-escape-scoped-dep                         | resolution     |   300 |         11,216,858 |                — |            — |             — |           — |          — |                 — |
| plan-escape-hooked-dep                         | resolution     |   300 |          2,786,835 |                — |            — |             — |           — |          — |                 — |
| plan-escape-optional-dep                       | resolution     |   300 |          3,848,055 |                — |            — |             — |           — |          — |                 — |
| plan-escape-multi-dep                          | resolution     |   300 |          2,389,394 |                — |            — |             — |           — |          — |                 — |
| plan-class-chain-24                            | resolution     |     1 |          7,290,629 |                — |            — |             — |           — |          — |                 — |
| plan-class-chain-40                            | resolution     |     1 |         4,430,111‡ |                — |            — |             — |           — |          — |                 — |
| interpreted-class-chain-24                     | resolution     |     1 |            375,018 |                — |            — |             — |           — |          — |                 — |
| interpreted-class-chain-40                     | resolution     |     1 |            194,078 |                — |            — |             — |           — |          — |                 — |
| plan-runs-1                                    | resolution     |     1 |           741,796‡ |                — |            — |             — |           — |          — |                 — |
| plan-runs-256                                  | resolution     |     1 |             14,952 |                — |            — |             — |           — |          — |                 — |
| plan-runs-512                                  | resolution     |     1 |              7,781 |                — |            — |             — |           — |          — |                 — |
| plan-runs-1024                                 | resolution     |     1 |              3,882 |                — |            — |             — |           — |          — |                 — |
| plan-runs-2048                                 | resolution     |     1 |              1,925 |                — |            — |             — |           — |          — |                 — |
| plan-runs-4096                                 | resolution     |     1 |              1,157 |                — |            — |             — |           — |          — |                 — |
| plan-runs-8192                                 | resolution     |     1 |                647 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-1                               | resolution     |     1 |           205,022‡ |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-256                             | resolution     |     1 |              4,849 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-512                             | resolution     |     1 |              2,509 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-1024                            | resolution     |     1 |              1,269 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-2048                            | resolution     |     1 |                660 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-8192                            | resolution     |     1 |                216 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-1                              | resolution     |     1 |           704,929‡ |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-512                            | resolution     |     1 |              7,661 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-1024                           | resolution     |     1 |              4,106 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-2048                           | resolution     |     1 |              2,003 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-8192                           | resolution     |     1 |                660 |                — |            — |             — |           — |          — |                 — |
| nested-context-resolve-in-factory              | resolution     |   300 |         44,080,456 |           1.91×† |       3.68×† |        5.13×† |      17.5×† |     2.19×† |            0.83×† |
| nested-container-resolve-in-factory            | resolution     |   300 |         40,686,466 |           1.72×† |       2.94×† |        4.72×† |      16.2×† |     1.10×† |            0.87×† |
| accessor-injection-construct                   | resolution     |   300 |         9,156,981‡ |          0.25×†‡ |            — |             — |           — |          — |                 — |

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
minutes on this machine. `baselines/` holds exactly the committed runs the repository cites: the pinned baseline,
`baselines/2026-09-20T14-04-41-396Z`, the run this page is transcribed from, and the two contract-tier runs the
cold-path redesign's decision record reads its before and after from (`2026-09-20T02-07-56-518Z`,
`2026-09-20T05-28-49-997Z`). A run under `baselines/` that nothing cites any more is deleted; re-anchoring the ledger
(re-pinning `bench:baseline` to a newer run once an engine epoch closes, as this page did with the pre-rewrite run) is
what makes an older baseline unreferenced and removable. The run writes a timestamped directory under `bench-results/`
(gitignored) holding `observations.jsonl` with every per-trial `mean ms`, `p99 ms` and IQR; `bench:report` turns the
newest run into the `report.md` this page is transcribed from, whose Environment section prints the load average each
child started under. Before quoting any single loss as a factor rather than a direction, re-measure it paired and
alternating on a quiet machine — a full pass carries no between-run variance of its own. The rewrite's own protocol is
in [`BENCH_GUIDE.md`](./BENCH_GUIDE.md): swap the change's `src` files per side, `BENCH_LIBRARY=@codefast/di` and
`BENCH_ONLY` the target rows plus warm canaries, a `BENCH_MODE=fast` gate first and one full pass per side only when it
wins, and read the per-trial spread, not one ratio; the redesign's record adds the cheaper gate that came first, a
standalone probe of the scenario's own function for time, bytes and objects per op. `BENCH_TIER=contract` runs the
comparison without the engine rows; `pnpm bench:list` prints which rows each library implements and confirms there is no
row a library's features allow that nobody wrote.
