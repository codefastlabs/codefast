# `@codefast/di` — one resolution pipeline, one lane at a time — decision record

**Date:** 2026-09-19 · **Status:** restacked on the cold-path redesign 2026-09-20 · **Package:** `packages/di` ·
**Precedes:** [`di-resolution-engine-thresholds.md`](di-resolution-engine-thresholds.md) · **Follows:**
[`di-cold-path-redesign.md`](di-cold-path-redesign.md)

The safety net, the three lane fixes, the alias fold, the flat plans, the flag-only cycle check and the codegen count
landed on `main` through the cold-path redesign; what this branch still carries is the two records, the version
canaries, the `resolveAll` copy, the coverage thresholds, steps 1a, 1b and 2a below, and the `plan-runs-*` rows.

The first record left the engine with one synchronous cycle mechanism and no size thresholds, and a lane differential
test that holds every entry point to one answer. This record folds the pipeline itself: the contracts the lanes still
disagreed on, then the duplicated sync/async pairs, one step per commit, each gated the same way — five hundred
differential runs green, a paired A/B against the commit before it with a four-experiment A/A floor on any fast row that
moves, and a stop rule: a loss with a causal path stops the series at the step before.

Nothing here is quoted from `SPEC.md`, `ARCHITECTURE.md`, `RESULTS.md` or the first record's numbers; every figure below
was measured for this record, with the method beside it.

---

## Step 1a — a failure is reported in declaration order on every lane

**The contract gap.** The synchronous lanes resolve a level's dependencies in declaration order and throw at the first
that fails. The async lanes start every dependency concurrently and combined them with `Promise.all`, which rejects with
whichever settles first — so a graph with two failing siblings reported one error from `resolve()` and, depending on how
many microtask ticks each failure took, another from `resolveAsync()`. The first record's differential test had to be
told to accept "both fail" on graphs with siblings.

**Decision.** One combinator, `settleInOrder` in `resolution/async-fan-out.ts`, behind every fan-out — the interpreted
`#resolveDepsAsync`, the closure tier's `settleThenApply`, the generated tier's per-node `n<k>()` function, and both
collection reads. The happy path is still `Promise.all` and one `then`; only a failure waits for every sibling to settle
and then rejects with the earliest that did, in declaration order. Every sibling still starts before anything is
reported. The differential test's two graph properties now hold errors to verbatim equality across sync and async.

**Cost, measured.** Paired A/B, full profile, isolated, alternating, against the commit before the change. Rows with a
causal path first — every awaiting plan node, every interpreted fan-out of two or more, every collection read — then
canaries.

