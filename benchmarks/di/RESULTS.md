# Results

Where `@codefast/di` actually stands against the field right now, wins and losses given equal weight — the point of this
page is to know where the engine is slower so the next change knows what to aim at. One machine-derived snapshot, no
accreted ledger. The method is in [`BENCH_GUIDE.md`](./BENCH_GUIDE.md); re-run it with the recipe at the bottom.

**This is one full-profile pass, so read the aggregates, not the rows.** GC-exposed, one subprocess per scenario,
libraries interleaved with rotating order, 3 trials each — a single pass measures no between-run variance of its own,
192 of the cells carry a per-trial IQR above 5%, and 124 rows sit above ~30M ops/s where the ratio moves between runs of
the same build whatever its IQR says. Ratios are worth more than the absolute `hz/op`; a single row is worth less than
the group it sits in. A loss highlighted below points at a direction — quote a precise factor only after a paired
re-run, except where a loss is a structural difference that reproduces by construction (called out as such).

**This run reads against the pinned baseline.** It is `baselines/2026-09-20T08-51-37-761Z`, over the tree at `ca59f4e44`
— `main` after the cold-path redesign and the one-async-lane series landed; the baseline it is compared to is
`baselines/2026-09-14T23-41-04-932Z`, the last full pass over the previous engine (byte-identical to `0.10.0`), pinned
by `pnpm bench:baseline`. Both runs' `observations.jsonl` are committed under `baselines/`, so every `Δ` on this page is
that comparison read from data in the repository, not from a local `bench-results/` run only the author has. The suite
grew by the 18 `plan-runs-*` rows that priced the codegen tier's count, engine rows that enter no cross-library figure;
the 126 rows the two runs share are compared one to one. Every library implements every row its declared features allow,
so a `—` below is a feature the library lacks, never a row nobody wrote.

**Environment.** `@codefast/di` 0.10.1 (the pass ran on tree `ca59f4e44`, which carries the two series' unreleased
changes on top of `0.10.1`) from a `dist` the harness rebuilt first, on Node 26.1.0 / V8 14.6, Apple M3 Max × 14,
darwin/arm64, `--expose-gc` for every library. inversify 8.2.3 · awilix 13.0.5 · tsyringe 4.10.0 · brandi 5.1.0 · ditox
3.3.0 · injection-js 2.6.1. Each library runs at its canonical decorator mode (inversify legacy decorators +
`reflect-metadata`, codefast TC39 Stage 3 + `Symbol.metadata`); every inversify container uses `{ jitless: false }`, its
fastest documented configuration. Run 2026-09-20, 30m18s wall, on a machine that was not quiet: two system daemons held
a core and a half for the whole pass.

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
| InversifyJS 8  |  91 of 130 |          89 / 1 / 1 |  3.14× |   5.05× |  41 |
| Awilix 13      |  38 of 130 |          37 / 1 / 0 |  4.99× |   5.19× |  15 |
| tsyringe 4     |  43 of 130 |          36 / 3 / 4 |  4.73× |   3.98× |  17 |
| Brandi 5       |  29 of 130 |          28 / 0 / 1 |  13.7× |   11.1× |  15 |
| Ditox 3        |  44 of 130 |         27 / 0 / 17 |  1.30× |   1.48× |  17 |
| injection-js 2 |  31 of 130 |          21 / 1 / 9 |  1.43× |   1.46× |  19 |

**The headline, stated plainly: codefast sweeps inversify, awilix and brandi — awilix loses it no row now, the two
rebind rows it held having turned into 1.51× and 1.61× — wins tsyringe on the median by 4.7× while still losing it four
rows, and moves both aggregates against the two libraries it is closest to: ditox on the median 1.30× (from 1.06×) and
the geomean 1.48× (from 1.39×), injection-js 1.43× and 1.46× (from 1.49× and 1.43×).** Against ditox the row count went
the other way — 17 losses now, 14 before — because the seven parities of the last pass split: the per-request rows
became wins (`production-http-handler` 1.09×, `production-unit-of-work` 1.13×,
`child-request-lifecycle-create-resolve-dispose` 1.51×), and the two stable-set collections became losses (0.81× and
0.72×), the price of the `resolveAll` copy named below. Against the baseline, 32 of the 126 shared rows are more than
10% faster and 11 are more than 10% slower; the rows that read down are named below, each with the mechanism behind it.
Every remaining loss is one of the same shapes — **registration**, **cold collections**, the **accessor lane**, the
**warm reads above the ceiling** — plus two this round chose: the collection copy and the three allocations an async
level owns.

## The losses, foregrounded — where to improve

Ordered by how much they matter, each marked as a **real deficit** (same work, codefast slower), a **work difference**
(codefast does more per op by design, so the row is a design cost to reconsider, not a bug) or a **chosen cost** (a
correctness fix this round took with its price known). Where the baseline is quoted, it is the same row in
`2026-09-14T23-41-04-932Z`.

