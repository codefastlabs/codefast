# What each shape costs — `@codefast/di`

The measured record for the shapes [ARCHITECTURE.md](./ARCHITECTURE.md) describes: what one is worth, on which row, by
which method. Every figure here is a claim someone can re-run, and none of them belong in a source comment or in that
file.

**Where a number lives.** This file is keyed by **mechanism** and outlives any single session: "what is this shape
worth, and how would I check." [`benchmarks/di-inversify/RESULTS.md`](../../benchmarks/di-inversify/RESULTS.md) is keyed
by **run** — dated, per-commit, cross-library, supersedable — and is where a suite aggregate or a head-to-head ratio
goes. [`BENCH_GUIDE.md`](../../benchmarks/di-inversify/BENCH_GUIDE.md) is the method itself, and nothing here restates
it. A figure for a shape that was tried and **not** kept goes in [REJECTED.md](./REJECTED.md) instead, with its loss.

Unless a row says otherwise: paired A/B of two builds of this package, one subprocess per side, alternating which side
runs first each pass, medians of the per-pass ratios, `pnpm bench:isolate` from `benchmarks/di-inversify`.

## The model

**One V8 hidden class for every binding** is worth roughly **30%** on hot resolve, and is why `createBinding()` lists
every kind's fields in one literal. It is also the suite's one deliberate loss: a cold iteration hands the collector ten
bindings each carrying every field any kind declares, which puts `realistic-graph-cold-resolve` at **0.94×** of
tsyringe. Winning that row means paying for it on every resolve.

**Registering once and refining in place** is what the fluent chain does instead of commit-remove-re-commit, which cost
**~2.3×** on the bind path.

The chain's per-bind allocation has a known floor and it is not worth chasing — see [REJECTED.md](./REJECTED.md).

## Compiled plans and escapes

**Escapes are worth a 13.9× cliff.** Before them, one `toDynamic` dependency anywhere dropped the whole graph to the
interpreted path — on a graph shape real applications write constantly.

**Per-hop resolve options, measured as allocation, because that is the claim.** Scavenges per 2M resolves under a 1 MB
young generation, on a four-named-dependency class whose plan an activation hook declines:

| Shape                             | before | after   |
| --------------------------------- | -----: | ------- |
| `slot-injected-name-interpreted`  |    870 | **442** |
| criteria-free control (not a row) |    443 | 443     |
| `slot-injected-name-compiled`     |   1260 | 1260    |

The interpreted lane lands exactly on the control, so the allocation is gone rather than reduced. The instrument is
`pnpm --filter @codefast/benchmark-di-inversify instrument:alloc`.

That change read **flat over all 65 throughput rows**, correctly: no row reached the changed code, because a compiled
plan already derived those options at compile time and the suite had no row that injected a criteria-carrying dependency
at all until `slot-injected-name-compiled` and `slot-injected-name-interpreted` were added with it. A per-hop allocation
is far below what a throughput row here can resolve.

**Compile-time named selection** turns four named constants from four escapes into four `() => value` thunks:
`slot-injected-name-compiled` falls **1260 → 366** scavenges, level with the criteria-free plan of the same arity, and
stops allocating more than its own interpreted twin. It is a throughput change too and a large one — **4.06×** on that
row over twelve paired passes with every pass above 3.87×, on a row whose A/A spread is ±3%, while the interpreted twin
and eleven control rows held parity. The mechanism predicts the size: the row's whole body was four escapes, each
re-entering the resolver and copying an ancestor path and stack per call.

That leaves the compiled lane as the larger remaining target for allocation: every criteria-carrying dependency still
escapes, and an escape copies its ancestor path and stack on every call.

## Fast lanes

| Shape                                                          |                  Worth | On                                                                       |
| -------------------------------------------------------------- | ---------------------: | ------------------------------------------------------------------------ |
| `#resolveCandidateSync` re-checking constant/cached singleton  |                   ~24% | `production-event-bus-dispatch` — eight cached singletons/event          |
| Plain-constant test kept **inside** the `singleton` branch     | ~8% (costs ~7% to one) | `fan-out-tree-depth-3-breadth-4` vs `constant-resolve`                   |
| `#findBinding` treating a lone candidate as its own selection  |                  ~1.5× | `resolve-optional-hit`                                                   |
| `namedEntry()` on `getOrInsertComputed`, factory module-scoped |                 ~1.72× | `named-constant-get`                                                     |
| The registry's `add()` kept on the **eager** fallback          |                    ~4% | `boot-decorated-container-build-and-resolve`, `module-cold-from-modules` |

The dispatcher-prefix row is a trade, not a win: hoisting the constant test to the top of `#resolveDefaultEntry` buys
~7% on `constant-resolve` and costs ~8% on a row that resolves 21 transient factories per iteration and is charged the
test 21 times for a kind it never has. Ratios paired against the previous build, alternating per pass, medians of 3+.

`#resolveDefaultEntry` is also the file's most inlining-sensitive site: adding one test inside a branch it does **not
take** moved an unrelated class-binding row by **15%**. Treat any edit adjacent to it as having that blast radius and
pair it with controls.