| Row                               | Median ratio | Experiments | Reading                                                                                           |
| --------------------------------- | -----------: | ----------- | ------------------------------------------------------------------------------------------------- |
| `plan-async-resolved-chain-8`     |       2.590× | 2.53 · 2.65 | one awaiting dependency per level: `Promise.resolve(p).then()` replaces `Promise.all([p]).then()` |
| `plan-async-class-chain-8`        |       0.978× | 0.97 · 0.99 | inside ±14% spread                                                                                |
| `resolve-all-async-8`             |       0.973× | 0.99 · 0.96 | an eight-member fan-out pays one rejection handler per read                                       |
| `async-branch-chain-8`            |       1.024× | 1.02 · 1.02 | branch lane, no fan-out: flat                                                                     |
| `async-branch-escape-mid-chain-8` |       1.016× | 1.04 · 0.99 | flat                                                                                              |
| `dynamic-async-chain-8`           |       0.988× | 0.98 · 1.00 | canary: flat                                                                                      |
| `async-diamond-shared-leaf`       |       0.970× | 0.95 · 0.99 | canary (the fan-out is the bench's own `Promise.all`): inside spread                              |
| `transient-class-1-dep`           |       1.003× | 1.00 · 1.01 | canary: flat                                                                                      |

A first version without the one-dependency case read `plan-async-resolved-chain-8` at 0.948× (0.94 · 0.96) — the
rejection handler allocated per level was the whole cost — which is what turned the specialisation from an optimisation
into the fix's shape. The eight-member collection read carries the one handler the contract costs, inside its spread.

## Step 1b — one async lane: the cascade retired

**The contract gap.** An options-less `resolveAsync` ran on a _cascade_: one shared frame stack pushed on factory entry
and popped when the factory returned its promise, and one `AsyncCascadeContext` shared by every level, so a chain of
`dynamic-async` factories allocated nothing per level. The price was documented as imprecision — a cycle formed entirely
from post-`await` edges was named one level in from the true root — but the differential probes found a wrong value
underneath it: a factory that called `ctx.resolve(...)` after an `await` read the _live_ cascade stack, which by then
held either nothing or another chain's frames, so a `whenParentIs(root)` binding was passed over for the default one
(`"top"` where the branch lane, and the graph, said `"under-root"`), and `ctx.graph.resolutionPath` named whatever was
on the stack at the time.

**Why the cascade could not be made right for free.** Its zero-allocation shape rests on strict LIFO: a level's frames
are gone the moment its factory returns. A continuation that uses the context needs those frames, so a correct answer
needs a per-level snapshot or a per-level owned prefix — which is the branch lane, exactly. Marking a level's context
stale and answering from an empty path would have turned the wrong value into the documented imprecision, still not the
graph's answer.

**Decision.** The cascade lane is retired. `resolveAsyncFromRoot` takes the compiled async plan when a transient class
or factory root has one, and otherwise opens a branch over a fresh array — the lane every other async entry already used
— so each level owns its prefix for as long as its factory holds the context. Gone with it: `AsyncCascadeContext`, the
resolver's cascade stack, its context pool, `resolveAsyncFromCascade` and the escape that snapshotted the cascade for
"anything else". A post-`await` cycle is now named from the true root. The three probes that found the defect are the
regression tests beside it.

**The first measurement, and what it taught about the harness.** The first A/B of this step read the cascade's own row,
`dynamic-async-chain-8`, at **0.22×**, `async-diamond-shared-leaf` at 0.36× and `async-branch-escape-mid-chain-8` at
0.70× — far beyond one context object per level. A standalone loop of the same eight-level chain against both builds
read them within 8% with no forced collections, equal under a forced `gc()` every 100 iterations, and the new side at
**0.55×** under one every 1 000. `--trace-deopt` under that cadence showed the new build marking optimized code for
deoptimization 43 times in 30 collections — `AsyncLevelContext`'s constructor, `runFactoryPrefix`, `resolveAsync`,
`#resolveTransientDynamicAsyncFromContext` — with the reason "embedded weak objects cleared", and the old build 0 times.
A level's context lives only as long as its chain; a full collection that finds no instance clears something those
optimized sites had embedded weakly, they deoptimize, re-optimize, and the next collection does it again. The cascade
lane never met this because its one context lived as long as the resolver.

What the cleared object is was narrowed but not named: a module-level instance of the class, constructed past V8's slack
tracking and sharing the same map as the live contexts (`%HaveSameMap` true), did not stop it; keeping only the most
recent branch array did not stop it; keeping the most recent _context_ did — 42 marks to 0, and the forced-GC throughput
from 0.55× to 0.97× of the cascade. So the resolver keeps its most recent root-level context in one field: one store per
root resolve, and one instance always live. Without forced collections the branch lane still costs the chain row about a
tenth: the context and the root array that the cascade did not allocate.

This is also the mechanism behind the first record's "harness-only" movements. The full profile forces a collection
every hundred samples; any row whose path allocates short-lived objects with a shape of their own can be thrown into
this churn, and which rows are hit depends on what each build's optimized code happened to embed — code the row never
executes can decide it. The first record's two fast rows and the +71% on `resolve-all-async-8` were this, not layout.

**Cost, measured.** Paired A/B, full profile, isolated, alternating, against the commit before the change, with the
anchor field in place. Rows with a causal path first — every async entry, the fan-out that resolves eight roots per
iteration, the two branch rows — then canaries.

| Row                                 | Median ratio | Experiments | Reading                                                                            |
| ----------------------------------- | -----------: | ----------- | ---------------------------------------------------------------------------------- |
| `dynamic-async-chain-8`             |       0.952× | 0.95 · 0.96 | the retired lane's own row: a context and a frame per level, one array per chain   |
| `resolve-async-single-hop`          |       0.966× | 0.94 · 0.99 | one level: the same three allocations where there was a push and a pop             |
| `async-fanout-concurrent-8`         |       0.840× | 0.84 · 0.84 | eight roots per iteration, each opening its own branch: three allocations per root |
| `async-init-single-hop`             |       1.045× | 1.05 · 1.04 | a class root with an async initializer, now answered by the async plan             |
| `async-diamond-shared-leaf`         |       0.987× | 1.00 · 0.98 | flat                                                                               |
| `resolve-all-async-8`               |       1.006× | 1.01 · 1.00 | flat                                                                               |
| `plan-async-resolved-chain-8`       |       1.051× | 1.10 · 1.00 | inside the base side's ±11% spread                                                 |
| `plan-async-class-chain-8`          |       1.172× | 1.02 · 1.32 | base side ±33%: the harness, not the change                                        |
| `async-branch-chain-8`              |       2.809× | 2.84 · 2.78 | the anchor field, on a row that was already on the branch lane — see below         |
| `async-branch-escape-mid-chain-8`   |       2.293× | 2.31 · 2.28 | same                                                                               |
| `nested-context-resolve-in-factory` |       1.017× | 0.99 · 1.04 | canary: flat                                                                       |
| `transient-class-1-dep`             |       0.985× | 0.99 · 0.98 | canary: flat                                                                       |

The price of a correct answer is the three allocations a level owns — its frame, its context, and for a root its array —
where the cascade pushed onto a shared stack: about a twentieth on the eight-level chain, and a sixth on the fan-out,
whose every one of eight resolves per iteration is a root. Nothing cheaper answers a continuation: a snapshot taken when
the factory receives its context is the same allocation under another name, and one taken lazily on first use is wrong
after an `await`. A root's array could be minted lazily — the fan-out's factories never touch their context — and that
is deferred to the step that reshapes the level.

The two branch rows were on the branch lane before this step and are not faster because of it: they are faster because
of the anchor field. Their contexts died between chains in the base build too, so every forced collection in the harness
deoptimized the lane for them — the same mechanism as above, present in the shipped engine and invisible until a row was
read against a build that kept one instance live. The standalone loop of that shape — eight levels, every request after
an `await`, two hundred thousand resolves — reads the two builds within 2% with no forced collection, and 0.52M against
0.80M resolves per second under one every thousand: the shipped engine paid this on every real collection, and the
harness's denser cadence is what turned it into 2.8×.

**Re-measured on the redesigned engine, in the user's fast profile.** Restacked on the cold-path redesign and read with
`pnpm di:bench:fast` — the whole suite in one child, no forced collections — one run per point, `BENCH_ONLY` on the
async rows: step 1a reads as the redesign head does (`async-fanout-concurrent-8` 892 against 899 ns,
`async-init-single-hop` 131 against 141, `dynamic-async-chain-8` 422 against 433); step 1b then reads 1 042, 158 and
472, with `async-diamond-shared-leaf` 462 → 514 — the three allocations a level owns, at a sixth to a fifth on the
fan-out and the single hop without the forced-GC churn that made the full profile read the branch rows as a win. The
rows keep their rivals beaten (`async-fanout-concurrent-8` 1.60× → 1.23× of inversify, `dynamic-async-chain-8` 1.63× →
1.33×) except `async-init-single-hop`, already below ditox at 0.95× and 0.76× after. The step stays in because the
answer it replaces is wrong, not slow: a factory that asks after an `await` is handed another chain's ancestors by the
cascade, and no cheaper shape answers a continuation from its own path.

## Step 2 — folding the pairs

The sync and async pipelines are two copies of one shape: a level guards its binding, pushes its frame, builds a context
if the factory or a hook needs one, instantiates, activates, stores by scope, and leaves. The copies exist because `#`
private fields cannot span files and every hop touches the same private state, and because the earlier attempts to share
more lost a fast lane. So each fold below is one shape shared at a time, in the order of least risk: the constraint
context (no hot loop owns it), the flag-and-push around the lean dynamic lanes, the level's state, then the three
resolution contexts. Every step is gated the same way — five hundred differential runs, a paired A/B against the commit
before it, an A/A floor on any fast row that moves — and the stop rule is fixed in advance: neutral keeps, a loss with a
causal path stops the series at the step before.

### Step 2a — one constraint context

**What was shared.** A predicate read one of three shapes: a module-level literal for the root (data properties over
empty lists), a literal built per selection in the resolver (an accessor for `resolutionPath`, an eager slice for
`ancestors`), and the `DefaultConstraintContext` class the resolution contexts' `graph` getter builds (the same
accessor, `ancestors` sliced on first read) — plus a fourth in the inspector. Every predicate call site was therefore
polymorphic across whichever of them had reached it. The class is now the one shape: the root constant is an instance
over the shared empty list, the resolver and the inspector construct it, and the per-selection literal is gone.