- **Registration is still the biggest deficit, and it is a ditox-only one.** `bind-128-plain` — 128 transient factory
  bindings into a fresh container, no resolve — runs at 0.42× ditox, 0.99× tsyringe and 2.17× injection-js, where it ran
  0.42×, 1.02× and 2.21×: a fresh registration is one probe, one write and one version read now, and the row did not
  move, because what it pays is the object. The bind-floor probe in the redesign record puts a bare `Map.set` with a
  two-field literal at 13.4 ns and a probe-and-set with the twenty-field chain object at 20.3 ns on this V8; ditox's
  whole `bindFactory` is 17.8 ns. The chain object is the fluent builder the contract returns, and the probe is
  last-wins; closing this row is a contract change (a lighter builder, or a bulk bind), not an optimisation. Everything
  that binds before it resolves sits on the same floor and moved where the redesign moved it: `create-child-empty` 1.62×
  ditox and 1.02× tsyringe (from 1.27× and 0.83×), `container-create-empty` 1.54× and 1.09× (from 1.57× and 1.09×),
  `realistic-graph-class-cold-resolve` 0.67× ditox and 0.99× tsyringe (from 0.49× and 0.76×),
  `boot-decorated-container-build-and-resolve` 0.89× tsyringe (from 0.75×), `module-cold-from-modules` 1.10× ditox (from
  1.05×). The two empty-container rows still lose injection-js above the ceiling (0.77×† and 0.66×†): a container is
  four objects now where it was seven, injection-js's injector is fewer. **Real deficit, structural** — one object per
  binding is the design, and the record says what it would cost to change.
- **The cold collection loses tsyringe and, at N=10, ditox.** `resolve-all-cold-N` builds a fresh container and reads
  the collection once: at N=100, 0.57× tsyringe (from 0.62×), ditox 1.31× and injection-js 1.43× stay wins; at N=10,
  0.47× tsyringe, 0.72× ditox and 0.95× injection-js (from 0.46×, 0.76× and 1.04×). A chain's own `.many()` re-slots
  without a probe now, which the hundred-member row shows and the ten-member row does not; what the pair still pays is
  the registration above, ten or a hundred times. **Real deficit against tsyringe and at N=10 against ditox — the
  registration cost seen from the collection side.**
- **The stable-set collections are a chosen cost.** `resolve-all-strategies-10` 0.81× ditox and 0.94× injection-js,
  `-100` 0.72× and 0.88× (from 1.00×, 1.09×, 0.95× and 1.11×), 0.85× and 0.79× of their baseline throughput: a
  root-level `resolveAll` hands each caller a copy of its memoized list, where it handed out the list itself, so no
  caller can mutate the engine's memo. A frozen list was measured and rejected — a frozen array iterates through a slow
  elements kind for every consumer. **Chosen cost**, its own commit, reversible alone.
- **Teardown at scale is a registration loss wearing a lifecycle label, and it narrowed.** `materialize-100-singletons`
  (bind and resolve 100 singletons, no teardown) is 0.49× ditox and 2.58× tsyringe (from 0.35× and 1.88×);
  `unbind-all-100-singletons` (the same, then dispose) 0.48× and 1.90× (from 0.35× and 1.50×) — 1.38× and 1.34× their
  baseline throughput, from the activation need stamped on the binding and a teardown that splices nothing. The two
  ratios against ditox are the same, so the teardown walk costs nothing the rivals do not pay — the loss is the 100
  bindings above. `lifecycle-pre-destroy-unbind` (one singleton, one hook) at 0.83× ditox and 1.79× tsyringe is the same
  story at N=1. **Work difference on the hook, real deficit on the registration underneath.**
- **Rebind is a win against awilix now and still slow against ditox.** `rebind-hot-swap` 1.61× awilix (from 0.89×) and
  0.26×† ditox (from 0.14×†); `rebind-parent-resolve-child-depth-3` 1.51× awilix and 1.57× ditox (from 0.89× and 1.07×).
  A rebind of a lone token is one registration whose displaced binding is deactivated on the spot — 1.82× and 1.71× the
  baseline — and what it still pays against ditox's map write is the builder object and the deactivation walk. **Work
  difference**, above the ceiling against ditox.
- **The async rows carry the one-lane fix.** `async-fanout-concurrent-16/32/64` read 0.84×, 0.80× and 0.79× of their
  baseline throughput (still 1.34–1.42× inversify), `async-init-single-hop` 0.94× ditox and 0.87× injection-js (from
  0.98× and 0.90×), `resolve-all-async-8` at parity with inversify (1.00×, from 0.58× — 1.91× its baseline). The cascade
  lane — one shared frame stack, one context for every level — answered a factory that asked after an `await` from
  another chain's ancestors, a wrong value; every `resolveAsync` now runs on the branch lane, each level owning its
  frame, its context and, at a root, its array. Every one of the eight roots the fan-out resolves per iteration pays
  those three allocations. **Chosen cost**: the rows stay wins where they were wins, and the value is right.
- **`accessor-injection-construct` 0.43× inversify, from 0.42×.** The row measures the benchmark's transpiler as much as
  the engine: esbuild lowers the scenario's own `accessor` field to `WeakMap`-backed privates (`__privateAdd`,
  `__accessCheck`), which is a third of the row's self time. What the engine pays is the ambient scope around
  construction and the accessor's own `resolve` through the container, where inversify's property injection is a
  metadata read on the same plan. **Work difference**, and a harness change proposed (a `tsc` compile of the codefast
  scenarios), not made.
- **Warm reads above the ceiling: 0.79×† and 0.74×† ditox on `constant-resolve` and `singleton-class-1-dep`**, the same
  shape on `to-resolved-3-deps` 0.74×†, `resolve-optional-hit` 0.76×† and `production-event-bus-dispatch` 0.66×† (from
  0.79×†, 0.71×†, 0.71×†, 0.78×† and 0.83×†). ditox's `get` is close to a map read; codefast still carries its binding
  and lifecycle shape on every resolve. In a standalone loop of the same scenario functions the two libraries read equal
  at 5 ns; the gap exists only inside the harness, and an inline warm answer was tried and reverted (it cost the
  non-warm paths and helped none). All five rows sit above 30M ops/s, inside the band that stops reproducing between
  runs. **Real deficit, ceiling-bound, harness-only so far.**
