# Architecture — `@codefast/di`

> **How to read this file.** These are working notes. Their job is to help the next person (possibly you, months from
> now) build an accurate mental model of the engine before changing it. They are not a fence around the code.
>
> Three kinds of statement are mixed together below, and each is labelled so you can tell them apart:
>
> - **Invariant** — a _correctness_ property that other parts of the engine, or the tests, depend on. Break one and
>   something resolves the wrong binding or throws where it should not. Almost every invariant here names the test that
>   pins it.
> - **Convention / Heuristic** — a shape kept for _performance_. It was true when written and it is re-measurable. Treat
>   any "this shape is faster" claim as a pointer to go measure it against the benchmark suite, not as settled fact.
> - **Practical note** — advice, and the occasional lesson the engine has already taught once.
>
> The honest summary: understand the shape and its invariants first, then change whatever you have a good reason to.

**What this document is.** It describes _what the shape is and what it guarantees_. What a shape **costs**, and whether
a new idea beats it, is an empirical question. The benchmark suite in
[`benchmarks/di-inversify`](../../benchmarks/di-inversify/README.md) answers it, and re-running the suite is how you
check. No figure belongs in this file: a cost claim has to be re-measurable, and numbers belong with the method that
produced them (the suite, its [`RESULTS.md`](../../benchmarks/di-inversify/RESULTS.md) ledger, or the commit).

<a id="overview"></a>

## Overview — the mental model

`@codefast/di` is a dependency-injection container. You register **bindings** (a token → how to build its value) into a
**registry**, and you **resolve** a token to get a value. Containers form a parent chain; a child that does not own a
token asks its parent. The value-building work lives in one engine class, `DependencyResolver`, which has a synchronous
pipeline and an asynchronous one.

A single `container.resolve(token)` goes through these steps:

1. **Find** the binding. A small cache answers the common case; otherwise the registry's indexes and the container chain
   are consulted.
2. **Select** among candidates when a token has several bindings, using the request's criteria (name, tags) and any
   `when()` predicates.
3. **Dispatch** on the binding's kind and scope: a constant is returned, a cached singleton is read off the binding, a
   factory is called, a class is constructed.
4. **Build dependencies** for a class or a `toResolved` descriptor. A static subgraph is compiled once into a plan;
   anything the compiler cannot see through re-enters the interpreted resolver.
5. **Guard against cycles** along the way, using the fact that synchronous code runs on one call stack.
6. **Run activation hooks** if the binding or container has any, then return the value.

Four ideas hold the whole design together, and every later section is an elaboration of one of them:

- **One binding shape, one owner.** Every binding is built at one construction site and belongs to exactly one
  container. Caches and singleton slots live on the binding itself because of this.
- **Two dependency sources, one slot shape.** A constructor parameter and a `toResolved` descriptor are the same
  structure to the engine, so every rule about dependencies exists once.
- **Fast lanes share semantics with the full path.** A fast lane is allowed to answer sooner, never differently. The
  matching rules exist in exactly one place, and the fast lanes call them.
- **Cycle detection follows the call stack.** Where code runs on one synchronous call stack, a flag or an array _is_ the
  ancestor chain. Where it does not (after an `await`), ancestors have to be carried explicitly.

**A few V8 terms used below.** V8 is Node's JavaScript engine. It gives every object a **hidden class** describing its
property layout; code that reads a property from objects of one hidden class is **monomorphic** and fast, while code
that sees many layouts becomes **megamorphic** and falls back to slower generic lookups. The per-site record of what
shapes a read has seen is its **type feedback** (kept in an **inline cache**). Objects that survive long enough are
moved from **new space** to **old space**; storing a pointer into an old-space object costs a **write barrier**, a small
bookkeeping step for the garbage collector. Finally, V8 **inlines** small hot functions into their callers, and a
function that grows past a size heuristic stops being inlined. Each term is explained again briefly where it matters.

<a id="layers"></a>

## Layered architecture

### The five levels

Dependencies point downward only. Nothing below knows about anything above. An upward **value** import is a violation; a
type-only one erases at build time and couples nothing.

```
container/        Container, fluent binding chain             ← the public surface
introspection/    inspector, dependency graph, adapters
  ↓
decorators/       @injectable, @inject, lifecycle decorators
metadata/         the reader port and its default reader
  ↓
resolution/       DependencyResolver + its collaborators      ← the engine
  ↓
lifecycle/        LifecycleManager, ScopeManager              ← per-container state
ambient/          the container an @inject accessor reads
  ↓
core/             token, types, tag, binding, registry, module   ← the model
errors/           the taxonomy and its diagnostics
injection/        the descriptor every dependency normalises to
```

Reading from the bottom:

- **`core/`, `errors/`, `injection/`** are the model: what a token, binding, registry and dependency descriptor _are_.
- **`lifecycle/` and `ambient/`** hold per-container state (scopes, activation hooks) and the "current container" an
  `@inject` accessor reads from.
- **`resolution/`** is the engine.
- **`decorators/` and `metadata/`** sit _above_ the engine. An `@inject` accessor's initializer resolves through the
  ambient container while the instance is being constructed, so decorators depend on resolution, not the other way
  around.
- **`container/` and `introspection/`** sit on top because they compose everything below: `container/` imports
  `@injectable`'s registry and four of the metadata modules.

The top two levels are not on any hot path, which is why they read as peripheral. They are still ordered, and an import
the other way is a violation.

### Three directories that name a rule

Most directories name a topic. Three name a rule instead:

- **`errors/` is cold by construction.** The hot path imports the error constructors and nothing else. Building a
  message is something an error path can afford, and a hot function's prefix cannot, so message building happens at the
  throw site.
- **`injection/` is the one shape both dependency sources normalise to.** Because of it, the model can read a dependency
  without reaching up into `decorators/`.
- **`resolution/` groups by lane** — `cache/`, `path/`, `plan/`, `select/` — because the reasoning about the engine is
  per-lane, not per-noun.

### Every module is an entry point

`package.json#exports` is generated by `codefast mirror` from the `mirror["@codefast/di"]` entry in
[`codefast.config.js`](../../codefast.config.js), with no exclusions. This repo is its own sole consumer, so full access
beats encapsulation. The root export additionally re-exports everything a typical consumer needs.

One naming consequence follows: the map is derived from `dist/`, so reorganising `src/` renames published specifiers.
`strip: "./introspection/"` pins the introspection modules' consumer-facing specifiers where they shipped.

> **Practical note.** `package.json#exports` is generated — edit `codefast.config.js` and re-run `pnpm cli:mirror`
> rather than hand-editing the map. If a refactor moves a directory, `pnpm cli:mirror:preview` shows renamed specifiers
> before you commit.

### Build and type-level facts

**The build runs `isolatedDeclarations`, so every exported value carries an explicit type.** Per-file declaration emit
needs to know the type a declaration emits without looking at other files. A `satisfies` alone is not enough: it
validates a literal without naming that type. The flag is set once for the whole repo in
`@codefast/typescript-config/library-build.json`.

**Covariance is annotated, not assumed.** `Token`, `Constructor` and `InjectionDescriptor` declare `out Value`. The
engine erases the value type at every internal lane and casts once at a public entry point, and that only works while
these three types are covariant. The annotation makes the compiler reject the day one of them stops being so.

