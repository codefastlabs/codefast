# Architecture — `@codefast/di`

How this package is put together, and — more importantly — **why the shapes that look odd are the way they are**. Most of them are load-bearing for performance, and each one has a measurement behind it. Read this before refactoring anything under `src/resolution/`.

## Layers

Dependencies point downward only. Nothing below knows about anything above.

```
container/        Container, fluent binding chain          ← the public surface
  ↓
resolution/       DependencyResolver + its collaborators   ← the engine
  ↓
registry, binding, token, types, errors                    ← the model
```

`introspection/`, `decorators/` and `metadata/` hang off the side: introspection reads the model, decorators and metadata feed it. Neither is on a hot path.

## The model

**One binding shape, one construction site.** Every binding is built by `createBinding()` in [`binding.ts`](src/binding.ts) — a single object literal listing every kind's fields in one fixed order, so all bindings in a process share one V8 hidden class. Mixed binding kinds otherwise make the resolver's hot property reads (`kind`/`scope`/`factory`) megamorphic, worth ~30% throughput. The registry therefore stores what it is handed **by reference** rather than re-copying it.

> **Rule:** never construct a binding with an object literal. Go through `createBinding()`, and keep its literal's key order untouched.

**Registration happens once.** `bind(T).toDynamic(f).singleton()` registers on `toDynamic()`; `singleton()` then writes `scope` in place on that same registered object. Only `when*()` re-slots, because slot and predicate are what the registry indexes on — and it re-registers under the chain's original id, so `id()` is stable for the whole chain. Doing it the other way (commit, remove, re-commit) cost ~2.3× on the bind path.

## The engine

`DependencyResolver` is one large class on purpose: `#private` access is per class, and the sync and async pipelines both need the same private state on every hop. Splitting them behind interfaces would put a call and a property load on paths that run millions of times a second.

What _is_ split out are the collaborators that need no cross-instance private access:

| Module                                                                                                     | Owns                                                                                                               |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| [`binding-lookup-cache.ts`](src/resolution/binding-lookup-cache.ts)                                        | options-less token → `{binding, owner}` memo, alias hops folded, stamped with the chain's summed registry versions |
| [`class-introspector.ts`](src/resolution/class-introspector.ts)                                            | per-class metadata: constructor params, `@postConstruct` presence, accessor injection, and the `new` itself        |
| [`activation-need.ts`](src/resolution/activation-need.ts)                                                  | per-binding "does this need the activation pipeline", versioned on the lifecycle manager                           |
| [`instantiation-plan.ts`](src/resolution/instantiation-plan.ts)                                            | the plan compiler (below)                                                                                          |
| [`resolution-path.ts`](src/resolution/resolution-path.ts)                                                  | cycle-detection bookkeeping carried on the path array                                                              |
| [`binding-select.ts`](src/resolution/binding-select.ts), [`constraints.ts`](src/resolution/constraints.ts) | candidate selection for name/tag/predicate shapes                                                                  |

Lookup caches form their own parent chain mirroring the resolvers', for the same `#private`-is-per-class reason.

## Compiled plans and escapes

A transient `class`/`resolved` binding resolved at the top level compiles once into a nested-constructor closure. The static subgraph is cycle-checked **at compile time**, so executing it does no per-resolve bookkeeping at all.

A dependency the compiler cannot see through — a factory, a scoped binding, an activation hook, a class past the depth limit, a multi/optional/named param — does **not** sink the plan. It compiles to an _escape_: a re-entry into the runtime resolver seeded with exactly the ancestors the interpreted path would have pushed at that point, dispatched through exactly the resolve the interpreter would have called. So cycle detection, constraint contexts and error paths are identical to never having compiled.

> **Rule:** an escape must stay behaviourally indistinguishable from the interpreted path. If you add a case, seed it with the same ancestors and replay the same call. `tests/unit/resolution/instantiation-plan-escapes.test.ts` pins this.

Before escapes existed, one `toDynamic` dependency anywhere dropped the whole graph to the interpreted path — a 13.9× cliff on a graph shape real applications write constantly.

## Cycle detection — two mechanisms, on purpose

| Lane                           | Mechanism                                                    | Why not the other one                                                                                             |
| ------------------------------ | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Sync transient-dynamic         | `binding.inFlight`, set on factory-enter and cleared on exit | Sync resolution runs on one call stack, so the flag _is_ exact path membership: `O(1)`, no hashing, no side table |
| Everything else, and all async | `enterResolutionPath` on the shared path array               | Async chains interleave, so a per-binding flag would report a cycle where two chains merely overlap               |