- **Failing fast costs more here: `misconfigured-missing-binding` 0.71× tsyringe, 0.75× ditox, 0.76× brandi, 0.97×
  injection-js**, from 0.63×, 0.69×, 0.68× and 0.86× — 1.14× its baseline, because each error class names itself with a
  literal instead of a constructor lookup per throw. codefast still builds a structured error with the resolution path;
  the rivals throw a string, and the stack capture both pay is most of the row. **Work difference** on a path a
  production request should never take.
- **Rows that read down against the baseline in this pass.** The eleven, with their mechanism: the stable-set
  collections (0.85×, 0.79×) and the fan-out rows (0.84×, 0.80×, 0.79×) are the two chosen costs above.
  `scale-mid-transient-chain-32` 0.89× and `production-event-bus-dispatch` 0.78× are a per-process mode this round found
  and could not attribute: the same source reads the 32-level chain at 890 or at 1 200 ns depending on the child
  process, on `main` before the round as after it, and no commit, the frame carrier or the context pool moves it; with
  the rows alone in the process the two builds read within 4%, and the row is 1.47× ditox here. `transient-class-1-dep`
  0.89× and `plan-deps-inlined` 0.89× read equal standalone with and without forced collections, the harness-side
  movement the redesign record files under compile-on-repeat. `slot-injected-name-compiled` 0.85× is an engine row in
  the unstable band; `resolve-all-named-8` 0.83× is the indexed collection lane's known swing (0.66–1.00× of baseline
  across passes). **Open**: the mode on the chain rows, and the indexed collection swing, to re-measure before the next
  change to either lane.

## The wins

- **inversify — 89 of 91 comparable rows, 3.14× median, 5.05× geomean.** Widest margins on `failure`'s
  `circular-dependency-3` and `alias-cycle-detected` (both excluded — inversify recurses to the stack limit rather than
  detecting either), then `boot` (23.8× geomean), `production` (17.4×), `scope` (13.9×), `lifecycle` (11.9×),
  `introspection` (6.27×), `realistic` (6.00×), `fan-out` (5.90×), `slot-selection` (3.38×); tightest on `resolution`
  (1.03×, the accessor row) and `async` (1.32×). `resolve-all-async-8` is at parity from 0.58×: the members of an async
  collection settle in declaration order through the one combinator every fan-out uses. Every fresh-child row is 32–49×,
  every production row 10–32×, `bind-128-plain` 30×, and the `child-depth` axis is flat at 1.45–1.53×†.
- **Awilix 13 — 37 of 38, 4.99× median, no loss**, up to 12× on the deep child walk and 35× on `bind-128-plain`; the two
  rebind rows it held are 1.61× and 1.51× now, and `async-init-single-hop` is the one parity.
- **tsyringe 4 — 36 of 43, 4.73× median**, 12.3× on `micro` and 7.10× on `scope`; the stable-set collections read 26.9×
  at N=100 and 3.18× at N=10, `realistic-graph-class-cold-resolve` is at parity (0.99×, from 0.76×),
  `create-child-empty` 1.02× (from 0.83×), `bind-128-plain` 0.99×; it still wins the cold collections (0.57× and 0.47×),
  `boot-decorated-*` (0.89×) and the missing-binding throw (0.71×).
- **Brandi 5 — 28 of 29, 13.7× median**, 31× on transient micro and 50×† on the resolved-factory graph; loses only the
  missing-binding throw.
- **Against ditox codefast wins 27 rows to 17 and both aggregates (1.30× median, 1.48× geomean, from 1.06× and 1.39×).**
  The warm work — `transient-class-1-dep` 6.86×†, `realistic-graph-resolved-root` 4.82×†, `resolve-optional-miss`
  4.74×†, `realistic-graph-class-resolve-root` 3.16× (from 2.09×), `realistic-graph-resolve-root` 1.60×, every
  `child-depth` row 3.94–26.4×† — and the cold and per-request work: `fresh-child-default-n4` 2.84×,
  `fresh-child-default-n1` 2.32× (from 1.84×), `create-child-empty` 1.62×, `rebind-parent-resolve-child-depth-3` 1.57×,
  `container-create-empty` 1.54×, `child-request-lifecycle-create-resolve-dispose` 1.51× (from 1.34×),
  `scale-mid-transient-chain-32` 1.47×, `scoped-binding-per-child` 1.42×, `resolve-all-cold-100` 1.31×,
  `scale-deep-transient-chain-512` 1.28×, `production-unit-of-work` 1.13× and `production-http-handler` 1.09× (from
  1.01× and 1.00×), `module-cold-from-modules` 1.10×, `realistic-graph-cold-resolve` 1.05× (from 0.98×). It still loses
  every row that binds many things (`bind-128-plain` 0.42×, the two 100-singleton lifecycle rows 0.49× and 0.48×, the
  class-cold graph 0.67×), the cold collection at N=10 (0.72×), the two stable sets by choice, the missing-binding throw
  and the warm reads above the ceiling.
- **Against injection-js the geomean is 1.46× and the median 1.43×** (from 1.43× and 1.49×; 21 wins, 1 parity, 9
  losses). The warm rows are wins (`realistic-graph-resolved-root` 3.81×†, `singleton-class-1-dep` 3.04×†,
  `realistic-graph-class-resolve-root` 2.66×, `realistic-graph-resolve-root` 1.32×), so is registration
  (`bind-128-plain` 2.17×, `realistic-graph-cold-resolve` 2.33×, `boot-decorated-*` 1.85×, the class-cold graph 2.04×),
  and so is the cold collection at N=100 (1.43×); the losses are the two empty-container rows above the ceiling, the two
  stable sets and the cold ten (0.94×, 0.88×, 0.95×), `async-init-single-hop` 0.87×, the two nested-factory rows above
  the ceiling (0.92×†, 0.84×†) and the missing-binding throw, at 0.97× now.