The binding kinds deliberately have **no** variance annotation. Their lifecycle hooks are methods, so their parameters
compare bivariantly, and pinning a variance there would fight the assignability that
`tests/types/binding-variance.test.ts` exists to protect. [Value-type erasure](#value-erasure) explains why that
assignability matters.

<a id="core-model"></a>

## Core model

<a id="one-binding-shape"></a>

### Bindings: one shape, one construction site

Every binding is built by `createBinding()` in [`binding.ts`](src/core/binding.ts). It is a single object literal that
lists every kind's fields in one fixed order, so all bindings in a process share one V8 hidden class (the
engine-internal description of an object's property layout).

This matters because the resolver's hot property reads — `kind`, `scope`, `factory` — are then monomorphic: every
binding they see has the same layout. Mixed layouts would make those reads megamorphic, meaning V8 falls back to slow
generic property lookup. The registry stores what it is handed **by reference** rather than re-copying it, so the shape
survives registration.

> **Convention (performance-load-bearing).** Construct bindings through `createBinding()` and keep the literal's key
> order intact. A bare object literal, or reordered keys, quietly gives that binding a different hidden class and makes
> the hot reads megamorphic. It still _works_; it just gives back what the single hidden class buys. If you have a
> reason to change the construction site, measure it against the benchmark suite.

<a id="copy-on-write"></a>

### A token's binding list is copy-on-write

A token can carry several bindings, and the registry keeps them in a list. `add` and `removeById` **replace** that array
rather than splicing it.

The reason is selection. Selection walks the registry's own list while running `when()` predicates, and a predicate is
user code that may rebind the very token being walked. Because the walk holds its pre-mutation array, every candidate
registered at selection start still gets its predicate evaluated, and no defensive copy is needed on the read side.

> **Invariant (correctness).** A token's binding **list** is copy-on-write: `add` and `removeById` replace the array and
> never splice one that has been handed out. `tests/unit/resolution/select/binding-select.test.ts` pins the observable
> half.

<a id="scope-total"></a>

### `scope` is a total field

Every binding kind declares a `scope`, including `AliasBinding`, which declares `scope: "transient"`. An alias defers
scoping to what it points at, and that _is_ transient behaviour, so the declaration is truthful.

Because no kind is missing the field, the engine reads `scope` as a plain field with no `undefined` fallback.
`effectiveBindingScope()` is that read, kept as a named function because it is the vocabulary validation and
introspection speak. The gain is not the removed `??`: it is that the field's type feedback (V8's per-site record of the
shapes a read has seen) stays one shape.

<a id="value-erasure"></a>

### The engine erases the value type

Internally, every lane of the engine takes the erased union `Binding` and returns `unknown`. Only the eight public
resolve entry points name `Value`, and each casts exactly once, at the point where the caller's token is the claim being
made.

For that to type-check, `Binding<Value>` has to stay assignable to `Binding`. One declaration choice makes it so: the
lifecycle hooks on `BindingLifecycleHooks` are declared as **methods**, and TypeScript compares method parameters
bivariantly. Had they been function-typed properties, `Value` would sit in a parameter position, `strictFunctionTypes`
would make the binding invariant, and every internal signature would need either a cast or a structural stand-in.

The bivariance reaches only the field read off a binding. The public `ActivationHandler` stays a function-typed
property, so a user's handler is still checked strictly.

> **Invariant (type safety).** Internal lanes take `Binding` and return `unknown`; only the eight public resolve entry
> points name `Value`, and each casts once. A `Value` type parameter on a private method would be a fiction — the caller
> supplies it through an unchecked cast, so it documents an intent the compiler never verified.
> `tests/types/binding-variance.test.ts` fails to compile if the hooks lose method syntax.

<a id="frame-memo"></a>

### The memoised `frame` and scope refinement

A binding memoises a `frame` — the record a resolution path and a `when()` predicate see for it. `frame` derives from
the token name, id, kind, slot **and scope**.

