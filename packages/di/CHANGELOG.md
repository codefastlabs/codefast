# @codefast/di

## 0.5.0-canary.8

### Minor Changes

- [#646](https://github.com/codefastlabs/codefast/pull/646) [`0093b99`](https://github.com/codefastlabs/codefast/commit/0093b99ed711ad037b0e98e7343dee89786d328b) Thanks [@thevuong](https://github.com/thevuong)! - Build a container's rarely-used collaborators on first use instead of in its constructor: the inspector, the module ref/binding tables, the scope's in-flight and scoped caches, the registry's named and tagged slot indexes, and the class introspector's metadata caches. A container that only binds and resolves — the common case, and every per-request child container — no longer allocates eleven `Map`s it never reads.

  A fresh `Container.create()` retains 2.7 KB instead of 4.8 KB (**43% lighter**), and `parent.createChild()` the same, measured by retention against a forced collection. Every deferred collaborator behaves identically whether or not something touched it first, which `tests/unit/container/deferred-subsystems.test.ts` pins by exercising each one as the first thing a fresh container does.

  It is a throughput win too, on the paths that actually build containers: `Container.create()` is **1.80×** faster (230 ns → 127 ns) and a per-request child container plus a resolve through it — `createChild()` + resolve, the shape a web app runs once per request — is **1.31×** faster. Measured by an interleaved A/B with both builds loaded into one process, 13 trials in alternating order, against a control scenario that resolves from a pre-built container and so cannot benefit; the control sat at 0.997–1.009, and median and best-of agreed on both figures.

  **Breaking:** `ScopeManager.getAllScoped()` is removed from the `./resolution/scope` subpath. Deferring the scoped cache raised the question of what a bulk reader returns when the cache was never allocated, and this reader had no callers anywhere in the package — so it is gone rather than carrying an empty-map fallback for nobody. `getAllSingletons()` is unaffected; its cache is still eager.

  What it does **not** do is close the `realistic-graph-cold-resolve` loss against tsyringe, and the arithmetic says why: 103 ns off container construction is 2.5% of that row's 4.06 µs iteration, so the row moves ~1.5% — measured, and inside the noise floor. That row's gap is GC-attributable (the two libraries are at mutator parity; di only loses once a forced collection is in the loop), so a 13.7% allocation cut was never going to carry it.

- [#646](https://github.com/codefastlabs/codefast/pull/646) [`de80bad`](https://github.com/codefastlabs/codefast/commit/de80bad63f14afda1bd64a6d247852b24aac8e16) Thanks [@thevuong](https://github.com/thevuong)! - Publish an intentional export surface: 13 subpaths instead of 36. The engine's collaborators — `resolution/*`, `registry`, `container/*`, `binding`, `constructor-type`, and the `metadata` internals — are no longer entry points. They carry the invariants documented in ARCHITECTURE.md, and publishing them meant every internal refactor was technically a breaking change. Everything a consumer needs stays reachable from the root export, which already re-exports the builder interfaces, `Constructor`, `MetadataReader`, `effectiveBindingScope`, and the resolve-options helpers.

  **This also repairs a silent break.** The surface was generated from `dist/`, so reorganising `src/` into `container/`, `resolution/` and `introspection/` renamed twelve already-published entry points — `./inspector` → `./introspection/inspector`, `./dependency-graph` → `./introspection/dependency-graph`, `./graph-adapters/*` → `./introspection/graph-adapters/*`, `./container` → `./container/container`, and the whole flat `./resolver`/`./scope`/`./lifecycle`/`./environment`/`./constraints`/`./binding-select`/`./binding-scope`/`./resolve-options` set — with no changeset saying so. The consumer-facing ones (`./inspector`, `./dependency-graph`, `./graph-adapters/*`) are back at the specifiers they shipped under; `examples/tanstack-start` imports two of them and would have broken on its next upgrade.

  **Breaking:** the internal subpaths listed above are gone. Import from the package root instead.

- [#646](https://github.com/codefastlabs/codefast/pull/646) [`4ba70d1`](https://github.com/codefastlabs/codefast/commit/4ba70d1724e19580ee93ee392e413c23e669f310) Thanks [@thevuong](https://github.com/thevuong)! - Keep a singleton's instance on its binding instead of in a per-container table. A binding belongs to exactly one container, so its singleton slot is per-binding — which turns every cached-singleton read from a keyed `Map` lookup into a field read, on the most common resolve shape there is. The scope manager keeps only a lazily-created list of the bindings that have materialized, so disposal and `inspect()` can still enumerate them, and the singleton `Map` is gone entirely.

  In the suite, `realistic-graph-resolve-root` — a transient controller over eight cached singletons — went from 10.66M to **12.19M** hz/op, and the `realistic` group geomean from 2.24× to **2.54×** of InversifyJS. That row carries a 2.9% IQR, so it is one of the numbers here worth reading precisely. `singleton-class-1-dep` and cold container build both moved up as well, on rows whose IQR is too wide to attribute confidently.

  An interleaved A/B against the previous build, both in one process with a control that cannot benefit, put the same row between 1.09× and 1.40× across four runs — never slower, median and best-of agreeing inside each run, but with a spread that depends on what else the process had run. The suite's figure is the one to cite; the A/B established the direction. A trap worth recording: the control first read 0.88×, which was an artifact of timing an 11 ns call one at a time — batched the way the harness does it, the same control reads 1.02× with a 4% spread.

  **Breaking:** `ScopeManager`'s singleton API takes a `Binding` rather than a `BindingIdentifier`, and `hasSingleton`/`getSingleton`/`peekSingleton`/`setSingleton(id, …)`/`getAllSingletons` are replaced by `setSingleton(binding, …)`, `deleteSingleton(binding)` and `cachedSingletons()`. The `SINGLETON_MISS` sentinel is gone; `NO_INSTANCE` on the binding replaces it. None of this is a published entry point any more, so it is internal — but a fork reaching into `./resolution/scope` would notice. `InstantiationPlanDependencyEntry` also drops its `ownerScope` field, which a compiled thunk no longer needs.

### Patch Changes

- [#646](https://github.com/codefastlabs/codefast/pull/646) [`d27b76f`](https://github.com/codefastlabs/codefast/commit/d27b76fb14200ae5226ec2a05b77d44ab91b016c) Thanks [@thevuong](https://github.com/thevuong)! - Thread an async chain's resolution context through the call and pool it, instead of parking chain identity on the resolver. `ctx.resolveAsync()` now hands the callee the context it used, so an inner level reuses it when the owner matches — which removes the resolver's path-identity heuristic, its shared settle callback and its active-level counter, and makes two concurrent chains correct by construction rather than by a fallback branch.

  The contexts are pooled, and that is load-bearing rather than an allocation micro-optimization: a per-chain context survives its chain's microtask hops, so under a collecting profile a freshly allocated one is promoted out of the nursery and then collected the expensive way. An ablation that allocated per chain cost **2.5×** on `dynamic-async-chain-8` under a forced GC every 100 samples, which is the reason for the shape.

  It does **not** close that row. An earlier draft of this changeset claimed it went from 0.98× to 1.18× of InversifyJS; that figure came from a probe running both library builds in one process, which this harness's README warns is worth ~30% on async chains, and from a 3-trial suite run on a loaded machine. At 5 trials on a quiet machine the row is **0.87×** with a 0.6% / 0.3% IQR — among the tightest numbers in the suite. The mechanism above is real; the win over inversify was not.

  A competing hypothesis was tested and rejected: a forced full GC costs the two libraries the same (1.35 ms / 9.76 MB live for di, 1.41 ms / 9.89 MB for inversify), so the cost was never the collection but what di re-established afterwards.

- [#646](https://github.com/codefastlabs/codefast/pull/646) [`864d213`](https://github.com/codefastlabs/codefast/commit/864d213a4253346dae5799ebba06fc2726e933d2) Thanks [@thevuong](https://github.com/thevuong)! - Fold the fluent chain's registry committer into the chain itself. `bind()` now allocates a `BindingEntry` that carries only the `to*()` calls, and `to*()` a `BindingChain` that commits to the registry directly — one object per bind less than the entry/chain/committer trio, and one `Map` lookup less per binding registered by a module.

  The two classes now share a `BindingRegistration` describing where the chain registers, built once per container rather than once per `bind()`. Threading that instead of a loose `(registry, moduleBindingIds, moduleRef)` triple makes the module invariant type-enforced — the id list is present exactly when the chain belongs to a module load — which removes both non-null assertions from the commit path, and drops the constructors from 4 and 5 positional parameters to 2 and 3.

  `BindingCommitter` is gone and `BindingEntry`'s constructor now takes `(token, registration)`. Neither is a published entry point any more, so this is internal.

  This is a simplification, **not** a throughput win: removing only the committer measured no change above noise. The chain stays two objects because `tests/unit/container/bind-to-builder-order.test.ts` requires `bind()`'s result to lack `when*()` at runtime — that is the test's own guarantee, stricter than SPEC §2.4, which only claims compiler enforcement. The measured ceiling for removing every builder object is ~19% on `realistic-graph-cold-resolve` under a forced GC — recorded in ARCHITECTURE so the lead is not re-tried blind.

- [#646](https://github.com/codefastlabs/codefast/pull/646) [`d27b76f`](https://github.com/codefastlabs/codefast/commit/d27b76fb14200ae5226ec2a05b77d44ab91b016c) Thanks [@thevuong](https://github.com/thevuong)! - Compile instantiation plans around dependencies the compiler cannot see through, instead of refusing to compile the graph at all. A factory, a scoped binding, an activation hook, a class past the depth limit, or a multi/optional/named parameter now compiles to an _escape_ — a re-entry into the runtime resolver seeded with exactly the ancestors the interpreted path would have pushed at that point, dispatched through exactly the resolve the interpreter would have called. Cycle detection, constraint contexts and error paths are therefore identical to never having compiled, and only the opaque dependency pays the runtime price while its siblings and ancestors stay compiled.

  Previously a single `toDynamic` dependency anywhere in a class graph dropped the whole graph to the interpreted path — a 13.9× cliff on a shape applications write constantly (a factory-provided config injected into a class tree). That graph is now ~2× faster, and the first-materialization path of a singleton dependency inside a plan gained cycle detection it did not have.

- [#646](https://github.com/codefastlabs/codefast/pull/646) [`d27b76f`](https://github.com/codefastlabs/codefast/commit/d27b76fb14200ae5226ec2a05b77d44ab91b016c) Thanks [@thevuong](https://github.com/thevuong)! - Split the resolver's self-contained caches into named collaborators — `BindingLookupCache` (the chain-versioned options-less lookup memo), `ClassIntrospector` (per-class metadata, `@postConstruct` discovery, accessor injection, instantiation) and `ActivationNeedCache` (per-binding activation need, versioned on the lifecycle manager). The engine class keeps the sync and async pipelines, which genuinely need the same private state on every hop, and `ARCHITECTURE.md` now records the layering, the invariants each hot path depends on, and the rule that separates a legitimate threshold (choosing an implementation) from the kind that was removed (choosing a semantics).

  New subpaths `@codefast/di/resolution/{activation-need,binding-lookup-cache,class-introspector}`; `@codefast/di/resolution/class-plan` is now `@codefast/di/resolution/instantiation-plan`, correcting an export map that had been stale since the module was renamed.

- [#646](https://github.com/codefastlabs/codefast/pull/646) [`a720c62`](https://github.com/codefastlabs/codefast/commit/a720c6297d041ffd2d0bba2e6146af894007a367) Thanks [@thevuong](https://github.com/thevuong)! - Collapse the fluent binding chain into one object. A single `BindingChain` is now the `BindToBuilder` that `bind()` returns and the kind-specific builder that `to*()` returns, so a `bind()` allocates one builder instead of two.

  The `to*()`-before-`when*()` ordering stays enforced, as a type-level guarantee — which is what SPEC §2.4 actually claims. `bind()` is typed `BindToBuilder`, so a refinement before `to*()` does not compile; `tests/types/container-api.test.ts` pins that. For a caller without types, or one who casts past them, every refinement now throws the new **`ChainNotRegisteredError`** naming the token and pointing at `to*()`, rather than silently doing nothing. `whenDefault()` asserts registration for that reason alone, since it otherwise has nothing to do.

  The previous revision kept two objects because a unit test asserted the refinement methods were _absent from the object_ `bind()` returns — a stricter reading than the spec, and one that pinned an implementation detail. That test now asserts the contract instead: every refinement throws before `to*()`, nothing is registered when it does, and the chain still works normally afterwards.

  This is an API simplification, **not** a throughput win: going from four builder objects per bind to three measured no change above noise, and a fluent API cannot go below one, so the ~19% ceiling recorded in ARCHITECTURE for removing all of them is unreachable rather than pending.

- [#646](https://github.com/codefastlabs/codefast/pull/646) [`1241f82`](https://github.com/codefastlabs/codefast/commit/1241f82bdb40613667c781111f2ce20409ddfd89) Thanks [@thevuong](https://github.com/thevuong)! - Register a fluent binding chain once instead of once per refinement. `bind(T).toDynamic(f).singleton()` used to insert a binding, remove it, and insert a replacement — two registry mutations, two version bumps, and a full index churn per binding. The chain now registers on its `to*()` call and refines that same registered object in place; only `when*()` re-slots, and it re-registers under the chain's original id, so `id()` stays valid for the whole chain instead of the intermediate ids being dead. Binding construction also funnels through a single `createBinding()` literal, which is what guarantees the one V8 hidden class the resolver's hot property reads depend on — so the registry stores what it is handed rather than re-copying it.

  Cold container build (build, bind 10 nodes, resolve the root) went from the suite's only loss to a win against every competitor: 0.76× → 3.0× of InversifyJS, 0.43× → 1.9× of Awilix, 0.22× → 1.07× of tsyringe.

  The builder's `CommitFn` type is replaced by a `BindingCommitter` interface (`commit` plus `refine`, the latter for in-place refinements the registry indexes do not care about), and `createBinding` / `refinableFields` are new exports from `@codefast/di/binding`.

## 0.5.0-canary.7

### Minor Changes

- [`ad11507`](https://github.com/codefastlabs/codefast/commit/ad115077e23eaed845abd1f093f32d57f2445a36) Thanks [@thevuong](https://github.com/thevuong)! - Reorganize the source tree into subsystem folders — `container/` (container + the extracted fluent binding builders), `resolution/` (resolver, scope, lifecycle, environment, selection/constraints, and the extracted cycle-guard module), and `introspection/` (inspector, dependency graph, and the graph adapters). The root entry keeps exporting everything and now also exports the graph adapters (`toDotGraph`, `toCytoscapeGraph`, `toReactFlowGraph` and their types), so `import { toReactFlowGraph } from "@codefast/di"` is the preferred path.

  Breaking (0.x minor): the `@codefast/di/graph-adapters/*` subpaths are removed — import the adapters from the root entry or from `@codefast/di/introspection/graph-adapters/*`. Deep subpaths of other moved modules follow the new folders (e.g. `@codefast/di/resolver` → `@codefast/di/resolution/resolver`).

- [`6a25788`](https://github.com/codefastlabs/codefast/commit/6a25788320c73074c3ae0bb06cf7a70b7800c953) Thanks [@thevuong](https://github.com/thevuong)! - Resolver performance overhaul — the head-to-head benchmark vs InversifyJS 8 now shows 38/38 comparable scenarios won (median 1.82×, isolated mode), up from 7 losing rows. Four techniques, no public-API changes:

  - **Chain-versioned lookup memo** — `BindingRegistry` gains a monotonic mutation version; resolvers memoize options-less `token → {binding, owner}` lookups across the parent chain with alias hops folded to the terminal binding. Resolving a root binding from a depth-2 child (or through `toAlias`) is now as fast as resolving it locally.
  - **Compiled resolution plans** — a transient class binding whose dependency subgraph is pure static (class/constant/cached-singleton deps, no activation hooks or `postConstruct`) compiles once into a nested-constructor closure, cycle-checked at compile time. Anything dynamic keeps the runtime cycle guard, so error semantics are unchanged.
  - **Uniform binding hidden class** — `Registry.add` rebuilds every binding with one fixed field superset so mixed binding kinds no longer turn the resolver's hot property reads megamorphic (~30% throughput loss in processes exercising several kinds).
  - **Leaner async transient path** — cleanup runs as a FIFO side listener on the factory promise instead of a derived-promise chain (one less promise and one less microtask hop per level), and activated transient dynamic bindings get a dedicated lane that fetches container hooks once. Behavior note: an unawaited _failing_ `resolveAsync` no longer surfaces as an `unhandledRejection`; await (or `.catch`) the returned promise.

- [#643](https://github.com/codefastlabs/codefast/pull/643) [`14c3a98`](https://github.com/codefastlabs/codefast/commit/14c3a98a98ae6221df447a94afe14b2e4a147c90) Thanks [@thevuong](https://github.com/thevuong)! - `container.validate()` now reports a captive dependency when a singleton depends on a **transient or scoped `toDynamic` / `toDynamicAsync` binding**. Previously any dynamic terminal was classified opaque and its declared scope went unchecked, so the most common form of the bug — a singleton capturing one instance of something bound transient — passed validation silently.

  A factory's _body_ remains opaque: `validate()` still does not descend into it, so whatever the factory resolves internally is not reported. Only the declared scope of the dependency edge is judged, which is the part the container actually knows.

  **Breaking:** a container that wires a singleton to a transient or scoped dynamic binding now throws `ScopeViolationError` from `validate()` where it previously passed. Either widen the dependency's scope, or inject a factory instead of the value if a fresh instance per use is intended.

### Patch Changes

- [`2def688`](https://github.com/codefastlabs/codefast/commit/2def688e305eebe7e14af4ae163beec13582aad5) Thanks [@thevuong](https://github.com/thevuong)! - Fix a crash on cyclic aliases: `bind(a).toAlias(b)` + `bind(b).toAlias(a)` previously recursed until `RangeError: Maximum call stack size exceeded` on both `resolve` and `resolveAsync`. Alias following is now an iterative loop with exact revisit detection — a genuine cycle throws `CircularDependencyError` naming the alias chain, and legitimately long alias chains resolve with no arbitrary hop cap.

  Also splits the magic `32` that served two unrelated roles: the transient-dynamic fast lanes keep their own `DEEP_LANE_THRESHOLD = 32` (a shared-context/pool design point), while the cycle-scan Set attachment moves to a measured `RESOLUTION_SET_THRESHOLD = 128` — benchmarking showed `Array.includes` beats the Set's has/add/delete churn up to at least depth 96, so mid-depth graphs now skip the Set entirely.

- [`19199af`](https://github.com/codefastlabs/codefast/commit/19199af174d8971081d1849a36fd9df05c8541ae) Thanks [@thevuong](https://github.com/thevuong)! - Fix binding-registration order sensitivity: the fluent builder chain commits eagerly, so `bind(x).toDynamic(f).when(p)` (or `.whenNamed(...)` / `.whenTagged(...)`) momentarily registered a default-slot binding whose last-wins commit silently displaced an existing default binding of the same token — and the displaced binding was never restored once the chain narrowed to a predicate or a named/tagged slot. Registering a default binding before a constrained one on the same token therefore lost the default. The commit chain now remembers what an intermediate commit displaced and restores it when the chain settles on a non-conflicting shape; a chain that genuinely ends on the same default slot still replaces the previous default (last-wins unchanged).

  Binding selection also gains a most-specific-wins rule: when both a default binding and exactly one predicate-carrying binding match, the predicate wins (it is a deliberate specialization) instead of throwing `AmbiguousBindingError` — so "default plus `when(...)` override" now works as naturally intended. Two matching predicates remain ambiguous and still throw.

- [#643](https://github.com/codefastlabs/codefast/pull/643) [`14c3a98`](https://github.com/codefastlabs/codefast/commit/14c3a98a98ae6221df447a94afe14b2e4a147c90) Thanks [@thevuong](https://github.com/thevuong)! - Unify sync transient-dynamic cycle detection on a per-binding `inFlight` flag, replacing the shallow lane's `O(depth)` `resolutionPath.includes()` scan and the deep lane's `Map` of generation marks. Sync resolution runs on a single call stack, so a binding marked on factory-enter and cleared on factory-exit is exactly path membership — detection becomes an `O(1)` field read with no hashing, no string scan, and no side table to allocate or grow. The async lane keeps its own per-path check, since async chains can interleave.

  Transient-dynamic chains that previously lost now win across the whole depth range (a 32-deep chain went from ~0.55× to ~1.8× of InversifyJS), deep chains widen their lead, and cold container builds get cheaper because there is no per-resolver cycle-tracking structure to allocate. It also fixes a latent correctness bug: because the deep lane now clears a binding's mark when its factory returns, a deep (past-threshold) transient dependency resolved twice via separate sub-branches (a diamond, not a cycle) no longer throws a false `CircularDependencyError`.

- [`f9aeeb0`](https://github.com/codefastlabs/codefast/commit/f9aeeb04a271877e47a7fbbfc6d62ae0fe1ad955) Thanks [@thevuong](https://github.com/thevuong)! - Extend the compiled-plan and memoization coverage: `toResolved(...)` transient bindings with pure-static explicit deps now compile into factory-call plans (same refusal rules and sync-only check as class plans), and name-only resolves gain a chain-versioned memo that fast-paths constants and cached singletons — predicates, aliases, and anything context-dependent keep the full selection path. Measured: `named-constant-get` ~21M → ~30M hz/op, `to-resolved-3-deps` ~39M → ~52M hz/op.

- [#643](https://github.com/codefastlabs/codefast/pull/643) [`14c3a98`](https://github.com/codefastlabs/codefast/commit/14c3a98a98ae6221df447a94afe14b2e4a147c90) Thanks [@thevuong](https://github.com/thevuong)! - Collapse the async transient-dynamic resolver into a single lane and retune the cycle-set threshold.

  The async lane used to split at depth 32 into a fast path (linear path scan, shared context, no stack frames) and a slow path (forced Set, fresh context per level, stack frames, extra microtask hop) — so context identity, `ctx.graph` contents, and promise shape all changed silently at that depth. Both are now one lane whose cycle guard goes through `enterResolutionPath`, the only mechanism that stays correct when chains interleave (`Promise.all`) and which adapts on its own: a linear scan while the path is short, an attached Set past `RESOLUTION_SET_THRESHOLD`. `DEEP_LANE_THRESHOLD` is gone from the package entirely.

  `RESOLUTION_SET_THRESHOLD` drops from 128 to 32 on fresh measurements — at 128 an async chain costs 1275 / 3641 / 9645 / 26082 ns at depth 16 / 32 / 64 / 128 versus 1202 / 3285 / 7735 / 16837 at 32, so the old value was the worse choice at every depth measured.

- [#643](https://github.com/codefastlabs/codefast/pull/643) [`14c3a98`](https://github.com/codefastlabs/codefast/commit/14c3a98a98ae6221df447a94afe14b2e4a147c90) Thanks [@thevuong](https://github.com/thevuong)! - Collapse the sync transient-dynamic resolver into a single lane and memoize each binding's resolution frame on the binding itself.

  The separate deep lane existed to escape an `O(depth)` `resolutionPath.includes()` cycle scan past ~32 levels. With cycle detection now an `O(1)` `binding.inFlight` mark there is nothing to escape, so the depth split, its shared-context bookkeeping, its reentrancy fallback, and the per-resolver frame `Map` are all gone — the smaller function also inlines better. Frames derive only from immutable binding fields, so caching one per binding replaces a `Map` lookup per hop and a `Map` insert per binding per container.

  Faster at every chain depth measured (8 → 512), e.g. a 32-deep transient chain improved ~39% and cold container build ~62%, which turns the cold-build result against Awilix from a loss into a win in the default benchmark profile.

- [#643](https://github.com/codefastlabs/codefast/pull/643) [`14c3a98`](https://github.com/codefastlabs/codefast/commit/14c3a98a98ae6221df447a94afe14b2e4a147c90) Thanks [@thevuong](https://github.com/thevuong)! - `toResolved()` and `toResolvedAsync()` now accept injection descriptors — `inject()`, `optional()` and `injectAll()` — in their dependency list, matching what `@injectable([...])` already allowed and what the builder already did at runtime (it normalizes every entry through `normalizeToDescriptor`). Previously the public signature only admitted bare tokens and constructors, so an optional or multi dependency needed a cast even though resolution handled it correctly.

  Factory arguments are typed from the descriptor: a bare token gives `Value`, `optional(token)` gives `Value | undefined`, and `injectAll(token)` gives `Array<Value>`. Widening only — existing bare-token call sites are unaffected.

- [#643](https://github.com/codefastlabs/codefast/pull/643) [`14c3a98`](https://github.com/codefastlabs/codefast/commit/14c3a98a98ae6221df447a94afe14b2e4a147c90) Thanks [@thevuong](https://github.com/thevuong)! - `unbind(token)` now drops the token's bindings in a single registry pass instead of removing them one id at a time. The previous path re-scanned and re-indexed the token's binding list once per binding — quadratic in the number of slots bound to that token — and bumped the registry version once per removal, invalidating resolver lookup caches repeatedly. Behaviour is unchanged, including deactivation of cached singletons.

## 0.5.0-canary.6

### Minor Changes

- [`4f7a188`](https://github.com/codefastlabs/codefast/commit/4f7a188a5f4a281882606f11ed660aecb9844753) Thanks [@thevuong](https://github.com/thevuong)! - Rename the `hint` resolve parameter to `options` throughout — "hint" implied optional guidance the container may ignore, but the value is a hard selection criterion (`resolve` throws `NoMatchingBindingError` when nothing matches), so the name misstated its role. Positional call sites are unaffected; the one breaking surface is `NoMatchingBindingError.hint`, now `NoMatchingBindingError.options`.

## 1.0.0-canary.7

## 1.0.0-canary.6

## 0.5.0-canary.5

## 0.5.0-canary.4

### Minor Changes

- [`4f7a188`](https://github.com/codefastlabs/codefast/commit/4f7a188a5f4a281882606f11ed660aecb9844753) Thanks [@thevuong](https://github.com/thevuong)! - Rename the `hint` resolve parameter to `options` throughout — "hint" implied optional guidance the container may ignore, but the value is a hard selection criterion (`resolve` throws `NoMatchingBindingError` when nothing matches), so the name misstated its role. Positional call sites are unaffected; the one breaking surface is `NoMatchingBindingError.hint`, now `NoMatchingBindingError.options`.

## 0.5.0-canary.3

## 0.5.0-canary.2

## 0.5.0-canary.1

## 0.5.0-canary.0

## 0.4.0

### Patch Changes

- [`2397801`](https://github.com/codefastlabs/codefast/commit/239780172d7a71c3426382ec66309ec7f39bd883) Thanks [@thevuong](https://github.com/thevuong)! - chore: align package config globs

- [`172720f`](https://github.com/codefastlabs/codefast/commit/172720f8e7a7d65d653fb9b20bbb47a770b2f713) Thanks [@thevuong](https://github.com/thevuong)! - Drop redundant type assertions in the container, resolver, decorators, and module wiring — behavior is unchanged; the types now flow without casts.

- [`e0e4aae`](https://github.com/codefastlabs/codefast/commit/e0e4aaee087057668cd1e2ef4cacc83bc4eb833f) Thanks [@thevuong](https://github.com/thevuong)! - fix: support Node 26 mirror export verification

- [`f79b333`](https://github.com/codefastlabs/codefast/commit/f79b333d0599c19028f29b9889afcbfb99db91a1) Thanks [@thevuong](https://github.com/thevuong)! - feat(dev): enable source condition for zero-rebuild HMR in apps/docs

- [`ebdf9e3`](https://github.com/codefastlabs/codefast/commit/ebdf9e396d3c3a826f05f278c93d391a0ae5ca45) Thanks [@thevuong](https://github.com/thevuong)! - feat(web): refactor theme management to color scheme system

- [`6c3ac44`](https://github.com/codefastlabs/codefast/commit/6c3ac44b7ddb9e5bcf3fbe0757e00ef86f27b513) Thanks [@thevuong](https://github.com/thevuong)! - Normalize import statement order and package.json key order repo-wide via the new oxfmt `sortImports`/`sortPackageJson` settings — purely mechanical, no runtime behavior change.

- [`8fc1299`](https://github.com/codefastlabs/codefast/commit/8fc129956d353e1e31a2c1a364792484a85a53a1) Thanks [@thevuong](https://github.com/thevuong)! - refactor(di): clarify contextual names

## 0.4.0-canary.6

## 0.4.0-canary.5

## 0.4.0-canary.4

### Patch Changes

- [#495](https://github.com/codefastlabs/codefast/pull/495) [`a66946d`](https://github.com/codefastlabs/codefast/commit/a66946d7b4f249927caea567232a9c05cd861020) Thanks [@thevuong](https://github.com/thevuong)! - Drop redundant type assertions in the container, resolver, decorators, and module wiring — behavior is unchanged; the types now flow without casts.

- [#495](https://github.com/codefastlabs/codefast/pull/495) [`fa338d6`](https://github.com/codefastlabs/codefast/commit/fa338d61fbfafb94beaa4d05d93d01e2c005cc91) Thanks [@thevuong](https://github.com/thevuong)! - Normalize import statement order and package.json key order repo-wide via the new oxfmt `sortImports`/`sortPackageJson` settings — purely mechanical, no runtime behavior change.

## 0.3.16-canary.3

### Patch Changes

- [`2a82188`](https://github.com/codefastlabs/codefast/commit/2a82188264c204b0b519b3324402ae962594d29b) Thanks [@thevuong](https://github.com/thevuong)! - feat(dev): enable source condition for zero-rebuild HMR in apps/docs

- [`bed2f30`](https://github.com/codefastlabs/codefast/commit/bed2f30df74128fe3b1a98dd9d03f6bb96099164) Thanks [@thevuong](https://github.com/thevuong)! - feat(web): refactor theme management to color scheme system

## 0.3.16-canary.2

### Patch Changes

- [`1ad2cb7`](https://github.com/codefastlabs/codefast/commit/1ad2cb73a3f6f8bff2b001e9df2f2492efd89aa2) Thanks [@thevuong](https://github.com/thevuong)! - chore: align package config globs

- [`4fda78b`](https://github.com/codefastlabs/codefast/commit/4fda78b20f98646d114cfddb09e66af609a625a2) Thanks [@thevuong](https://github.com/thevuong)! - fix: support Node 26 mirror export verification

- [`1b0df2e`](https://github.com/codefastlabs/codefast/commit/1b0df2e55140c927b7f3ba39ccdcb4cba87ec7ff) Thanks [@thevuong](https://github.com/thevuong)! - refactor(di): clarify contextual names

## 0.3.16-canary.1

## 0.3.16-canary.0

## 0.3.15

### Patch Changes

- [`8492085`](https://github.com/codefastlabs/codefast/commit/849208521571b18a3af1f36566c3111a5af01b7c) Thanks [@thevuong](https://github.com/thevuong)! - refactor(di): enhance token exports for improved usability

- [`4df6e65`](https://github.com/codefastlabs/codefast/commit/4df6e6579faf21c6dc7622eb424ad213b120dabb) Thanks [@thevuong](https://github.com/thevuong)! - chore(tsdown): remove bench exclusions and streamline configuration files

## 0.3.14

### Patch Changes

- [`4435cfb`](https://github.com/codefastlabs/codefast/commit/4435cfbf4883d018c29942aa571422bb95f73f97) Thanks [@thevuong](https://github.com/thevuong)! - refactor(di): enhance binding key generation and simplify transient binding logic

- [`5d39880`](https://github.com/codefastlabs/codefast/commit/5d398804b061eac5102730ae4121d0f6f0197590) Thanks [@thevuong](https://github.com/thevuong)! - refactor(di): update injectable decorator usage for consistency

- [`427bff6`](https://github.com/codefastlabs/codefast/commit/427bff64196ba62ccfcf1e893d93714875b7b42e) Thanks [@thevuong](https://github.com/thevuong)! - refactor(di): update predicates and improve documentation

- [`2097bf6`](https://github.com/codefastlabs/codefast/commit/2097bf6c81639506c4c7f3f8a9a0f72bdb49ea49) Thanks [@thevuong](https://github.com/thevuong)! - refactor(di): update generateDependencyGraph method for improved clarity and functionality

- [`787a8fc`](https://github.com/codefastlabs/codefast/commit/787a8fc818295bb7f7e8455ff0a7f993d7e0aab5) Thanks [@thevuong](https://github.com/thevuong)! - refactor(di): improve type safety and readability in binding selection and error handling

- [`408a9ad`](https://github.com/codefastlabs/codefast/commit/408a9ad5903eb7f1f15ebc576017d2122a18722f) Thanks [@thevuong](https://github.com/thevuong)! - refactor(di): improve binding resolution logic in DefaultContainer and BindingRegistry

- [`0720553`](https://github.com/codefastlabs/codefast/commit/0720553f01bfae88725c1688efaf608e2cf45493) Thanks [@thevuong](https://github.com/thevuong)! - feat(di): add graph adapters for visualization formats

- [`3457958`](https://github.com/codefastlabs/codefast/commit/3457958f3a90c62149b14161db92b9d763e90fd2) Thanks [@thevuong](https://github.com/thevuong)! - docs(di): add TypeDoc configuration and enhance comments for clarity

- [`4957e0e`](https://github.com/codefastlabs/codefast/commit/4957e0e8b4b2428447ef11380397b03deef0b092) Thanks [@thevuong](https://github.com/thevuong)! - fix(vitest): update test file patterns to use .test extension

- [`a78ae1d`](https://github.com/codefastlabs/codefast/commit/a78ae1d57f4fea0c7d9cfeb345e67d9fc040b0e0) Thanks [@thevuong](https://github.com/thevuong)! - refactor(di): enhance clarity and consistency in SPEC.md and examples

- [`4601be2`](https://github.com/codefastlabs/codefast/commit/4601be25746e628c7d74cebaa9ee362e80301a19) Thanks [@thevuong](https://github.com/thevuong)! - feat(di): implement fast resolution mechanism in DefaultContainer

- [`ab92dc7`](https://github.com/codefastlabs/codefast/commit/ab92dc7e5d864727bb5dcb1f2a3d08660c4112e8) Thanks [@thevuong](https://github.com/thevuong)! - refactor(di): enhance type definitions and documentation for clarity

- [`680b28d`](https://github.com/codefastlabs/codefast/commit/680b28d6fca0c5ec754967b02a994231dca0fa9f) Thanks [@thevuong](https://github.com/thevuong)! - docs(di): update README.md for clarity and structure

- [`b44597c`](https://github.com/codefastlabs/codefast/commit/b44597c9ec3a121a707aa269d7f68550ae1da72a) Thanks [@thevuong](https://github.com/thevuong)! - docs: enhance type annotations and comments for clarity across multiple files

- [`8109f4e`](https://github.com/codefastlabs/codefast/commit/8109f4e1f8186b91c296d25d640594b43493cdef) Thanks [@thevuong](https://github.com/thevuong)! - docs: update README.md files across packages for consistency and clarity

- [`568f370`](https://github.com/codefastlabs/codefast/commit/568f370143b5951fa018472ba6e882d8d599f5e7) Thanks [@thevuong](https://github.com/thevuong)! - refactor(di): enhance transient binding handling in DependencyResolver

- [`0803cd0`](https://github.com/codefastlabs/codefast/commit/0803cd04c5f12848061451d664b74fd5552eb2fb) Thanks [@thevuong](https://github.com/thevuong)! - feat(di): introduce injectAll for multi-binding resolution

- [`ea57eab`](https://github.com/codefastlabs/codefast/commit/ea57eab321f4e57361520de3d6356abf900acbf8) Thanks [@thevuong](https://github.com/thevuong)! - refactor(benchmarks): enhance binding resolution and improve transient binding handling

## 0.3.14-canary.2

### Patch Changes

- [`4435cfb`](https://github.com/codefastlabs/codefast/commit/4435cfbf4883d018c29942aa571422bb95f73f97) Thanks [@thevuong](https://github.com/thevuong)! - refactor(di): enhance binding key generation and simplify transient binding logic

- [`427bff6`](https://github.com/codefastlabs/codefast/commit/427bff64196ba62ccfcf1e893d93714875b7b42e) Thanks [@thevuong](https://github.com/thevuong)! - refactor(di): update predicates and improve documentation

- [`408a9ad`](https://github.com/codefastlabs/codefast/commit/408a9ad5903eb7f1f15ebc576017d2122a18722f) Thanks [@thevuong](https://github.com/thevuong)! - refactor(di): improve binding resolution logic in DefaultContainer and BindingRegistry

- [`4957e0e`](https://github.com/codefastlabs/codefast/commit/4957e0e8b4b2428447ef11380397b03deef0b092) Thanks [@thevuong](https://github.com/thevuong)! - fix(vitest): update test file patterns to use .test extension

- [`4601be2`](https://github.com/codefastlabs/codefast/commit/4601be25746e628c7d74cebaa9ee362e80301a19) Thanks [@thevuong](https://github.com/thevuong)! - feat(di): implement fast resolution mechanism in DefaultContainer

- [`568f370`](https://github.com/codefastlabs/codefast/commit/568f370143b5951fa018472ba6e882d8d599f5e7) Thanks [@thevuong](https://github.com/thevuong)! - refactor(di): enhance transient binding handling in DependencyResolver

- [`ea57eab`](https://github.com/codefastlabs/codefast/commit/ea57eab321f4e57361520de3d6356abf900acbf8) Thanks [@thevuong](https://github.com/thevuong)! - refactor(benchmarks): enhance binding resolution and improve transient binding handling

## 0.3.14-canary.1

### Patch Changes

- [`2097bf6`](https://github.com/codefastlabs/codefast/commit/2097bf6c81639506c4c7f3f8a9a0f72bdb49ea49) Thanks [@thevuong](https://github.com/thevuong)! - refactor(di): update generateDependencyGraph method for improved clarity and functionality

- [`0720553`](https://github.com/codefastlabs/codefast/commit/0720553f01bfae88725c1688efaf608e2cf45493) Thanks [@thevuong](https://github.com/thevuong)! - feat(di): add graph adapters for visualization formats

- [`ab92dc7`](https://github.com/codefastlabs/codefast/commit/ab92dc7e5d864727bb5dcb1f2a3d08660c4112e8) Thanks [@thevuong](https://github.com/thevuong)! - refactor(di): enhance type definitions and documentation for clarity

## 0.3.14-canary.0

### Patch Changes

- [`5d39880`](https://github.com/codefastlabs/codefast/commit/5d398804b061eac5102730ae4121d0f6f0197590) Thanks [@thevuong](https://github.com/thevuong)! - refactor(di): update injectable decorator usage for consistency

- [`787a8fc`](https://github.com/codefastlabs/codefast/commit/787a8fc818295bb7f7e8455ff0a7f993d7e0aab5) Thanks [@thevuong](https://github.com/thevuong)! - refactor(di): improve type safety and readability in binding selection and error handling

- [`3457958`](https://github.com/codefastlabs/codefast/commit/3457958f3a90c62149b14161db92b9d763e90fd2) Thanks [@thevuong](https://github.com/thevuong)! - docs(di): add TypeDoc configuration and enhance comments for clarity

- [`a78ae1d`](https://github.com/codefastlabs/codefast/commit/a78ae1d57f4fea0c7d9cfeb345e67d9fc040b0e0) Thanks [@thevuong](https://github.com/thevuong)! - refactor(di): enhance clarity and consistency in SPEC.md and examples

- [`680b28d`](https://github.com/codefastlabs/codefast/commit/680b28d6fca0c5ec754967b02a994231dca0fa9f) Thanks [@thevuong](https://github.com/thevuong)! - docs(di): update README.md for clarity and structure

- [`b44597c`](https://github.com/codefastlabs/codefast/commit/b44597c9ec3a121a707aa269d7f68550ae1da72a) Thanks [@thevuong](https://github.com/thevuong)! - docs: enhance type annotations and comments for clarity across multiple files

- [`8109f4e`](https://github.com/codefastlabs/codefast/commit/8109f4e1f8186b91c296d25d640594b43493cdef) Thanks [@thevuong](https://github.com/thevuong)! - docs: update README.md files across packages for consistency and clarity

- [`0803cd0`](https://github.com/codefastlabs/codefast/commit/0803cd04c5f12848061451d664b74fd5552eb2fb) Thanks [@thevuong](https://github.com/thevuong)! - feat(di): introduce injectAll for multi-binding resolution

## 0.3.13

### Patch Changes

- [`93b7399`](https://github.com/codefastlabs/codefast/commit/93b7399737eb2220866338da31023f95665021a0) Thanks [@thevuong](https://github.com/thevuong)! - feat(cli): enhance CLI structure and update dependencies

- [`78d25cd`](https://github.com/codefastlabs/codefast/commit/78d25cd2bacd37f623ceeceb211375d2daf93541) Thanks [@thevuong](https://github.com/thevuong)! - docs(di): update README.md for clarity and structure

- [`0542867`](https://github.com/codefastlabs/codefast/commit/054286713c242d3aa75eb7b6ad259693e266faed) Thanks [@thevuong](https://github.com/thevuong)! - feat(cli): add architecture graph and refine dependency injection

- [`c458ff9`](https://github.com/codefastlabs/codefast/commit/c458ff9806426dd664ebfbc71dc387973f2aa2ef) Thanks [@thevuong](https://github.com/thevuong)! - test(di): add comprehensive unit tests for binding-select, binding, constraints, and dependency-graph modules

- [`3d25484`](https://github.com/codefastlabs/codefast/commit/3d254841f2aad4e00d9e18da62369c659bdd88d6) Thanks [@thevuong](https://github.com/thevuong)! - refactor(di): enhance dependency graph generation and binding builder types

- [`c5727bb`](https://github.com/codefastlabs/codefast/commit/c5727bb3d739bb68a829a550471cfb9fb6152da8) Thanks [@thevuong](https://github.com/thevuong)! - feat(di): add unit tests for DefaultContainer and ScopeManager

- [`2ba60d2`](https://github.com/codefastlabs/codefast/commit/2ba60d256c93b2590984f3992d35b3d71c40d472) Thanks [@thevuong](https://github.com/thevuong)! - chore(knip): add knip configuration for dependency management

- [`45426cf`](https://github.com/codefastlabs/codefast/commit/45426cf610c09764d2a0fbae394f8b997d0a3312) Thanks [@thevuong](https://github.com/thevuong)! - refactor(di): enhance type safety in dependency resolution

- [`142cfbc`](https://github.com/codefastlabs/codefast/commit/142cfbc6a8e882824eacc14cbe84877a1c7c7d23) Thanks [@thevuong](https://github.com/thevuong)! - docs(di): expand examples in README.md for clarity and practical guidance

- [`733dafa`](https://github.com/codefastlabs/codefast/commit/733dafadff88e32a82f00d44599efbb0771b7b6a) Thanks [@thevuong](https://github.com/thevuong)! - refactor(cli): reorganize imports for clarity and consistency

- [`b8a9cca`](https://github.com/codefastlabs/codefast/commit/b8a9cca27306e0ce68bee5b47b61a49e568296ec) Thanks [@thevuong](https://github.com/thevuong)! - feat(di): introduce dependency injection package with core functionality

- [`5c5c103`](https://github.com/codefastlabs/codefast/commit/5c5c10374fdfbd480047111fc0e6b90c027f7c8d) Thanks [@thevuong](https://github.com/thevuong)! - refactor(di): enhance documentation and type annotations for clarity

- [`4248d75`](https://github.com/codefastlabs/codefast/commit/4248d75f2d547247dde937c322c2ed48d484f9e0) Thanks [@thevuong](https://github.com/thevuong)! - chore(tests): streamline test coverage commands and configurations

- [`fa53c0b`](https://github.com/codefastlabs/codefast/commit/fa53c0b361200eadf6238d633c8b181fd165acec) Thanks [@thevuong](https://github.com/thevuong)! - test(cli): add integration tests for arrange, mirror, and tag modules

- [`77c7b9c`](https://github.com/codefastlabs/codefast/commit/77c7b9c35960e7a3038185c7b9dfc2736e2868a9) Thanks [@thevuong](https://github.com/thevuong)! - refactor(di): rename DefaultContainer to Container and enhance validation logic

- [`cf7055c`](https://github.com/codefastlabs/codefast/commit/cf7055c916ea7c630a41c13a0398a00bbaa12fd5) Thanks [@thevuong](https://github.com/thevuong)! - refactor(di): improve variable naming for clarity and consistency

- [`2dd4641`](https://github.com/codefastlabs/codefast/commit/2dd464127708066e900deb42d88d6d38bd7849b2) Thanks [@thevuong](https://github.com/thevuong)! - refactor(di): replace DiError with InternalError for internal consistency

- [`453bc2e`](https://github.com/codefastlabs/codefast/commit/453bc2ec63f65fe03cb77bdcc36ccbf8ef8cb3d0) Thanks [@thevuong](https://github.com/thevuong)! - refactor(di): enhance binding builder and module API for clarity and consistency

- [`a626eb5`](https://github.com/codefastlabs/codefast/commit/a626eb58a56a73aab2e5cf79fba92e68d4080274) Thanks [@thevuong](https://github.com/thevuong)! - test(di): add comprehensive unit tests for Container and Module functionalities

- [`2340231`](https://github.com/codefastlabs/codefast/commit/23402311084871d238ec50aa23061afd4b14e61e) Thanks [@thevuong](https://github.com/thevuong)! - refactor(imports): standardize import paths across applications and benchmarks

- [`e0f6065`](https://github.com/codefastlabs/codefast/commit/e0f6065323255e2c1aa2c1e8f9c28a4b4c6e0ac2) Thanks [@thevuong](https://github.com/thevuong)! - refactor(di): standardize tag handling to use string keys only

- [`35329d5`](https://github.com/codefastlabs/codefast/commit/35329d5f17682542e3ef0907d4936fa513346a72) Thanks [@thevuong](https://github.com/thevuong)! - feat(tsconfig): enforce module detection in TypeScript configuration

- [`2fbf6a0`](https://github.com/codefastlabs/codefast/commit/2fbf6a07da06fd9383ab7c97fb69640a472fda19) Thanks [@thevuong](https://github.com/thevuong)! - refactor(di): improve error handling and serialization in dependency resolution

- [`2c156bb`](https://github.com/codefastlabs/codefast/commit/2c156bbef480aa1c7f312289f25c7dd19bb971d1) Thanks [@thevuong](https://github.com/thevuong)! - refactor(di): simplify binding API and enhance type definitions

- [`8120fd0`](https://github.com/codefastlabs/codefast/commit/8120fd034761f456e0706439172a7f50b4abfe1e) Thanks [@thevuong](https://github.com/thevuong)! - chore(di): update package.json and tsconfig.build.json for improved module resolution and type definitions

- [`1a66f91`](https://github.com/codefastlabs/codefast/commit/1a66f911632ed23bd9a6fb3f178909ef23e44ea6) Thanks [@thevuong](https://github.com/thevuong)! - refactor(di): enhance index file with additional exports and type definitions

- [`dea6bbc`](https://github.com/codefastlabs/codefast/commit/dea6bbcebaaecc09808c42b3f93e0fbf2296eb5b) Thanks [@thevuong](https://github.com/thevuong)! - refactor(di, theme): streamline imports and remove unused files

## 0.3.13-canary.4

### Patch Changes

- [`93b7399`](https://github.com/codefastlabs/codefast/commit/93b7399737eb2220866338da31023f95665021a0) Thanks [@thevuong](https://github.com/thevuong)! - feat(cli): enhance CLI structure and update dependencies

- [`78d25cd`](https://github.com/codefastlabs/codefast/commit/78d25cd2bacd37f623ceeceb211375d2daf93541) Thanks [@thevuong](https://github.com/thevuong)! - docs(di): update README.md for clarity and structure

- [`0542867`](https://github.com/codefastlabs/codefast/commit/054286713c242d3aa75eb7b6ad259693e266faed) Thanks [@thevuong](https://github.com/thevuong)! - feat(cli): add architecture graph and refine dependency injection

- [`c458ff9`](https://github.com/codefastlabs/codefast/commit/c458ff9806426dd664ebfbc71dc387973f2aa2ef) Thanks [@thevuong](https://github.com/thevuong)! - test(di): add comprehensive unit tests for binding-select, binding, constraints, and dependency-graph modules

- [`3d25484`](https://github.com/codefastlabs/codefast/commit/3d254841f2aad4e00d9e18da62369c659bdd88d6) Thanks [@thevuong](https://github.com/thevuong)! - refactor(di): enhance dependency graph generation and binding builder types

- [`c5727bb`](https://github.com/codefastlabs/codefast/commit/c5727bb3d739bb68a829a550471cfb9fb6152da8) Thanks [@thevuong](https://github.com/thevuong)! - feat(di): add unit tests for DefaultContainer and ScopeManager

- [`2ba60d2`](https://github.com/codefastlabs/codefast/commit/2ba60d256c93b2590984f3992d35b3d71c40d472) Thanks [@thevuong](https://github.com/thevuong)! - chore(knip): add knip configuration for dependency management

- [`45426cf`](https://github.com/codefastlabs/codefast/commit/45426cf610c09764d2a0fbae394f8b997d0a3312) Thanks [@thevuong](https://github.com/thevuong)! - refactor(di): enhance type safety in dependency resolution

- [`142cfbc`](https://github.com/codefastlabs/codefast/commit/142cfbc6a8e882824eacc14cbe84877a1c7c7d23) Thanks [@thevuong](https://github.com/thevuong)! - docs(di): expand examples in README.md for clarity and practical guidance

- [`733dafa`](https://github.com/codefastlabs/codefast/commit/733dafadff88e32a82f00d44599efbb0771b7b6a) Thanks [@thevuong](https://github.com/thevuong)! - refactor(cli): reorganize imports for clarity and consistency

- [`b8a9cca`](https://github.com/codefastlabs/codefast/commit/b8a9cca27306e0ce68bee5b47b61a49e568296ec) Thanks [@thevuong](https://github.com/thevuong)! - feat(di): introduce dependency injection package with core functionality

- [`5c5c103`](https://github.com/codefastlabs/codefast/commit/5c5c10374fdfbd480047111fc0e6b90c027f7c8d) Thanks [@thevuong](https://github.com/thevuong)! - refactor(di): enhance documentation and type annotations for clarity

- [`4248d75`](https://github.com/codefastlabs/codefast/commit/4248d75f2d547247dde937c322c2ed48d484f9e0) Thanks [@thevuong](https://github.com/thevuong)! - chore(tests): streamline test coverage commands and configurations

- [`fa53c0b`](https://github.com/codefastlabs/codefast/commit/fa53c0b361200eadf6238d633c8b181fd165acec) Thanks [@thevuong](https://github.com/thevuong)! - test(cli): add integration tests for arrange, mirror, and tag modules

- [`77c7b9c`](https://github.com/codefastlabs/codefast/commit/77c7b9c35960e7a3038185c7b9dfc2736e2868a9) Thanks [@thevuong](https://github.com/thevuong)! - refactor(di): rename DefaultContainer to Container and enhance validation logic

- [`cf7055c`](https://github.com/codefastlabs/codefast/commit/cf7055c916ea7c630a41c13a0398a00bbaa12fd5) Thanks [@thevuong](https://github.com/thevuong)! - refactor(di): improve variable naming for clarity and consistency

- [`2dd4641`](https://github.com/codefastlabs/codefast/commit/2dd464127708066e900deb42d88d6d38bd7849b2) Thanks [@thevuong](https://github.com/thevuong)! - refactor(di): replace DiError with InternalError for internal consistency

- [`453bc2e`](https://github.com/codefastlabs/codefast/commit/453bc2ec63f65fe03cb77bdcc36ccbf8ef8cb3d0) Thanks [@thevuong](https://github.com/thevuong)! - refactor(di): enhance binding builder and module API for clarity and consistency

- [`a626eb5`](https://github.com/codefastlabs/codefast/commit/a626eb58a56a73aab2e5cf79fba92e68d4080274) Thanks [@thevuong](https://github.com/thevuong)! - test(di): add comprehensive unit tests for Container and Module functionalities

- [`2340231`](https://github.com/codefastlabs/codefast/commit/23402311084871d238ec50aa23061afd4b14e61e) Thanks [@thevuong](https://github.com/thevuong)! - refactor(imports): standardize import paths across applications and benchmarks

- [`e0f6065`](https://github.com/codefastlabs/codefast/commit/e0f6065323255e2c1aa2c1e8f9c28a4b4c6e0ac2) Thanks [@thevuong](https://github.com/thevuong)! - refactor(di): standardize tag handling to use string keys only

- [`35329d5`](https://github.com/codefastlabs/codefast/commit/35329d5f17682542e3ef0907d4936fa513346a72) Thanks [@thevuong](https://github.com/thevuong)! - feat(tsconfig): enforce module detection in TypeScript configuration

- [`2fbf6a0`](https://github.com/codefastlabs/codefast/commit/2fbf6a07da06fd9383ab7c97fb69640a472fda19) Thanks [@thevuong](https://github.com/thevuong)! - refactor(di): improve error handling and serialization in dependency resolution

- [`2c156bb`](https://github.com/codefastlabs/codefast/commit/2c156bbef480aa1c7f312289f25c7dd19bb971d1) Thanks [@thevuong](https://github.com/thevuong)! - refactor(di): simplify binding API and enhance type definitions

- [`8120fd0`](https://github.com/codefastlabs/codefast/commit/8120fd034761f456e0706439172a7f50b4abfe1e) Thanks [@thevuong](https://github.com/thevuong)! - chore(di): update package.json and tsconfig.build.json for improved module resolution and type definitions

- [`1a66f91`](https://github.com/codefastlabs/codefast/commit/1a66f911632ed23bd9a6fb3f178909ef23e44ea6) Thanks [@thevuong](https://github.com/thevuong)! - refactor(di): enhance index file with additional exports and type definitions

- [`dea6bbc`](https://github.com/codefastlabs/codefast/commit/dea6bbcebaaecc09808c42b3f93e0fbf2296eb5b) Thanks [@thevuong](https://github.com/thevuong)! - refactor(di, theme): streamline imports and remove unused files