- **The selection axes are flat where they should be.** `named-resolve-slots-1/64` read 3.08× and 3.21× inversify and
  `tagged-resolve-slots-1/64` 4.58× and 4.42× with no trend across N: both lanes are indexed, and the axis proves it.
- **What this round moved, against the baseline.** The widest, on rows with a causal path: `plan-class-chain-40` 3.23×
  (flat plans to any depth), `async-branch-chain-8` 2.61× and `async-branch-escape-mid-chain-8` 2.22× (one live context
  anchors the branch lane against the forced-collection deopt loop that had every real collection re-optimising it),
  `plan-async-resolved-chain-8` 2.57× (one awaiting dependency is `Promise.resolve(p).then()`, not `Promise.all([p])`),
  `plan-escape-multi-dep` 2.38× and `multi-tag-constraint-resolve` 2.22× (one constraint-context shape),
  `resolve-all-async-8` 1.91×, `rebind-hot-swap` 1.82×, `rebind-parent-resolve-child-depth-3` 1.71×,
  `realistic-graph-class-resolve-root` 1.46×, `materialize-100-singletons` 1.38×, `unbind-all-100-singletons` 1.34×,
  `realistic-graph-class-cold-resolve` 1.33×, `fresh-child-default-n1` 1.28×, `create-child-empty` 1.27×,
  `interpreted-class-chain-40` 1.21× and `-24` 1.17× (the flag-only cycle check),
  `boot-decorated-container-build-and-resolve` 1.18×, `misconfigured-missing-binding` 1.14×, `production-unit-of-work`
  1.11×, `scale-deep-transient-chain-512` 1.11× — 32 of 126 shared rows more than 10% faster, 83 within 10%, with the
  warm resolve rows (`constant-resolve` 1.00×, `singleton-class-1-dep` 1.03×, `realistic-graph-resolve-root` 1.03×,
  `plan-class-chain-24` 0.99×) at parity, which is what every slice's probe was gated on.

## Geomean by group

Geomean of the ratios in each group, comparable row count in parentheses. Read a group, not a cell.

| Group          | InversifyJS 8 | Awilix 13 | tsyringe 4 |  Brandi 5 |   Ditox 3 | injection-js 2 |
| -------------- | ------------: | --------: | ---------: | --------: | --------: | -------------: |
| micro          |    2.98× (22) | 5.17× (8) |  12.3× (7) | 18.9× (8) | 1.62× (7) |      1.64× (9) |
| realistic      |     6.00× (5) | 5.69× (4) |  3.57× (4) | 14.8× (5) | 1.76× (5) |      2.29× (5) |
| fan-out        |     5.90× (9) | 1.95× (1) |  2.45× (5) | 10.2× (1) | 1.03× (5) |      1.03× (4) |
| async          |    1.32× (10) | 1.01× (1) |  1.21× (1) | 2.23× (1) | 0.94× (1) |      0.87× (1) |
| lifecycle      |     11.9× (8) | 4.56× (5) |  2.59× (4) |         — | 0.60× (5) |              — |
| scope          |    13.9× (12) | 6.28× (8) |  7.10× (8) | 14.7× (5) | 4.50× (8) |      1.94× (4) |
| scale          |     1.90× (2) | 10.6× (2) |  3.93× (2) | 9.10× (2) | 1.37× (2) |              — |
| boot           |     23.8× (7) | 13.9× (3) |  0.99× (4) | 5.27× (4) | 1.03× (4) |      1.19× (4) |
| failure        |     1.68× (2) | 2.27× (1) |  0.71× (1) | 0.76× (1) | 0.75× (1) |      0.97× (1) |
| production     |     17.4× (3) | 6.51× (2) |  3.78× (3) |         — | 0.93× (3) |      1.20× (1) |
| introspection  |     6.27× (2) | 1.25× (1) |  4.31× (2) |         — | 1.51× (1) |              — |
| slot-selection |     3.38× (6) |         — |          — |         — |         — |              — |
| resolution     |     1.03× (3) | 2.92× (2) |  5.20× (2) | 15.5× (2) | 1.40× (2) |      0.88× (2) |