**What did not change.** `parent` is still read off the stack when the context is built, `resolutionPath` is still
derived per read over a stack that may be live, and `ancestors` is still what `resolutionStack.slice(0, -1)` would give
— the one difference is that the slice now happens on first read rather than at construction, which is what the class
already did for every `ctx.graph`.

**Cost, measured.** Paired A/B against the commit before it. Every row that builds a context with options or a non-empty
path, or runs a predicate, then canaries.

| Row                                                                                           | Median ratio | Experiments | Reading                                                                      |
| --------------------------------------------------------------------------------------------- | -----------: | ----------- | ---------------------------------------------------------------------------- |
| `multi-tag-constraint-resolve`                                                                |       2.127× | —           | a `whenParentTaggedAll` predicate at depth: one shape where there were three |
| `multi-tag-select-32`                                                                         |       1.988× | —           | thirty-two two-tag variants, selected by predicate                           |
| `plan-escape-multi-dep`                                                                       |       2.318× | —           | a predicate-only leaf reached by a plan's escape                             |
| `multi-tag-slot-resolve`                                                                      |       1.017× | —           | tags only, no predicate: flat                                                |
| `conditional-injection-tagged`                                                                |       1.021× | —           | flat                                                                         |
| `slot-tag-resolve-all`                                                                        |       0.997× | —           | flat                                                                         |
| `mask-accept-two-of-four`                                                                     |       0.984× | —           | inside ±3%                                                                   |
| `slot-name-and-tag`                                                                           |       0.873× | —           | new side ±32%: one experiment dipped — floored below                         |
| `slot-tag-*`, `tagged-binding-resolve`, `named-constant-get`, `slot-*-parent-owned`, `mask-*` |   0.99–1.01× | —           | above 60M ops/s at ±40–65% spread: not readable at this level                |
| `transient-class-1-dep`                                                                       |       0.977× | —           | canary, ±7%                                                                  |
| `nested-context-resolve-in-factory`                                                           |       0.977× | —           | canary, ±19%                                                                 |
| `dynamic-async-chain-8`                                                                       |       1.002× | —           | canary: flat                                                                 |

