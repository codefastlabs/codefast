# DI Library — Design Specification

> Inspired by InversifyJS v8 · Built from scratch · Zero `reflect-metadata` · Standard decorators · TypeScript 7+ ·
> ESM-only

## How to read this specification

This is a **design specification and behavioural contract**, not a tutorial and not an architecture guide. It states
what `@codefast/di` guarantees to callers and what an implementer must satisfy. It is one specification in several
documents: this page holds the scope, the design principles and the public-API rule, and each document listed below
holds one area of the API. Each section follows the same order: what a concept is, the rule that governs it, a short
example, the edge cases and case tables, and — last — the rationale or compatibility note.

Three kinds of callout recur:

- **Normative** — the contract. An implementer must satisfy it; a caller may rely on it.
- **Exact shape** — a pointer to the source file that declares a type. The source is authoritative for field-level
  shape; the specification is authoritative for behaviour.
- **Rationale / Compatibility** — explanation of _why_ a rule exists, or how it relates to InversifyJS. These notes
  never add a rule.

Everything specified here is observable through the public API. What the engine is made of — its layers, caches and
compiled plans — is in [`ARCHITECTURE.md`](../ARCHITECTURE.md); why the API is shaped like this rather than InversifyJS
v8's is in [`DECISIONS.md`](../DECISIONS.md); how to use it is in [`README.md`](../README.md); and how to build, test
and release the package is in [`CONTRIBUTING.md`](../CONTRIBUTING.md). A rule a caller cannot see broken does not belong
here.

---

## Documents

| Document                                   | Scope                                                                                                                                               |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| [foundation-types.md](foundation-types.md) | The types every API shares: scopes, identifiers, handlers, `ResolveOptions`, the resolution and constraint contexts, `DependencySlot`, `TokenValue` |
| [token.md](token.md)                       | `token()`: creating one, display names, the type signature, a class as a token                                                                      |
| [binding.md](binding.md)                   | The fluent chain: binding kinds, scope, constraints, aliases, explicit deps, lifecycle hooks, slots and last-wins, the `Binding` union              |
| [container.md](container.md)               | `Container`: creation, resolution, managing bindings, modules, hooks, children, state lifecycle, `initializeAsync`, `validate`, introspection       |
| [decorators.md](decorators.md)             | `@injectable`, `inject`, inheritance, the `MetadataReader` port, accessor injection, lifecycle decorators, auto-registration, the tsconfig setup    |
| [constraints.md](constraints.md)           | The `when*` parent and ancestor predicates: token name resolution, signatures, semantics, composability, the normative rules                        |
| [modules.md](modules.md)                   | Sync, async and declared modules, loading and unloading, the module interface                                                                       |
| [errors.md](errors.md)                     | The `DiError` taxonomy, and the boundaries between a library bug and a caller error                                                                 |

Read them in that order the first time; each stands on its own afterwards.

---

## Scope and requirements

`@codefast/di` is a dependency-injection container for TypeScript with no runtime dependencies. It is not compatible
with any version of InversifyJS, by design.