The `boot` group against tsyringe, ditox and injection-js (0.99×, 1.03×, 1.19×, from 0.92×, 0.97× and 1.11×) is the
registration deficit in one number: closed at the group level, and what remains of it is the single `bind-128-plain` row
against ditox. The `fan-out` group against ditox and injection-js fell from 1.14× and 1.16× to 1.03× and 1.03×: the two
stable-set rows now pay the copy. `production` against ditox (0.93×, from 0.94×) is the event-bus row above the ceiling,
the two request rows being wins. `lifecycle` against ditox (0.60×, from 0.43×) is the two 100-singleton rows, the
registration deficit again, narrower. `async` against inversify (1.32×, from 1.42×) is the one-lane fix's three
allocations on the fan-out rows; against ditox and injection-js (0.94×, 0.87×) it is `async-init-single-hop`, the one
async row that is not a win. `realistic` against inversify (6.00×, from 5.20×) and against every rival is the generated
plans, plus a class graph that resolves its root 1.46× faster than at the baseline. `resolution` against inversify stays
at 1.03×, the accessor row against the plan rows. `failure` against inversify stays at 1.68× because
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
| constant-resolve                               | micro          |  1000 |       143,630,022‡ |          2.12×†‡ |      3.79×†‡ |       9.56×†‡ |     24.6×†‡ |    0.79×†‡ |           1.53×†‡ |
| singleton-class-1-dep                          | micro          |   200 |       126,193,972‡ |          2.47×†‡ |      3.13×†‡ |       9.31×†‡ |     24.5×†‡ |    0.74×†‡ |           3.04×†‡ |
| transient-class-1-dep                          | micro          |   200 |         66,899,423 |          1.83×†‡ |       7.65×† |        13.8×† |      31.3×† |     6.86×† |                 — |
| named-constant-get                             | micro          |   500 |        78,527,009‡ |          3.03×†‡ |            — |             — |           — |          — |                 — |
| named-resolve-slots-1                          | micro          |   500 |        82,693,455‡ |          3.08×†‡ |            — |             — |           — |          — |                 — |
| named-resolve-slots-4                          | micro          |   500 |        82,225,256‡ |          3.14×†‡ |            — |             — |           — |          — |                 — |
| named-resolve-slots-16                         | micro          |   500 |        83,082,224‡ |          3.13×†‡ |            — |             — |           — |          — |                 — |
| named-resolve-slots-64                         | micro          |   500 |        82,871,988‡ |          3.21×†‡ |            — |             — |           — |          — |                 — |
| optional-missing-transient                     | micro          |   200 |         34,725,823 |           1.14×† |            — |             — |      9.77×† |     2.79×† |                 — |
| realistic-graph-resolve-root                   | realistic      |    20 |         18,226,931 |            2.60× |        2.68× |         8.26× |      18.0×‡ |      1.60× |            1.32×‡ |
| realistic-graph-cold-resolve                   | realistic      |     1 |           268,775‡ |           12.8×‡ |       4.39×‡ |        2.50×‡ |      5.54×‡ |     1.05×‡ |            2.33×‡ |
| realistic-graph-resolved-root                  | realistic      |    20 |         52,456,242 |           3.52×† |            — |             — |      50.4×† |     4.82×† |           3.81×†‡ |
| realistic-graph-class-resolve-root             | realistic      |    20 |         24,688,156 |            2.36× |        5.11× |         7.91× |       24.5× |      3.16× |             2.66× |
| realistic-graph-class-cold-resolve             | realistic      |     1 |            422,709 |            28.0× |       17.5×‡ |         0.99× |       5.74× |      0.67× |             2.04× |
| realistic-graph-validate                       | realistic      |    10 |         18,570,608 |                — |            — |             — |           — |          — |                 — |
| fan-out-tree-depth-3-breadth-4                 | fan-out        |    20 |          1,772,316 |            1.65× |        1.95× |         3.94× |       10.2× |      2.07× |                 — |
| resolve-all-strategies-10                      | fan-out        |     1 |         22,219,469 |            6.78× |            — |         3.18× |           — |      0.81× |            0.94×‡ |
| resolve-all-strategies-100                     | fan-out        |     1 |        21,023,714‡ |           51.4×‡ |            — |        26.9×‡ |           — |     0.72×‡ |            0.88×‡ |
| resolve-all-cold-10                            | fan-out        |     1 |          1,310,988 |           28.9×‡ |            — |         0.47× |           — |      0.72× |            0.95×‡ |
| resolve-all-cold-100                           | fan-out        |     1 |            190,022 |           26.3×‡ |            — |        0.57×‡ |           — |      1.31× |             1.43× |
| resolve-all-named-8                            | fan-out        |     1 |        13,888,929‡ |           2.02×‡ |            — |             — |           — |          — |                 — |
| resolve-all-named-16                           | fan-out        |     1 |         18,863,329 |            2.61× |            — |             — |           — |          — |                 — |
| resolve-all-named-32                           | fan-out        |     1 |        18,914,284‡ |           2.19×‡ |            — |             — |           — |          — |                 — |
| resolve-all-named-64                           | fan-out        |     1 |        15,789,621‡ |           1.71×‡ |            — |             — |           — |          — |                 — |
| resolve-async-single-hop                       | async          |     1 |          8,902,611 |            1.18× |            — |             — |           — |          — |                 — |
| async-init-single-hop                          | async          |     1 |          4,329,839 |            1.34× |        1.01× |         1.21× |       2.23× |      0.94× |             0.87× |
| dynamic-async-chain-8                          | async          |     1 |          1,998,692 |            1.46× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-8                      | async          |     1 |            891,601 |            1.42× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-16                     | async          |     1 |            428,301 |            1.34× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-32                     | async          |     1 |            206,462 |            1.35× |            — |             — |           — |          — |                 — |
| async-fanout-concurrent-64                     | async          |     1 |            105,554 |            1.42× |            — |             — |           — |          — |                 — |
| async-branch-chain-8                           | async          |     1 |          1,281,740 |                — |            — |             — |           — |          — |                 — |
| async-branch-escape-mid-chain-8                | async          |     1 |          1,638,585 |                — |            — |             — |           — |          — |                 — |
| async-diamond-shared-leaf                      | async          |     1 |          1,741,172 |            1.21× |            — |             — |           — |          — |                 — |
| plan-async-resolved-chain-8                    | async          |     1 |          2,271,151 |                — |            — |             — |           — |          — |                 — |
| plan-async-class-chain-8                       | async          |     1 |          3,136,971 |                — |            — |             — |           — |          — |                 — |
| resolve-all-async-8                            | async          |     1 |            921,711 |            1.00× |            — |             — |           — |          — |                 — |
| resolve-optional-async-miss                    | async          |     1 |          9,989,004 |            1.56× |            — |             — |           — |          — |                 — |
| lifecycle-post-construct-singleton             | lifecycle      |   250 |       125,650,838‡ |          2.50×†‡ |            — |             — |           — |          — |                 — |
| lifecycle-pre-destroy-unbind                   | lifecycle      |     1 |          2,102,602 |           25.0×‡ |       5.53×‡ |         1.79× |           — |      0.83× |                 — |
| binding-level-activation-hook                  | lifecycle      |   200 |        52,117,848‡ |          2.01×†‡ |            — |             — |           — |          — |                 — |
| child-depth-1-resolve                          | scope          |   500 |         92,820,938 |          1.45×†‡ |       3.91×† |        7.15×† |      16.9×† |     3.94×† |           1.37×†‡ |
| child-depth-2-resolve                          | scope          |   500 |         91,574,075 |          1.49×†‡ |       4.81×† |        8.15×† |      17.9×† |     7.24×† |           1.53×†‡ |
| child-depth-4-resolve                          | scope          |   500 |         91,864,030 |          1.53×†‡ |       6.83×† |        10.6×† |      19.5×† |     15.8×† |           2.40×†‡ |
| child-depth-8-resolve                          | scope          |   500 |         92,214,075 |          1.46×†‡ |       12.2×† |        15.6×† |      24.1×† |     26.4×† |           2.82×†‡ |
| child-request-lifecycle-create-resolve-dispose | scope          |   100 |          2,480,482 |            47.1× |       10.0×‡ |        4.73×‡ |           — |      1.51× |                 — |
| fresh-child-default-n1                         | scope          |   100 |         12,447,544 |           44.7×‡ |       7.81×‡ |         8.67× |           — |      2.32× |                 — |
| fresh-child-default-n4                         | scope          |   100 |          8,381,948 |           38.7×‡ |       6.47×‡ |         8.27× |           — |      2.84× |                 — |
| fresh-child-name-n1                            | scope          |   100 |         12,023,280 |           48.5×‡ |            — |             — |           — |          — |                 — |
| fresh-child-name-n4                            | scope          |   100 |          7,801,966 |           34.3×‡ |            — |             — |           — |          — |                 — |
| fresh-child-tag-n1                             | scope          |   100 |         11,642,652 |           46.4×‡ |            — |             — |           — |          — |                 — |
| fresh-child-tag-n4                             | scope          |   100 |          7,729,506 |           32.0×‡ |            — |             — |           — |          — |                 — |
| scale-mid-transient-chain-32                   | scale          |     1 |          1,286,509 |            2.26× |        4.34× |        3.98×‡ |       10.9× |      1.47× |                 — |
| scale-deep-transient-chain-512                 | scale          |     1 |             55,766 |            1.61× |        25.7× |         3.88× |       7.62× |      1.28× |                 — |
| boot-decorated-container-build-and-resolve     | boot           |     1 |            574,844 |           23.1×‡ |            — |         0.89× |           — |          — |            1.85×‡ |
| container-create-empty                         | boot           |   100 |        24,985,209‡ |           39.5×‡ |       8.76×‡ |        1.09×‡ |      7.13×‡ |     1.54×‡ |           0.77×†‡ |
| create-child-empty                             | boot           |   100 |         22,151,777 |           49.5×‡ |        8.84× |         1.02× |       6.25× |      1.62× |           0.66×†‡ |
| bind-128-plain                                 | boot           |     1 |            177,473 |           30.3×‡ |       35.0×‡ |         0.99× |       10.1× |      0.42× |             2.17× |
| bind-128-refined                               | boot           |     1 |             28,008 |           4.80×‡ |            — |             — |           — |          — |                 — |
| misconfigured-missing-binding                  | failure        |     1 |           299,583‡ |           1.82×‡ |       2.27×‡ |        0.71×‡ |      0.76×‡ |     0.75×‡ |            0.97×‡ |
| circular-dependency-3                          | failure        |     1 |            159,678 |           196.2× |       1.49×‡ |             — |           — |          — |             0.48× |
| ambiguous-multi-binding                        | failure        |     1 |           235,995‡ |           1.55×‡ |            — |             — |           — |          — |                 — |
| production-http-handler                        | production     |    50 |          1,614,196 |           31.5×‡ |       6.85×‡ |        3.53×‡ |           — |      1.09× |                 — |
| production-unit-of-work                        | production     |   100 |           966,879‡ |           16.7×‡ |       6.19×‡ |        2.37×‡ |           — |     1.13×‡ |                 — |
| production-event-bus-dispatch                  | production     |   100 |        39,451,362‡ |          9.94×†‡ |            — |       6.45×†‡ |           — |    0.66×†‡ |           1.20×†‡ |
| to-resolved-3-deps                             | micro          |   200 |       125,341,005‡ |          2.48×†‡ |            — |             — |     24.2×†‡ |    0.74×†‡ |           1.63×†‡ |
| to-alias-redirect                              | micro          |   500 |         85,390,865 |           1.67×† |       4.86×† |        13.5×† |           — |          — |           1.00×†‡ |
| to-self-binding                                | micro          |   300 |       118,959,089‡ |          2.53×†‡ |            — |       7.90×†‡ |           — |          — |           2.32×†‡ |
| alias-chain-3                                  | micro          |   500 |         85,606,483 |          3.68×†‡ |       11.2×† |        21.9×† |           — |          — |           1.07×†‡ |
| alias-parent-owned-terminal                    | micro          |   500 |         85,182,359 |           1.67×† |       5.77×† |        14.7×† |           — |          — |           1.05×†‡ |
| alias-cycle-detected                           | failure        |     1 |           269,343‡ |          772.7×‡ |       2.52×‡ |             — |           — |          — |            0.84×‡ |
| resolve-optional-hit                           | micro          |   500 |       140,712,868‡ |          4.64×†‡ |      3.99×†‡ |             — |     24.5×†‡ |    0.76×†‡ |           1.61×†‡ |
| resolve-optional-miss                          | micro          |   500 |        232,867,799 |           7.49×† |       4.47×† |             — |     6.01×†‡ |     4.74×† |           2.64×†‡ |
| tagged-binding-resolve                         | micro          |   300 |        87,097,783‡ |          4.14×†‡ |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-1                         | micro          |   300 |        93,043,476‡ |          4.58×†‡ |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-4                         | micro          |   300 |        93,131,958‡ |          4.53×†‡ |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-16                        | micro          |   300 |        93,571,231‡ |          4.67×†‡ |            — |             — |           — |          — |                 — |
| tagged-resolve-slots-64                        | micro          |   300 |        92,650,867‡ |          4.42×†‡ |            — |             — |           — |          — |                 — |
| conditional-injection-tagged                   | micro          |   300 |         54,969,860 |           2.10×† |            — |             — |      24.9×† |          — |                 — |
| rebind-hot-swap                                | lifecycle      |    50 |         20,711,463 |           63.0×‡ |        1.61× |             — |           — |     0.26×† |                 — |
| has-bound-check                                | introspection  |  1000 |        317,809,748 |           5.89×† |       1.25×† |        3.12×† |           — |     1.51×† |                 — |
| has-own-unbound-check                          | introspection  |  1000 |       621,898,670‡ |          6.68×†‡ |            — |       5.96×†‡ |           — |          — |                 — |
| container-level-activation-hook                | lifecycle      |   200 |        49,153,433‡ |          1.91×†‡ |            — |       5.15×†‡ |           — |          — |                 — |
| scoped-binding-per-child                       | scope          |   100 |          5,785,466 |           54.5×‡ |       3.05×‡ |         1.97× |       4.87× |      1.42× |                 — |
| rebind-parent-resolve-child-depth-3            | lifecycle      |    50 |         13,162,321 |            81.7× |        1.51× |             — |           — |      1.57× |                 — |
| materialize-100-singletons                     | lifecycle      |     1 |            65,769‡ |           19.7×‡ |       13.6×‡ |        2.58×‡ |           — |     0.49×‡ |                 — |
| unbind-all-100-singletons                      | lifecycle      |     1 |             47,864 |           17.1×‡ |       10.7×‡ |         1.90× |           — |      0.48× |                 — |
| module-load-unload                             | boot           |     1 |            992,806 |           21.3×‡ |            — |             — |           — |          — |                 — |
| module-cold-from-modules                       | boot           |     1 |          1,619,447 |            30.9× |            — |             — |       1.72× |      1.10× |                 — |
| initialize-async-warmup                        | boot           |     1 |            387,341 |                — |            — |             — |           — |          — |                 — |
| inspect-snapshot                               | introspection  |    20 |          8,924,846 |                — |            — |             — |           — |          — |                 — |
| lookup-bindings                                | introspection  |   200 |         22,940,844 |                — |            — |             — |           — |          — |                 — |
| generate-dependency-graph                      | introspection  |    10 |            708,789 |                — |            — |             — |           — |          — |                 — |
| multi-tag-slot-resolve                         | micro          |   300 |         13,966,676 |                — |            — |             — |           — |          — |                 — |
| multi-tag-constraint-resolve                   | micro          |   200 |          7,109,590 |                — |            — |             — |           — |          — |                 — |
| multi-tag-select-32                            | micro          |   300 |          2,823,944 |                — |            — |             — |           — |          — |                 — |
| mask-reject-wide-catalog                       | slot-selection |   300 |         46,279,292 |                — |            — |             — |           — |          — |                 — |
| mask-accept-two-of-four                        | slot-selection |   300 |         19,952,228 |                — |            — |             — |           — |          — |                 — |
| mask-collision-same-bit                        | slot-selection |   300 |         49,019,178 |                — |            — |             — |           — |          — |                 — |
| slot-tag-array-hoisted                         | slot-selection |   300 |        85,967,981‡ |                — |            — |             — |           — |          — |                 — |
| slot-tag-shorthand-hoisted                     | slot-selection |   300 |        90,247,021‡ |                — |            — |             — |           — |          — |                 — |
| slot-tag-array-inline                          | slot-selection |   300 |        64,173,350‡ |                — |            — |             — |           — |          — |                 — |
| slot-tag-shorthand-inline                      | slot-selection |   300 |        74,202,611‡ |                — |            — |             — |           — |          — |                 — |
| slot-tag-zero-value                            | slot-selection |   300 |        86,481,015‡ |          4.31×†‡ |            — |             — |           — |          — |                 — |
| slot-name-and-tag                              | slot-selection |   300 |        40,147,447‡ |          2.12×†‡ |            — |             — |           — |          — |                 — |
| slot-tag-resolve-all                           | slot-selection |   300 |         49,317,962 |           4.02×† |            — |             — |           — |          — |                 — |
| slot-tag-miss-optional                         | slot-selection |   300 |        63,686,344‡ |          2.78×†‡ |            — |             — |           — |          — |                 — |
| slot-tag-parent-owned                          | slot-selection |   300 |        85,995,373‡ |          4.15×†‡ |            — |             — |           — |          — |                 — |
| slot-name-parent-owned                         | slot-selection |   300 |        82,398,906‡ |          3.49×†‡ |            — |             — |           — |          — |                 — |
| slot-injected-name-compiled                    | slot-selection |   300 |        47,215,912‡ |                — |            — |             — |           — |          — |                 — |
| slot-injected-name-interpreted                 | slot-selection |   300 |          4,016,485 |                — |            — |             — |           — |          — |                 — |
| slot-injected-tag-compiled                     | slot-selection |   300 |         52,316,502 |                — |            — |             — |           — |          — |                 — |
| slot-injected-tag-interpreted                  | slot-selection |   300 |          4,126,218 |                — |            — |             — |           — |          — |                 — |
| plan-deps-inlined                              | resolution     |   300 |        42,917,869‡ |                — |            — |             — |           — |          — |                 — |
| plan-escape-factory-dep                        | resolution     |   300 |          6,880,118 |                — |            — |             — |           — |          — |                 — |
| plan-escape-scoped-dep                         | resolution     |   300 |         10,655,243 |                — |            — |             — |           — |          — |                 — |
| plan-escape-hooked-dep                         | resolution     |   300 |          2,584,727 |                — |            — |             — |           — |          — |                 — |
| plan-escape-optional-dep                       | resolution     |   300 |          3,615,287 |                — |            — |             — |           — |          — |                 — |
| plan-escape-multi-dep                          | resolution     |   300 |          2,252,620 |                — |            — |             — |           — |          — |                 — |
| plan-class-chain-24                            | resolution     |     1 |          3,985,891 |                — |            — |             — |           — |          — |                 — |
| plan-class-chain-40                            | resolution     |     1 |         1,708,373‡ |                — |            — |             — |           — |          — |                 — |
| interpreted-class-chain-24                     | resolution     |     1 |            355,256 |                — |            — |             — |           — |          — |                 — |
| interpreted-class-chain-40                     | resolution     |     1 |            177,819 |                — |            — |             — |           — |          — |                 — |
| plan-runs-1                                    | resolution     |     1 |            681,218 |                — |            — |             — |           — |          — |                 — |
| plan-runs-256                                  | resolution     |     1 |             13,649 |                — |            — |             — |           — |          — |                 — |
| plan-runs-512                                  | resolution     |     1 |              7,158 |                — |            — |             — |           — |          — |                 — |
| plan-runs-1024                                 | resolution     |     1 |              3,800 |                — |            — |             — |           — |          — |                 — |
| plan-runs-2048                                 | resolution     |     1 |              1,936 |                — |            — |             — |           — |          — |                 — |
| plan-runs-4096                                 | resolution     |     1 |              1,167 |                — |            — |             — |           — |          — |                 — |
| plan-runs-8192                                 | resolution     |     1 |                645 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-1                               | resolution     |     1 |            183,734 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-256                             | resolution     |     1 |              4,713 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-512                             | resolution     |     1 |              2,409 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-1024                            | resolution     |     1 |              1,222 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-2048                            | resolution     |     1 |                636 |                — |            — |             — |           — |          — |                 — |
| plan-runs-deep-8192                            | resolution     |     1 |                212 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-1                              | resolution     |     1 |            664,994 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-512                            | resolution     |     1 |              6,938 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-1024                           | resolution     |     1 |              3,800 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-2048                           | resolution     |     1 |              1,959 |                — |            — |             — |           — |          — |                 — |
| plan-runs-mixed-8192                           | resolution     |     1 |                636 |                — |            — |             — |           — |          — |                 — |
| nested-context-resolve-in-factory              | resolution     |   300 |         41,073,444 |           1.70×† |       3.44×† |        5.60×† |      17.5×† |     2.15×† |           0.92×†‡ |
| nested-container-resolve-in-factory            | resolution     |   300 |        34,228,539‡ |          1.49×†‡ |      2.47×†‡ |       4.84×†‡ |     13.7×†‡ |    0.91×†‡ |           0.84×†‡ |
| accessor-injection-construct                   | resolution     |   300 |          8,699,087 |           0.43×‡ |            — |             — |           — |          — |                 — |