The three predicate rows doubled for one reason: the literal built per selection defined an accessor property at
construction and sliced `ancestors` eagerly, and the predicate then ran against whichever of three maps had reached it.
A class instance with a lazy slice, one map everywhere, is the whole change. `slot-name-and-tag` was then read at a
four-experiment A/A floor of 0.93–1.01 (median 0.961) and a four-experiment A/B of 0.99 · 0.99 · 1.08 · 1.00 (median
0.999): flat.

### Step 2b — the lean dynamic lanes through the shared helpers: measured, not merged

**What was tried.** The two lean synchronous lanes for a transient `dynamic` binding — the bare one and the one that
runs activation hooks — carry their own copy of the guard-flag-push and pop-clear that `enterSyncPath` and
`leaveSyncPath` already are for the generic level and the plan's accessor path. The step replaced the copies with the
calls, leaving one in-line flag write in the engine: an async factory's prefix, whose lifetime differs. Five hundred
differential runs green; no behaviour changed.

**Cost, measured.** Four experiments, against the 2a commit, on the rows whose path runs the lanes and the floors
measured just before on the same rows (`scale-mid` A/A 1.00–1.20 with one outlier, `scale-deep` 0.98–1.01,
`nested-context` 0.94–1.06, `transient-class-1-dep` 0.97–1.01).