> **Normative — what a consumer must bring.**
>
> - **ESM only.** There is no CommonJS build and no dual build.
> - **Node.js ≥ 24**, the first line with explicit resource management built in.
> - **In a browser, Chrome and Edge 136, Firefox 136, or Safari 18.4**, the first releases that ship every ES2025
>   builtin ([support policy](../../../SUPPORT.md#browsers)). `await using` also needs the browser to ship explicit
>   resource management, which Safari has not; `dispose()` needs nothing extra.
> - **TypeScript ≥ 7**, the one compiler that type-checks this package and emits its published declarations. Standard
>   decorators are TypeScript's default, so `experimentalDecorators` and `emitDecoratorMetadata` stay **off** and
>   `reflect-metadata` is never loaded ([tsconfig setup](decorators.md#tsconfig-setup)).
> - **The explicit resource management types.** The declarations key `Container`'s disposal methods by
>   `Symbol.asyncDispose` and `Symbol.dispose`, which no numbered `lib` declares before ES2027. `@types/node` 24 or
>   later loads them, and so does `ESNext.Disposable` in `lib` ([tsconfig setup](decorators.md#tsconfig-setup)).
> - Decorators themselves are optional: an application that declares every binding explicitly needs nothing beyond the
>   runtime and the module format.

The entry points a consumer imports from are in [Public API](#public-api).

---

## Design principles

### Naming — no `I` or `T` prefix

A name states what a thing is or does; a prefix or suffix that carries no information is dropped.

| Avoid                   | Use                              | Why                                                  |
| ----------------------- | -------------------------------- | ---------------------------------------------------- |
| `IContainer`            | `Container`                      | An interface describes behaviour; the name is enough |
| `ILogger`               | `Logger`                         | —                                                    |
| `ContainerImpl`         | `DefaultContainer`               | `Impl` is lazy naming                                |
| `T` (a lone type param) | `Value`, `Target`, `Deps`, `Ctx` | A name that says what it holds                       |
| `TResult`               | `Result`                         | —                                                    |

This rule applies to the library's own code and to every illustrative snippet in this SPEC. Where the document quotes an
external API verbatim (Inversify's `Newable<T>`, for instance), the original spelling may stay so the comparison does
not distort the source.

### Naming — sync/async convention

One consistent rule: **unqualified = sync, `Async` suffix = async**. There is never a `Sync` suffix. The one exception
is `dispose()`, which is always async and returns a `Promise` — disposal has no sync form to tell it apart from, and it
is the name `Symbol.asyncDispose` pairs with.

```ts
container.resolve(Logger); // sync
container.resolveAsync(Database); // async — an async factory is in the chain
container.load(AppModule); // sync
container.loadAsync(LazyModule); // async — the module has async setup
```

### Token replaces ServiceIdentifier

The sole identifier is `Token<Value>` — a **branded type** (a type carrying a phantom, non-constructible marker so that
only the library's factory can produce one). A class may also be used directly as a token; `Token<Value>` is the
preferred form when an abstraction is needed.

> **Compatibility.** InversifyJS uses `string | symbol | Newable<T>` as the service identifier — flexible, but not
> type-safe: `container.get<WrongType>('my-service')` compiles and returns the wrong type. A branded token makes that
> call impossible.

### Fluent chain — the canonical, invariant order

A binding is declared as a chain of four steps. Only the strategy is required, and the order never changes.

```
bind(token)
  .when*(…)     // 1. Slot — optional, always before to*
  .to*(…)       // 2. Strategy — required; registers the binding
  .scope()      // 3. Scope — optional, always after to*
  .on*(…)       // 4. Lifecycle — optional, always after scope
```

> **Normative.** The compiler enforces this order through each step's return type:
>
> - `when*` and `many()` **cannot** be called after `to*()` — the builder `to*()` returns has no slot step, and a caller
>   without types gets `ChainAlreadyRegisteredError`. The slot is final once the binding registers.
> - Scope **cannot** be called before `to*()` — `bind(token)` returns a `BindToBuilder`, which offers the slot steps and
>   `to*()` only, and a caller without types gets `ChainNotRegisteredError`.
> - Lifecycle hooks **cannot** be called before `scope()` — `BindingBuilder` (the result of `to*()`) does not expose
>   `on*`. `toConstantValue()` is the exception: a constant is always a singleton, so its builder offers `on*` directly
>   with no scope step.

> **Rationale — why the slot comes first.** The slot is what the registry files a binding under and what slot last-wins
> compares, so it decides what the binding displaces. Declared before `to*()`, it is known when the binding registers,
> and the binding registers once, in its final shape: no step afterwards can move it to another slot, displace something
> else, or bring back what it displaced.

> **Rationale — why lifecycle comes after scope.** If `onActivation` could be called before scope, it would be unclear
> whether activation fires for a transient instance (every resolve) or a singleton (only the first). Forcing scope to be
> declared first removes the ambiguity entirely — a reader knows immediately which context the activation runs in.

### Other principles

- **Zero magic.** Decorators are optional. An entire app can be written with explicit bindings and not a single
  decorator.
- **Last-wins / override.** `bind()` applies **slot-aware last-wins at registration time**. Same slot (`default`, same
  `whenNamed`, same `whenTagged`) means the new binding replaces the old one; a different slot appends, which is what
  serves `resolveAll`. The exact definition is in
  [Slots and last-wins](binding.md#slots-and-last-wins--the-exact-definition); worked examples are in
  [Full examples](binding.md#full-examples).
- **Eager commit.** `to*()` commits the binding into the registry immediately — exactly **once** for the whole chain, in
  its final slot. Every read after that (`has`, `resolve*`, `validate`, `inspect`) sees the latest state, even if the
  chain is abandoned midway; a later scope or hook is written in place on the registered binding.
- **Async must be explicit.** `resolve()` on an async binding throws `AsyncResolutionError` with a clear message. It
  never silently returns a `Promise`. Once an async singleton is cached — by `resolveAsync()` or `initializeAsync()` — a
  plain `resolve()` returns that instance, since no async work is left to do.
- **Lifecycle is first-class.** `onActivation` and `onDeactivation` per binding — learned from InversifyJS v8 — but more
  type-safe. The container also has container-level hooks that apply to every binding of a token.
- **Singleton async creation is serialized.** Concurrent `resolveAsync` calls for the same singleton token share one
  in-flight Promise — the factory runs once, `onActivation` runs once. See [Resolution](container.md#resolution).

---

## Public API

> **Normative — the root entry point is complete.** Every name this specification states is exported from
> `@codefast/di`: the foundation types, `token` and `tag`, `Container`, the builder interfaces, the module factories,
> the decorators and injection helpers, the metadata port, the advanced constraints, the introspection and graph types
> with their adapters, and every error class alongside `DiError`. A caller never needs a subpath to reach a name its
> code uses, and each document above is the authority on the names it introduces. The one group this specification
> describes without the root exporting it is the engine's own model — `Binding`, its seven member interfaces and
> `BindingSlot` ([The `Binding` discriminated union](binding.md#the-binding-discriminated-union)) — which it specifies
> because the public snapshots are views of it; they are published at `@codefast/di/core/binding` only.

> **Normative — a subpath mirrors the source layout, and that layout is not frozen.** Every module is also published at
> a subpath derived from the built output, so `@codefast/di/core/token`, `@codefast/di/container/container` and the rest
> resolve to the same modules the root re-exports, the introspection group with them
> (`@codefast/di/introspection/inspector`, `@codefast/di/introspection/dependency-graph`,
> `@codefast/di/introspection/graph-adapters/{dot,mermaid,cytoscape,reactflow}`). Because the map follows the source
> tree, moving a module renames its specifier — import from the root unless you are deliberately trimming a bundle.

Because every module is published, most subpaths also carry names the root does not re-export: the engine's
collaborators (`DependencyResolver`, `BindingRegistry`, `ScopeManager`, the plan compiler, `Inspector`,
`buildDependencyGraph`, …) and the helpers they share. Those are implementation surface, not contract — nothing in this
document promises their shape, and they change with the source.

One of them is a deliberate channel: **`@codefast/di/introspection/diagnostics`** exports `RESOLUTION_DIAGNOSTICS`, the
symbol a container answers to with its runtime counters — `generatedPlanCount` among them
([Code generation and Content Security Policy](container.md#code-generation-and-content-security-policy)). It is a
diagnostic channel, not part of the resolution contract: a counter may be added or renamed without a rule above
changing.

---

## Roadmap

Nothing here is normative. It is intent, and intent is not a commitment — what the library guarantees today is
everything above this section.

Framework adapter packages are **not** planned. A per-request scope is `createChild()` plus `await using`
([Child containers](container.md#child-containers)) — a pattern to document, not a package to publish.

---

## License

Released under the [MIT License](../LICENSE).