`enterResolutionPath` scans linearly while the path is short and attaches a membership `Set` past `RESOLUTION_SET_THRESHOLD`. That threshold switches a **data structure**, not a behaviour: both branches answer identically, and the constant is picked from measurements recorded at its definition. Compare with the deleted `DEEP_LANE_THRESHOLD`, which switched _lanes_ and therefore silently changed context identity, stack frames and promise shape at the crossing point — and reported a false `CircularDependencyError` for a diamond dependency past it.

> **Rule:** a threshold may choose an implementation. It may never choose a semantics.

## Resolution contexts are pooled, and that is not an optimization detail

Two pools, both in the resolver:

- **sync** — indexed by depth; a resolve at depth _n_ always reuses the same context.
- **async chains** — a free list. The chain's first level borrows one, every level increments `chainLevels`, the last to settle returns it.

Pooling here is not about saving an allocation. A per-chain context **survives its chain's microtask hops**, so a freshly allocated one gets promoted out of the nursery and is then collected the expensive way. Measured on `dynamic-async-chain-8` under a forced full GC every 100 samples: allocating per chain costs **2.5×**. Pooling holds the row at 1.16–1.23× against inversify where the resolver-state version sat at 0.97–0.99×.

What the async lane deliberately does **not** keep is any per-chain state on the resolver. The chain's context is threaded through the call — `ctx.resolveAsync()` hands the callee the context it used, and an inner level reuses it when `ctx.owner === this`. Two concurrent chains are two contexts with two independent `chainLevels`; there is no shared counter and no path-identity heuristic to get wrong.

## A container defers most of itself

`DefaultContainer`'s constructor builds only what a resolve cannot happen without: the registry, the scope manager, the lifecycle manager and the resolver chain. Everything else arrives on first use — the inspector, the module ref/binding tables, the scope's in-flight and scoped caches, the registry's named and tagged slot indexes, and the class introspector's three metadata caches. Eleven `Map`s a bind-and-resolve container never reads.

An empty `Map` is not free: V8 gives it a backing store, and one costs 184 bytes here. A fresh `Container.create()` retains **2.7 KB against 4.8 KB** eager, and `parent.createChild()` the same — so a service minting a child container per request halves what it allocates. Measured by retention (hold N containers live across a forced collection, divide the heap delta), which is stable to a few bytes, unlike timing a forced `gc()`.

> **Rule:** deferral is an allocation decision only. A deferred collaborator must answer identically whether or not something touched it first — an unallocated cache reads as a miss, never as an error — which is why `tests/unit/container/deferred-subsystems.test.ts` exercises each one as the _first_ thing a fresh container does.

Deferring a cache also raises the question of what a bulk reader should hand back when it was never allocated. `ScopeManager.getAllScoped()` was the only such reader, and it had no callers anywhere, so it was removed rather than given an empty-map fallback: the cheapest answer to "what should this return when there is nothing to return" is to not carry the method.

What this did **not** do is close the `realistic-graph-cold-resolve` loss against tsyringe, which is worth recording because the reasoning looked sound. That row is at mutator parity — di is only slower once a forced collection is in the loop — so cutting per-container allocation looked like the fix. It cut 13.7% of the row's allocation and moved throughput by less than the suite's ~5% noise floor, confirmed against an in-run control scenario (`constant-resolve`, which resolves from a pre-built container and so cannot benefit) that drifted by the same amount the target did. Two passes in alternating order disagreed on the sign. The footprint reduction is why this shape stays; do not cite it as a throughput win.

## Changing anything here

1. **Measure first, on a quiet machine.** `pnpm bench:isolate` from `benchmarks/di-inversify` for order-independent numbers.
2. **Measure cold paths too.** A change that wins the hot loop can lose badly on container construction — that is how the dense-`Uint8Array` cycle detector was rejected.
3. **Validate a perf fix by throwaway ablation**, not by reasoning. Two of the four hypotheses tried on the async-chain row were wrong in the direction their author expected.
4. **Best-of across processes, not a single median.** Ambient load only ever subtracts throughput, and a single run cannot separate a 5% change from noise — three runs each side, minimum.