| Row                                 | Median ratio | Experiments               | Reading                                             |
| ----------------------------------- | -----------: | ------------------------- | --------------------------------------------------- |
| `scale-deep-transient-chain-512`    |       0.965× | 0.95 · 0.99 · 0.97 · 0.96 | four of four below the row's ±2% floor              |
| `scale-mid-transient-chain-32`      |       0.999× | 0.96 · 1.01 · 1.04 · 0.99 | flat                                                |
| `binding-level-activation-hook`     |       0.963× | 0.94 · 0.98 · 0.94 · 1.01 | the hooked lane; spread ±19–23%, not readable alone |
| `container-level-activation-hook`   |       0.992× | —                         | flat                                                |
| `nested-context-resolve-in-factory` |       0.982× | —                         | inside its floor                                    |
| `transient-class-1-dep`             |       0.991× | —                         | canary: flat                                        |
| `dynamic-async-chain-8`             |       1.010× | —                         | canary: flat                                        |

A standalone loop of the chain shape against both builds — no harness, no forced collection, alternating, three runs
each — read the 512-level chain at 67.0–69.1k against 63.9–65.6k resolves per second (about 0.95×, three of three) and
the 32-level chain equal within its noise. The loss is real and grows with depth; the lane runs the changed code once
per level.

**Decision.** Not merged. A dedupe of six lines earns no throughput, and this one costs some where the lane matters
most. The likely mechanism — the shared helper's `binding.inFlight` site now sees every binding shape the generic level
and the plan host pass it, where each in-line copy saw one — was not confirmed, and does not need to be for the
decision: the rule was a loss with a causal path stops the fold, and this is one. The two copies stay, with the comment
they already carry. The patch is in the record's history, not the tree.

### Step 2c — one level state object for the generic pair

**What was tried.** The generic synchronous level and the generic asynchronous level are the two longest copies of one
shape: the cache pre-check (a plain constant, a cached singleton, a cached scoped instance, a materialization already
under way, a closed scope), the guard and the frame, the lean transient-dynamic branch, the context if a factory or a
hook needs one, instantiation, the owner's first-instantiation bookkeeping, activation, and the store by scope. The step
gave a level one state object —
`ResolutionLevel { resolver, binding, owner, options, stack, depth, needsActivation, ctx }`, a plain class allocated
only past the pre-check and the lean branch — and moved the shared halves into static private functions on the resolver
that take it: the pre-check (`#cachedAnswer`, answering the value, an `IN_FLIGHT` sentinel, or "instantiate"), the
first-instantiation bookkeeping, and the store by scope. The async instantiate-and-activate step takes the level instead
of six parameters. The lanes keep their own guard, context class, instantiation and activation calls; nothing dispatches
through an interface. The sync lane's in-flight case still throws and the async lane's still joins the promise, from the
same pre-check.

**Cost, measured.** Paired A/B against the 2a commit, two experiments, on every row whose path runs the generic level —
the interpreted class chains, the plan escapes into a factory, a scoped and a hooked leaf, the cold realistic graphs, a
scoped child, activation hooks, the async generic level — then canaries.

| Row                                                                              | Median ratio | Experiments | Reading                                                               |
| -------------------------------------------------------------------------------- | -----------: | ----------- | --------------------------------------------------------------------- |
| `interpreted-class-chain-24`                                                     |       0.457× | 0.39 · 0.52 | one level object per level; new side ±116%: the collector's churn too |
| `interpreted-class-chain-40`                                                     |       0.413× | 0.42 · 0.41 | the same, deeper                                                      |
| `realistic-graph-cold-resolve`                                                   |       0.677× | 0.68 · 0.68 | every level of a cold graph is a generic level                        |
| `realistic-graph-class-cold-resolve`                                             |       0.648× | 0.66 · 0.64 | same                                                                  |
| `plan-escape-hooked-dep`                                                         |       0.811× | 0.82 · 0.81 | one generic level per resolve, hooked                                 |
| `scoped-binding-per-child`                                                       |       0.955× | 0.95 · 0.96 | one generic level per child                                           |
| `plan-escape-factory-dep`                                                        |       0.998× | 1.00 · 0.99 | the lean lane, no level object: flat                                  |
| `plan-escape-scoped-dep`                                                         |       0.996× | 0.94 · 1.05 | flat                                                                  |
| `singleton-class-1-dep`                                                          |       0.992× | —           | a cached answer allocates nothing: flat                               |
| `*-activation-hook`                                                              | 0.993–0.995× | —           | the lean hooked lane, untouched: flat                                 |
| `async-init-single-hop`                                                          |       1.016× | —           | the async generic level: flat                                         |
| `resolve-all-async-8`, `async-fanout-concurrent-8`                               | 1.004–1.008× | —           | flat                                                                  |
| `nested-*-resolve-in-factory`                                                    | 1.016–1.020× | —           | canaries: flat                                                        |
| `transient-class-1-dep`, `scale-mid-transient-chain-32`, `dynamic-async-chain-8` | 0.986–1.008× | —           | canaries: flat                                                        |