## Re-running this

```bash
pnpm bench:baseline                                             # from benchmarks/di — the full-profile pass above, read against the pinned baseline
pnpm bench:report                                               # derive report.md + report.json from the newest run
BENCH_MODE=full pnpm bench                                      # the same pass, read against whatever run landed before
```

`bench:baseline` is `bench` in the full profile with `BENCH_BASELINE` pinned to `baselines/2026-09-14T23-41-04-932Z`,
the last full pass over the previous engine, whose observations are tracked in this repository, so every pass's `Δ`
reads against the same run. It runs 3 trials per library in its own subprocess — one invocation is one pass, not three.
`baselines/` holds exactly the committed runs the repository cites: the pinned baseline,
`baselines/2026-09-20T08-51-37-761Z`, the run this page is transcribed from, and the two contract-tier runs the
cold-path redesign's decision record reads its before and after from (`2026-09-20T02-07-56-518Z`,
`2026-09-20T05-28-49-997Z`). A run under `baselines/` that nothing cites any more is deleted; re-anchoring the ledger
(re-pinning `bench:baseline` to a newer run once an engine epoch closes, as this page did with the pre-rewrite run) is
what makes an older baseline unreferenced and removable. The run writes a timestamped directory under `bench-results/`
(gitignored) holding `observations.jsonl` with every per-trial `mean ms`, `p99 ms` and IQR; `bench:report` turns the
newest run into the `report.md` this page is transcribed from. Before quoting any single loss as a factor rather than a
direction, re-measure it paired and alternating on a quiet machine — a full pass carries no between-run variance of its
own. The rewrite's own protocol is in [`BENCH_GUIDE.md`](./BENCH_GUIDE.md): swap the change's `src` files per side,
`BENCH_LIBRARY=@codefast/di` and `BENCH_ONLY` the target rows plus warm canaries, a `BENCH_MODE=fast` gate first and one
full pass per side only when it wins, and read the per-trial spread, not one ratio; the redesign's record adds the
cheaper gate that came first, a standalone probe of the scenario's own function for time, bytes and objects per op.
`BENCH_TIER=contract` runs the comparison without the engine rows; `pnpm bench:list` prints which rows each library
implements and confirms there is no row a library's features allow that nobody wrote.