A memo on a binding is only sound while what it derives from is immutable, and `scope` is the one field a fluent chain
writes in place after registration (see [The fluent chain](#fluent-chain)). So `singleton()`, `transient()` and
`scoped()` call `clearBindingFrame()`. Without it, a chain refined after its first resolve would report the old scope to
every `when()` predicate that reads `ctx.parent.scope`. `tests/unit/resolution/cache-invalidation.test.ts` pins it.

<a id="fluent-chain"></a>

### The fluent chain: one object, one registration

A binding is declared through a fluent chain such as `bind(T).toDynamic(f).singleton()`. Two facts about that chain
shape the rest of the model.

**Registration happens on `to*()`.** `toDynamic()` registers the binding. A refinement that follows, such as
`singleton()`, then writes `scope` in place on that same registered object. Only `when*()` re-slots the binding, because
slot and predicate are what the registry indexes on, and it re-registers under the chain's original id, so `id()` is
stable for the whole chain.

**One object per `bind()`.** A single `BindingChain` plays every role: the `BindToBuilder` before `to*()`, the
kind-specific builder after, and it commits to the registry itself. `bind()` is typed as `BindToBuilder`, so
`when*()`/`singleton()` are not reachable before a `to*()`. The ordering is a **type-level** guarantee, matching
[SPEC's fluent-chain section](SPEC.md#chain-order) ("Compiler enforce"). A caller who has no types, or casts past them,
gets a `ChainNotRegisteredError` naming the token, never a silent no-op. `whenDefault()` asserts registration too, for
that reason alone, since it otherwise has nothing to do.

> **Invariant (contract, two-part).** Both halves of the ordering contract are pinned, by two different kinds of test.
> `tests/types/container-api.test.ts` asserts the refinements are absent from `bind()`'s **type**;
> `tests/unit/container/bind-to-builder-order.test.ts` asserts every one of them **throws** before `to*()`. Asserting
> instead that the methods are absent from the _object_ would pin an implementation detail and forbid this single-object
> shape. If you change the class, check which of the two a failing test is actually holding.

<a id="resolution"></a>

## Resolution and planning

### The engine and its collaborators

`DependencyResolver` is one large class on purpose. `#private` access in JavaScript is per class, and the sync and async
pipelines both need the same private state on every hop. Splitting them behind interfaces would put a call and a
property load on paths that run millions of times a second. That is design reasoning, and it is a measurable claim: if
you want to challenge it, the benchmark suite is where.

Everything that needs no cross-instance private access is split out into a collaborator:

| Module                                                                                                                   | Owns                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| [`binding-lookup-cache.ts`](src/resolution/cache/binding-lookup-cache.ts)                                                | options-less token → `{binding, owner}` memo, alias hops folded, stamped with the chain's summed registry versions |
| [`class-introspector.ts`](src/resolution/cache/class-introspector.ts)                                                    | per-class metadata: constructor params, `@postConstruct` presence, accessor injection, and the `new` itself        |
| [`activation-need.ts`](src/resolution/cache/activation-need.ts)                                                          | per-binding "does this need the activation pipeline", versioned on the lifecycle manager                           |
| [`instantiation-plan.ts`](src/resolution/plan/instantiation-plan.ts)                                                     | the plan compiler ([Compiled plans and escapes](#plans))                                                           |
| [`resolution-path.ts`](src/resolution/path/resolution-path.ts)                                                           | cycle-detection bookkeeping carried on the path array                                                              |
| [`binding-select.ts`](src/resolution/select/binding-select.ts), [`constraints.ts`](src/resolution/select/constraints.ts) | candidate selection for name/tag/predicate shapes, and `matchesSlot()` — the one slot matcher                      |
| [`resolve-options.ts`](src/injection/resolve-options.ts)                                                                 | `DependencySlot`, the shape both dependency sources share, and the `ResolveOptions` derived from it                |

Lookup caches form their own parent chain mirroring the resolvers', for the same `#private`-is-per-class reason.

<a id="one-slot-shape"></a>

### Two dependency sources, one slot shape

A dependency reaches the engine from one of two sources: a class's constructor parameter (`ParamMetadata`, read by the
class introspector) or a `toResolved` `InjectionDescriptor`. Both are structurally a `DependencySlot`.

Because they share a shape, `#resolveDeps`/`#resolveDepsAsync` serve both and the plan compiler compiles both. That is
one pair of loops rather than four near-identical ones, and a dispatch rule that can no longer be fixed in only one of
them.

Two questions about a slot are answered in exactly one place each:

- **Does a slot match a request?** `matchesSlot()`.
- **Does a request carry exactly one criterion?** `singleCriterionOnlyOf()`. A lone name folds to the reserved
  `slotName` criterion there, so the name spelling and the tag spellings reach one lane.

The resolver's fast lanes are lanes, not separate semantics. Each one calls these two functions rather than re-deciding
the rule.

> **Invariant (single source of truth).** Whether a slot matches a request is answered by `matchesSlot()` alone, and
> whether a request carries exactly one criterion by `singleCriterionOnlyOf()`. A fast lane that re-implements either
> rule is how the spellings drift apart. (A lesson on this is recorded in [Lessons](#lessons).)

<a id="plans"></a>

### Compiled plans and escapes

**What a plan is.** A transient `class`/`resolved` binding resolved at the top level compiles once into a
nested-constructor closure. The static subgraph is cycle-checked **at compile time**, so executing the plan does no
per-resolve bookkeeping at all.

**What an escape is.** Some dependencies the compiler cannot see through: a factory, a scoped binding, an activation
hook, a class past the depth limit, a multi/optional/named param. Such a dependency does **not** sink the plan. It
compiles to an _escape_: a re-entry into the runtime resolver, seeded with exactly the ancestors the interpreted path
would have pushed at that point, and dispatched through exactly the resolve the interpreter would have called. Cycle
detection, constraint contexts and error paths are therefore identical to never having compiled. Without escapes, one
`toDynamic` dependency anywhere would drop the whole graph to the interpreted path.

> **Invariant (correctness).** An escape must stay behaviourally indistinguishable from the interpreted path. If you add
> a case, seed it with the same ancestors and replay the same call.
> `tests/unit/resolution/plan/instantiation-plan-escapes.test.ts` pins this.

**A dependency's criteria are fixed when it is declared, so nothing rebuilds them per hop.** `#compileInjectionThunk`
derives a named or tagged param's `ResolveOptions` at _compile_ time and captures them in the escape thunk. The
interpreted path has no such moment — `#resolveDep` runs per hop — so `resolveOptionsForSlot` memoises them on the slot
itself. That memo is sound to share across containers because it derives from the slot alone; a binding-keyed memo would
not be, since class metadata is global to the class rather than per container.

The memoised object is **frozen**. One object now answers every resolve of that slot, and a constraint predicate is
handed it as `currentResolveOptions`; a write through that reference would rewrite what the dependency asks for from
then on. Frozen, the attempt throws where it is made.

<a id="frame-copy"></a>

**The frame copy in `#compileEscapeThunk` is load-bearing.** An escape hands the runtime a _copy_ of the frame array
(`[...frames]`), never the array itself. Two mechanisms defeat any scheme that shares or lends that array:

- The membership `Set` that `enterResolutionPath` attaches past `RESOLUTION_SET_THRESHOLD` (see
  [Cycle detection](#cycles)) lives on the **array object**. A lent array would carry it into a lane that does not
  maintain it; a spread does not copy symbol-keyed properties, so `[...frames]` hands the escape an array with no set at
  all.
- A constraint predicate runs on a live seed **before any push**, at exactly the length a depth guard reads as idle, and
  can re-enter the same cached plan. One indexed write into a lent seed would then survive forever, whereas the
  interpreted lane's `rootStack` drains to zero after each top-level resolve and self-heals.

A poisoned frame changes which binding is selected — a wrong value, not just a wrong diagnostic. That is why this one is
firm rather than a matter of taste; anything faster here has to keep both mechanisms from firing.

**A criterion the registry can settle is baked into the plan.** `whenNamed`/`whenTagged` write criteria into the slot
rather than a predicate, so a single-criterion request is usually a plain index hit. `lookupPathIndependentEntry` bakes
that selection into the plan when, and only when, the candidate carries no predicate and its slot matches the request. A
predicate reads the resolution path, so it is the runtime's to evaluate.

> **Invariant (correctness).** An entry reached by a criterion carries that criterion into every escape it falls back
> to. `#compileDepThunk`'s escapes replay `resolveFromContext` — the _default_ slot — when handed no options, so a named
> singleton's cold materialisation or a named factory would silently resolve a different binding without this.
> `tests/unit/resolution/plan/instantiation-plan-named.test.ts` pins it.

<a id="lookup-caches"></a>

### Lookup caches and inline caches

**An inline cache in front of a map.** When a loop asks a map about the same key every iteration, a one-entry cache in
front of the map turns a hash lookup into a pointer compare. `LifecycleManager.activationHandlersFor()` keeps one such
token → hooks cache, invalidated by `registerActivation`, because a resolve loop asks about the same token every
iteration.

**`defaultEntry()` is the same shape one layer down.** `BindingLookupCache.defaultEntry()` is reached by exactly two
cases the registry's direct index cannot serve: an **alias**, whose terminal the index cannot name, and a token owned by
a **parent**, whose entry has to carry that owner. Both are resolved in a loop over one token. `null` is a real answer
there ("this shape needs full selection"), so the slot tracks absence by its token, not by its entry.

> **Invariant (correctness).** Alias hops are not folded into `registry.getFastDefault()`. That method is a bare
> own-registry `Map.get` returning a binding, and an alias terminal may live in a parent container whose rebind only the
> chain's summed version can see. Alias folding belongs where the version stamp is; moving it into `getFastDefault()`
> would miss a parent rebind.

**`taggedEntry()` mirrors `defaultEntry()`, and defers its map.** It is chain-versioned, `null` means "this shape needs
full selection", and predicate- and alias-carrying hits are declined. The memo key is the criterion object itself:
interning (see [Criteria and tag indexes](#criteria)) makes identity the slot contract's own `Object.is`, so an indexed
hit needs no value re-check.

One difference came out of measuring fresh containers against warm ones. A per-request child usually asks one
`(token, tag)` exactly once, and allocating an inner map on that first ask was the whole cost of the memo on that shape.
So the first shape a cache generation sees is answered from the walk and parked in a one-entry front, and the map is not
written until a second distinct shape appears. An alternating pair converges after one extra walk per key. The
warm-vs-fresh numbers that settled this, and the shape's A/B, live in the benchmark suite's `RESULTS.md`.

**Late hooks are why the activation-need memo reads the field first.** `.onActivation()` writes the hook field **in
place** on an already-registered binding and bumps no version. `needsActivation()` therefore answers the binding's own
hook from the field itself before touching the memo, and stamps the memo with the registry version too, so a rebind loop
cannot grow it. `tests/unit/resolution/cache-invalidation.test.ts` pins all the lanes. (The silent failure this guards
against is recorded in [Lessons](#lessons).)

**One alias walk, one set of not-bound diagnostics.** `resolve` and `resolveAsync` both take their terminal binding from
`#requireBinding`, so the alias-cycle walk and the diagnostics exist once. The stack frame that adds is charged only to
a resolve that fails, and constructing the error at the throw site rather than in the helper keeps most of the cost
there.

<a id="criteria"></a>

### Criteria: interning and the tag indexes

**A criterion is interned.** A tag key is minted by `tag()` and its criteria by `TagKey.of()`, which caches one object
per value. So the `Object.is` equality the contract specifies ([SPEC — ResolveOptions](SPEC.md#resolve-options)) becomes
object identity, and the registry keys tagged bindings by the criterion itself rather than by key-then-value.

Interning removes a hash level from every tagged lookup. More importantly, it removes a divergence: a value-keyed `Map`
compares keys by SameValueZero, which holds `+0` and `-0` equal, while `Object.is` does not. The intern cache splits
those two under a private symbol, so the index cannot conflate them.

> **Invariant (correctness).** A `BindingTag` is only ever constructed through `TagKey.of()` — the brand on the type is
> the enforcement — because interning is what makes identity sound here.
> `tests/unit/resolution/select/tagged-selection.test.ts` pins the `±0` split it buys. Constructing one another way
> would let the index conflate `+0` and `-0`.

**The multi-tag lane prefilters on keys with a bitmask.** Each key carries a bit, each slot the OR of its keys, and a
request the OR of what it names. A slot whose keys the request does not cover is rejected by
`(requestMask & slotMask) !== slotMask` before any criterion is read — a subset test a `Map` cannot do. Bits wrap every
32 keys, so two keys can share one; that is a false positive the identity comparison then rejects, never a false
negative.

**Three spellings are one request.** `tag: pair`, `tags: [pair]` and — through the reserved criterion — `name: n` are
each one-criterion requests. `singleCriterionOnlyOf` is the admission test into the single-criterion lane, and it sees
all three the same way. A request carrying criteria from **two** sources at once still declines: two criteria asked for
is not something a one-criterion index can answer without skipping the ambiguity check the full path runs.

> **Invariant (consistency of contract).** Two spellings SPEC calls equivalent have to reach the same lane, or the
> shorter one becomes the slower one and the documentation recommending it becomes wrong.
> [SPEC](SPEC.md#resolve-options) makes the two spellings one request;
> `tests/unit/resolution/select/tag-shorthand-parity.test.ts` pins the lane alongside the answer.

**`resolveAll` reads the tag index too.** A request carrying exactly one criterion (a lone name folds to the reserved
criterion) matches exactly the bindings whose slot _is_ that criterion: a multi-criterion slot cannot satisfy it, and
last-wins keeps at most one such binding per registry. So the index holds the whole answer per container, and walking
the chain produces the candidate set rather than a prefilter. Both lanes that read the index evaluate a found binding's
predicate, because a predicate needs a live context no index can hold.

**Several criteria form a subset query.** A request carrying several criteria matches every binding whose criteria are a
subset of them: `[A]`, `[B]` and `[A,B]` all answer a request for `[A,B]`. No single `Map` lookup can serve that. The
index that serves it buckets every multi-criterion slot under its **first** criterion. A matching slot's every criterion
is in the request, its first included, so walking the request's few buckets (plus the single-tag index under each
request criterion, the folded name criterion among them) finds each candidate **exactly once**. There is no dedup set,
no per-resolve allocation beyond the candidate list selection was already building, and no stringified tag values —
buckets are keyed by the interned criterion, so the `Object.is` rule in [SPEC](SPEC.md#resolve-options) still holds.

Two deliberate bounds on that lane:

- It serves **`resolve` only**. `resolveAll` keeps the full scan, because its result order follows the token's list and
  bucket order would reorder it.
- It engages only past a **size threshold** on the token's list. Under it, the generic scan is cheaper than the bucket
  walk. The threshold switches the data structure, never the semantics: both paths answer identically, which
  `tests/unit/resolution/select/multi-tag-selection.test.ts` pins along with the subset, specificity, predicate and
  index-invalidation behaviour. The residual cost on a small list is one length read.

<a id="cycles"></a>

### Cycle detection: two mechanisms, on purpose

A **resolution path** is the chain of ancestors a level is being resolved under — "A is resolving B, which is resolving
C". A cycle is a binding that appears on its own path. How that path is represented depends on whether the code
producing it runs on one synchronous call stack.

| Lane                   | Mechanism                                                            | Why not the other one                                                                                               |
| ---------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Sync transient-dynamic | `binding.inFlight`, set on factory-enter and cleared on exit         | Sync resolution runs on one call stack, so the flag _is_ exact path membership: `O(1)`, no hashing, no side table   |
| Everything else sync   | `enterResolutionPath` — push and pop one shared path/stack pair      | One call stack, so the array _is_ a stack; a per-binding flag cannot name the path in the error                     |
| Async, in a cascade    | `binding.inFlight`, cleared when the factory returns its **promise** | The request that closes a cycle comes from a factory's synchronous prefix, and synchronous code does not interleave |
| Async, out of one      | `extendResolutionBranch` — append-only path, read by branch depth    | A continuation's ancestors are on no call stack, so they have to be carried explicitly                              |

**Both variants of the first lane take the flag**, with and without activation hooks, because the argument for it does
not mention hooks: a hook runs on the same call stack the factory did. A hook that re-resolves its own token still
reports `CircularDependencyError` rather than recursing, and the flag is still released on every exit path.
`tests/unit/resolution/in-flight-invariants.test.ts` pins both for the hooked lane too.

**Every path-based check keys on binding identity, never on a token's display name.** A display name is not unique: two
`token("Config")` from different modules are distinct tokens. `enterResolutionPath` and `extendResolutionBranch` compare
`bindingId` read off the frame stack. The names an error or `ctx.resolutionPath` reports are **derived from the frames**
at the moment they are asked for, so no name array exists to keep in step. A hop pushes and pops one stack, the branch
helper takes one depth, and an escape thunk copies one frame array; the error path pays for name materialisation, not
the hot path.

**A membership set past a depth threshold.** `enterResolutionPath` scans the frames linearly while the stack is short,
and attaches a membership `Set` of binding ids to the array once the stack passes `RESOLUTION_SET_THRESHOLD`, which
is 32. The threshold switches a **data structure**, not a behaviour: both branches answer identically. The 32 is a
tuning constant from a depth sweep; re-sweeping it with the benchmark is cheap if the typical graph depth in real
consumers shifts, or the collector's behaviour changes.

**The set is seeded from the stack, so it has to notice when it has gone stale.** The frames already on the stack when
the set attaches are handed no set and delete nothing on unwind. The array outlives a resolve — the resolver lends one
stack (see [The context pool](#context-pool)) — so a set that survived the unwind would refuse bindings nobody is
resolving. A live set mirrors the stack exactly (ids on an acyclic path are unique), so `enterResolutionPath` drops one
whose size no longer matches the stack's length, and the next deep frame rebuilds it.
`tests/unit/resolution/path/resolution-path.test.ts` pins the three ways the seed becomes observable: a second resolve
of the same deep graph, a sibling branch below the attach depth, and the entry point called directly.

> **Invariant (correctness).** A threshold in this engine may choose an implementation; it must not choose a semantics.
> Both sides of `RESOLUTION_SET_THRESHOLD` answer identically, and so do both sides of the multi-tag size threshold in
> [Criteria and tag indexes](#criteria). A threshold that switched _lanes_ once changed context identity, stack frames
> and promise shape at the crossing point, and reported a false cycle for a diamond dependency past it; that story is in
> [Lessons](#lessons).

<a id="async"></a>

### The async pipeline: a cascade lane and a branch lane

The sync pipeline gets two things for free from the call stack: one array pushed and popped **is** the ancestor chain,
and `binding.inFlight` is exact membership in it. The async pipeline has both properties too, for the requests that
matter, and one lane exists to exploit them.

**The cascade lane.** A factory's request for a dependency is made from its synchronous prefix:
`async ctx => await ctx.resolveAsync(dep)` calls `resolveAsync` before it awaits anything. So the chain of "who is
resolving whom" at the moment of a request is the synchronous call stack, and a whole eight-level chain is built inside
**one** synchronous cascade before any of it settles.

While that cascade is open, the resolver's own `#cascadeStack` is the ancestor chain: pushed on factory-enter, popped
when the factory returns **its promise**, not when that promise settles. Two cascades can never interleave, so
`binding.inFlight` is exact path membership again, and every level shares one `AsyncCascadeContext`. Nothing is
allocated per level, and nothing observes its own settlement.

A consequence of clearing the flag on promise-return is that a **diamond** resolves correctly. When `A` awaits `B` and
`C` in parallel and both need `D`, `D`'s flag is already clear when the second sibling reaches it, so no cycle is
reported for `b → d → c`, which is not a dependency edge at all.

**The branch lane.** A request made from a continuation, after an `await`, has ancestors on no call stack. Such a
request arrives with the cascade empty, which is an exact test — a continuation never runs inside a synchronous cascade
— so it **escapes** to the branch lane, seeded with a snapshot of the ancestors the cascade had reached. Anything the
cascade lane does not serve escapes the same way. Once a subtree leaves the cascade it stays off it, which is what keeps
a cycle crossing the boundary on one path.

The branch lane is the general one. `extendResolutionBranch` appends to a path while this branch still owns the next
slot, and copies its own prefix once a sibling has claimed it. Nothing is removed there either, so it needs no settle
listener; it pays a context per level instead. A cycle formed entirely from post-await edges is caught there —
`post-q → post-p → post-q` — one level in from the true root, because the ancestors before the first escape were never
written down. That imprecision is the price of the cascade lane, and `tests/unit/resolution/resolver-async.test.ts` pins
it rather than leaving it to be discovered.

> **Invariant (ownership, held by the compiler).** A branch may only ever append to an array it minted itself. A sync
> frame's path is one that frame will pop in its own `finally`, and it may carry an `enterResolutionPath` membership
> `Set` this lane cannot keep true. So `extendResolutionBranch` is the only thing that mints an `OwnedBranchStack`,
> `AsyncLevelContext` accepts nothing else, and a `BranchDepth` is branded so a bare number cannot stand in for one — a
> depth from anywhere but this branch silently re-parents a level. `AsyncLevelContext` reads its depth off the branch it
> was handed rather than taking it as a parameter, so the two cannot disagree.
> `tests/types/async-branch-ownership.test.ts` fails to compile if either brand is removed. Check that it still fails
> before trusting it: a type test that compiles once its invariant is gone asserts nothing.

The cascade entry answers a plain constant and a cached singleton itself rather than escaping. A materialised async
singleton that escaped would snapshot both cascade arrays for a resolve that never reads a path. (A perf shape, not a
correctness matter.)

**Async plans.** The sync lane's compiled plan ([Compiled plans and escapes](#plans)) ports to async exactly as far as
the graph is visible. `class`, `resolved` and `resolved-async` bindings declare their dependencies, so `compileAsync`
compiles those into an async plan. A `dynamic-async` factory stays opaque and keeps the cascade, which needs no graph
because it reads the ancestors off the call stack that is already there.

The async plan runs only at a **true root**: a `resolveAsync` arriving with the cascade idle. Inside an open cascade the
same binding escapes instead, because a plan does no bookkeeping and its escapes must carry the live ancestors. Each
node's promise-ness is settled at compile time: a fully synchronous subtree touches no promise at all, and anything that
may yield one routes its dependencies through `Promise.all`. That is exactly how the interpreted async path treats every
dependency, down to unwrapping a promise-valued constant and starting every sibling before the first rejection
propagates. `tests/unit/resolution/plan/instantiation-plan-async.test.ts` pins the lane being active, the escape
criteria, the late-hook invalidation, and those two exactness corners.

<a id="context-pool"></a>

### The sync context pool, and the stack it lends

**What is pooled.** A sync resolve needs a resolution context per depth level. Rather than allocating one per level, the
resolver keeps a pool indexed by depth and calls `reset()` on a pooled context, which writes a handful of fields.
Pooling beat per-level allocation in measurement, which is why it is there.

**Why the fields are compared before they are stored.** A pooled context outlives enough resolves to be promoted to V8's
**old space**, and every pointer write into an old-space object pays a **write barrier** (a small bookkeeping step for
the garbage collector). So `reset()` compares the resolver and the stack against what the context already holds and
writes only when they differ. That comparison can only ever hit if the stack is the same object, which is why one stack
is reused per resolver rather than minted per `container.resolve()` call.

The same mechanism sets the price of the shared stack: a fresh array lives in new space and needs no barrier to push a
frame onto, while the shared stack pays one per push.

> **Invariant (lending protocol).** An empty `rootStack` _is_ the whole lending protocol. Every sync lane pops what it
> pushes, so a non-empty stack means a resolve is holding it and the caller mints its own. A nested
> `container.resolve()` inside a factory must therefore still see an empty stack, and a resolve that throws must hand it
> back; `tests/unit/resolution/in-flight-invariants.test.ts` pins both. If the stack ever leaks dirty, the failure mode
> is lost reuse (slower), never a wrong path — the protocol is built so that the correctness case cannot break here.

> **Invariant (correctness).** A pooled context is reused only for the stack it already holds. The pools are keyed by
> stack — one for the root stack, one for the cascade stack, each depth-indexed — and any other stack (a nested
> resolve's minted array, an async level's snapshot) mints a context per call. A nested top-level resolve reaches the
> same depth while the outer factory still holds that depth's pooled context; re-pointing it at the nested resolve's
> freshly minted stack would leave the outer factory's `ctx` answering from the wrong path, so a `when()` predicate
> reading `ctx.parent` would select the wrong binding. Keying the pools by stack holds this structurally, with one
> pointer compare on the hot lane. Asking the context whether it holds the requested array answered the same question
> but cost the acquire its inlining. `tests/unit/resolution/context-pool-isolation.test.ts` pins the behaviour.

<a id="deferral"></a>

### A container defers most of itself

`DefaultContainer`'s constructor builds only what a resolve cannot happen without: the registry, the scope manager, the
lifecycle manager and the resolver chain. Everything else arrives on first use — the inspector, the module ref/binding
tables, the scope's in-flight and scoped caches, the registry's tagged slot indexes, and the class introspector's three
metadata caches.

The reason is that an empty `Map` is not free: V8 gives it a backing store. Those are `Map`s a bind-and-resolve
container never reads.

> **Invariant (correctness).** Deferral is an allocation decision only. A deferred collaborator must answer identically
> whether or not something touched it first — an unallocated cache reads as a miss, never as an error — which is why
> `tests/unit/container/deferred-subsystems.test.ts` exercises each one as the _first_ thing a fresh container does.

<a id="singleton-on-binding"></a>

### One binding, one container, and the singleton slot that follows

A binding is registered by its chain into exactly one registry, and only that container's scope ever caches it. A child
resolving a parent's token delegates to the parent resolver, which owns the same binding object.

Because of that, a singleton's slot is **per-binding, not per-container**. The instance lives on `binding.instance`
(`NO_INSTANCE` when unset) instead of in a `Map` keyed by binding id. That replaces a keyed lookup with a field read on
the most common resolve shape there is: a transient over cached singletons. `ScopeManager` keeps only a lazily-created
list of the bindings that have materialised, so disposal and `inspect()` can still enumerate them.

> **Invariant (correctness).** This is only sound while one binding maps to one owning container. Anything that would
> share a binding object between two registries — a snapshot that re-registers into a different container, a clone that
> copies bindings by reference — breaks it silently, by making two containers share one instance.
> `tests/unit/resolution/singleton-on-binding.test.ts` pins the parts that are easy to get wrong: the chain-shared read,
> invalidation on unbind and rebind, enumeration for disposal, and a cached `undefined` that must stay distinguishable
> from a miss.

<a id="invariants"></a>

## Important invariants

Every invariant above, grouped, with the test that pins it. Read this table before touching a file; read the linked
section before changing what the table describes.

**Model and types**

| Invariant                                                                                                                                | Pinned by                                                                                 | Where                                             |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------- |
| A token's binding list is copy-on-write; `add`/`removeById` never splice a handed-out array.                                             | `tests/unit/resolution/select/binding-select.test.ts`                                     | [Copy-on-write binding list](#copy-on-write)      |
| Internal lanes take `Binding` and return `unknown`; only the eight public entry points name `Value`. Lifecycle hooks stay method syntax. | `tests/types/binding-variance.test.ts`                                                    | [Value-type erasure](#value-erasure)              |
| `frame` is cleared whenever `scope` is refined in place.                                                                                 | `tests/unit/resolution/cache-invalidation.test.ts`                                        | [The memoised `frame`](#frame-memo)               |
| Chain refinements are absent from `bind()`'s type **and** throw before `to*()`.                                                          | `tests/types/container-api.test.ts`, `tests/unit/container/bind-to-builder-order.test.ts` | [The fluent chain](#fluent-chain)                 |
| One binding belongs to one container; the singleton slot lives on the binding.                                                           | `tests/unit/resolution/singleton-on-binding.test.ts`                                      | [Singleton on the binding](#singleton-on-binding) |

**Selection and lookup**

| Invariant                                                                                                                          | Pinned by                                                       | Where                                 |
| ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------- |
| `matchesSlot()` and `singleCriterionOnlyOf()` are the only places their two rules are decided.                                     | (design rule; the parity and selection tests below exercise it) | [One slot shape](#one-slot-shape)     |
| A `BindingTag` is only constructed through `TagKey.of()`; the index never conflates `+0` and `-0`.                                 | `tests/unit/resolution/select/tagged-selection.test.ts`         | [Criteria and tag indexes](#criteria) |
| Equivalent spellings (`tag`, `tags`, folded `name`) reach the same lane.                                                           | `tests/unit/resolution/select/tag-shorthand-parity.test.ts`     | [Criteria and tag indexes](#criteria) |
| The multi-tag size threshold switches data structure only; both sides answer identically.                                          | `tests/unit/resolution/select/multi-tag-selection.test.ts`      | [Criteria and tag indexes](#criteria) |
| Alias hops are folded where the chain version stamp is, never in `registry.getFastDefault()`.                                      | (structural)                                                    | [Lookup caches](#lookup-caches)       |
| `needsActivation()` reads a binding's own late hook from the field before the memo, and stamps the memo with the registry version. | `tests/unit/resolution/cache-invalidation.test.ts`              | [Lookup caches](#lookup-caches)       |

**Plans and escapes**

| Invariant                                                                                          | Pinned by                                                       | Where                                |
| -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------ |
| An escape is behaviourally indistinguishable from the interpreted path: same ancestors, same call. | `tests/unit/resolution/plan/instantiation-plan-escapes.test.ts` | [Compiled plans and escapes](#plans) |
| An escape thunk copies the frame array; it never lends it.                                         | (structural; see the two mechanisms)                            | [The frame copy](#frame-copy)        |
| An entry reached by a criterion carries that criterion into every escape.                          | `tests/unit/resolution/plan/instantiation-plan-named.test.ts`   | [Compiled plans and escapes](#plans) |
| The async plan runs only at a true root and mirrors the interpreted async path exactly.            | `tests/unit/resolution/plan/instantiation-plan-async.test.ts`   | [The async pipeline](#async)         |

**Cycle detection and paths**

| Invariant                                                                                    | Pinned by                                            | Where                        |
| -------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ---------------------------- |
| `binding.inFlight` is set and released on every exit path, with or without activation hooks. | `tests/unit/resolution/in-flight-invariants.test.ts` | [Cycle detection](#cycles)   |
| Path checks key on binding identity, never on a display name.                                | (structural)                                         | [Cycle detection](#cycles)   |
| A stale membership set is detected by size mismatch and rebuilt.                             | `tests/unit/resolution/path/resolution-path.test.ts` | [Cycle detection](#cycles)   |
| A threshold may choose an implementation, never a semantics.                                 | the two threshold tests above                        | [Cycle detection](#cycles)   |
| A branch appends only to an `OwnedBranchStack` it minted; `BranchDepth` is branded.          | `tests/types/async-branch-ownership.test.ts`         | [The async pipeline](#async) |
| A post-await-only cycle is reported one level in from the true root.                         | `tests/unit/resolution/resolver-async.test.ts`       | [The async pipeline](#async) |

**Pooling, lending and deferral**

| Invariant                                                                                             | Pinned by                                              | Where                             |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | --------------------------------- |
| An empty `rootStack` is the lending protocol; a nested resolve sees it empty, a throw returns it.     | `tests/unit/resolution/in-flight-invariants.test.ts`   | [The context pool](#context-pool) |
| A pooled context is reused only for the stack it already holds; pools are keyed by stack.             | `tests/unit/resolution/context-pool-isolation.test.ts` | [The context pool](#context-pool) |
| Deferral is an allocation decision only; a deferred subsystem answers identically when first touched. | `tests/unit/container/deferred-subsystems.test.ts`     | [Deferral](#deferral)             |

<a id="performance"></a>

## Performance-sensitive decisions

Every item here is a shape kept because it measured well at the time. None is an axiom. If you touch one, re-run the
benchmark suite before and after; if the arities or workloads the suite measures have changed, the trade may have too.

<a id="fast-lanes"></a>

### Fast lanes that read as duplication

Two shapes in the resolver look like copy-paste of `#resolveBinding`. Both are deliberate.

**A candidate answers where it is selected.** `#resolveCandidateSync`/`#resolveCandidateAsync` re-check plain-constant
and cached-singleton before delegating, which `#resolveBinding` would check anyway. Routing every candidate through
`#resolveBinding` instead pays those checks per candidate rather than per call, and a `resolveAll` over cached
singletons multiplies that out.

**The dispatcher's prefix is charged to every resolve.** In `#resolveDefaultEntry` the plain-constant test lives
_inside_ the `singleton` branch, because a constant is a singleton that is already its own instance. Hoisting it to the
top, where it reads more naturally, would help a constant resolve and charge every transient-factory resolve for a kind
it never has.

> **Heuristic (perf, not correctness).** A test tends to be cheapest under the branch that already implies it. A test in
> the hot dispatcher's prefix is paid by every resolve that _is not_ the case it is looking for, and there are usually
> more of those. This dispatcher is also inlining-sensitive: a test added inside a branch it does not even take has
> moved an unrelated row in the benchmark, because it changed the function's size. That sensitivity is a V8 property and
> can shift between versions, so measure any edit near it against the benchmark rather than trusting a past number.

The same reasoning covers two smaller shapes. `#taggedBindingsFromChain` returns `[binding]` whole for a root container
rather than growing an empty list, because a criterion matches at most once per registry and the size is known.
`#findBinding` treats a lone candidate as its own selection: matching it _is_ the decision, with no specificity to weigh
and no ambiguity to report.

> **Practical note.** Both duplicated shapes were removed on a DRY pass and put back after measuring the regression.
> That is their honest status: the duplication earns its keep at the arities the suite measures, and if those change the
> trade is worth revisiting. Re-run the benchmark before assuming either way.

### Upserts: eager or computed, by hit rate

The package's own upsert helpers in [`core/map-upsert.ts`](src/core/map-upsert.ts) come in two forms. `getOrInsert`
takes a fallback the caller has already evaluated; `getOrInsertComputed` calls a factory only on a miss. The choice
follows which case dominates:

- `BindingLookupCache.taggedEntry()` runs on every criterion-carrying resolve and almost always hits on a long-lived
  container, so it takes the computed form, with the factory hoisted to module scope so no closure is allocated per
  call.
- The registry's index insertions are the mirror image: a bind is usually the token's first, so the fallback is usually
  the value that gets stored, and the eager form wins. (`add()` itself no longer upserts — its list is copy-on-write, so
  it always builds the next array.)

Both forms are in the tree on purpose. They stay the package's own rather than the platform's ES2025 `Map` methods,
which would move the Node floor to 26 for two call shapes a local helper already covers. Both reject a value type that
admits `undefined`, because they read absence with one `get` rather than a second `has`; a map that stores `undefined`
needs `ScopeManager.readScoped()`'s shape, not this one.

A lazily allocated index also spells its type arguments — `this.#field ??= new Map<Key, Value>()` — because TypeScript
does not contextually type the right-hand side of `??=`. A bare `new Map()` there becomes `Map<any, any>` and silently
drops every check that reads the field.

> **Practical note.** "Almost always hits" is a claim about a long-lived container. It inverts in a per-request one,
> where every first criterion-carrying resolve of a token buys a map it will not read again. Measure fresh vs warm if
> you revisit this; the deferred inner map in [Lookup caches](#lookup-caches) is what that measurement produced.

### Shapes described elsewhere that are perf decisions

These are covered in the sections above; this list exists so a perf review can find them in one place.

- **One hidden class for all bindings** — [One shape, one construction site](#one-binding-shape). Convention: build
  through `createBinding()`.
- **`scope` as a total field** — [`scope` is a total field](#scope-total). Keeps the field's type feedback one shape.
- **Path-independent entries baked into plans** — [Compiled plans and escapes](#plans). Saves a runtime lookup per
  criterion-carrying param.
- **One-entry inline caches in front of maps**, and the deferred inner map in `taggedEntry()` —
  [Lookup caches](#lookup-caches).
- **Interned criteria as `Map` keys**, and the bitmask prefilter — [Criteria and tag indexes](#criteria). Removes a hash
  level and the stringification of tag values.
- **Multi-tag bucket index past a size threshold** — [Criteria and tag indexes](#criteria). Semantics identical on both
  sides.
- **Membership `Set` past `RESOLUTION_SET_THRESHOLD` (32)** — [Cycle detection](#cycles). A depth-sweep tuning constant.
- **The cascade lane allocating nothing per level**, and the cascade entry answering constants and cached singletons
  itself — [The async pipeline](#async).
- **The depth-indexed context pool** and the shared, lent `rootStack` — [The context pool](#context-pool). Write
  barriers are the cost model.
- **Deferred subsystems** — [Deferral](#deferral). An empty `Map` has a backing store.
- **Singleton instance on the binding** — [Singleton on the binding](#singleton-on-binding). Field read instead of keyed
  lookup.
- **Errors built at the throw site** — [Layered architecture](#layers) and `#requireBinding` in
  [Lookup caches](#lookup-caches).

<a id="practical-notes"></a>

## Practical notes for maintainers

### Changing anything here

There is no gate to clear, just a suggested order that tends to save time:

1. Understand the invariant(s) the code you are touching depends on (the labelled blocks above and the table in
   [Important invariants](#invariants)), and check the test named next to each. If a test is what is holding an
   invariant, it will tell you fast whether your change broke it.
2. If the change is about speed, measure it. What a shape costs, and whether a new idea beats it, is an empirical
   question. The benchmark suite ([`benchmarks/di-inversify`](../../benchmarks/di-inversify/README.md)) is the source of
   truth, [`BENCH_GUIDE.md`](../../benchmarks/di-inversify/BENCH_GUIDE.md) is the method, and the performance step of
   [CONTRIBUTING.md](./CONTRIBUTING.md#guard-performance) is the checklist.

Two things that guide does not cover and this engine keeps demonstrating:

- **Measure cold paths too.** A change that wins the hot loop can lose badly on container construction, and the hot
  loops hide it completely.
- **Validate a perf idea by throwaway ablation, not by reasoning.** Build the variant, measure it, delete it. Past
  attempts against this engine were mostly wrong in the direction their author expected, which is the best argument for
  measuring rather than arguing.

### Type tests need to be checked in both directions

A type test that compiles once its invariant is gone asserts nothing. Before trusting `tests/types/*` to hold an
invariant, remove the thing it guards and confirm the test stops compiling. This applies to the variance test, the
container-API test and the branch-ownership test alike.

### Two tests can hold one contract

The fluent-chain ordering ([The fluent chain](#fluent-chain)) is pinned by a type test and a runtime test that assert
different things. When one fails, work out which half it is holding before reshaping the class; asserting on the
object's shape instead would forbid the single-object design.

<a id="lessons"></a>

### Lessons the engine has already taught

Each of these is a failure that happened once and is now pinned by a test. They are kept here because each one is a
general pattern, not just a fixed bug.

- **A fast lane that re-decides a rule drifts from the full path.** `resolveAll`'s name lane once returned a binding
  whose `when()` predicate `resolve` was refusing, because it re-implemented the slot match instead of calling
  `matchesSlot()`. That is why [One slot shape](#one-slot-shape) insists on one matcher.
- **Reading the presence of a key as a reason to give up hid the recommended spelling from the index.**
  `singleCriterionOnlyOf` once treated a present `tag` field as "not a single criterion", which made the shorthand — the
  form the README reaches for — the only spelling the index never served. The parity test in
  [Criteria and tag indexes](#criteria) exists because of it.
- **A restriction can outlive the fact that justified it.** `simpleTagOf` once excluded predicate-bearing bindings from
  the tag index "because the index is read without a re-check". That justification stayed in place long after the `±0`
  fix had given every indexed hit a predicate evaluation. The predicate evaluation is now pinned by
  `tests/unit/resolution/select/tagged-selection.test.ts`, so the failure stale reasoning could have caused — an indexed
  hit reaching a caller past a predicate that refused it — cannot land quietly. When you read _any_ comment justifying a
  restriction, check whether the reason is still true.
- **A dependency escaped too early.** A named or tagged dependency used to escape on `options !== undefined`, before
  anything tried to look it up. `lookupPathIndependentEntry` ([Compiled plans and escapes](#plans)) is the fix: a
  criterion the registry can settle is not opaque.
- **A memo keyed on binding id missed a late hook.** The activation-need memo once cached "no activation" per binding id
  and skipped a late `.onActivation()` hook on every lane that consulted it, while the default dynamic lane read the
  field fresh and honoured it. The failure was silent. [Lookup caches](#lookup-caches) describes the fix.
- **A name-keyed cycle check reported a false cycle.** Two `token("Config")` from different modules are distinct tokens,
  and a check keyed on display name reported a cycle for a legitimately acyclic chain that held both. Every path check
  now keys on `bindingId` ([Cycle detection](#cycles)).
- **A threshold that switched lanes changed semantics.** A removed constant, `DEEP_LANE_THRESHOLD`, switched the async
  pipeline between _lanes_ past a depth. That silently changed context identity, stack frames and promise shape at the
  crossing point, and reported a false `CircularDependencyError` for a diamond dependency past it.
  `RESOLUTION_SET_THRESHOLD` broke the same rule once while looking like it was only choosing a data structure, which is
  why the invariant in [Cycle detection](#cycles) is stated as a rule about thresholds in general.
- **The old shared async path reported a false cycle for a diamond.** Before the cascade lane, a settle-scoped path
  reported `Circular dependency detected: a → b → d → c → d` for `A` awaiting `B` and `C` in parallel, both needing `D`.
  Clearing `inFlight` on promise-return ([The async pipeline](#async)) removed it.
- **The cheapest answer to "what should this return when there is nothing to return" is no method.**
  `ScopeManager.getAllScoped()` was the only bulk reader that could meet an unallocated cache, and it had no callers, so
  it was removed rather than given an empty-map fallback.

<a id="changelog"></a>

## Changelog of this rewrite

This section records how the document changed in the rewrite. The technical content — every invariant, convention,
heuristic, test reference, benchmark reference and design rationale — is carried over in full.

**Structure**

- Reorganised into a seven-part outline: Overview → Layers → Core model → Resolution and planning → Invariants →
  Performance decisions → Practical notes. The original had a flat sequence of topic sections. Headings are unnumbered
  so a section can be inserted later without renumbering, and the rendered docs site builds its own table of contents
  from them.
- Added the [Overview](#overview): a one-screen mental model (the six steps of a resolve, the four organising ideas) and
  a short glossary of the V8 terms the document relies on. The original assumed them.
- Added [Important invariants](#invariants): every invariant in one grouped table with its pinning test and a link back
  to the section that explains it. Previously invariants were only findable by reading the whole document.
- Added an index of every perf-motivated shape under [Performance-sensitive decisions](#performance), so a perf review
  can find them in one place.
- Moved the two "looks like duplication" fast lanes and the upsert discussion out of the resolution narrative into
  [Performance-sensitive decisions](#performance), since they are purely perf decisions.
- Collected every historical failure into [Lessons](#lessons), each stated as a general pattern with a link to the
  section it now motivates. Previously these were interleaved with the mechanism they explained, often as the opening
  sentence of a paragraph.
- Added explicit `<a id>` anchors on every section, and every cross-reference uses a descriptive label rather than a
  section number, so links survive both reordering and rewording.

**Progressive disclosure: "what it is" before "why", and never negating an assumption the reader has not made**

- Layers: the original opened with "Five levels, not four". The rewrite lists the five levels from the bottom up, says
  what each holds, and only then explains why decorators sit above the engine.
- Engine: "What _is_ split out are…" now follows a sentence that first says the engine is one class and why.
- Fast lanes: "Two shapes here look like copy-paste … and aren't" became a description of each shape, its cost model,
  and then a practical note on the DRY pass that removed and restored them.
- Criteria: "Agreeing on the answer is not agreeing on the lane" became "Three spellings are one request", with the
  lane-admission function named first and the historical miss moved to [Lessons](#lessons).
- Cycle detection: the invariant "A threshold may choose an implementation; it must not choose a semantics" now appears
  _after_ the paragraph that introduces what `RESOLUTION_SET_THRESHOLD` is and what it switches, and names the multi-tag
  threshold as the second instance. The `DEEP_LANE_THRESHOLD` story moved to [Lessons](#lessons).
- Fluent chain: "Registration happens once." and "One object per `bind()`." now sit under a heading that first shows the
  chain (`bind(T).toDynamic(f).singleton()`) so the reader knows what is being registered.
- Frame copy: the section now states what the escape does (hands a copy) before listing the two mechanisms that make
  lending unsafe.
- Path-independent entries: "A criterion the registry can settle is not opaque" opened with "used to escape on
  `options !== undefined`". The rewrite states the current mechanism first; the history is in [Lessons](#lessons).
- Async: the section now leads with what the cascade lane is and how the flag is maintained, and presents the diamond
  case as a consequence of that design. The original led with "Async resolution was assumed to have neither property".
- Context pool: the write-barrier cost model is introduced before the comparison it motivates, with "old space" and
  "write barrier" explained inline.
- `resolveAll` and the tag index: the `simpleTagOf` "caution this lane earned the hard way" moved from the middle of the
  mechanism to [Lessons](#lessons).
- Removed early-placed hedges such as "if you ever want to challenge it" and "past attempts were mostly wrong" from the
  body sections; the second survives once, under [Practical notes](#practical-notes), where it is advice rather than
  framing.

**Corrections**

- The branded branch-path type is `OwnedBranchStack` in `src/resolution/path/resolution-path.ts`; the original named it
  `OwnedBranchPath`.

**Unchanged**

- All links to source files, test files, SPEC anchors, the benchmark suite, `RESULTS.md`, `BENCH_GUIDE.md`,
  `CONTRIBUTING.md` and `codefast.config.js`.
- The rule that no performance figure appears in this file.

## License

Released under the [MIT License](./LICENSE).