The standalone loop — a twenty-four-level chain of resolved factories whose root declines its plan, so every level is a
generic level, one hundred thousand resolves — reads 2c at 0.61–0.73× of 2a with no forced collection, and at 0.50–0.52×
under one every thousand. Two mechanisms, then: the object allocated per level is the first, and the collector clearing
what the lane's optimized code embedded — the same loop as Step 1b, now over a class whose every instance dies inside
the resolve that made it — roughly doubles it under the harness's cadence.

**Decision.** Not merged; the fold stops at 2a. The generic synchronous level allocates nothing of its own today — its
context is pooled by depth and its frame is memoized per binding — and that is the whole reason the interpreted lane is
as fast as it is. A state object that exists so two lanes can share three functions is an allocation on every level of
every cold resolve, and no sharing pays for that. The async lane, which already allocates a context per level, read
flat: the object is free where a level already allocates, and ruinous where it does not — which is the first record's
hard truth about one shape for both lanes, now with a number on it. The patch is in the record's history, not the tree.

### Step 2d — one resolution context class: not attempted

The fourth fold — the three `ResolutionContext` classes into one over the level object, keeping the sync pool — builds
on 2c's object, so with 2c out it has nothing to build on. Its own risk was already visible in 1b: a single class for
the pooled sync context and the per-level async context gives every method one shape, but the pooled one is reset in
place (a write per field into old space, the cost the architecture notes measure) and the async one is allocated, so a
shared class would carry both costs at every site. It stays a candidate only if a level object is ever free, which 2c
says it is not.

### What the fold left

One constraint context (2a, landed: the three predicate rows doubled). The lean lanes keep their in-line flag copies
(2b, −3.5% on the deep chain for a dedupe). The generic pair keeps its two copies (2c, −54% on the interpreted chain).
The contexts stay three (2d, not attempted). The two pipelines therefore still share what they shared before this record
plus one class, and the record's answer to "can the sync and async pipelines be one" is: their contracts can — 1a and 1b
made them answer identically — and their code cannot, at this engine's cost model, beyond the pieces that allocate
nothing.

## Step 3 — evidence for the codegen tier's count

`PLAN_CODEGEN_THRESHOLD` is the run on which a compiled plan is generated as a function of its own. The first record
kept it at thirty-two as a count with no measurement behind it and named the row that would give it one. That row family
is here, in `benchmarks/di/src/scenarios/codefast/plan-runs.ts`: `plan-runs-k` resolves an eight-level transient class
chain from a fresh container exactly `k` times, and `plan-runs-deep-k` a twenty-four-level one. Every row in a family
pays the same fixed cost — the container, the bindings, the closure compile on the first run — so the difference between
two rows is `k` runs of whichever tier those runs fell in. The ladder was chosen to separate four things the naive model
`n* = C / (I − G)` folds into two: the closure run `I`, the generation `C`, the generated function's warm-up — it is new
code each time, where the closure's code is shared across every plan and already hot — and the warm generated run `G`.

**Two things the rows had to get right first.** The first version discarded each resolve's result; past a couple of
thousand iterations V8 inlined the generated plan into the loop and eliminated the instances it built, and a "generated
run" read at a tenth of a closure run — dead code, not resolution. Consuming the leaf's value was not enough either: a
chain whose levels do not keep their dependency can still have every intermediate elided once the plan is inlined. So
each level keeps the instance it was given and the resolved leaf is kept in a module variable, and every instance
escapes on both tiers alike. The numbers below are from that version; the earlier readings are in this record's history.

