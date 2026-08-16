# @codefast/di

## 0.6.2

### Patch Changes

- [#732](https://github.com/codefastlabs/codefast/pull/732) [`83704d9`](https://github.com/codefastlabs/codefast/commit/83704d96435650946f482f1236ef6633ec19d973) Thanks [@thevuong](https://github.com/thevuong)! - fix(di): reject a deps array longer than the constructor at compile time

  The deps-checking changeset closed three of the four `@injectable` mismatches and documented the fourth as the one
  TypeScript's arity rules let through: a class taking fewer parameters than `deps` declares satisfies a constructor type
  taking more, so the surplus dependency compiled, resolved, and was discarded — a latent wiring bug nothing reported. The
  deps overload now infers the class and requires `Deps["length"]` to be an arity the constructor declares, so the surplus
  is a compile error at the decorator.

  Exactly the arities the class admits stay legal: an optional trailing parameter contributes every length it declares
  (the check is against the union), and a rest parameter admits any list. `@injectable()` and `@injectable([])` keep their
  looser overload for classes that inject through accessors. The rejection and both admissions are pinned in
  `tests/types/injection-contract.test.ts` beside the three mismatches already there.

  The check only binds where the compiler knows the length: a deps **array** — built at runtime, length `number` — skips
  it, which is also the deliberate spelling for declaring more dependencies than the constructor takes (the dependency
  graph's edge declarations do exactly this). The first draft enforced arity on arrays too and was corrected by its own
  first run: it rejected a legitimate mapped-token deps list and the intentional declare-more-than-you-take shape in the
  benchmark suite.

  A literal deps tuple that compiled against the old signature only did so by carrying a dependency the class could never
  receive — fixing the declaration is deleting the surplus entry.

## 0.6.1

### Patch Changes

- [#729](https://github.com/codefastlabs/codefast/pull/729) [`a8fff29`](https://github.com/codefastlabs/codefast/commit/a8fff29aac58b6e60595de35a613795087b055ab) Thanks [@thevuong](https://github.com/thevuong)! - perf(di): settle a single-tag dependency at compile time, the named settlement's rule on the tagged lane

  A compiled plan settled a name-only dependency ahead of time and still escaped a tag-only one, though the tagged lane
  now has everything the named rule needs: criteria are interned so an index hit is exact, and the chain-walk memo gives
  the compiler a path-independent lookup to ask. A dependency carrying one tag and nothing else, whose candidate carries
  no predicate and whose slot the request satisfies, now compiles to a plain dep thunk; a predicate, a second tag, a name,
  a miss — anything whose selection could read the resolution path — escapes exactly as before, on both the sync and async
  plan lanes.

  `InstantiationPlanHost` gains `lookupPathIndependentTaggedEntry`, deliberately **optional** where the named twin's
  arrival was a breaking change: a host that does not provide it stays a valid host, and a compiler given none simply
  escapes the dependency, which is the pre-settlement behavior.

  Measured paired against the previous build, six alternating passes: the new `slot-injected-tag-compiled` row — four
  tagged constants injected into one class, mirroring the named pair — reads **4.33×** (every pass 4.13–4.61), going 5.76M
  → 24.96M hz/op and landing exactly where `slot-injected-name-compiled` and the criteria-free `plan-deps-inlined` sit,
  which is what "the criterion was the only reason it escaped" predicts. The interpreted twin and three controls hold
  parity. Eight tests mirror the named settlement's pins — the baked answer tracks rebinds, a predicate keeps runtime
  selection, an opaque factory's escape replays the tag — plus one holding a two-tag dependency on the runtime path.

- [#729](https://github.com/codefastlabs/codefast/pull/729) [`a60bcf8`](https://github.com/codefastlabs/codefast/commit/a60bcf80deeda3964b0bf2e8a6d30aeeb6dc39ab) Thanks [@thevuong](https://github.com/thevuong)! - fix(di): a `when()` chain no longer hides a helper's requirement from `validate()`

  `.when(whenParentNamed("x")).when(other)` composes one closure out of two predicates, and the composition dropped the
  unreachability requirement the name helper had recorded — the constraint stayed impossible to satisfy, `validate()` just
  could not see it, a limit the previous changeset stated outright. SPEC's rule carries no such carve-out: `validate()`
  throws `UnreachableConstraintError` when no binding declares the slot name a constraint waits for, composed or not.

  The composition site now merges both sides' requirements onto the composite predicate, and `validate()` reads the full
  list, so a requirement survives any number of `when()` narrowings and either side of the chain can contribute one.
  `constraintRequirementOf` keeps its shape and answers the first recorded requirement; the plural
  `constraintRequirementsOf` is the reader `validate()` uses. A container that previously validated clean can now throw —
  that is the documented rule holding where it silently did not.

- [#729](https://github.com/codefastlabs/codefast/pull/729) [`0ee3290`](https://github.com/codefastlabs/codefast/commit/0ee329099359352ed8870d4f8bcfcbb8f2a55126) Thanks [@thevuong](https://github.com/thevuong)! - perf(di): lend a sync escape's seed stack instead of copying it per call

  A compiled plan's escape re-enters the runtime resolver seeded with its ancestor frames, and minted a fresh
  `[...frames]` on every call because the resolver pushes and pops on the array it is given. Every sync lane pops what it
  pushes, so the owned array still holds exactly the seed when a call returns — the thunk now lends one array, the
  resolver's own root-stack rule one level down. A dirty return (length not restored) drops the array and the next call
  mints; re-entering the same thunk without a genuine cycle is impossible — every route back to the same plan node crosses
  a binding that is still in flight — so the claimed branch is a one-compare defence rather than a hot case. The async
  escape lane keeps copying: it lives across awaits, where "the call returned" and "the stack is free" are different
  moments.

  The win is bigger than removing one small allocation, and the mechanism is the context pool: a pooled resolution context
  is reused only for the array pair it already holds, so a fresh array per escape forced a fresh context per escape — the
  lent array keeps its identity across calls and the pool starts hitting. Measured paired against the previous build, six
  alternating passes, all five escape rows positive in every pass: `plan-escape-factory-dep` **1.41×** (1.331–1.460),
  `plan-escape-scoped-dep` **1.23×**, `plan-escape-optional-dep` **1.14×**, `plan-escape-hooked-dep` **1.12×**,
  `plan-escape-multi-dep` **1.11×**; the no-escape `plan-deps-inlined` control holds parity and
  `realistic-graph-resolve-root`, whose root plan escapes once for a singleton materialization, reads 1.03×. A new test
  pins that a throwing escape leaves the thunk reusable.

- [#729](https://github.com/codefastlabs/codefast/pull/729) [`12186d6`](https://github.com/codefastlabs/codefast/commit/12186d698b57a491a7b99d63750ff83199772f35) Thanks [@thevuong](https://github.com/thevuong)! - perf(di): a one-entry cache in front of `TagKey.of()`, narrowing the inline-criterion gap

  The tag-interning changeset recorded that an inline `.of(v)` stayed behind a hoisted criterion because every call reads
  the intern map, and that the gap had widened rather than closed. An inline call site usually repeats one value, so
  `of()` now keeps its last `(value, pair)` and answers a repeat before touching `internKeyFor` or the map. The check is
  `Object.is` — the comparison the slot contract already defines — so ±0 stay distinct and `NaN` hits itself, with no
  special-casing.

  Measured paired against the previous build, six alternating passes on rows whose A/A floor is the suite's widest:
  `slot-tag-shorthand-inline` **1.07×** (six of six passes positive, 1.040–1.124) and `slot-tag-array-inline` **1.07×**
  (five of six), while both hoisted rows — which never call `.of()` in the loop — sit at parity, doubling as the proof the
  source swap was live. Hoisted stays the fast spelling, as it must: it pays zero calls.

- [#729](https://github.com/codefastlabs/codefast/pull/729) [`aa76f4d`](https://github.com/codefastlabs/codefast/commit/aa76f4d0559004337f4c0a0aa89b434c26a78d3c) Thanks [@thevuong](https://github.com/thevuong)! - perf(di): memoize the single-tag chain walk, with a deferred map so a per-request child does not pay for it

  A single-tag `resolve` was the one criteria lane that consulted each container's tag index on the way up on **every**
  call — `defaultEntry` and `namedEntry` already memoized their walks, and ARCHITECTURE carried the question as open,
  waiting on a fresh-vs-warm measurement. That measurement (RESULTS.md, 2026-08-16): the memoized name lane answered the
  same parent-owned shape at ~2.1× the unmemoized tag lane, warm; the memo's per-container state cost ~5–8% at duty cycle
  1 and amortized before N=4.

  `BindingLookupCache` gains `taggedEntry(token, tag)` — chain-versioned like `namedEntry`, `null` meaning "this shape
  needs full selection", predicate- and alias-carrying hits declined so a `when()` is still evaluated on every resolve —
  and `resolve()` gains the tagged twin of its name-only fast lane, dispatching just the shapes whose semantics involve no
  resolution context (plain constants, cached singletons). The memo key is the criterion object itself: interning makes
  identity the slot contract's own `Object.is`, so ±0 stay split and no indexed hit needs a value re-check.

  The first cut mirrored `namedEntry` exactly and failed its own gate: `fresh-child-tag-n1` — one tagged resolve inside a
  child that then dies — read 0.861 across six negative passes, and the whole cost was the inner-map allocation on a
  container that never asks twice. So the first `(token, tag)` shape a cache generation sees is answered from the walk and
  parked in a one-entry front; the map is not written until a second distinct shape appears, and an alternating pair
  converges after one extra walk per key.

  Measured paired against the previous build, six alternating passes, medians: `slot-tag-parent-owned` **2.78×** (every
  pass 2.73–2.95), `slot-tag-shorthand-hoisted` **2.14×**, `tagged-binding-resolve` **1.98×** (a head-to-head row),
  `fresh-child-tag-n4` **1.24×**, with the must-hold `fresh-child-tag-n1` at 0.98 (0.933–1.072, inside that row's floor)
  and the name-lane and multi-tag controls at parity. Seven new tests pin the memo's invalidation and its refusals:
  rebind/unbind in both request spellings, a parent rebind observed from a child, a predicate beside the tag, a late
  container-level activation hook, and a warmed `+0` criterion refusing `-0`.

## 0.6.0

### Minor Changes

- [#727](https://github.com/codefastlabs/codefast/pull/727) [`9182664`](https://github.com/codefastlabs/codefast/commit/91826641f284ebf8e7bfcdbdcb3aaf73f77381cb) Thanks [@thevuong](https://github.com/thevuong)! - perf(di): compile statically-visible graphs entering resolveAsync into async plans

  A transient `class`/`resolved`/`resolved-async` binding resolved by `resolveAsync` at a true root (no open cascade) now
  compiles once into a plan, like the sync lane has always done — the graph is declared up front, so nothing about it
  needs per-level bookkeeping. A fully synchronous subtree executes without touching a promise; nodes that may yield one
  await their dependencies together, exactly as the interpreted path does (promise-valued constants unwrap, siblings start
  before the first rejection propagates). `dynamic-async` factories stay opaque and keep the cascade lane. Escapes replay
  the async dispatch seeded with the plan's ancestors, so cycles, criteria and hooks behave as if nothing had compiled.
  Diagnostics gain `compiledAsyncPlanCount`.

- [#690](https://github.com/codefastlabs/codefast/pull/690) [`ed1387c`](https://github.com/codefastlabs/codefast/commit/ed1387c7be719ece9a271993834dd23347b5bf6e) Thanks [@thevuong](https://github.com/thevuong)! - Fix `toResolved` bindings on the async path, and tighten the type surface.

  `bind(T).toResolved(factory, deps)` threw `InternalError: resolved binding requires resolution context` from every async
  entry point — `resolveAsync`, `resolveAllAsync`, `resolveOptionalAsync`, and any `toDynamicAsync` factory awaiting one.
  `requiresResolutionContext()` answers only for the two factory kinds that are handed a context, so a `resolved` binding
  legitimately arrives with none; the guard that rejected it never read the context it demanded. The sync lane never had
  it.

  Type-surface changes, all verified type-identical or strictly wider:

  - Optional properties on the public option bags — `ResolveOptions`, `InjectOptions`, `InjectableOptions`, `GraphOptions`
    — are now `?: T | undefined`. Under `exactOptionalPropertyTypes` the old `?: T` rejected a caller holding
    `T | undefined`, which is the shape a real call site has.
  - `BindingConstraint` is exported: the `(ctx: ConstraintContext) => boolean` that `when()` takes and every `when*`
    helper returns now has a name instead of fourteen inline spellings.
  - `ParamMetadata` and `InjectionDescriptor` extend `DependencySlot`, and the dependency-graph builder uses it directly,
    so the one shape both dependency sources normalise to is enforced by the compiler rather than by four declarations
    that happened to match.
  - `PartialBinding` is derived from `Binding` by a distributive `Omit`, so a new binding kind cannot join one union and
    miss the other.
  - The inert `const` modifier is gone from type parameters inferred from a token rather than a literal; the four on
    `toResolved`/`toResolvedAsync`, where `deps` is an array literal, stay.

- [#703](https://github.com/codefastlabs/codefast/pull/703) [`4ceccf2`](https://github.com/codefastlabs/codefast/commit/4ceccf2656ca626215093b85c4111ef8e195c1fd) Thanks [@thevuong](https://github.com/thevuong)! - A chain's `when()` calls now narrow rather than replace. SPEC defines a candidate as a binding that passes **all** of a
  chain's `when(ctx)` predicates, and §5.4 describes a binding as carrying "one or several constraints combined"; the
  chain's type says the same by returning `this`. Only the implementation disagreed, and it did so silently — `#reslot`
  overwrote the predicate field, so the first condition was discarded and never called.

  The consequence was worse than a binding being more permissive than written. Specificity prefers a binding that carries
  a predicate, so a discarded first condition made the constrained binding beat the default one:

  ```ts
  container
    .bind(Logger)
    .to(ConsoleLogger)
    .when((ctx) => ctx.parent !== undefined) // never consulted
    .when((ctx) => ctx.parent?.scope === "singleton");
  ```

  Nothing reported it — not at bind time, not at resolve time, not from `validate()`. A service that should have received
  the default logger received the constrained one instead.

  `whenTagged()` already accumulated, which is what made this a trap rather than a quirk: two adjacent methods with the
  same chaining syntax and the same `this` return type, one combining and one replacing.

  Binding-level `onActivation()` and `onDeactivation()` keep replacing. That reading is pinned by a test and is reasonable
  for reconfiguring a chain held in a variable, even though the chained spelling reads as combination and the
  container-level hooks accumulate. Changing it is a separate decision from this one.

- [#708](https://github.com/codefastlabs/codefast/pull/708) [`957f438`](https://github.com/codefastlabs/codefast/commit/957f4385612d068162e82f134ec8d995e0819834) Thanks [@thevuong](https://github.com/thevuong)! - A compiled plan now settles a name-only dependency at compile time instead of escaping to the runtime for it. A
  dependency escaped as soon as it carried any criterion, before anything tried to look it up — yet `whenNamed` writes the
  binding's slot name rather than a predicate, so a name-only request is usually a plain hit in the registry's named
  index, and that index is already memoized on the same registry version the plan cache is keyed on. Four named constants
  injected into one class stop escaping and become four `() => value` thunks.

  The row that measures exactly that shape, `slot-injected-name-compiled`, reads **4.06×** the previous build, paired and
  alternating over twelve passes with every pass above 3.87×, while its interpreted twin and eleven control rows hold
  parity. Allocation on the same shape falls from 1260 to 366 scavenges per 2M resolves — level with the criteria-free
  plan of the same arity, so the compiled lane no longer allocates more than the interpreted path it exists to beat.

  Selection is only baked in when it cannot depend on the resolution path: the candidate must carry no predicate and its
  slot must match the request. A predicate reads the path, so it stays the runtime's to evaluate, and anything else — a
  tag, a miss, an ambiguous name — escapes exactly as before.

  `InstantiationPlanHost` gains `lookupPathIndependentNamedEntry`. **Breaking** for anything implementing that interface
  directly, which the package exposes on the `./resolution/plan/instantiation-plan` subpath.

- [#704](https://github.com/codefastlabs/codefast/pull/704) [`44dd4a3`](https://github.com/codefastlabs/codefast/commit/44dd4a3cfa886fdf43debc708d6ede9505d71ea5) Thanks [@thevuong](https://github.com/thevuong)! - `toConstantValue(...).onDeactivation(...)` now runs, and `validate()` reports a hook that can never run.

  SPEC §3.4 names `toConstantValue` as one of the two things deactivation applies to ("treat as singleton"), and
  `ConstantBindingBuilder` offers `onDeactivation` in the type. The hook was never called.

  What made it hard to spot is that it worked whenever an activation hook happened to sit beside it:

  ```ts
  container
    .bind(Pool)
    .toConstantValue(pool)
    .onDeactivation((p) => p.end()); // silent
  container
    .bind(Pool)
    .toConstantValue(pool)
    .onActivation((_ctx, p) => p) // unrelated
    .onDeactivation((p) => p.end()); // now it fires
  ```

  The resolver's plain-constant fast path returns `binding.value` with no pipeline, and it decides that on activation
  alone — but the step it skips is what records the binding as a cached singleton, and that recording is what teardown
  iterates. An activation hook disables the fast path, so the deactivation starts working for a reason that has nothing to
  do with it. `dispose()`, `unbind()`, `unbindAll()` and module `unload()` were all affected.

  Teardown now finds a constant through the registry instead of relying on that recording. A container that has never held
  a constant skips the sweep, so teardown cost is unchanged where there is nothing to find.

  **A constant deactivates whether or not anything resolved it.** A singleton only exists after its first resolve, so an
  unresolved one has nothing to deactivate; a constant is the opposite — the value is handed in at bind time and exists
  from then on. Making the hook depend on whether someone happened to resolve it would make teardown depend on resolution
  order. If the value was activated, the hook receives the activated value rather than the bound one.

  ### `validate()` reports an unreachable hook

  Container-level hooks are keyed by token identity, so a class used only as an implementation target matches nothing:

  ```ts
  container.bind(LoggerToken).to(ConsoleLogger);
  container.onDeactivation(ConsoleLogger, (l) => l.flush()); // keyed by the class — never runs
  ```

  `validate()` now throws `UnreachableLifecycleHookError` when a container-level hook's token is bound in neither this
  container nor any ancestor. Registering a hook before its binding stays valid — the check runs at `validate()`, not at
  registration — and a hook for a parent-owned token is accepted, since the child resolves through it.

  ### Not changed

  `transient`, `scoped` and `toAlias` bindings still have no deactivation, and this is not a gap:
  `TransientBindingBuilder`, `ScopedBindingBuilder` and `AliasBindingBuilder` do not expose `onDeactivation` at all, so
  the compiler rejects it. They appear to accept one only under a runtime that skips type-checking.

- [#706](https://github.com/codefastlabs/codefast/pull/706) [`8dfac73`](https://github.com/codefastlabs/codefast/commit/8dfac73fd4278c94bfe20f1554ce3f06c62445ac) Thanks [@thevuong](https://github.com/thevuong)! - Two constraints that could never hold are now reported instead of quietly resolving to the default binding.

  `whenParentTaggedAll([])` reads as a requirement but matches every parent — "carries all of no criteria" is vacuously
  true, so the constraint silently weakens to "has a parent at all", and specificity still ranks it above an unconstrained
  binding. Both `…TaggedAll` helpers now throw `EmptyTagCriteriaError` at the call site. An empty list is what a filtered
  array or an absent config produces, which is exactly when nobody is watching.

  `whenParentNamed("typo")` waits on a bare string, so a misspelling produces a constraint nothing can satisfy, with no
  error at bind time, at resolve time, or from `validate()`. The name helpers now record what they wait for on the
  predicate itself, and `validate()` throws `UnreachableConstraintError` when no binding in the container or its ancestors
  declares that slot name.

  Neither touches resolution: the criteria check runs where the helper is called, and the name check runs inside
  `validate()`. The requirement rides on the predicate under a symbol that resolution never reads.

  One limit, stated because it is easy to assume otherwise: chaining `.when(whenParentNamed("x")).when(other)` composes a
  new closure, and the requirement does not survive that. The constraint is still unreachable; `validate()` just cannot
  see it.

- [#681](https://github.com/codefastlabs/codefast/pull/681) [`4a29f20`](https://github.com/codefastlabs/codefast/commit/4a29f2086dd7ad8e9d3a1e429470776478af668c) Thanks [@thevuong](https://github.com/thevuong)! - A custom `MetadataReader` can now actually reach resolution, and the ambient container is public API:

  - **`Container.create({ metadataReader })`** — new `ContainerOptions`. A container hands its reader to the resolver it
    builds in its constructor, so a `MetadataReaderToken` binding on that same container was always too late: resolution
    kept the decorator reader and any undecorated class threw `MissingMetadataError`, while
    `validate()`/`inspect()`/`generateDependencyGraph()` re-read the token and honoured it — the two halves disagreed. The
    option is in place before the resolver exists and is inherited by children; the binding path still works in its one
    working shape (bound on a parent, used from a child).
  - **One container, one reader.** That asymmetry is gone rather than documented: a container now answers every question —
    resolve, `validate()`, `inspect()`, `generateDependencyGraph()`, `unbind*` — with the reader its resolver was built
    with, so introspection cannot describe a class differently from how it is instantiated. As a side effect those paths
    no longer re-scan the registry for `MetadataReaderToken` on every call.
  - **`runWithContainer` / `getActiveContainer` are exported from the root entry**, alongside the metadata pieces needed
    to write a reader without reaching for subpaths: `defaultMetadataReader`, `SymbolMetadataReader`, and the
    `ConstructorMetadata` / `LifecycleMetadata` / `ParamMetadata` types. `toMermaidGraph` joins the other graph adapters
    on the barrel.
  - **A `MetadataReader`'s answer is verified, not trusted.** The seam returned `ConstructorMetadata` by cast, so a
    hand-written reader that forgot `params` produced a bare `TypeError` from the plan compiler — no `code`, no class name
    — while `validate()` passed the same container because its cold path defended with `?? []`. New `InvalidMetadataError`
    names the class and the defect. A supplied reader is wrapped once at container construction so resolve, `validate()`
    and `generateDependencyGraph()` all see verified answers; the decorator reader writes the metadata it later reads, so
    a container that supplies none is left on the path it always took.
  - **Fix: `MissingContainerContextError` named the accessor where it meant the class.** Constructing a class with
    `@inject` accessors outside a container context reported `Class 'clock' … container.resolve(clock)` instead of the
    class it was told to name (SPEC §7.5 already specified the class). The error now carries
    `className: string | undefined` and `accessorName: string | symbol` instead of a single flattened `targetName`, and
    phrases itself accordingly — the word "Class" leaves the sentence when there is no class to name. **Breaking:**
    `targetName` is gone from this error.
  - New examples `18-ambient-container` and `19-custom-metadata-reader`; SPEC §6.1, §6.11, §7.4 and §7.5 updated.

- [#727](https://github.com/codefastlabs/codefast/pull/727) [`4d472a6`](https://github.com/codefastlabs/codefast/commit/4d472a68b5629f2fba034dae95f302c5db5cb437) Thanks [@thevuong](https://github.com/thevuong)! - fix(di)!: keep a factory's ctx on its own resolution path across a nested top-level resolve

  The depth-indexed sync context pool reused a pooled context by resetting it onto whatever array pair the next
  acquisition carried. A nested `container.resolve()` inside a factory mints its own path arrays and reaches the same
  depth as the frame still holding that pooled context, so the outer factory's `ctx` was silently re-pointed at the nested
  resolve's arrays — `ctx.resolve` then evaluated `when()` predicates against an empty ancestor chain and selected the
  wrong binding, and `ctx.graph` reported an empty path. A pooled context is now reused only for the array pair it already
  holds; a mismatch mints a fresh context, and only the resolver's two stable pairs may claim a pool slot.

  Breaking (type/API surface, no behavioral change for correct programs):

  - `ConstraintContext.currentResolveOptions` is now `Readonly<ResolveOptions>` — the object was already frozen at
    runtime, so a write through it always threw; it is now a compile error.
  - `ScopeManager.hasScoped`/`getScoped` are removed — dead since `readScoped` replaced the two-read shape.
  - Diagnostics getters renamed for role: `BindingRegistry.isBuilt` → `isNamedIndexBuilt`/`isTaggedIndexBuilt` (the tagged
    index was previously unobservable), `ScopeManager.isBuilt` → `isScopedCacheBuilt`, `LifecycleManager.isBuilt` →
    `isActivationTableBuilt`. `builtSubsystems` now also reports `registry.taggedIndex`.
  - `TagKeyMask` is exported from the package root.

- [#680](https://github.com/codefastlabs/codefast/pull/680) [`c415c6b`](https://github.com/codefastlabs/codefast/commit/c415c6bd9466421419fd7d97445fb29f76257d95) Thanks [@thevuong](https://github.com/thevuong)! - `generateDependencyGraph` now tells the whole wiring story instead of an approximation of it:

  - **Optional dependencies are visible.** A bound optional dependency's edge carries an `optional` label; an unbound one
    now points at an `unbound:<token>` placeholder node (`kind`/`scope`: `"unbound"`) instead of silently disappearing —
    "optional and absent" is no longer indistinguishable from "not a dependency".
  - **Multi-bindings fan out.** An `injectAll(...)` dependency draws an edge to every binding of the token, not just the
    first.
  - **Class-constructor edges use slot labels.** A named or tagged constructor dependency is labeled `name:...`/`tag:...`
    like resolved-factory deps always were, and edge targets are filtered with the same slot-matching rules resolution
    uses (`matchesSlot`, SPEC §6.9) — an unnamed request no longer draws an edge to a named binding it could never
    resolve.
  - **`includeParent` connects across the chain.** A child binding whose dependency is satisfied by the parent now gets
    its edge (own bindings still shadow the parent, mirroring resolution's upward walk).

  `GraphNode["scope"]` widens from `BindingScope` to `BindingScope | "unbound"` for the placeholder nodes.

- [#727](https://github.com/codefastlabs/codefast/pull/727) [`a4377ff`](https://github.com/codefastlabs/codefast/commit/a4377ff1a2afd5c83a865ce38a93a8573582ffb6) Thanks [@thevuong](https://github.com/thevuong)! - **Breaking:** removed `isToken()`. The guard tested for an object carrying a string `name`, which every `Token` has but
  so does anything else — an `InjectionDescriptor` that named its slot passed it, as did any plain `{ name }` object. A
  `Token` is a branded structural type with nothing to check at runtime, so the predicate could not be made sound; it
  narrowed to `Token<unknown>` on evidence that did not support the claim. Nothing in the package used it.

  Discriminating a declared dependency is what `isInjectionDescriptor()` is for, and it stays. Code that called
  `isToken(x)` to tell a token from a class wants `typeof x === "function"` instead.

- [#690](https://github.com/codefastlabs/codefast/pull/690) [`f4b1aa6`](https://github.com/codefastlabs/codefast/commit/f4b1aa6335f535574eae5cf559b81a568f5a7a30) Thanks [@thevuong](https://github.com/thevuong)! - Report the failures that were being swallowed or mislabelled, and derive the types the build emits.

  `@codefast/di`:

  - `@inject`, `@postConstruct` and `@preDestroy` on a static member now throw `StaticMemberDecoratorError` instead of
    `InternalError`. All three act on one instance, so this is caller misuse — and `InternalError` means the library
    broke, which sent anyone catching it to file a bug against their own mistake. SPEC §10 already recorded that mistake
    for predicate ambiguity.
  - `AsyncResolutionError` names the token the caller asked for and the token whose factory is async, which is what SPEC
    has always specified. Every throw site passed the same token twice, so the message read "Token 'X' requires async
    resolution because 'X' in its dependency chain has an async factory"; a `resolve(App)` that fails on an async
    `Database` now says so. `asyncSourceToken` defaults to `tokenName` for the case where the requested binding is itself
    the source.
  - A `MetadataReader` that names a `@postConstruct`/`@preDestroy` method the instance does not have raises
    `InvalidMetadataError` instead of skipping the hook — a hook that silently never runs is the failure a caller cannot
    see. `InvalidMetadataError`'s message no longer says "constructor", since it now covers both answers; the specifics
    moved into `reason`.
  - `MissingScopeContextError` from `ScopeManager` names its token instead of `"(unknown)"`, and the scoped read takes one
    map lookup where it took two.
  - `Token`, `Constructor` and `InjectionDescriptor` declare `out Value`, so the compiler checks the covariance the engine
    already relied on.

  Repo-wide: `isolatedDeclarations` is on for every package that emits declarations, so a public type can always be
  written down from the source file alone. `allowJs` is gone from the shared base config — no package has JavaScript
  sources. `@codefast/theme` and `@codefast/tracking` gained explicit annotations on four exported constants to satisfy
  it; the emitted types are unchanged. `@codefast/ui` and `@codefast/benchmark-viewer` opt out for reasons recorded in
  their configs.

- [#727](https://github.com/codefastlabs/codefast/pull/727) [`50448de`](https://github.com/codefastlabs/codefast/commit/50448defd0c94bffe9b824afef46aa42d80114e2) Thanks [@thevuong](https://github.com/thevuong)! - perf(di)!: freeze slot tags where they are built so snapshots alias instead of copy

  `BindingSnapshot.slot.tags` is now the binding's own frozen array rather than a fresh copy per snapshot per binding —
  `lookupBindings()`/`inspect()` skip an allocation per binding, reclaiming the cost the defensive copy had added. The
  array is frozen at its two construction sites (the default slot and the builder's re-tag), so the registry stays
  uncorruptible.

  Breaking: mutating a snapshot's `tags` array — already a type error against `ReadonlyArray` — now throws `TypeError` at
  runtime instead of silently editing a private copy.

- [`08a5f2d`](https://github.com/codefastlabs/codefast/commit/08a5f2d6425960d7674b257196962009ab6279dd) Thanks [@thevuong](https://github.com/thevuong)! - Publish every module as an entry point again — the sole-consumer repo prefers full access over encapsulation. The 0.5.0
  surface reduction (13 subpaths) is reverted: `resolution/*`, `registry`, `container/*`, `binding`, `constructor-type`,
  and the `metadata` internals are entry points once more. Introspection modules keep the flat specifiers they have always
  shipped under (`./inspector`, `./dependency-graph`, `./graph-adapters/*`).

- [#680](https://github.com/codefastlabs/codefast/pull/680) [`c415c6b`](https://github.com/codefastlabs/codefast/commit/c415c6bd9466421419fd7d97445fb29f76257d95) Thanks [@thevuong](https://github.com/thevuong)! - The dependency graph states its facts as fields instead of hiding them in a display string. `GraphEdge` gains
  `optional: boolean` and `slotName?: string`, so a consumer reads what an edge means rather than parsing `label` (which
  stays, as the string the adapters render). `GraphNode` gains `tokenKey`: two tokens that share a display name are now
  distinguishable, and the same token keeps its key across graphs from the same process — enough to key a view by, which
  `tokenName` never was.

  `GraphNode["kind"]` is now `BindingKind | "unbound"` instead of a bare `string`, alongside the already-widened `scope`,
  and the React Flow and Cytoscape adapters carry those same unions (plus `tokenKey`, `optional`, `slotName`) instead of
  flattening them to `string` — a consumer can narrow on them now. SPEC.md now documents what the graph does and does not
  represent: unbound optional placeholders, omitted required-but-unbound deps, `injectAll` fan-out, slot-filtered targets,
  unevaluated predicates, and parent shadowing under `includeParent`.

- [#688](https://github.com/codefastlabs/codefast/pull/688) [`3112841`](https://github.com/codefastlabs/codefast/commit/31128417f8ac1212c2861df0e1270ba818324e31) Thanks [@thevuong](https://github.com/thevuong)! - `inject()`, `optional()` and `injectAll()` accept the single-tag shorthand. `container.resolve(Token, { tag: pair })`
  has always been valid while `inject(Token, { tag: pair })` was a compile error, so the same request had two vocabularies
  depending on whether you were asking a container or declaring a dependency — and the one a constructor dependency had to
  use was the longer one.

  `InjectOptions` gains `tag`, and that is the whole surface change. Nothing downstream learns a second spelling: the
  shorthand is folded into `tags` where the descriptor is built, so `InjectionDescriptor`, `ParamMetadata`, the plan
  compiler and the dependency graph keep seeing exactly one tag list. Passing both is a request for every pair across the
  two, which is what the matcher already did with them.

  While that path was open: an `@inject` accessor was rebuilding its resolve options on **every constructed instance**,
  from the raw options rather than from the descriptor. It now derives them once, from the descriptor — so the accessor
  honours the shorthand for free, and stops allocating per instance.

  Measured against the previous build on the bind and boot rows, paired and alternating: parity everywhere, controls
  clean.

- [#702](https://github.com/codefastlabs/codefast/pull/702) [`22a02b8`](https://github.com/codefastlabs/codefast/commit/22a02b8604e932550474297c8d86fed161385237) Thanks [@thevuong](https://github.com/thevuong)! - What a constructor and a factory are handed is now checked against what they declare.

  `@injectable([...])` had no relation to the class it decorated. Deps in the wrong order compiled and injected the wrong
  dependency; a deps array one short compiled and handed a parameter `undefined`; `injectAll()` handed an array to a
  parameter declaring one value, and `optional()` handed `undefined` to one that did not admit it. Every case failed
  silently — resolution succeeded, the object was built, and the wrong value was already inside it.

  The decorator now infers its deps and requires the class to match:

  ```ts
  @injectable([ConfigToken, LoggerToken]) // Property 'log' is missing in type 'Config'
  class Service {
    constructor(
      readonly logger: Logger,
      readonly config: Config,
    ) {}
  }
  ```

  `@injectable()` and `@injectable([])` are unchanged — a separate overload keeps the no-dependency form as loose as it
  was, for classes that inject through properties.

  One mismatch still compiles: a deps array **longer** than the constructor, because a class taking fewer parameters
  satisfies a constructor type taking more. The surplus dependency is resolved and discarded rather than misplaced, which
  makes it the least harmful of the four.

  Alongside it, a hand-written `InjectionDescriptor` no longer lies to a `toResolved` factory.
  `{ token: Plugin, multi: true }` said `Plugin` and delivered `Array<Plugin>`; `optional: true` said `Plugin` and could
  deliver `undefined`. `ResolvedDependencyValue` reads the flags before the descriptor's own type parameter, so both now
  say what they do. `injectAll()` and `optional()` were already correct and are untouched.

  The tightening found real looseness in `examples/17-extended-constraints` immediately: thirteen tokens were declared by
  structural shape — `token<{ score(): string }>` — while the constructors receiving them declared the concrete class,
  which has private members and is therefore a different type. Every one of those tokens is bound to exactly that class,
  so they now say so.

- [#680](https://github.com/codefastlabs/codefast/pull/680) [`c415c6b`](https://github.com/codefastlabs/codefast/commit/c415c6bd9466421419fd7d97445fb29f76257d95) Thanks [@thevuong](https://github.com/thevuong)! - New `toMermaidGraph` adapter (`@codefast/di/graph-adapters/mermaid`): renders a container graph as Mermaid
  `flowchart TD` source — viewable anywhere Mermaid renders (GitHub markdown, docs tooling, mermaid.live) with no extra
  library. Parent-chain nodes and unbound-optional placeholders carry dashed `classDef`s; `toDotGraph` now also dashes
  unbound placeholders, not just parent nodes.

- [#727](https://github.com/codefastlabs/codefast/pull/727) [`def51b4`](https://github.com/codefastlabs/codefast/commit/def51b4dea15700b8ad7add488247f2d34147f41) Thanks [@thevuong](https://github.com/thevuong)! - perf(di)!: derive resolution-path names from frames instead of carrying a second array

  Every hop used to push and pop two lockstep arrays — token names for error messages and frames for cycle detection. The
  name array is gone: cycle guards, branch extension, escapes, contexts and the cascade carry only the frame stack, and
  the names an error or `ctx.graph.resolutionPath` reports are derived from the frames at the moment they are asked for.
  Hot lanes pay one push/pop per hop instead of two; only error paths pay the name materialization.

  Breaking (internal-module surface; the root export is unchanged):

  - `ResolverCallbacks` and the resolution-path helpers take only the frame stack — `enterResolutionPath(stack, frame)`,
    `extendResolutionBranch(stack, depth, frame)`; `OwnedBranchPath` and `extendResolutionStackBranch` are gone
    (`OwnedBranchStack` is the one brand).
  - `DependencyResolver.rootPath` is gone; the lending protocol reads `rootStack` alone.
  - `ConstraintContext.resolutionPath` is now derived per read from `resolutionStack` — contents are identical, but it is
    no longer the same array object across reads.

- [#708](https://github.com/codefastlabs/codefast/pull/708) [`801c749`](https://github.com/codefastlabs/codefast/commit/801c7496ec0d7899c98d94bbbb9677005710f91b) Thanks [@thevuong](https://github.com/thevuong)! - A dependency slot that carries a name or a tag no longer rebuilds its `ResolveOptions` on every hop. The criteria are
  fixed when the slot is declared, so the derived options are too; they are now built once and memoized on the slot
  itself, which is sound to share across containers because they derive from the slot alone. A slot carrying no criterion
  answers from its two fields without calling the builder at all, so the common shape never reaches the memo. A frozen
  slot — which a custom `MetadataReader` may hand out — keeps rebuilding rather than throwing.

  The memoized object is frozen, because sharing it has a consequence: a constraint predicate is handed it as
  `currentResolveOptions`, and `ResolveOptions` declares mutable fields, so a write through that reference would rewrite
  what the dependency asks for on every later resolve. Frozen, the attempt throws where it is made. Paired A/B over six
  rows and twelve passes puts the freeze inside noise — the control that cannot be affected by it moved as much as the row
  that can.

  `resolveOptionsForSlot` and the `DependencySlot` type are exported, so the memoizing form is reachable and the slot it
  takes has a name a consumer can write down.

  This is an allocation change, not a throughput one, and the distinction is worth stating because only one lane ever
  paid. A compiled plan already derives a criteria-carrying param's options at compile time and captures them in its
  escape thunk; the interpreted path had no such moment, so it minted an options object per hop, per resolve. Counted as
  scavenges per 2M resolves under a 1 MB young generation
  (`pnpm --filter @codefast/benchmark-di-inversify instrument:alloc`), a four-named-dependency class whose plan is
  declined went 870 → 442, landing exactly on the criteria-free control's 443, while the compiled lane sat at 1260 on both
  builds. A paired benchmark A/B across all 65 rows reads flat — correctly, since none of them injected a
  criteria-carrying dependency until two rows were added for the lane.

- [#690](https://github.com/codefastlabs/codefast/pull/690) [`3bcb204`](https://github.com/codefastlabs/codefast/commit/3bcb2041e6e154b5fbd3a55a75161a614ce96b77) Thanks [@thevuong](https://github.com/thevuong)! - `src/` is reorganised by dependency direction, temperature and lane. **Breaking for deep subpath imports only** — the
  root entry `@codefast/di` and the four `@codefast/di/graph-adapters/*` specifiers are unchanged, and nothing else in
  this repo imported a deep specifier.

  - **`core/`** now holds the model — `token`, `types`, `constructor-type`, `binding`, `binding-scope`, `registry`,
    `module` — instead of sitting loose beside `index.ts`, so the layering the architecture test enforces is visible in
    the tree rather than only in prose.
  - **`errors/`** separates the taxonomy from its diagnostics. The hot path imports error constructors and nothing else;
    message building belongs behind the throw, which is what the measured cost of a deeper throw site already said.
  - **`injection/`** is new, and it closes a real inversion: `core/binding.ts` and `metadata/metadata-types.ts` imported
    `InjectionDescriptor` from `decorators/inject.ts` — the model depending on a decorator module, which passed the
    layering test only because the imports are type-only. The descriptor, its normalisers and the two pure builders
    (`optional`, `injectAll`) now live at the model layer; `decorators/inject.ts` keeps the one symbol that is actually a
    decorator. `resolve-options` moves alongside, so `DependencySlot` and the descriptor it derives from are in one place.
  - **`ambient/`** takes the module-global active container out of `resolution/environment.ts`, which had been carrying
    three unrelated jobs. The remainder is renamed `resolution/context.ts`, which is what it is.
  - **`lifecycle/`** promotes `LifecycleManager` and `ScopeManager` out of `resolution/`, and
    **`resolution/{cache,path,plan,select}/`** groups the engine's collaborators by the lane each one serves.

  Renamed specifiers: `./binding`, `./constructor-type`, `./module`, `./registry`, `./token`, `./types` → `./core/*`;
  `./errors` → `./errors/errors`; `./resolution/binding-scope` → `./core/binding-scope`; `./resolution/diagnostics` →
  `./errors/diagnostics`; `./resolution/lifecycle` → `./lifecycle/lifecycle-manager`; `./resolution/scope` →
  `./lifecycle/scope-manager`; `./resolution/resolve-options` → `./injection/resolve-options`;
  `./resolution/{activation-need,binding-lookup-cache,class-introspector}` → `./resolution/cache/*`;
  `./resolution/resolution-path` → `./resolution/path/resolution-path`; `./resolution/instantiation-plan` →
  `./resolution/plan/instantiation-plan`; `./resolution/{binding-select,constraints}` → `./resolution/select/*`;
  `./resolution/environment` → `./resolution/context`.

  No behaviour changes. Measured as a paired, alternating, per-scenario A/B against the pre-move build over thirteen
  scenarios: every median inside the A/A control's own spread, and the one row that looked down at three passes
  (`fan-out-tree-depth-3-breadth-4`, 0.966) came back at 0.993 over seven passes against an A/A median of 0.991 on the
  same row.

  `tests/unit/architecture.test.ts` gains a check that ARCHITECTURE.md's backticked `tests/…` citations point at files
  that exist — the existing link check only saw `](src/…)` links, so a moved test file could invalidate a citation
  silently.

  Three re-declared types are now derived, which is structurally identical and breaks nothing: `buildResolutionFrame`'s
  `slot` parameter is `ResolutionFrame["slot"]` rather than a hand-written shape that had lost both `readonly` modifiers,
  inlined `BindingTag`'s definition and dropped its tuple labels; `injectionSlotToResolveOptions` takes
  `Pick<DependencySlot, "name" | "tags">`; and the descriptor's `tags` no longer carries `any` from
  `PropertyDescriptor.value` into a cast that looked checked.

- [#688](https://github.com/codefastlabs/codefast/pull/688) [`c3403a0`](https://github.com/codefastlabs/codefast/commit/c3403a037f2ab7a9e3cdab15d33c1be2eacadcb4) Thanks [@thevuong](https://github.com/thevuong)! - A `resolve` whose tags match several bindings now takes the one declaring the most tags, instead of throwing
  `AmbiguousBindingError`.

  Tags on a binding are its own conditions, not a filter the request must match exactly, so naming more tags satisfies
  more bindings rather than fewer. Given `whenTagged(Fuel.of("petrol"))` and a specialisation
  `whenTagged(Fuel.of("petrol")).whenTagged(Size.of("v8"))`, a request for `{fuel}` skipped the specialisation — it also
  requires `size` — and a request for `{fuel, size}` satisfied both and was ambiguous. No request reached the
  specialisation at all, so declaring one was pointless.

  That is the dispatch model, the same one routing, media queries and overload resolution use, and every one of those
  pairs it with a most-specific-wins rule for exactly this reason. This adds the rule that was missing: a candidate
  declaring more tags than every other is the more specific match. `{fuel}` now resolves the general binding and
  `{fuel, size}` the specialisation, which is what both the filter reading and the dispatch reading of tags predict.

  Selection order is predicate first, then tag count, then throw. Predicate keeps its precedence because it is the older
  rule and re-ordering would re-decide resolutions that already succeed; with this order, every call that resolved before
  resolves to the same binding, and only calls that previously threw can now return. An equal tag count is still genuinely
  ambiguous — `{fuel:petrol}` against `{size:v8}` with both tags requested has no more specific side — and `resolveAll` is
  untouched, since specificity only applies where one binding must be chosen.

  The new comparison sits on the branch that used to throw, so no successful resolve reaches it. Paired A/B over three
  passes, alternating order, per-scenario isolation: the four rows whose requests reach candidate selection and two
  controls all land in parity, 0.986×–1.040× against a control spread of 0.993×–1.018×.

- [#691](https://github.com/codefastlabs/codefast/pull/691) [`02ea054`](https://github.com/codefastlabs/codefast/commit/02ea0542e4c99b5cf0e59c70ac11673aff85dcee) Thanks [@thevuong](https://github.com/thevuong)! - Replace the `[string, unknown]` tag tuple with a `tag()` factory whose criteria are interned.

  A tag key is declared once and mints its own criteria:

  ```ts
  const Region = tag<"eu" | "us">("region");
  container.bind(Storage).to(S3).whenTagged(Region.of("eu"));
  container.resolve(Storage, { tag: Region.of("eu") });
  ```

  The value type is now checked at both ends, so a bind site and a resolve site cannot drift apart — previously the key
  was a bare string and the value was `unknown`, and a typo was a runtime `NoMatchingBindingError` rather than a compile
  error. `whenTagged` takes the criterion instead of `(key, value)`, which makes it the same shape a request carries.

  This is not a compatible change: `BindingTag` is an interned, branded object rather than a tuple, and nothing outside
  `TagKey.of()` can construct one. `whenTagged`, `whenParentTagged`, `whenAnyAncestorTagged`, `whenParentTaggedAll`,
  `whenAnyAncestorTaggedAll`, `ResolveOptions.tag/tags` and `InjectOptions.tag/tags` all take criteria now.

  Interning is what pays for it, and it pays twice:

  - **The registry indexes tagged bindings by the criterion**, not by key-then-value, which removes a hash level and —
    because equal criteria are one object — makes the index exact. The value re-check that existed only to correct a
    `Map`'s SameValueZero treatment of `±0` is gone; the intern cache splits those two under a private symbol instead, so
    `Object.is` (SPEC §3.5) still holds.
  - **The multi-tag lane prefilters on a key mask.** Each key carries a bit, each slot and request the OR of theirs, so a
    slot whose keys the request does not cover is rejected by one AND and one compare before any criterion is read. Bits
    wrap every 32 keys; a shared bit is a false positive identity then rejects, never a false negative.

  Measured with `di:bench:isolate` against the previous build, `@codefast/di` hz/op:

  | Row                            | Before |        After |
  | ------------------------------ | -----: | -----------: |
  | `slot-tag-miss-optional`       |  13.3M | 19.8M (+48%) |
  | `slot-tag-shorthand-hoisted`   |  38.9M | 49.8M (+28%) |
  | `tagged-binding-resolve`       |  38.1M | 48.4M (+27%) |
  | `multi-tag-slot-resolve`       |  10.9M | 13.8M (+27%) |
  | `slot-tag-resolve-all`         |  38.2M | 46.5M (+22%) |
  | `multi-tag-constraint-resolve` |   6.9M |  8.1M (+18%) |

  Five control rows the change does not touch moved between −3.3% and +3.0%, and the head-to-head aggregate held at 44
  wins / 0 parity / 0 losses against inversify 8.2.3. Three new `mask-*` rows price the prefilter directly: reject-heavy,
  admit-then-decide, and the shared-bit collision.

  One thing interning did **not** buy: an inline `Region.of(v)` is still slower than a hoisted criterion (+2–3% against
  +25–28%), because `.of()` reads the intern map on every call. The gap between the inline and hoisted rows widened rather
  than closed.

### Patch Changes

- [#727](https://github.com/codefastlabs/codefast/pull/727) [`09e85b8`](https://github.com/codefastlabs/codefast/commit/09e85b87a80143d60c90240ea79de583c0f1ffb2) Thanks [@thevuong](https://github.com/thevuong)! - Fix a batch of correctness bugs found by a full engine audit:

  - Subclass decorators no longer pollute the base class's metadata: defining a decorated subclass used to make the base
    unresolvable and silently dropped the subclass's own hooks and accessors. Lifecycle and accessor metadata now
    aggregate over the base chain (postConstruct base-first, preDestroy derived-first); constructor metadata stays opt-in
    per class.
  - A dependency cycle through an `@inject` accessor now throws `CircularDependencyError` instead of overflowing the
    stack.
  - A held fluent chain refined after later registry writes can no longer undo an `unbind` or destroy a newer binding; a
    scope refinement evicts the instance cached under the old scope, and a re-slot no longer double-deactivates or re-runs
    the factory of a cached `undefined` singleton.
  - `resolveAll`/`resolveAllAsync` materialize a parent-owned singleton at the parent, so a child override no longer leaks
    into the shared instance and `child.dispose()` no longer destroys it.
  - Concurrent async resolves of one scoped binding construct one instance; a sync resolve during an in-flight async
    singleton materialization refuses with `AsyncResolutionError` instead of silently double-constructing.
  - Container-level activation hooks fire per the binding's owner, matching the SPEC, including through compiled plans.
  - Teardown survives throwing hooks (every remaining hook still runs, failures are reported), drains in-flight async
    materializations, deactivates dependents before dependencies, and a disposed parent no longer serves or
    re-materializes singletons through live children. A module whose setup throws rolls back, so a retry load works.
  - DOT/Mermaid graph adapters escape token names; `has()`/`hasOwn()` answer ambiguity with `true`; binding snapshots no
    longer alias live registry state; `NoMatchingBindingError` survives bigint and circular tag values; the verifying
    metadata reader checks lifecycle and accessor answers; `resolveOptional` evaluates `when()` predicates once
    (measurably faster on the hit path).

- [#727](https://github.com/codefastlabs/codefast/pull/727) [`7a103f0`](https://github.com/codefastlabs/codefast/commit/7a103f05b1306f9889f218753a26bc814fc05de3) Thanks [@thevuong](https://github.com/thevuong)! - Let a child container compile an instantiation plan for a transient class binding its parent owns. The plan compiler
  refuses to decide until a runtime resolve has read the class's lifecycle metadata, but that discovery was recorded on
  the owner's introspector while the compiler consulted the introspector of whichever resolver was doing the resolving.
  Where those differ, the child's answer stayed unknown forever: it recompiled the plan on every single resolve and threw
  the result away each time, falling back to the interpreted path. The resolving side now settles its own answer after
  instantiating a class binding another container owns.

  Measured against `benchmarks/di-inversify` (fast profile, isolated, best-of-3 per side): median 1.003×, geomean 1.005×
  over 103 scenarios, with no reproducible regression on a path the change touches.

- [#727](https://github.com/codefastlabs/codefast/pull/727) [`27020d1`](https://github.com/codefastlabs/codefast/commit/27020d159652ad71f7afe371e29cda1f17097739) Thanks [@thevuong](https://github.com/thevuong)! - perf(di): make token binding lists copy-on-write so selection drops its snapshot

  The registry now replaces a token's binding list on `add`/`removeById` instead of splicing it in place, so a selection
  walking the list while a `when()` predicate rebinds the token keeps its own pre-mutation array by construction. The
  defensive per-selection copy in binding selection is gone — predicate-bearing `resolveAll` fan-outs no longer pay an
  allocation per call. Observable behavior is unchanged: the mid-selection-rebind pin test passes as written.

- [#727](https://github.com/codefastlabs/codefast/pull/727) [`7feb085`](https://github.com/codefastlabs/codefast/commit/7feb0853292d347d2ea0e7b57d044226e91ca349) Thanks [@thevuong](https://github.com/thevuong)! - Key the resolution-path cycle guard on binding identity instead of token display names. Two distinct tokens created with
  the same name (say, two `token("Config")` from different modules) on one dependency chain used to throw a false
  `CircularDependencyError` for a legitimately acyclic graph — on the sync lane, on the deep-path membership set, and on
  the async branch lane alike. The guard now compares binding ids read off the resolution frame stack, which moves in
  lockstep with the path; the display-name array is kept solely for the error message, so a real cycle still reports the
  same readable chain.

- [#727](https://github.com/codefastlabs/codefast/pull/727) [`e337290`](https://github.com/codefastlabs/codefast/commit/e3372904e67990ea7f5a91e4f7ae014326b7026a) Thanks [@thevuong](https://github.com/thevuong)! - Warm constants whose only activation handler is container-level during `initializeAsync()`. A `toConstantValue` binding
  carrying a per-binding `onActivation` was already resolved and cached by the warm-up, but one whose hook was registered
  through `container.onActivation(token, …)` was skipped — so the hook first ran on whichever request happened to resolve
  the token, exactly the lazy-init latency `initializeAsync()` exists to remove. The skip now tests both hook channels,
  matching how the resolver's own plain-constant fast path decides the same question.

  Also tightens `isSyncModule()`, which read a brand field directly and so returned `undefined` rather than `false` for an
  async module despite declaring a boolean type predicate, and corrects the `Promise` type assertion on the parent-owned
  singleton lane of `resolveAsync`.

- [#727](https://github.com/codefastlabs/codefast/pull/727) [`839efbb`](https://github.com/codefastlabs/codefast/commit/839efbb2318d80acca76b8a02846c30f2ca3306c) Thanks [@thevuong](https://github.com/thevuong)! - perf(di): index multi-tag slots by their first criterion for subset selection

  A name-less multi-tag `resolve` over a wide variant set no longer scans the token's whole binding list: multi-tag slots
  are bucketed under their first criterion, and since a matching slot's every tag is in the request, walking the request's
  buckets (plus the single-tag index) finds each candidate exactly once — no dedup set, no extra per-resolve allocation.
  The lane engages only past a size threshold on the token's list (under it the generic scan is cheaper) and serves
  `resolve` only, so `resolveAll` keeps its result order. Selection semantics — subsets, specificity, predicates,
  ambiguity — are unchanged.

- [#727](https://github.com/codefastlabs/codefast/pull/727) [`5d5fe67`](https://github.com/codefastlabs/codefast/commit/5d5fe67d0d8480314fa6a45b40696a57856cf05f) Thanks [@thevuong](https://github.com/thevuong)! - Trim the `resolveAll` selection path so it fits V8's cumulative inlining budget. The chain from `resolveAll` down to the
  per-candidate resolve summed to roughly 1040 bytes of bytecode against a 920-byte budget, so TurboFan stopped inlining
  partway through it. Three changes cut about 100 of those bytes without changing behaviour: `filterBindings` takes the
  slot-match decision from its caller instead of deriving it, the per-candidate predicate is read once rather than twice,
  and building a non-root `ConstraintContext` moved to its own function so a selection inlines the test and not the object
  literal.

  Measured against `benchmarks/di-inversify` (default isolated profile, source-swapped, six alternating paired passes,
  median per row): `production-event-bus-dispatch` 1.058×, `resolve-all-strategies-10` 1.045×,
  `resolve-all-strategies-100` 1.034×. `constant-resolve` and `resolve-all-named-64` read slightly under parity, both on
  rows fast enough that the suite's own guidance says not to read them alone; neither is on the path this touches.

- [#688](https://github.com/codefastlabs/codefast/pull/688) [`6dcb736`](https://github.com/codefastlabs/codefast/commit/6dcb736a561c527b14b1153a2a4b79d84d28ce79) Thanks [@thevuong](https://github.com/thevuong)! - `resolve(token, { tag: pair })` now reaches the registry's tagged index, which its own documentation had always claimed
  it did. It never had: `singleTagOnlyOf` treated the presence of `tag` as a reason to give up on the fast lane, so the
  shorthand — the form `README` reaches for and `ResolveOptions` advertised as the fast one — was the only spelling
  excluded from it, and fell through to full candidate selection instead. Results were never wrong, only slower. Measured
  paired against the previous build, alternating order, five passes, medians: **2.42×** on a single-tag resolve with the
  pair hoisted and **2.38×** with it written inline, every pass agreeing; `{ tags: [pair] }` and the
  `tagged-binding-resolve` row hold at parity, controls clean.

  A request that carries a tag from both sources at once still declines the index, because two tags requested is not
  something a one-tag index can answer without skipping the ambiguity check the full path would have run.

  SPEC §3.5 now states the rule this fixes as normative — a fast path serving `tags: [pair]` must serve `tag: pair` — so
  the two spellings cannot drift into different lanes again, and `tests/unit/resolution/tag-shorthand-parity.test.ts` pins
  both the lane and the result equality across the value kinds `Object.is` and a `Map`'s SameValueZero disagree on.
  `ResolveOptions.tag` and the README also stop implying the two forms differ in speed, and say what actually
  distinguishes them: only `tags` expresses more than one tag, and only `tags` exists on `InjectOptions`.

- [#688](https://github.com/codefastlabs/codefast/pull/688) [`bbc111b`](https://github.com/codefastlabs/codefast/commit/bbc111b61611c1e62924503c6be713a96579dca8) Thanks [@thevuong](https://github.com/thevuong)! - `resolveAll(token, { tag })` reads the tagged index instead of scanning every binding under the token. `resolveAll` has
  had a fast lane for a name-only request since the name index existed; the identical shape for a one-tag request was
  missing, for a reason that had expired. `simpleTagOf` kept predicate-bearing bindings out of the tag index, justified by
  the index being "read without a re-check" — which stopped being true when the `±0` fix gave every indexed hit a
  re-check. With the premise gone the exclusion was vestigial, and it was the only thing keeping `resolveAll` off the
  index.

  Both lanes that read the index now evaluate the predicate on what they find, exactly as the name lane always has, so an
  indexed hit whose `when()` refuses still cannot reach a caller.

  Worth **1.72×** on a `resolveAll` over a tagged token, nine passes and every one positive, landing that row at the
  throughput the equivalent name lane already had. Single-tag `resolve`, the name lanes, and the sync controls hold.

  One row moves the other way and is recorded rather than explained: `resolveAll` with no options over a hundred
  pure-predicate bindings measures **0.95×**, nine passes inside a one-percent spread. It has no causal path — that
  request leaves candidate selection at its first test and never reaches the index or any new code — and the obvious
  remedy, keeping the caller its original size, did not move it. It reads as a code-layout effect; the experiment that
  would confirm that has not been run yet.

- [#727](https://github.com/codefastlabs/codefast/pull/727) [`bda71f7`](https://github.com/codefastlabs/codefast/commit/bda71f7a2d1121f1abc8d6e575d6779ef5085117) Thanks [@thevuong](https://github.com/thevuong)! - Stop a deep synchronous resolution from reporting a circular dependency that is not there. The membership set the
  resolution path attaches past `RESOLUTION_SET_THRESHOLD` is seeded from the path, and the frames already on it are
  handed no set to delete from on unwind — so the set outlived the resolve it was built for, on an array the resolver
  reuses. A graph resolved on the interpreted path deeper than that threshold answered its first resolve and threw
  `CircularDependencyError` on every later one, and a sibling branch below the attach depth threw within a single resolve.
  The set is now dropped as soon as it stops mirroring the path, and rebuilt by the next frame that needs one.

## 0.5.0

### Minor Changes

- [#677](https://github.com/codefastlabs/codefast/pull/677) [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842) Thanks [@thevuong](https://github.com/thevuong)! - Detect async cycles from the synchronous factory cascade instead of a settle-scoped path, and escape to a per-branch path only where the cascade cannot see.

  A factory asks for its dependencies from its **synchronous prefix** — `async ctx => await ctx.resolveAsync(dep)` calls `resolveAsync` before it awaits anything — so an eight-level chain is built inside one synchronous cascade before any of it settles, and the chain of who-is-resolving-whom at the moment of a request is the call stack itself. While that cascade is open the resolver's own arrays are the ancestor chain, pushed on factory-enter and popped when the factory returns its promise rather than when that promise settles. Two cascades cannot interleave, so `binding.inFlight` is exact path membership for async too, exactly as it already was for sync. Every level shares one context; nothing is allocated per level and no level observes its own settlement.

  This fixes a false `CircularDependencyError`. A diamond — `A` awaiting `B` and `C` in parallel, both needing `D` — rejected with `Circular dependency detected: a → b → d → c → d`, a path in which `b → d → c` is not a dependency edge at all. `D`'s flag is now clear by the time the second sibling asks for it.

  A request made from a continuation, after an await, has its ancestors on no call stack. It arrives with the cascade empty — an exact test, since a continuation never runs inside one — and escapes to a branch lane whose path is append-only: a level appends while its branch still owns the next slot and copies its own prefix once a sibling has claimed it. Anything the cascade lane does not serve escapes the same way, seeded with a snapshot of the ancestors reached so far, and a subtree that has left the cascade stays off it. A cycle formed entirely from post-await edges is still reported, one level in from the true root, because the ancestors before the first escape were never written down; `resolver-async.test.ts` pins that message.

  Measured with `BENCH_ISOLATE=1 BENCH_FULL=1`, libraries interleaved with rotating order, 3 trials: against inversify 8.2.3 the suite goes from **42 / 0 / 1** to **43 / 0 / 0** — the async chain row this library had always lost now reads **1.60×** where it read 0.75×, and the async group's geomean goes **1.13× to 1.58×**. Per-level overhead against a floor of eight plain awaited async functions falls from 48.3 ns to **19.5 ns** with the collector idle and **21.3 ns** with a full GC forced every 100 samples — the lane is now within ~7 ns of a build carrying no cycle bookkeeping at all, and it is GC-insensitive again.

  A paired A/B of the two builds, five passes alternating which side ran first, holds all seventeen measured sync rows at parity (0.99–1.08× medians, no row negative across every pass), including `circular-dependency-3`, which shares the `binding.inFlight` flag the cascade now uses. That A/B is also what caught a regression the suite reported as a win: a materialized async singleton did not match the cascade lane and escaped, snapshotting both cascade arrays on every resolve, for **0.81×** of the previous build across all five passes. The cascade entry now answers a plain constant and a cached singleton itself.

  `ARCHITECTURE.md` records the two shapes tried before this one, including the one that fixed the same bug and measured worse, and why the sync lane's compiled-plan answer does not port to async.

  `ResolutionDiagnostics` no longer carries `asyncContextPoolSize`, since there is no async context pool to report.

- [#646](https://github.com/codefastlabs/codefast/pull/646) [`0093b99`](https://github.com/codefastlabs/codefast/commit/0093b99ed711ad037b0e98e7343dee89786d328b) Thanks [@thevuong](https://github.com/thevuong)! - Build a container's rarely-used collaborators on first use instead of in its constructor: the inspector, the module ref/binding tables, the scope's in-flight and scoped caches, the registry's named and tagged slot indexes, and the class introspector's metadata caches. A container that only binds and resolves — the common case, and every per-request child container — no longer allocates eleven `Map`s it never reads.

  A fresh `Container.create()` retains 2.7 KB instead of 4.8 KB (**43% lighter**), and `parent.createChild()` the same, measured by retention against a forced collection. Every deferred collaborator behaves identically whether or not something touched it first, which `tests/unit/container/deferred-subsystems.test.ts` pins by exercising each one as the first thing a fresh container does.

  It is a throughput win too, on the paths that actually build containers: `Container.create()` is **1.80×** faster (230 ns → 127 ns) and a per-request child container plus a resolve through it — `createChild()` + resolve, the shape a web app runs once per request — is **1.31×** faster. Measured by an interleaved A/B with both builds loaded into one process, 13 trials in alternating order, against a control scenario that resolves from a pre-built container and so cannot benefit; the control sat at 0.997–1.009, and median and best-of agreed on both figures.

  **Breaking:** `ScopeManager.getAllScoped()` is removed from the `./resolution/scope` subpath. Deferring the scoped cache raised the question of what a bulk reader returns when the cache was never allocated, and this reader had no callers anywhere in the package — so it is gone rather than carrying an empty-map fallback for nobody. `getAllSingletons()` is unaffected; its cache is still eager.

  What it does **not** do is close the `realistic-graph-cold-resolve` loss against tsyringe, and the arithmetic says why: 103 ns off container construction is 2.5% of that row's 4.06 µs iteration, so the row moves ~1.5% — measured, and inside the noise floor. That row's gap is GC-attributable (the two libraries are at mutator parity; di only loses once a forced collection is in the loop), so a 13.7% allocation cut was never going to carry it.

- [#677](https://github.com/codefastlabs/codefast/pull/677) [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842) Thanks [@thevuong](https://github.com/thevuong)! - **Breaking:** `effectiveBindingScope` is no longer exported from the package root. It read a `Binding`,
  which `package.json#exports` deliberately withholds, and no public API ever handed one out — so it was
  exported and impossible to call. Read a binding's scope from `BindingSnapshot.scope`
  (`container.lookupBindings()` / `container.inspect()`) or from `GraphNode.scope`
  (`container.generateDependencyGraph()`), both of which have always carried it.

  `bindingSlotToResolveOptions` now takes its slot structurally, so the slot on a public
  `BindingSnapshot` — where `name` is an optional property rather than a required one holding
  `undefined` — is accepted. Passing a `BindingSlot`-shaped literal keeps working.

  A type test now asserts each exported function is callable with values a consumer can actually obtain
  from the package's own exports, which is what neither of these satisfied.

- [#646](https://github.com/codefastlabs/codefast/pull/646) [`de80bad`](https://github.com/codefastlabs/codefast/commit/de80bad63f14afda1bd64a6d247852b24aac8e16) Thanks [@thevuong](https://github.com/thevuong)! - Publish an intentional export surface: 13 subpaths instead of 36. The engine's collaborators — `resolution/*`, `registry`, `container/*`, `binding`, `constructor-type`, and the `metadata` internals — are no longer entry points. They carry the invariants documented in ARCHITECTURE.md, and publishing them meant every internal refactor was technically a breaking change. Everything a consumer needs stays reachable from the root export, which already re-exports the builder interfaces, `Constructor`, `MetadataReader`, `effectiveBindingScope`, and the resolve-options helpers.

  **This also repairs a silent break.** The surface was generated from `dist/`, so reorganising `src/` into `container/`, `resolution/` and `introspection/` renamed twelve already-published entry points — `./inspector` → `./introspection/inspector`, `./dependency-graph` → `./introspection/dependency-graph`, `./graph-adapters/*` → `./introspection/graph-adapters/*`, `./container` → `./container/container`, and the whole flat `./resolver`/`./scope`/`./lifecycle`/`./environment`/`./constraints`/`./binding-select`/`./binding-scope`/`./resolve-options` set — with no changeset saying so. The consumer-facing ones (`./inspector`, `./dependency-graph`, `./graph-adapters/*`) are back at the specifiers they shipped under; `examples/tanstack-start` imports two of them and would have broken on its next upgrade.

  **Breaking:** the internal subpaths listed above are gone. Import from the package root instead.

- [`4f7a188`](https://github.com/codefastlabs/codefast/commit/4f7a188a5f4a281882606f11ed660aecb9844753) Thanks [@thevuong](https://github.com/thevuong)! - Rename the `hint` resolve parameter to `options` throughout — "hint" implied optional guidance the container may ignore, but the value is a hard selection criterion (`resolve` throws `NoMatchingBindingError` when nothing matches), so the name misstated its role. Positional call sites are unaffected; the one breaking surface is `NoMatchingBindingError.hint`, now `NoMatchingBindingError.options`.

- [`ad11507`](https://github.com/codefastlabs/codefast/commit/ad115077e23eaed845abd1f093f32d57f2445a36) Thanks [@thevuong](https://github.com/thevuong)! - Reorganize the source tree into subsystem folders — `container/` (container + the extracted fluent binding builders), `resolution/` (resolver, scope, lifecycle, environment, selection/constraints, and the extracted cycle-guard module), and `introspection/` (inspector, dependency graph, and the graph adapters). The root entry keeps exporting everything and now also exports the graph adapters (`toDotGraph`, `toCytoscapeGraph`, `toReactFlowGraph` and their types), so `import { toReactFlowGraph } from "@codefast/di"` is the preferred path.

  Breaking (0.x minor): the `@codefast/di/graph-adapters/*` subpaths are removed — import the adapters from the root entry or from `@codefast/di/introspection/graph-adapters/*`. Deep subpaths of other moved modules follow the new folders (e.g. `@codefast/di/resolver` → `@codefast/di/resolution/resolver`).

- [`6a25788`](https://github.com/codefastlabs/codefast/commit/6a25788320c73074c3ae0bb06cf7a70b7800c953) Thanks [@thevuong](https://github.com/thevuong)! - Resolver performance overhaul — the head-to-head benchmark vs InversifyJS 8 now shows 38/38 comparable scenarios won (median 1.82×, isolated mode), up from 7 losing rows. Four techniques, no public-API changes:

  - **Chain-versioned lookup memo** — `BindingRegistry` gains a monotonic mutation version; resolvers memoize options-less `token → {binding, owner}` lookups across the parent chain with alias hops folded to the terminal binding. Resolving a root binding from a depth-2 child (or through `toAlias`) is now as fast as resolving it locally.
  - **Compiled resolution plans** — a transient class binding whose dependency subgraph is pure static (class/constant/cached-singleton deps, no activation hooks or `postConstruct`) compiles once into a nested-constructor closure, cycle-checked at compile time. Anything dynamic keeps the runtime cycle guard, so error semantics are unchanged.
  - **Uniform binding hidden class** — `Registry.add` rebuilds every binding with one fixed field superset so mixed binding kinds no longer turn the resolver's hot property reads megamorphic (~30% throughput loss in processes exercising several kinds).
  - **Leaner async transient path** — cleanup runs as a FIFO side listener on the factory promise instead of a derived-promise chain (one less promise and one less microtask hop per level), and activated transient dynamic bindings get a dedicated lane that fetches container hooks once. Behavior note: an unawaited _failing_ `resolveAsync` no longer surfaces as an `unhandledRejection`; await (or `.catch`) the returned promise.

- [#646](https://github.com/codefastlabs/codefast/pull/646) [`4ba70d1`](https://github.com/codefastlabs/codefast/commit/4ba70d1724e19580ee93ee392e413c23e669f310) Thanks [@thevuong](https://github.com/thevuong)! - Keep a singleton's instance on its binding instead of in a per-container table. A binding belongs to exactly one container, so its singleton slot is per-binding — which turns every cached-singleton read from a keyed `Map` lookup into a field read, on the most common resolve shape there is. The scope manager keeps only a lazily-created list of the bindings that have materialized, so disposal and `inspect()` can still enumerate them, and the singleton `Map` is gone entirely.

  In the suite, `realistic-graph-resolve-root` — a transient controller over eight cached singletons — went from 10.66M to **12.19M** hz/op, and the `realistic` group geomean from 2.24× to **2.54×** of InversifyJS. That row carries a 2.9% IQR, so it is one of the numbers here worth reading precisely. `singleton-class-1-dep` and cold container build both moved up as well, on rows whose IQR is too wide to attribute confidently.

  An interleaved A/B against the previous build, both in one process with a control that cannot benefit, put the same row between 1.09× and 1.40× across four runs — never slower, median and best-of agreeing inside each run, but with a spread that depends on what else the process had run. The suite's figure is the one to cite; the A/B established the direction. A trap worth recording: the control first read 0.88×, which was an artifact of timing an 11 ns call one at a time — batched the way the harness does it, the same control reads 1.02× with a 4% spread.

  **Breaking:** `ScopeManager`'s singleton API takes a `Binding` rather than a `BindingIdentifier`, and `hasSingleton`/`getSingleton`/`peekSingleton`/`setSingleton(id, …)`/`getAllSingletons` are replaced by `setSingleton(binding, …)`, `deleteSingleton(binding)` and `cachedSingletons()`. The `SINGLETON_MISS` sentinel is gone; `NO_INSTANCE` on the binding replaces it. None of this is a published entry point any more, so it is internal — but a fork reaching into `./resolution/scope` would notice. `InstantiationPlanDependencyEntry` also drops its `ownerScope` field, which a compiled thunk no longer needs.

- [#643](https://github.com/codefastlabs/codefast/pull/643) [`14c3a98`](https://github.com/codefastlabs/codefast/commit/14c3a98a98ae6221df447a94afe14b2e4a147c90) Thanks [@thevuong](https://github.com/thevuong)! - `container.validate()` now reports a captive dependency when a singleton depends on a **transient or scoped `toDynamic` / `toDynamicAsync` binding**. Previously any dynamic terminal was classified opaque and its declared scope went unchecked, so the most common form of the bug — a singleton capturing one instance of something bound transient — passed validation silently.

  A factory's _body_ remains opaque: `validate()` still does not descend into it, so whatever the factory resolves internally is not reported. Only the declared scope of the dependency edge is judged, which is the part the container actually knows.

  **Breaking:** a container that wires a singleton to a transient or scoped dynamic binding now throws `ScopeViolationError` from `validate()` where it previously passed. Either widen the dependency's scope, or inject a factory instead of the value if a fresh instance per use is intended.

### Patch Changes

- [#677](https://github.com/codefastlabs/codefast/pull/677) [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842) Thanks [@thevuong](https://github.com/thevuong)! - Make resolving through a container-level `onActivation` hook as cheap as resolving without one.

  A transient factory binding that carries activation hooks now takes the same `O(1)` `binding.inFlight`
  cycle guard as the unhooked lane — the argument for that guard never mentioned hooks, since a hook
  runs on the call stack the factory did — and `LifecycleManager` keeps a one-entry token→hooks cache
  in front of its map, because a resolve loop asks about the same token every iteration. Together they
  halve what the hook lane costs over the plain one. A hook that re-resolves its own token still
  reports `CircularDependencyError`, and the flag is still released on every exit path.

- [#677](https://github.com/codefastlabs/codefast/pull/677) [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842) Thanks [@thevuong](https://github.com/thevuong)! - Fix three defects found by an audit of the resolution engine's memoization:

  - A `.onActivation()` hook added to a chain **after** its binding's first resolve was silently skipped on every lane that consults the activation-need memo (named resolves and nested dependency resolves) while the default-slot dynamic lane honored it. The memo now reads the binding's own hook fresh on every call, so all lanes give one answer.
  - The activation-need memo is keyed by binding id and was only invalidated by the lifecycle version, so a long-running container that rebinds in a loop grew it without bound (~60 B per rebind). The memo is now also stamped with the registry version, evicting entries whose binding ids a rebind has retired.
  - A `scoped` instance cached in a child container survived `unbind`/`unbindAll`/module unload — the drain released singletons only. Scoped entries are now released with their binding (no deactivation, per SPEC §5.2), and resolution diagnostics expose a `scopedInstanceCount` so the release is pinned structurally.

  A paired A/B against the previous build over six activation- and dispatch-sensitive rows (three passes, alternating order) held every row within noise of parity.

- [`2def688`](https://github.com/codefastlabs/codefast/commit/2def688e305eebe7e14af4ae163beec13582aad5) Thanks [@thevuong](https://github.com/thevuong)! - Fix a crash on cyclic aliases: `bind(a).toAlias(b)` + `bind(b).toAlias(a)` previously recursed until `RangeError: Maximum call stack size exceeded` on both `resolve` and `resolveAsync`. Alias following is now an iterative loop with exact revisit detection — a genuine cycle throws `CircularDependencyError` naming the alias chain, and legitimately long alias chains resolve with no arbitrary hop cap.

  Also splits the magic `32` that served two unrelated roles: the transient-dynamic fast lanes keep their own `DEEP_LANE_THRESHOLD = 32` (a shared-context/pool design point), while the cycle-scan Set attachment moves to a measured `RESOLUTION_SET_THRESHOLD = 128` — benchmarking showed `Array.includes` beats the Set's has/add/delete churn up to at least depth 96, so mid-depth graphs now skip the Set entirely.

- [#646](https://github.com/codefastlabs/codefast/pull/646) [`d27b76f`](https://github.com/codefastlabs/codefast/commit/d27b76fb14200ae5226ec2a05b77d44ab91b016c) Thanks [@thevuong](https://github.com/thevuong)! - Thread an async chain's resolution context through the call and pool it, instead of parking chain identity on the resolver. `ctx.resolveAsync()` now hands the callee the context it used, so an inner level reuses it when the owner matches — which removes the resolver's path-identity heuristic, its shared settle callback and its active-level counter, and makes two concurrent chains correct by construction rather than by a fallback branch.

  The contexts are pooled, and that is load-bearing rather than an allocation micro-optimization: a per-chain context survives its chain's microtask hops, so under a collecting profile a freshly allocated one is promoted out of the nursery and then collected the expensive way. An ablation that allocated per chain cost **2.5×** on `dynamic-async-chain-8` under a forced GC every 100 samples, which is the reason for the shape.

  It does **not** close that row. An earlier draft of this changeset claimed it went from 0.98× to 1.18× of InversifyJS; that figure came from a probe running both library builds in one process, which this harness's README warns is worth ~30% on async chains, and from a 3-trial suite run on a loaded machine. At 5 trials on a quiet machine the row is **0.87×** with a 0.6% / 0.3% IQR — among the tightest numbers in the suite. The mechanism above is real; the win over inversify was not.

  A competing hypothesis was tested and rejected: a forced full GC costs the two libraries the same (1.35 ms / 9.76 MB live for di, 1.41 ms / 9.89 MB for inversify), so the cost was never the collection but what di re-established afterwards.

- [#677](https://github.com/codefastlabs/codefast/pull/677) [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842) Thanks [@thevuong](https://github.com/thevuong)! - Stop allocating a throwaway `Map` on every named resolve. The named-lookup memo upserted with
  `getOrInsert(token, new Map())`, whose fallback JavaScript evaluates eagerly — so every call built a
  `Map` for the hit that immediately discarded it. It now uses `Map.prototype.getOrInsertComputed` with a
  module-level factory, which allocates nothing on a hit and no closure per call: **~1.72×** on
  `named-constant-get`, measured paired against the previous build with the order alternated.

  The bind-time upserts keep the eager form deliberately — a bind is usually a token's first, so the
  fallback is usually the value stored, and the computed form measured slower there.

  `@codefast/di` now calls `Map.prototype.getOrInsertComputed` as well as `getOrInsert`; both ship in Node
  26+, which the package already required.

- [#677](https://github.com/codefastlabs/codefast/pull/677) [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842) Thanks [@thevuong](https://github.com/thevuong)! - Put a one-entry cache in front of `BindingLookupCache`'s options-less token map. Two shapes reach that map and neither can use the registry's direct index: an **alias**, whose terminal binding the index cannot name, and a token owned by a **parent container**, whose entry has to carry the owner. Both are then resolved in a loop over the same token, so the map lookup they repeat deserves an inline cache — the rule this package already applies to `LifecycleManager.activationHandlersFor()`.

  Paired A/B against the previous build, seven passes alternating which side ran first, medians: `to-alias-redirect` **1.16×** (every pass 1.15–1.18) and `child-depth-2-resolve` **1.23×** (every pass 1.22–1.27), which were the two thinnest wins in the suite outside the lifecycle rows. `rebind-hot-swap` — the row that invalidates the cache on every iteration, so the only place a front cache could be pure overhead — reads 1.17×, after a five-pass run had put it at 0.88× on mixed signs; the tighter run is the one to believe.

  In the interleaved isolated suite `to-alias-redirect` reads **1.53×** of inversify 8.2.3, up from 1.33×, which is what the paired ratio predicts. `child-depth-2-resolve` reads **1.14×** there against 1.36× before — that row carries both of the report's instability markers (above 30M ops/s, and a per-trial IQR over 5%), its own throughput went _up_, and seven paired passes put it at 1.22–1.27×, so the paired number is the one that describes this change. The suite's aggregate moved from 42/0/1 to 42/1/0 at a slightly lower median on rows this change cannot reach, which is run-to-run drift rather than an effect.

  `null` is a real answer from that map, meaning "this token's shape needs the full selection path", so absence is tracked by the token slot rather than by the entry, and a registry-version change clears the slot along with the map.

  Folding alias hops into `registry.getFastDefault()` instead was considered and rejected as unsound: that index is a bare own-registry `Map.get` returning a binding, while an alias's terminal may live in a parent container and its invalidation depends on the whole chain's summed version, neither of which the registry can see.

- [#677](https://github.com/codefastlabs/codefast/pull/677) [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842) Thanks [@thevuong](https://github.com/thevuong)! - Remove a type parameter the resolver could never honour. Fifteen private methods took `Binding<Value>`
  and returned `Value`, but every caller supplied `Value` through an unchecked `as Binding<Value>` — so the
  generic documented an intent the compiler never verified. The internal lanes now take the erased
  `Binding` and return `unknown`, and the eight public resolve entry points each cast once, where the
  caller's token is the claim being made. Seventeen casts fewer in the resolver.

  What made that possible: the binding kinds declare their lifecycle hooks as methods rather than
  function-typed properties, so their parameters compare bivariantly and `Binding<Value>` stays assignable
  to `Binding`. The public `ActivationHandler` and `DeactivationHandler` are unchanged and still checked
  strictly, so a handler you write is verified exactly as before.

  No behaviour change: the emitted JavaScript is identical apart from one line break.

- [`19199af`](https://github.com/codefastlabs/codefast/commit/19199af174d8971081d1849a36fd9df05c8541ae) Thanks [@thevuong](https://github.com/thevuong)! - Fix binding-registration order sensitivity: the fluent builder chain commits eagerly, so `bind(x).toDynamic(f).when(p)` (or `.whenNamed(...)` / `.whenTagged(...)`) momentarily registered a default-slot binding whose last-wins commit silently displaced an existing default binding of the same token — and the displaced binding was never restored once the chain narrowed to a predicate or a named/tagged slot. Registering a default binding before a constrained one on the same token therefore lost the default. The commit chain now remembers what an intermediate commit displaced and restores it when the chain settles on a non-conflicting shape; a chain that genuinely ends on the same default slot still replaces the previous default (last-wins unchanged).

  Binding selection also gains a most-specific-wins rule: when both a default binding and exactly one predicate-carrying binding match, the predicate wins (it is a deliberate specialization) instead of throwing `AmbiguousBindingError` — so "default plus `when(...)` override" now works as naturally intended. Two matching predicates remain ambiguous and still throw.

- [#643](https://github.com/codefastlabs/codefast/pull/643) [`14c3a98`](https://github.com/codefastlabs/codefast/commit/14c3a98a98ae6221df447a94afe14b2e4a147c90) Thanks [@thevuong](https://github.com/thevuong)! - Unify sync transient-dynamic cycle detection on a per-binding `inFlight` flag, replacing the shallow lane's `O(depth)` `resolutionPath.includes()` scan and the deep lane's `Map` of generation marks. Sync resolution runs on a single call stack, so a binding marked on factory-enter and cleared on factory-exit is exactly path membership — detection becomes an `O(1)` field read with no hashing, no string scan, and no side table to allocate or grow. The async lane keeps its own per-path check, since async chains can interleave.

  Transient-dynamic chains that previously lost now win across the whole depth range (a 32-deep chain went from ~0.55× to ~1.8× of InversifyJS), deep chains widen their lead, and cold container builds get cheaper because there is no per-resolver cycle-tracking structure to allocate. It also fixes a latent correctness bug: because the deep lane now clears a binding's mark when its factory returns, a deep (past-threshold) transient dependency resolved twice via separate sub-branches (a diamond, not a cycle) no longer throws a false `CircularDependencyError`.

- [#646](https://github.com/codefastlabs/codefast/pull/646) [`864d213`](https://github.com/codefastlabs/codefast/commit/864d213a4253346dae5799ebba06fc2726e933d2) Thanks [@thevuong](https://github.com/thevuong)! - Fold the fluent chain's registry committer into the chain itself. `bind()` now allocates a `BindingEntry` that carries only the `to*()` calls, and `to*()` a `BindingChain` that commits to the registry directly — one object per bind less than the entry/chain/committer trio, and one `Map` lookup less per binding registered by a module.

  The two classes now share a `BindingRegistration` describing where the chain registers, built once per container rather than once per `bind()`. Threading that instead of a loose `(registry, moduleBindingIds, moduleRef)` triple makes the module invariant type-enforced — the id list is present exactly when the chain belongs to a module load — which removes both non-null assertions from the commit path, and drops the constructors from 4 and 5 positional parameters to 2 and 3.

  `BindingCommitter` is gone and `BindingEntry`'s constructor now takes `(token, registration)`. Neither is a published entry point any more, so this is internal.

  This is a simplification, **not** a throughput win: removing only the committer measured no change above noise. The chain stays two objects because `tests/unit/container/bind-to-builder-order.test.ts` requires `bind()`'s result to lack `when*()` at runtime — that is the test's own guarantee, stricter than SPEC §2.4, which only claims compiler enforcement. The measured ceiling for removing every builder object is ~19% on `realistic-graph-cold-resolve` under a forced GC — recorded in ARCHITECTURE so the lead is not re-tried blind.

- [#677](https://github.com/codefastlabs/codefast/pull/677) [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842) Thanks [@thevuong](https://github.com/thevuong)! - Collapse the resolver's duplicated logic onto one rule per question, and fix the two places where a
  second copy had drifted.

  - `resolveAll(token, { name })` now evaluates a `when()` predicate on a named binding, as `resolve`
    always did. The name index answers the slot; the predicate is a further constraint, and the
    fast lane was returning a candidate `resolve` refuses.
  - Refining a binding's scope after its first resolve (`bind(T).toDynamic(f)` … later `.singleton()`)
    now reports the new scope to `when()` predicates that read `ctx.parent.scope`. The resolution
    frame is memoized on the binding and derives from `scope`, so the refinement has to drop it.

  Internally: slot matching, name-only requests, and the alias walk each exist once; a class's
  constructor params and a `toResolved` factory's descriptors resolve through one routine per lane;
  `scope` is declared by every binding kind, so the engine reads it as a plain field. No public API
  changed. Resolution throughput is unchanged or better across the benchmark suite — `resolveOptional`
  ~1.5×, transient class and `toResolved` construction ~1.35–1.44×, constants and named lookups
  ~1.3×, with the deep/wide graph rows at parity.

- [#646](https://github.com/codefastlabs/codefast/pull/646) [`d27b76f`](https://github.com/codefastlabs/codefast/commit/d27b76fb14200ae5226ec2a05b77d44ab91b016c) Thanks [@thevuong](https://github.com/thevuong)! - Compile instantiation plans around dependencies the compiler cannot see through, instead of refusing to compile the graph at all. A factory, a scoped binding, an activation hook, a class past the depth limit, or a multi/optional/named parameter now compiles to an _escape_ — a re-entry into the runtime resolver seeded with exactly the ancestors the interpreted path would have pushed at that point, dispatched through exactly the resolve the interpreter would have called. Cycle detection, constraint contexts and error paths are therefore identical to never having compiled, and only the opaque dependency pays the runtime price while its siblings and ancestors stay compiled.

  Previously a single `toDynamic` dependency anywhere in a class graph dropped the whole graph to the interpreted path — a 13.9× cliff on a shape applications write constantly (a factory-provided config injected into a class tree). That graph is now ~2× faster, and the first-materialization path of a singleton dependency inside a plan gained cycle detection it did not have.

- [#646](https://github.com/codefastlabs/codefast/pull/646) [`d27b76f`](https://github.com/codefastlabs/codefast/commit/d27b76fb14200ae5226ec2a05b77d44ab91b016c) Thanks [@thevuong](https://github.com/thevuong)! - Split the resolver's self-contained caches into named collaborators — `BindingLookupCache` (the chain-versioned options-less lookup memo), `ClassIntrospector` (per-class metadata, `@postConstruct` discovery, accessor injection, instantiation) and `ActivationNeedCache` (per-binding activation need, versioned on the lifecycle manager). The engine class keeps the sync and async pipelines, which genuinely need the same private state on every hop, and `ARCHITECTURE.md` now records the layering, the invariants each hot path depends on, and the rule that separates a legitimate threshold (choosing an implementation) from the kind that was removed (choosing a semantics).

  New subpaths `@codefast/di/resolution/{activation-need,binding-lookup-cache,class-introspector}`; `@codefast/di/resolution/class-plan` is now `@codefast/di/resolution/instantiation-plan`, correcting an export map that had been stale since the module was renamed.

- [`f9aeeb0`](https://github.com/codefastlabs/codefast/commit/f9aeeb04a271877e47a7fbbfc6d62ae0fe1ad955) Thanks [@thevuong](https://github.com/thevuong)! - Extend the compiled-plan and memoization coverage: `toResolved(...)` transient bindings with pure-static explicit deps now compile into factory-call plans (same refusal rules and sync-only check as class plans), and name-only resolves gain a chain-versioned memo that fast-paths constants and cached singletons — predicates, aliases, and anything context-dependent keep the full selection path. Measured: `named-constant-get` ~21M → ~30M hz/op, `to-resolved-3-deps` ~39M → ~52M hz/op.

- [#677](https://github.com/codefastlabs/codefast/pull/677) [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842) Thanks [@thevuong](https://github.com/thevuong)! - Stop minting two arrays per top-level sync resolve, and stop a pooled resolution context re-storing pointers it already holds.

  `--prof` over the four thinnest rows put the largest di-attributed cost in a place none of this package's notes mention: `#acquireSyncResolutionContext` and `DefaultResolutionContext.reset()` together take **22%** of ticks on `fan-out-tree-depth-3-breadth-4` and **16%** on `scale-deep-transient-chain-512`, and `reset()` alone takes **10%** on `container-level-activation-hook`. The reason `reset()` is not free is that a pooled context outlives enough resolves to sit in old space, so each of its five field writes is a pointer store with a write barrier — and three of the five write the same resolver and the same two arrays every time.

  Except they did not, because `container.resolve()` handed every call a fresh `[]` pair. So both halves are needed together: a resolver now keeps one sync `rootPath`/`rootStack` pair, lent to a top-level resolve when `rootStack.length === 0` and otherwise replaced by a fresh pair, and `reset()` compares before storing. Every sync lane pops what it pushes, so an empty stack is an exact "nobody holds this"; a nested `container.resolve()` from inside a factory still starts from an empty path, and if a resolve ever left the pair dirty the only consequence is that later resolves mint their own.

  Paired A/B against this commit's parent, six passes alternating which side ran first: `constant-resolve` **1.70×**, `container-level-activation-hook` **1.67×**, `realistic-graph-resolve-root` **1.34×**, `fan-out-tree-depth-3-breadth-4` **1.28×**, `scale-deep-transient-chain-512` **1.21×**, `scale-mid-transient-chain-32` 1.16×, `singleton-class-1-dep` 1.13×, `to-alias-redirect` 1.09×, and `dynamic-async-chain-8` 0.99× as the untouched control.

  `transient-class-1-dep` reads **0.91×**, negative in all six passes, and the mechanism is the same one that wins the other rows: a fresh array is in new space, so pushing a frame onto it needs no write barrier, while the shared pair is in old space and every push pays one. That row pushes a frame and does nothing else, so it is the one shape where the barrier costs more than the two allocations saved. Kept because it is one row at −9% against five between +21% and +70%.

  `tests/unit/resolution/in-flight-invariants.test.ts` pins the lending rule in both directions — a nested root resolve gets its own pair, and a throwing resolve hands the pair back — and both were checked by breaking the guard.

- [#677](https://github.com/codefastlabs/codefast/pull/677) [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842) Thanks [@thevuong](https://github.com/thevuong)! - `toSelf()` on a token that is not a class now throws `SelfBindingRequiresClassError` instead of a bare
  `Error`, so it is catchable as a `DiError` like every other failure this package raises, carries a
  `code` and the token name, and is documented in SPEC.

  It was the one throw site outside the error taxonomy, and the architecture test could not see it —
  that test only read `export class …Error` declarations. It now also fails on any `throw new Error(…)`
  under `src/`, and on an error class the root barrel forgets to export.

- [#643](https://github.com/codefastlabs/codefast/pull/643) [`14c3a98`](https://github.com/codefastlabs/codefast/commit/14c3a98a98ae6221df447a94afe14b2e4a147c90) Thanks [@thevuong](https://github.com/thevuong)! - Collapse the async transient-dynamic resolver into a single lane and retune the cycle-set threshold.

  The async lane used to split at depth 32 into a fast path (linear path scan, shared context, no stack frames) and a slow path (forced Set, fresh context per level, stack frames, extra microtask hop) — so context identity, `ctx.graph` contents, and promise shape all changed silently at that depth. Both are now one lane whose cycle guard goes through `enterResolutionPath`, the only mechanism that stays correct when chains interleave (`Promise.all`) and which adapts on its own: a linear scan while the path is short, an attached Set past `RESOLUTION_SET_THRESHOLD`. `DEEP_LANE_THRESHOLD` is gone from the package entirely.

  `RESOLUTION_SET_THRESHOLD` drops from 128 to 32 on fresh measurements — at 128 an async chain costs 1275 / 3641 / 9645 / 26082 ns at depth 16 / 32 / 64 / 128 versus 1202 / 3285 / 7735 / 16837 at 32, so the old value was the worse choice at every depth measured.

- [#646](https://github.com/codefastlabs/codefast/pull/646) [`a720c62`](https://github.com/codefastlabs/codefast/commit/a720c6297d041ffd2d0bba2e6146af894007a367) Thanks [@thevuong](https://github.com/thevuong)! - Collapse the fluent binding chain into one object. A single `BindingChain` is now the `BindToBuilder` that `bind()` returns and the kind-specific builder that `to*()` returns, so a `bind()` allocates one builder instead of two.

  The `to*()`-before-`when*()` ordering stays enforced, as a type-level guarantee — which is what SPEC §2.4 actually claims. `bind()` is typed `BindToBuilder`, so a refinement before `to*()` does not compile; `tests/types/container-api.test.ts` pins that. For a caller without types, or one who casts past them, every refinement now throws the new **`ChainNotRegisteredError`** naming the token and pointing at `to*()`, rather than silently doing nothing. `whenDefault()` asserts registration for that reason alone, since it otherwise has nothing to do.

  The previous revision kept two objects because a unit test asserted the refinement methods were _absent from the object_ `bind()` returns — a stricter reading than the spec, and one that pinned an implementation detail. That test now asserts the contract instead: every refinement throws before `to*()`, nothing is registered when it does, and the chain still works normally afterwards.

  This is an API simplification, **not** a throughput win: going from four builder objects per bind to three measured no change above noise, and a fluent API cannot go below one, so the ~19% ceiling recorded in ARCHITECTURE for removing all of them is unreachable rather than pending.

- [#646](https://github.com/codefastlabs/codefast/pull/646) [`1241f82`](https://github.com/codefastlabs/codefast/commit/1241f82bdb40613667c781111f2ce20409ddfd89) Thanks [@thevuong](https://github.com/thevuong)! - Register a fluent binding chain once instead of once per refinement. `bind(T).toDynamic(f).singleton()` used to insert a binding, remove it, and insert a replacement — two registry mutations, two version bumps, and a full index churn per binding. The chain now registers on its `to*()` call and refines that same registered object in place; only `when*()` re-slots, and it re-registers under the chain's original id, so `id()` stays valid for the whole chain instead of the intermediate ids being dead. Binding construction also funnels through a single `createBinding()` literal, which is what guarantees the one V8 hidden class the resolver's hot property reads depend on — so the registry stores what it is handed rather than re-copying it.

  Cold container build (build, bind 10 nodes, resolve the root) went from the suite's only loss to a win against every competitor: 0.76× → 3.0× of InversifyJS, 0.43× → 1.9× of Awilix, 0.22× → 1.07× of tsyringe.

  The builder's `CommitFn` type is replaced by a `BindingCommitter` interface (`commit` plus `refine`, the latter for in-place refinements the registry indexes do not care about), and `createBinding` / `refinableFields` are new exports from `@codefast/di/binding`.

- [#643](https://github.com/codefastlabs/codefast/pull/643) [`14c3a98`](https://github.com/codefastlabs/codefast/commit/14c3a98a98ae6221df447a94afe14b2e4a147c90) Thanks [@thevuong](https://github.com/thevuong)! - Collapse the sync transient-dynamic resolver into a single lane and memoize each binding's resolution frame on the binding itself.

  The separate deep lane existed to escape an `O(depth)` `resolutionPath.includes()` cycle scan past ~32 levels. With cycle detection now an `O(1)` `binding.inFlight` mark there is nothing to escape, so the depth split, its shared-context bookkeeping, its reentrancy fallback, and the per-resolver frame `Map` are all gone — the smaller function also inlines better. Frames derive only from immutable binding fields, so caching one per binding replaces a `Map` lookup per hop and a `Map` insert per binding per container.

  Faster at every chain depth measured (8 → 512), e.g. a 32-deep transient chain improved ~39% and cold container build ~62%, which turns the cold-build result against Awilix from a loss into a win in the default benchmark profile.

- [#677](https://github.com/codefastlabs/codefast/pull/677) [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842) Thanks [@thevuong](https://github.com/thevuong)! - Fix a tag request answering differently depending on how it was spelled. `resolve(T, { tags: [["n", -0]] })`
  matched a binding tagged `["n", 0]` while `resolve(T, { tag: ["n", -0] })` threw `NoMatchingBindingError`
  and `resolveAll` returned `[]` — three answers to one question.

  The registry indexes tagged bindings in a `Map`, so it answers by SameValueZero, while tag values compare
  by `Object.is` as SPEC §3.5 requires; the two differ on `+0` versus `-0`. The fast path now re-checks the
  index's answer, and only where the index can be wrong — a request whose tag value is not zero was already
  exact. `NaN` was never affected: both rules treat it as equal to itself.

- [#643](https://github.com/codefastlabs/codefast/pull/643) [`14c3a98`](https://github.com/codefastlabs/codefast/commit/14c3a98a98ae6221df447a94afe14b2e4a147c90) Thanks [@thevuong](https://github.com/thevuong)! - `toResolved()` and `toResolvedAsync()` now accept injection descriptors — `inject()`, `optional()` and `injectAll()` — in their dependency list, matching what `@injectable([...])` already allowed and what the builder already did at runtime (it normalizes every entry through `normalizeToDescriptor`). Previously the public signature only admitted bare tokens and constructors, so an optional or multi dependency needed a cast even though resolution handled it correctly.

  Factory arguments are typed from the descriptor: a bare token gives `Value`, `optional(token)` gives `Value | undefined`, and `injectAll(token)` gives `Array<Value>`. Widening only — existing bare-token call sites are unaffected.

- [#643](https://github.com/codefastlabs/codefast/pull/643) [`14c3a98`](https://github.com/codefastlabs/codefast/commit/14c3a98a98ae6221df447a94afe14b2e4a147c90) Thanks [@thevuong](https://github.com/thevuong)! - `unbind(token)` now drops the token's bindings in a single registry pass instead of removing them one id at a time. The previous path re-scanned and re-indexed the token's binding list once per binding — quadratic in the number of slots bound to that token — and bumped the registry version once per removal, invalidating resolver lookup caches repeatedly. Behaviour is unchanged, including deactivation of cached singletons.

- [#676](https://github.com/codefastlabs/codefast/pull/676) [`641e233`](https://github.com/codefastlabs/codefast/commit/641e2338d77fb61be2ca585a5986f34cf32ec746) Thanks [@thevuong](https://github.com/thevuong)! - Collapse the `types` and `default` lanes of `package.json#imports` from fallback arrays to single strings.

  Node resolves an imports array by taking the first candidate it can parse, without checking that the file exists and without falling through — a specifier whose first candidate is missing throws `ERR_MODULE_NOT_FOUND` rather than trying the second. `./dist/*/index.js` and `./dist/*/index.d.ts` could therefore never be reached, so they read as a safety net that does not exist. The `source` lane keeps its extension candidates, which only `tsc` and Vite read and both probe.

## 0.5.0-canary.9

### Minor Changes

- [#677](https://github.com/codefastlabs/codefast/pull/677) [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842) Thanks [@thevuong](https://github.com/thevuong)! - Detect async cycles from the synchronous factory cascade instead of a settle-scoped path, and escape to a per-branch path only where the cascade cannot see.

  A factory asks for its dependencies from its **synchronous prefix** — `async ctx => await ctx.resolveAsync(dep)` calls `resolveAsync` before it awaits anything — so an eight-level chain is built inside one synchronous cascade before any of it settles, and the chain of who-is-resolving-whom at the moment of a request is the call stack itself. While that cascade is open the resolver's own arrays are the ancestor chain, pushed on factory-enter and popped when the factory returns its promise rather than when that promise settles. Two cascades cannot interleave, so `binding.inFlight` is exact path membership for async too, exactly as it already was for sync. Every level shares one context; nothing is allocated per level and no level observes its own settlement.

  This fixes a false `CircularDependencyError`. A diamond — `A` awaiting `B` and `C` in parallel, both needing `D` — rejected with `Circular dependency detected: a → b → d → c → d`, a path in which `b → d → c` is not a dependency edge at all. `D`'s flag is now clear by the time the second sibling asks for it.

  A request made from a continuation, after an await, has its ancestors on no call stack. It arrives with the cascade empty — an exact test, since a continuation never runs inside one — and escapes to a branch lane whose path is append-only: a level appends while its branch still owns the next slot and copies its own prefix once a sibling has claimed it. Anything the cascade lane does not serve escapes the same way, seeded with a snapshot of the ancestors reached so far, and a subtree that has left the cascade stays off it. A cycle formed entirely from post-await edges is still reported, one level in from the true root, because the ancestors before the first escape were never written down; `resolver-async.test.ts` pins that message.

  Measured with `BENCH_ISOLATE=1 BENCH_FULL=1`, libraries interleaved with rotating order, 3 trials: against inversify 8.2.3 the suite goes from **42 / 0 / 1** to **43 / 0 / 0** — the async chain row this library had always lost now reads **1.60×** where it read 0.75×, and the async group's geomean goes **1.13× to 1.58×**. Per-level overhead against a floor of eight plain awaited async functions falls from 48.3 ns to **19.5 ns** with the collector idle and **21.3 ns** with a full GC forced every 100 samples — the lane is now within ~7 ns of a build carrying no cycle bookkeeping at all, and it is GC-insensitive again.

  A paired A/B of the two builds, five passes alternating which side ran first, holds all seventeen measured sync rows at parity (0.99–1.08× medians, no row negative across every pass), including `circular-dependency-3`, which shares the `binding.inFlight` flag the cascade now uses. That A/B is also what caught a regression the suite reported as a win: a materialized async singleton did not match the cascade lane and escaped, snapshotting both cascade arrays on every resolve, for **0.81×** of the previous build across all five passes. The cascade entry now answers a plain constant and a cached singleton itself.

  `ARCHITECTURE.md` records the two shapes tried before this one, including the one that fixed the same bug and measured worse, and why the sync lane's compiled-plan answer does not port to async.

  `ResolutionDiagnostics` no longer carries `asyncContextPoolSize`, since there is no async context pool to report.

- [#677](https://github.com/codefastlabs/codefast/pull/677) [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842) Thanks [@thevuong](https://github.com/thevuong)! - **Breaking:** `effectiveBindingScope` is no longer exported from the package root. It read a `Binding`,
  which `package.json#exports` deliberately withholds, and no public API ever handed one out — so it was
  exported and impossible to call. Read a binding's scope from `BindingSnapshot.scope`
  (`container.lookupBindings()` / `container.inspect()`) or from `GraphNode.scope`
  (`container.generateDependencyGraph()`), both of which have always carried it.

  `bindingSlotToResolveOptions` now takes its slot structurally, so the slot on a public
  `BindingSnapshot` — where `name` is an optional property rather than a required one holding
  `undefined` — is accepted. Passing a `BindingSlot`-shaped literal keeps working.

  A type test now asserts each exported function is callable with values a consumer can actually obtain
  from the package's own exports, which is what neither of these satisfied.

### Patch Changes

- [#677](https://github.com/codefastlabs/codefast/pull/677) [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842) Thanks [@thevuong](https://github.com/thevuong)! - Make resolving through a container-level `onActivation` hook as cheap as resolving without one.

  A transient factory binding that carries activation hooks now takes the same `O(1)` `binding.inFlight`
  cycle guard as the unhooked lane — the argument for that guard never mentioned hooks, since a hook
  runs on the call stack the factory did — and `LifecycleManager` keeps a one-entry token→hooks cache
  in front of its map, because a resolve loop asks about the same token every iteration. Together they
  halve what the hook lane costs over the plain one. A hook that re-resolves its own token still
  reports `CircularDependencyError`, and the flag is still released on every exit path.

- [#677](https://github.com/codefastlabs/codefast/pull/677) [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842) Thanks [@thevuong](https://github.com/thevuong)! - Fix three defects found by an audit of the resolution engine's memoization:

  - A `.onActivation()` hook added to a chain **after** its binding's first resolve was silently skipped on every lane that consults the activation-need memo (named resolves and nested dependency resolves) while the default-slot dynamic lane honored it. The memo now reads the binding's own hook fresh on every call, so all lanes give one answer.
  - The activation-need memo is keyed by binding id and was only invalidated by the lifecycle version, so a long-running container that rebinds in a loop grew it without bound (~60 B per rebind). The memo is now also stamped with the registry version, evicting entries whose binding ids a rebind has retired.
  - A `scoped` instance cached in a child container survived `unbind`/`unbindAll`/module unload — the drain released singletons only. Scoped entries are now released with their binding (no deactivation, per SPEC §5.2), and resolution diagnostics expose a `scopedInstanceCount` so the release is pinned structurally.

  A paired A/B against the previous build over six activation- and dispatch-sensitive rows (three passes, alternating order) held every row within noise of parity.

- [#677](https://github.com/codefastlabs/codefast/pull/677) [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842) Thanks [@thevuong](https://github.com/thevuong)! - Stop allocating a throwaway `Map` on every named resolve. The named-lookup memo upserted with
  `getOrInsert(token, new Map())`, whose fallback JavaScript evaluates eagerly — so every call built a
  `Map` for the hit that immediately discarded it. It now uses `Map.prototype.getOrInsertComputed` with a
  module-level factory, which allocates nothing on a hit and no closure per call: **~1.72×** on
  `named-constant-get`, measured paired against the previous build with the order alternated.

  The bind-time upserts keep the eager form deliberately — a bind is usually a token's first, so the
  fallback is usually the value stored, and the computed form measured slower there.

  `@codefast/di` now calls `Map.prototype.getOrInsertComputed` as well as `getOrInsert`; both ship in Node
  26+, which the package already required.

- [#677](https://github.com/codefastlabs/codefast/pull/677) [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842) Thanks [@thevuong](https://github.com/thevuong)! - Put a one-entry cache in front of `BindingLookupCache`'s options-less token map. Two shapes reach that map and neither can use the registry's direct index: an **alias**, whose terminal binding the index cannot name, and a token owned by a **parent container**, whose entry has to carry the owner. Both are then resolved in a loop over the same token, so the map lookup they repeat deserves an inline cache — the rule this package already applies to `LifecycleManager.activationHandlersFor()`.

  Paired A/B against the previous build, seven passes alternating which side ran first, medians: `to-alias-redirect` **1.16×** (every pass 1.15–1.18) and `child-depth-2-resolve` **1.23×** (every pass 1.22–1.27), which were the two thinnest wins in the suite outside the lifecycle rows. `rebind-hot-swap` — the row that invalidates the cache on every iteration, so the only place a front cache could be pure overhead — reads 1.17×, after a five-pass run had put it at 0.88× on mixed signs; the tighter run is the one to believe.

  In the interleaved isolated suite `to-alias-redirect` reads **1.53×** of inversify 8.2.3, up from 1.33×, which is what the paired ratio predicts. `child-depth-2-resolve` reads **1.14×** there against 1.36× before — that row carries both of the report's instability markers (above 30M ops/s, and a per-trial IQR over 5%), its own throughput went _up_, and seven paired passes put it at 1.22–1.27×, so the paired number is the one that describes this change. The suite's aggregate moved from 42/0/1 to 42/1/0 at a slightly lower median on rows this change cannot reach, which is run-to-run drift rather than an effect.

  `null` is a real answer from that map, meaning "this token's shape needs the full selection path", so absence is tracked by the token slot rather than by the entry, and a registry-version change clears the slot along with the map.

  Folding alias hops into `registry.getFastDefault()` instead was considered and rejected as unsound: that index is a bare own-registry `Map.get` returning a binding, while an alias's terminal may live in a parent container and its invalidation depends on the whole chain's summed version, neither of which the registry can see.

- [#677](https://github.com/codefastlabs/codefast/pull/677) [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842) Thanks [@thevuong](https://github.com/thevuong)! - Remove a type parameter the resolver could never honour. Fifteen private methods took `Binding<Value>`
  and returned `Value`, but every caller supplied `Value` through an unchecked `as Binding<Value>` — so the
  generic documented an intent the compiler never verified. The internal lanes now take the erased
  `Binding` and return `unknown`, and the eight public resolve entry points each cast once, where the
  caller's token is the claim being made. Seventeen casts fewer in the resolver.

  What made that possible: the binding kinds declare their lifecycle hooks as methods rather than
  function-typed properties, so their parameters compare bivariantly and `Binding<Value>` stays assignable
  to `Binding`. The public `ActivationHandler` and `DeactivationHandler` are unchanged and still checked
  strictly, so a handler you write is verified exactly as before.

  No behaviour change: the emitted JavaScript is identical apart from one line break.

- [#677](https://github.com/codefastlabs/codefast/pull/677) [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842) Thanks [@thevuong](https://github.com/thevuong)! - Collapse the resolver's duplicated logic onto one rule per question, and fix the two places where a
  second copy had drifted.

  - `resolveAll(token, { name })` now evaluates a `when()` predicate on a named binding, as `resolve`
    always did. The name index answers the slot; the predicate is a further constraint, and the
    fast lane was returning a candidate `resolve` refuses.
  - Refining a binding's scope after its first resolve (`bind(T).toDynamic(f)` … later `.singleton()`)
    now reports the new scope to `when()` predicates that read `ctx.parent.scope`. The resolution
    frame is memoized on the binding and derives from `scope`, so the refinement has to drop it.

  Internally: slot matching, name-only requests, and the alias walk each exist once; a class's
  constructor params and a `toResolved` factory's descriptors resolve through one routine per lane;
  `scope` is declared by every binding kind, so the engine reads it as a plain field. No public API
  changed. Resolution throughput is unchanged or better across the benchmark suite — `resolveOptional`
  ~1.5×, transient class and `toResolved` construction ~1.35–1.44×, constants and named lookups
  ~1.3×, with the deep/wide graph rows at parity.

- [#677](https://github.com/codefastlabs/codefast/pull/677) [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842) Thanks [@thevuong](https://github.com/thevuong)! - Stop minting two arrays per top-level sync resolve, and stop a pooled resolution context re-storing pointers it already holds.

  `--prof` over the four thinnest rows put the largest di-attributed cost in a place none of this package's notes mention: `#acquireSyncResolutionContext` and `DefaultResolutionContext.reset()` together take **22%** of ticks on `fan-out-tree-depth-3-breadth-4` and **16%** on `scale-deep-transient-chain-512`, and `reset()` alone takes **10%** on `container-level-activation-hook`. The reason `reset()` is not free is that a pooled context outlives enough resolves to sit in old space, so each of its five field writes is a pointer store with a write barrier — and three of the five write the same resolver and the same two arrays every time.

  Except they did not, because `container.resolve()` handed every call a fresh `[]` pair. So both halves are needed together: a resolver now keeps one sync `rootPath`/`rootStack` pair, lent to a top-level resolve when `rootStack.length === 0` and otherwise replaced by a fresh pair, and `reset()` compares before storing. Every sync lane pops what it pushes, so an empty stack is an exact "nobody holds this"; a nested `container.resolve()` from inside a factory still starts from an empty path, and if a resolve ever left the pair dirty the only consequence is that later resolves mint their own.

  Paired A/B against this commit's parent, six passes alternating which side ran first: `constant-resolve` **1.70×**, `container-level-activation-hook` **1.67×**, `realistic-graph-resolve-root` **1.34×**, `fan-out-tree-depth-3-breadth-4` **1.28×**, `scale-deep-transient-chain-512` **1.21×**, `scale-mid-transient-chain-32` 1.16×, `singleton-class-1-dep` 1.13×, `to-alias-redirect` 1.09×, and `dynamic-async-chain-8` 0.99× as the untouched control.

  `transient-class-1-dep` reads **0.91×**, negative in all six passes, and the mechanism is the same one that wins the other rows: a fresh array is in new space, so pushing a frame onto it needs no write barrier, while the shared pair is in old space and every push pays one. That row pushes a frame and does nothing else, so it is the one shape where the barrier costs more than the two allocations saved. Kept because it is one row at −9% against five between +21% and +70%.

  `tests/unit/resolution/in-flight-invariants.test.ts` pins the lending rule in both directions — a nested root resolve gets its own pair, and a throwing resolve hands the pair back — and both were checked by breaking the guard.

- [#677](https://github.com/codefastlabs/codefast/pull/677) [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842) Thanks [@thevuong](https://github.com/thevuong)! - `toSelf()` on a token that is not a class now throws `SelfBindingRequiresClassError` instead of a bare
  `Error`, so it is catchable as a `DiError` like every other failure this package raises, carries a
  `code` and the token name, and is documented in SPEC.

  It was the one throw site outside the error taxonomy, and the architecture test could not see it —
  that test only read `export class …Error` declarations. It now also fails on any `throw new Error(…)`
  under `src/`, and on an error class the root barrel forgets to export.

- [#677](https://github.com/codefastlabs/codefast/pull/677) [`7fd9ba8`](https://github.com/codefastlabs/codefast/commit/7fd9ba82426493bee6ffd11a512920103a644842) Thanks [@thevuong](https://github.com/thevuong)! - Fix a tag request answering differently depending on how it was spelled. `resolve(T, { tags: [["n", -0]] })`
  matched a binding tagged `["n", 0]` while `resolve(T, { tag: ["n", -0] })` threw `NoMatchingBindingError`
  and `resolveAll` returned `[]` — three answers to one question.

  The registry indexes tagged bindings in a `Map`, so it answers by SameValueZero, while tag values compare
  by `Object.is` as SPEC §3.5 requires; the two differ on `+0` versus `-0`. The fast path now re-checks the
  index's answer, and only where the index can be wrong — a request whose tag value is not zero was already
  exact. `NaN` was never affected: both rules treat it as equal to itself.

- [#676](https://github.com/codefastlabs/codefast/pull/676) [`641e233`](https://github.com/codefastlabs/codefast/commit/641e2338d77fb61be2ca585a5986f34cf32ec746) Thanks [@thevuong](https://github.com/thevuong)! - Collapse the `types` and `default` lanes of `package.json#imports` from fallback arrays to single strings.

  Node resolves an imports array by taking the first candidate it can parse, without checking that the file exists and without falling through — a specifier whose first candidate is missing throws `ERR_MODULE_NOT_FOUND` rather than trying the second. `./dist/*/index.js` and `./dist/*/index.d.ts` could therefore never be reached, so they read as a safety net that does not exist. The `source` lane keeps its extension candidates, which only `tsc` and Vite read and both probe.

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