**Sharing the alias walk costs an error path ~5%.** `misconfigured-missing-binding` pays it because a throw is dominated
by capturing its stack and `#requireBinding` puts the throw site one frame deeper. Constructing the error at the throw
site rather than in the helper recovered most of it; the rest buys a single copy of the alias-cycle walk and is paid
only when a resolve fails.

## The tag lanes

**Admitting the `tag:` shorthand to the single-tag index** is worth **2.77×** with the pair hoisted and **2.66×** with
it inline (per-scenario isolation, seven passes), against `tags` rows and the sync controls at parity. An independent
paired A/B — three passes, alternating which side ran first — reproduced those at **2.91×**/**2.94×**, so the published
figures are conservative and survive a re-run.

**`resolveAll` reading the same index** is worth **3.07×** on `slot-tag-resolve-all` under isolation with every other
row at parity; the independent re-run read **3.04×**.

What that re-run did **not** reproduce is any allocation advantage for the shorthand over the array form: 0.5% between
the two spellings, on rows whose measured A/A spread is ±12%. That difference sits below what this 2×2 can resolve, and
pricing it needs a row built for it.

The `slot-selection` group exists so this family has rows at all — four rows, a 2×2 over request form × where the tag
literal lives, which is what separates lane cost from allocation cost. The `mask-*` rows price the multi-tag prefilter's
three shapes: a reject-heavy catalog, an admit-then-decide request, and the shared-bit collision.

## Chain memos, and why the shape matters more than the decision

A one-entry slot in front of `BindingLookupCache.defaultEntry()`'s map is worth **1.16×** on `to-alias-redirect` and
**1.23×** on `child-depth-2-resolve` — seven paired passes, every pass positive, spreads of 0.03 and 0.05.

Whether the single-tag lane should have a memo too is the question a **warm** benchmark answers wrongly. Against a
long-lived child resolving in a loop, the memoized lanes land at ~14 ns/op whatever the depth (`child-depth-2-resolve`,
`slot-name-parent-owned`) against ~26 ns flat plus ~10 ns per hop for tagged (`slot-tag-array-hoisted`,
`slot-tag-parent-owned`) — a flat deficit.

A **fresh** child says something else. Marginal cost per resolve of one token, netting out a 166 ns create-plus-dispose
cycle, for N resolves inside one child:

| lane                              |      N=1 |  N=2 |  N=4 |
| --------------------------------- | -------: | ---: | ---: |
| single tag — no memo              |     33.0 | 34.2 | 34.6 |
| name only — `namedEntry`, a map   | **54.5** | 34.5 | 27.1 |
| no options — one-entry slot + map |     36.7 |    — | 17.7 |

The unmemoized lane is flat, which is what having no per-container state looks like. The memoized one is dear at N=1 and
amortizes, so the crossover against its unmemoized neighbour sits at **N=2** — it loses by ~21 ns at N=1, ties at N=2,
wins from N=3. That 21 ns is the `Map` `namedEntry` allocates per token through `getOrInsertComputed` and throws away
with the container; `defaultEntry`'s one-entry slot costs ~4 ns cold by comparison.

Two consequences. **A tagged memo should be the one-entry slot, not a map** — shaped that way it is close to free at N=1
rather than a loss, so what stands against adding it is the 15% blast radius around `#findBinding`, which a paired A/B
with controls can settle, and not the duty cycle. And the justification standing over `namedEntry` — that it almost
always hits — is a statement about a long-lived container that inverts in a per-request one, where every first resolve
of a named token buys a map it will not read again.

The one consumer outside this package answers with **N=1**: the inspector in `examples/tanstack-start` binds two tokens
per region with `whenTagged()`, opens a child per request with `createChild()`, and resolves each tagged token exactly
once inside it. Its two repeated requests carry `tags: []`, which SPEC counts as no criterion, so they never reach this
lane.

> **Rule:** a chain memo is justified by hit rate, not by symmetry with a lane that has one — and the hit rate to quote
> is a **fresh** container's, because that is where the memo is paid for and a warm loop hides the payment entirely.

## Cycle detection

**Giving the hooked transient-factory lane the same `O(1)` flag as its unhooked sibling** is worth **~15%** on
`container-level-activation-hook`, which had been the suite's only loss against inversify.

`RESOLUTION_SET_THRESHOLD` is 32, measured on Node 26 / M3 Max over an async transient chain — ns/op at depth 16 / 32 /
64 / 128:

| Threshold |   16 |   32 |   64 |   128 |
| --------- | ---: | ---: | ---: | ----: |
| 16        | 1299 | 3694 | 7449 | 15625 |
| **32**    | 1202 | 3285 | 7735 | 16837 |
| 128       | 1275 | 3641 | 9645 | 26082 |

32 wins the shallow-to-mid depths real graphs have while staying near the best deep numbers; 128 is worst almost
everywhere.

## The async lane

Per-level overhead against a floor of eight plain awaited async functions, one process, libraries interleaved with
rotating order, best of five trials. `BENCH_FULL=1` forces a full GC every 100 samples, so the right-hand column is the
one published figures come from:

| Build                                                                  | Collector idle | Full GC every 100 |
| ---------------------------------------------------------------------- | -------------: | ----------------: |
| Pooled chain context, shared settle-scoped path, settle listener       |        48.3 ns |           48.3 ns |
| Per-level context, per-level path **copied** whole (`[...path, name]`) |        61.4 ns |                 — |
| Per-level context, append-only branch (the escape lane alone)          |        28.2 ns |           62.6 ns |
| **Cascade lane + branch escape**                                       |    **19.5 ns** |       **21.3 ns** |
| Ceiling: no cycle bookkeeping at all (unsound; measurement only)       |        13.8 ns |           12.3 ns |

Two things to read here. First, **the middle two rows are the trap**: per-level state fixes the diamond false positive
and measures _worse_, and it is worse in the profile that counts by 34 ns, because a per-level context is held across
its factory's await, so it is promoted out of the nursery and then collected the expensive way. The pooled build was
GC-insensitive and that, not the saved allocation, was what its pool bought. Second, the ceiling says the lane's real
machinery — promise plumbing, frame lookup, binding dispatch — is only ~13 ns, so **everything above it was cycle
bookkeeping**, and the cascade lane gets within ~7 ns of it while keeping the guarantee.

In the interleaved isolated suite that moves `dynamic-async-chain-8` from 0.75× to **1.60×** of inversify 8.2.3 and the
async group's geomean from 1.13× to 1.58×. A paired A/B against the previous build holds every measured sync row at
parity, `circular-dependency-3` included — it shares the `binding.inFlight` flag the cascade uses, so it is the row that
would show the two lanes fighting.

**Answering a plain constant and a cached singleton at the cascade entry**, rather than escaping, is worth **~19%** on
`resolve-async-single-hop`. The suite hid that behind a ratio still above 1× against inversify; only the paired A/B saw
it.

> **Rule:** measure this lane in **both** columns and never quote the idle-collector number alone. Three of the four
> attempts that failed here tried to make a settle-scoped path cheaper — a decomposition priced its settle listener at
> 16.7 ns per level against 9.4 ns for the cycle check itself, so the bookkeeping was never the lever. The lever was
> asking whether the path had to be settle-scoped at all.

## The sync context pool

`--prof` over the four thinnest rows put the pool first among everything attributable to this package:

| Row                               | `#acquireSyncResolutionContext` | `reset()` |
| --------------------------------- | ------------------------------: | --------: |
| `fan-out-tree-depth-3-breadth-4`  |                           13.5% |      8.8% |
| `scale-deep-transient-chain-512`  |                            8.4% |      7.4% |
| `container-level-activation-hook` |                         inlined |      9.8% |
| `resolve-async-single-hop`        |                               — |         — |

`reset()` writes five fields, three of which wrote the same resolver and the same two arrays every time; they only
_looked_ different because `container.resolve()` minted a fresh `[]` pair per call, so a compare-before-store would
never have hit. Reusing one pair per resolver and comparing before storing is therefore one change, not two, and it is
worth **1.90×** on `constant-resolve` and **1.71×** on `container-level-activation-hook`.

The same mechanism sets the price. A fresh array is in new space, so pushing a frame onto it needs no barrier; the
shared pair is in old space and every push pays one. `transient-class-1-dep` pushes exactly one frame and does nothing
else, so it is the one shape where that barrier costs more than the two allocations saved — **0.93×**, negative in all
six paired passes, kept against five rows between +16% and +90%.

> **Rule:** `--prof` before theorising about this engine. Reading its structure produced five wrong guesses in a row
> about where time goes — an alias `Set`, a resolved-promise memo, a redundant deep-path `Set`, and two shapes of
> compiled activation chain — while the profiler pointed at a collaborator none of them mentioned.

## Container construction

Deferring eleven `Map`s to first use takes a fresh `Container.create()` from **4.8 KB to 2.7 KB** retained, and
`parent.createChild()` the same, so a service minting a child container per request halves what it allocates. An empty
`Map` is not free: V8 gives it a backing store, and one costs 184 bytes here. Measured by retention — hold N containers
live across a forced collection, divide the heap delta — which is stable to a few bytes, unlike timing a forced `gc()`.

As throughput it is worth **1.80×** on `Container.create()` and **1.31×** on `createChild()` plus a resolve.

What it did **not** do is close the `realistic-graph-cold-resolve` loss, which is worth recording because the reasoning
looked sound: that row is at mutator parity — this library is only slower once a forced collection is in the loop — so
cutting per-container allocation looked like the fix. It cut 13.7% of the row's allocation and moved the row ~1.5%,
which the arithmetic predicts: 103 ns off container construction is 2.5% of a 4.06 µs iteration.

## The singleton slot

Moving a singleton's instance onto `binding.instance` replaces a keyed lookup with a field read on the most common
resolve shape there is, and is worth **1.09×–1.40×** on the realistic graph's root resolve depending on what else the
process has run.