**Measured at the shipped count of 32.** Full profile, isolated, three trials, median per row; `t(k)` is the time per op
in microseconds. `mixed` first runs six other plan shapes below the threshold in the same process.

| `k` | depth 8 | depth 24 | mixed |
| --- | ------: | -------: | ----: |
| 1   |    1.86 |     6.34 |  1.89 |
| 8   |    3.70 |    11.82 |     — |
| 16  |    5.68 |    17.59 |  5.83 |
| 32  |   21.92 |    55.94 | 22.24 |
| 64  |   36.82 |   100.17 | 37.17 |
| 128 |   54.60 |        — |     — |
| 256 |   82.35 |   232.36 | 84.04 |

Derived by differences, microseconds per run unless stated:

| Term                                | depth 8 | depth 24 |   mixed | Read from                                           |
| ----------------------------------- | ------: | -------: | ------: | --------------------------------------------------- |
| fixed cost `F`                      |    1.86 |     6.34 |    1.89 | `t(1)`                                              |
| closure run `I`                     |    0.25 |     0.72 |    0.26 | `(t(16) − t(8)) / 8`                                |
| generation `C` (one-off)            |    12.3 |     26.8 |    12.2 | `t(32) − t(16) − 16·I`                              |
| generated run, the first thirty-two |    0.47 |     1.38 |    0.47 | `(t(64) − t(32)) / 32`                              |
| generated run, warm `G`             |    0.22 |     0.69 |    0.24 | `(t(256) − t(128)) / 128`, `(t(256) − t(64)) / 192` |
| saving per warm run `I − G`         |    0.03 |     0.03 |    0.02 |                                                     |
| runs after generation to break even |   ≈ 670 |  ≈ 1 470 | ≈ 1 030 | `(C + 32·(cold − I)) / (I − G) + 32`                |

Three things the warm rows could never show. A warm generated run saves a tenth to a fifth of a closure run — real, but
not a multiple: V8 already inlines a closure tree of this shape. Generation costs some fifty closure runs, and the
freshly generated function then runs at about twice the closure's cost for thirty-odd runs while it is tiered up — the
closure never pays that, because its code is one function literal shared by every plan in the process and hot from the
first container. And the break-even is therefore not `C / (I − G)` but that plus the cold period, and it lands between
seven hundred and fifteen hundred further runs of the same plan in the same container, at both depths, with or without
six other shapes in the process. (Six shapes did not make the closure measurably slower; a process with dozens was not
measured, and is the one reading that could still move this.)

**What thirty-two means in practice.** Plans are per resolver, so a per-request child that resolves a class root
thirty-two times generates a function of its own for that request and never recoups it; a long-lived container recoups
it after some thousand resolves of that one root and then gains a fifth per resolve. The threshold is a proxy for "this
plan will run in the thousands", and thirty-two is more than an order of magnitude below where the measured break-even
sits.

**Decision: 1024, committed separately.** A count, not a policy, and the power of two nearest the measured break-even.
The same ladders re-run at that count — the ids move with the constant, so `plan-runs-256` is then a closure-only row —
read the closure run at 0.22 / 0.74 / 0.24, the warm generated run at 0.17 / 0.51 / 0.17, and a break-even of about nine
hundred to eighteen hundred runs after generation: the same picture from the other side. A plan that runs fewer than a
thousand times in one container keeps its closure and is never worse off; one that runs ten thousand times gives up at
most a thousand runs of a fifth-of-a-run saving before it is generated, which is less than the generation it paid on the
thirty-second. The cost model does not change, no tier is removed, and nothing adapts at run time. The change is one
constant and the differential test's tiered lane, which follows it; no document states the count itself. Its own A/B is
the last table of this step.

**Cost of the change, measured.** Paired A/B of the constant against the commit before it, two experiments. The three
ladder rows shared by both counts are the change's own effect: at 256 runs the old count has generated and the new one
has not. The warm rows run past either count during warm-up and should not move.

