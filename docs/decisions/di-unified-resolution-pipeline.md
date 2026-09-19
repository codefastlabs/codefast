# `@codefast/di` — one resolution pipeline, one lane at a time — decision record

**Date:** 2026-09-19 · **Status:** in progress on `research/di-unified-engine` · **Package:** `packages/di` ·
**Precedes:** [`di-resolution-engine-thresholds.md`](di-resolution-engine-thresholds.md)

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

## Step 2 — folding the pairs

_(pending)_
