# Tried against this engine, and rejected

Changes that were designed, built and measured against `src/resolution/` and then thrown away. **Read this before
proposing an optimization here** — most of the obvious ones are on this page, and several of them look more obvious
after reading [ARCHITECTURE.md](./ARCHITECTURE.md), not less.

An entry is not a prohibition. It is a bar: whatever cost is recorded here is what a new attempt at the same idea has to
beat, measured the same way. What the shapes that _were_ kept are worth is in [PERFORMANCE.md](./PERFORMANCE.md); the
method for either is [`BENCH_GUIDE.md`](../../benchmarks/di-inversify/BENCH_GUIDE.md).

## Fewer builder objects per `bind()`

**Unreachable, not pending.** The chain's per-bind allocation was measured against a floor that registers the binding
with no builder objects at all: the ceiling for removing _every_ builder object is **~19%** on
`realistic-graph-cold-resolve` at a forced GC every 4096 iterations, the operating point that reproduces the published
0.82×. Getting from four objects per bind to three — committer folded in, then entry folded in — moved **nothing
measurable**, and a fluent API cannot go below one builder object.

Measure that floor in-process before believing any object-counting argument here. An in-process A/B against an in-run
control is the only version of this measurement that came out reproducible; the same change measured cross-build,
without a control scenario, reported a clean +4% that was entirely machine drift. Retained-footprint measurement is
blind to all of it — the builders die immediately, so holding containers live across a forced collection cannot see
them.

## Sharing, lending or plan-owning the escape thunk's arrays

**Four schemes, all four broken; the only one that got as far as a measurement cost 1.80×** on the smallest escaping
shape, because the guard that makes sharing safe costs more than the two length-1 allocations it removes. Two mechanisms
defeat every variant — a stale membership `Set` living on the array object, and a constraint predicate that runs on a
live seed before any push and can re-enter the same cached plan. Both are stated as an invariant in
[ARCHITECTURE.md](./ARCHITECTURE.md); the failure they produce is a wrong binding selected, not a wrong diagnostic.

## Hoisting the request out of the candidate loop

**Wins four excluded rows, loses three that count.** `--prof` puts over half this lane's JavaScript time in
`matchesSlot`, re-deriving the same request per candidate, so reading it once in `filterBindings` looks free. It is
worth 1.27×/1.19×/1.13×/1.06× on the four slot rows and costs **0.87×**/**0.90×**/**0.93×** on
`resolve-all-strategies-10`, `-100` and `production-event-bus-dispatch`. Every row it wins carries
`excludeFromAggregates`; every row it loses is one of the 44 that count.

The mechanism is V8's cumulative inlining budget, not an added comparison: a bigger `filterBindings` pushes the tail of
`resolveAll → #candidateBindings → selectAllBindings → filterBindings → matchesPredicate` out of the inlined chain, so
the per-candidate loop loses its inlining. Two remedies failed — extracting the lane into its own method, then branching
in the caller, which made it worse.

> **Rule:** a hot chain can be too big as well as too eager, and the two fail differently. An extra comparison scales
> with call count; a lost inlining edge scales with candidates and survives being moved into another method — the budget
> counts bytecode and call sites present, not how often a call runs, and it is cumulative, so moving bytecode into the
> caller only re-accounts it. Raising `--max-inlined-bytecode-size*` on both sides is the oracle: if the difference
> vanishes, code size was the cause.

## Making `#getResolutionFrame` inlinable

**~6% slower, five paired passes, all five negative.** Folding it into a single expression so it would inline, with the
build extracted to a cold method, cost that on `fan-out-tree-depth-3-breadth-4` and was reverted. The mirror-image
change — a one-entry inline cache in front of `LifecycleManager.activationHandlersFor()`'s map — was kept and won, so
the shape is not the lesson. **A profile showing self-time in a memo is not evidence that the memo is the cost.**

## Compiling the activation chain

**Three shapes, three different places to lose.** The hook pipeline is re-decided per resolve while its shape is fixed
per `(binding, activationVersion)` — the same redundancy the async cascade removed — so: memoize a closure over the
exact hooks, keyed on the resolver rather than the binding, since `this.#lifecycle` belongs to whichever container is
resolving and a child's hooks differ from its parent's for the same binding. Five paired passes each:

| Shape                                                  | Target row | What it cost instead                     |
| ------------------------------------------------------ | ---------: | ---------------------------------------- |
| Fast exit moved behind the memo lookup                 |      1.11× | `scale-mid-transient-chain-32` **0.89×** |
| Fast exit inlined at the dispatcher, memo behind it    |      1.00× | `transient-class-1-dep` **0.85×**        |
| Dispatcher byte-identical, lane compiles its own chain |  **0.94×** | controls clean                           |

Two lessons, both re-earned the hard way. `#resolveDefaultEntry` is inlining-sensitive: adding one test inside a branch
it does not take moved a **class**-binding row 15%, which is the dispatcher-prefix rule reappearing as a code-size
effect rather than an extra comparison. And a compiled chain does not pay at the arity that actually occurs — with one
hook it is a closure call wrapping a hook call, against one direct call after two checks, so the indirection costs more
than the loop it removes.

> **Rule:** before compiling a pipeline, count the arity in the row you are trying to move. Compilation pays for a loop,
> and a one-element loop is not one.

The hunt was still worth it: it found the late-`.onActivation()` memo bug, which is now an invariant in
[ARCHITECTURE.md](./ARCHITECTURE.md) with `tests/unit/resolution/cache-invalidation.test.ts` behind it.

## Routing every candidate through `#resolveBinding`

**~24% on `production-event-bus-dispatch`.** `#resolveCandidateSync`/`#resolveCandidateAsync` re-check plain-constant
and cached-singleton before delegating, which reads as copy-paste of the dispatcher and was removed once on a DRY pass.
The cost is paid per candidate rather than per call, so a `resolveAll` over eight cached singleton handlers pays it
eight times per published event.

## Hoisting the plain-constant test to the top of `#resolveDefaultEntry`

**Buys ~7%, costs ~8% to more rows than it helps.** It reads more naturally at the top and belongs inside the
`singleton` branch, because a constant is a singleton that is already its own instance. The trade is priced in
[PERFORMANCE.md](./PERFORMANCE.md).

## A per-level path or context for the async lane

**Fixes the diamond false positive and measures worse — 34 ns per level worse in the profile that counts**, because a
per-level context is held across its factory's await, so it is promoted out of the nursery and then collected the
expensive way. Four attempts failed before the cascade lane, three of them trying to make a settle-scoped path cheaper:
a decomposition priced its settle listener at 16.7 ns per level against 9.4 ns for the cycle check itself, so the
bookkeeping was never the lever. The full per-level cost table is in [PERFORMANCE.md](./PERFORMANCE.md).

## `DEEP_LANE_THRESHOLD` — a threshold that chose a semantics

**Deleted, and the reason is a rule.** It switched _lanes_ rather than a data structure, so it silently changed context
identity, stack frames and promise shape at the crossing point — and reported a false `CircularDependencyError` for a
diamond dependency past it. `RESOLUTION_SET_THRESHOLD` replaced it and switches only a data structure; both of its
branches answer identically.

## A dense `Uint8Array` cycle detector

**Rejected on the cold path.** It wins the hot loop and loses badly on container construction, which the hot loops hide
completely — the standing reason [ARCHITECTURE.md](./ARCHITECTURE.md) gives for measuring cold paths on every change.