| Row                                  | Median ratio | Experiments | Reading                                                                  |
| ------------------------------------ | -----------: | ----------- | ------------------------------------------------------------------------ |
| `plan-runs-256`                      |       1.332× | 1.33 · 1.33 | two hundred and fifty-six runs from a fresh container, no generation now |
| `plan-runs-deep-256`                 |       1.173× | 1.18 · 1.17 | same, twenty-four levels                                                 |
| `plan-class-chain-24`                |       1.019× | 1.03 · 1.01 | warm: flat                                                               |
| `transient-class-1-dep`              |       0.997× | 1.01 · 0.99 | canary: flat                                                             |
| `fresh-child-default-n4`             |       1.022× | 1.03 · 1.01 | a child resolving four roots once: never reached either count, flat      |
| `plan-class-chain-40`                |       0.960× | 1.38 · 0.54 | both sides bimodal at ±55–68%: the harness, not the change               |
| `plan-async-class-chain-8`           |       1.172× | 1.03 · 1.31 | both sides ±30%: same                                                    |
| `plan-deps-inlined`                  |       1.160× | 1.13 · 1.19 | base side ±19%, new side ±5%; a warm row on code the change never runs   |
| `realistic-graph-class-resolve-root` |       1.382× | 1.55 · 1.21 | base side bimodal at ±46%, new side ±5% at the base's upper mode         |

The last two read as the collector's loop biting one side and not the other — a warm row whose plan is generated on both
sides has no per-run reason to move — and are recorded as such, not claimed. Whether a generated function is itself what
the loop clears is the open question they raise, and the single-module child of Step 4 is the experiment that would
answer it.

## Step 4 — why a fast row moves on code it never runs

The first record's rule — a row above thirty million ops/s can read ±10% in the harness on untouched code, so get a
four-experiment A/A floor and a standalone probe before believing it — held, and this record found the mechanism behind
the largest of those movements. The full profile forces a collection every hundred samples. A collection that finds no
live instance of a class clears an object that optimized code had embedded weakly, and every optimized site that
embedded it deoptimizes, re-optimizes, and is cleared again on the next collection, for as long as instances keep dying
between resolves. Which sites those are depends on what each build's optimized code happened to embed, so a build can
change a row's reading by changing code the row never executes. Step 1b measured it directly (forty-three deoptimization
marks in thirty collections against none; 0.55× against parity under a forced collection every thousand) and the same
mechanism was already acting on the shipped engine's branch rows. The remedy in the engine is one live instance per
class the lanes allocate per level; the remedy in the harness is to know the profile does this.

Two harness experiments were planned against this — a child that loads only the measured scenario's module, so the code
layout of the other hundred scenarios cannot decide what is embedded, and a layout canary row run as A/A inside every
`bench:ab` so a movement of the canary reads as harness, not change. Neither was run: the mechanism above accounts for
every movement this record met that was larger than a row's four-experiment A/A floor, and the floor itself — measured
on the same rows immediately before each A/B, as this record did for 2a, 2b and 2c — is the canary, run by hand. Both
stay worth doing; the single-module child would settle whether anything remains once the collector's churn is out of the
picture, and that is the reading to take before touching the harness.

**What the record leaves as practice.** Before an A/B: list the rows with a causal path. On any movement on a fast row
or on untouched code: a four-experiment A/A on that row, then a standalone loop of the same shape against both builds
with `--expose-gc`, at no forced collection and at one every thousand. A loss that appears only under forced collection
is the deoptimization loop, diagnosed with `--trace-deopt` and its "embedded weak objects cleared" reason, and remedied
by keeping one instance of the dying class live. A loss that appears without it is real.

## Where this leaves the engine

- **Contracts.** Every lane answers a graph identically — value, sharing and error — and the differential test holds
  them to verbatim errors on every property. An async failure is reported in declaration order; a factory's context
  answers from its own ancestors before and after an `await`; a post-`await` cycle is named from the true root.
- **Lanes.** One async lane where there were two. One constraint context where there were four. The synchronous and
  asynchronous generic levels remain two copies, and the lean dynamic lanes keep their in-line flag: each fold past the
  first was measured, lost, and left out, with the number that decided it.
- **Thresholds.** `PLAN_CODEGEN_THRESHOLD` is 1024, with the ladder that measured it in the suite; `MASK_WIDTH` and
  `MULTI_TAG_INDEX_THRESHOLD` stand as the first record left them.
- **The harness.** The full profile's forced collection turns a class whose instances die between resolves into a
  deoptimization loop; the engine keeps one level context live for that reason, and the record's floors are measured
  under it.
