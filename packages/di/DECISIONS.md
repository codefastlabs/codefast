# Decisions — `@codefast/di`

> **How to read this file.** It records _why_ this library's API looks the way it does — what it took from InversifyJS
> v8, what it rebuilt, and what it deliberately left behind. Nothing here is a contract: what the library guarantees is
> in [`SPEC.md`](./SPEC.md), how the engine is built is in [`ARCHITECTURE.md`](./ARCHITECTURE.md), and how to use it is
> in [`README.md`](./README.md). A comparison row describes InversifyJS v8.0.0 as it stood in March 2026.

---

## Background and goals

### What InversifyJS v8 solved

InversifyJS v8 (released March 2026) brought substantial improvements over v7: a consistent naming convention
(unqualified = sync, `Async` suffix = async), `Provider` dropped in favour of `Factory`, better type safety for
`ServiceIdentifier`, and a move to ESM-only. Those are the right calls, and this library learns from them.

### What InversifyJS v8 still has not solved

**`reflect-metadata` is still there.** The v8 getting-started guide still requires:

```
npm install inversify reflect-metadata
```

And it still needs `experimentalDecorators: true` plus `emitDecoratorMetadata: true` in tsconfig — two legacy flags tied
to a TC39 proposal that has since been replaced. v8 has no plan to drop `reflect-metadata`, because its entire decorator
layer still depends on `emitDecoratorMetadata` to read constructor types.

**`ServiceIdentifier` is still not a branded type.** v8 narrowed it from `string | symbol | Function` down to
`string | symbol | AbstractNewable<T> | Newable<T>` (the `T` spelling is kept verbatim from Inversify's own API) — a
small improvement over v7 — but it is still not branded. `container.get<WrongType>('my-service')` still compiles and
still returns the wrong type.

### Goals of this library

- **Zero `reflect-metadata`** — no polyfill, no legacy flags
- **TC39 Decorator Stage 3** — `Symbol.metadata`, no `experimentalDecorators`
- **Branded `Token<Value>`** — fully type-safe, never leaks `any`
- **ESM-only** — like InversifyJS v8, no dual build
- **Learn the good API from v8** — lifecycle hooks, fluent builder, naming convention — but rebuild it from scratch
- **No backward compatibility** with any version of InversifyJS

---

## Comparison with InversifyJS v8

This section compares the whole public API of InversifyJS v8.0.0 (March 2026) against `@codefast/di`. Each feature group
is examined along three axes: **learned from v8**, **improved over v8**, **not adopted from v8**.

---

### API comparison by group

#### Setup and requirements

| Aspect             | InversifyJS v8                                                | `@codefast/di`                                  |
| ------------------ | ------------------------------------------------------------- | ----------------------------------------------- |
| Installation       | `npm install inversify reflect-metadata`                      | `npm install @codefast/di`                      |
| reflect-metadata   | Required — `import 'reflect-metadata'` at the entry point     | Not needed — zero dependencies                  |
| tsconfig flags     | `experimentalDecorators: true`, `emitDecoratorMetadata: true` | No special flags needed                         |
| Decorator standard | Legacy TC39 Stage 1 (experimentalDecorators)                  | TC39 Stage 3 (`Symbol.metadata`, TypeScript 7+) |
| Module format      | ESM-only                                                      | ESM-only                                        |
| Minimum Node.js    | Node ≥ 20.19.0                                                | Node ≥ 24.0.0                                   |

#### Binding API

| Feature                | InversifyJS v8                                    | `@codefast/di`                                                      |
| ---------------------- | ------------------------------------------------- | ------------------------------------------------------------------- |
| Async binding          | `toDynamicValue` takes both sync and async        | `toDynamic` vs `toDynamicAsync` — enforced by the compiler          |
| Explicit async deps    | No `toResolvedValueAsync`                         | `toResolvedAsync(factory, deps)` — symmetric with the sync one      |
| Scope naming           | `inSingletonScope()` / `inTransientScope()` / ... | `singleton()` / `transient()` / `scoped()`                          |
| Lifecycle after scope  | `when*` available after scope (v8)                | `on*()` only after scope — the chain order is invariant             |
| `onDeactivation` guard | Runtime error on a non-singleton                  | Compile time: only on `SingletonBindingBuilder`                     |
| Alias                  | `toService()` returns `void`                      | `toAlias()` returns an `AliasBindingBuilder` — with `when*`/`.id()` |
| Alias + hint forward   | Not specified                                     | The hint is forwarded to the target resolution                      |

#### Container API

| Feature                  | InversifyJS v8                                          | `@codefast/di`                                             |
| ------------------------ | ------------------------------------------------------- | ---------------------------------------------------------- |
| Creating a container     | `new Container()`                                       | `Container.create()` — a static factory                    |
| Child container          | `new Container({ parent })`                             | `container.createChild()` — explicit                       |
| Optional resolution      | `container.get(id, { optional: true })`                 | `resolveOptional()` / `resolveOptionalAsync()`             |
| Multi resolution         | `getAll()` is sync only                                 | `resolveAll()` + `resolveAllAsync()`                       |
| Singleton async safety   | Not specified                                           | Concurrent `resolveAsync` shares one in-flight Promise     |
| Container lifecycle      | No `isDisposed`; operations after dispose are undefined | An `isDisposed` getter, `DisposedContainerError`           |
| `isBound()`              | Unclear semantics with a hint                           | `has(token, hint?)` — has a binding / matches a given hint |
| `isCurrentBound()`       | An easily confused name                                 | `hasOwn(token, hint?)` — clearer                           |
| `lookupBindings()`       | Absent                                                  | `lookupBindings()` returns `[]` (never `undefined`)        |
| Disposed container guard | Absent                                                  | `DisposedContainerError` on every operation                |
| Warming up singletons    | Absent                                                  | `initializeAsync()` — fail fast at startup                 |
| Dependency graph export  | Absent                                                  | `generateDependencyGraph({ includeParent? })` → JSON + DOT |

#### Error handling

| Case                           | InversifyJS v8                    | `@codefast/di`                              |
| ------------------------------ | --------------------------------- | ------------------------------------------- |
| Predicate ambiguity            | `InternalError` (the wrong type)  | `AmbiguousBindingError` with `candidateIds` |
| Async handler on a sync unbind | Silent failure or a runtime error | `AsyncDeactivationError` — explicit         |
| Disposed container             | Undefined behaviour               | `DisposedContainerError`                    |
| No typed error hierarchy       | No `code` field                   | `DiError` abstract + a `code` string        |

#### Module system

| Feature                       | InversifyJS v8                                                   | `@codefast/di`                                                     |
| ----------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------ |
| Module type distinction       | `ContainerModule` / `AsyncContainerModule` are not distinguished | `SyncModule` / `AsyncModule` branded — `load(async)` is a TS error |
| Module coupling               | The `ContainerModule` callback has `unbind`, `rebind`            | `ModuleBuilder` is additive-only — avoids hidden coupling          |
| Module deduplication          | Not specified                                                    | Object-identity dedup + documented reference counting              |
| SyncModule importing an Async | Not guarded                                                      | Compile error — `ModuleBuilder.import()` only takes `SyncModule[]` |
| Unload + deactivation         | Not specified                                                    | Singletons deactivated when the ref-count reaches 0                |

---

### Learned from v8

| v8 feature                                                     | How it is done here                                                                |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Naming: unqualified=sync, `Async`=async                        | Kept: `resolve`/`resolveAsync`, `load`/`loadAsync`, `unbind`/`unbindAsync`, …      |
| ESM-only                                                       | Same as v8                                                                         |
| Per-binding `onActivation` / `onDeactivation`                  | Kept, with the callback inferring its type from the binding — no manual annotation |
| Container-level `onActivation` / `onDeactivation`              | Kept; children do not inherit the parent's hooks                                   |
| `toResolvedValue(factory, injectOptions)`                      | `toResolved(factory, deps)` sync, plus the new `toResolvedAsync`                   |
| The `toService()` alias concept                                | `toAlias()` — a clearer name, with hint forwarding specified                       |
| `BindingIdentifier` / `.getIdentifier()`                       | Concept kept, renamed to `.id()` — shorter                                         |
| `whenNamed` / `whenTagged` / `whenDefault` / `when(predicate)` | Kept; tag keys are declared with `tag()`, criteria minted with `TagKey.of()`       |
| `isBound()` checking the hierarchy                             | `has()` — same semantics, with hint support                                        |
| `isCurrentBound()` checking the current container only         | `hasOwn()` — a clearer name                                                        |
| `unbindAll()` / `unbindAllAsync()`                             | Kept as-is                                                                         |
| `@postConstruct()` / `@preDestroy()` method decorators         | Kept, on TC39 Stage 3, supporting several methods per class rather than just one   |
| `getAll` filter semantics                                      | `resolveAll` — filter semantics, returning `[]` when nothing matches               |
| `bind(id).unbind(bindingId)` — unbinding one specific binding  | Kept, via `container.unbind(bindingId)`                                            |

---

### Improved over v8

| InversifyJS v8                                                           | This library                                                                                          |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `reflect-metadata` + `experimentalDecorators` required                   | Zero `reflect-metadata` — TC39 Stage 3, no legacy flags                                               |
| `ServiceIdentifier` is a union type, not branded                         | `Token<Value>` branded — `resolve` always has the right type                                          |
| `container.get<WrongType>('id')` compiles                                | Impossible — `Token<Value>` carries the type at compile time                                          |
| `inSingletonScope()` / `inTransientScope()` / `inRequestScope()`         | `singleton()` / `transient()` / `scoped()` — shorter names, no `in` prefix                            |
| `toDynamicValue` takes sync and async, with no compiler enforcement      | `toDynamic` vs `toDynamicAsync` — the compiler enforces `resolveAsync()` where needed                 |
| No `toResolvedValueAsync`                                                | `toResolvedAsync(factory, deps)` — symmetric with `toResolved`                                        |
| `when*` available after scope                                            | `on*()` only after scope — an invariant chain order that removes the ambiguity                        |
| `onDeactivation` has no compile-time guard                               | Builder type narrowing — `onDeactivation` exists only on `SingletonBindingBuilder`                    |
| `toService()` returns `void`                                             | `toAlias()` returns an `AliasBindingBuilder` — with `when*`, `.id()` and hint forwarding              |
| `@inject` on a parameter needs `experimentalDecorators`                  | `@injectable([deps])` + `inject()` — pure TC39 Stage 3                                                |
| `@inject` on a plain property                                            | `@inject accessor field` — using the TC39 `accessor` keyword                                          |
| `getAll()` is sync only                                                  | `resolveAll()` + `resolveAllAsync()`                                                                  |
| `container.get()` + `{ optional: true }` — hidden inside options         | `resolveOptional()` + `resolveOptionalAsync()` — an explicit method name                              |
| `tag` is a single tag object — no multi-tag support                      | `tags` is a `ReadonlyArray<BindingTag>`, interned — multi-tag, compared by identity                   |
| The `Symbol.metadata` prototype chain is not handled                     | `SymbolMetadataReader` uses an `Object.hasOwn` guard — no leaking of parent metadata                  |
| `ContainerModule` / `AsyncContainerModule` are not distinguished by type | `SyncModule` / `AsyncModule` branded — `load(asyncModule)` is a TypeScript error                      |
| `@postConstruct` allows only one method per class                        | Arrays supported — several `@postConstruct()` / `@preDestroy()` per class                             |
| No `validate()`                                                          | `container.validate()` — static captive-dependency detection, transitive through aliases              |
| No `initializeAsync()`                                                   | Idempotent warm-up, with the cross-container trigger documented                                       |
| No typed error hierarchy                                                 | `DiError` abstract + a `code` string + context fields on every subclass                               |
| A module can `unbind` / `rebind` another module's bindings               | `ModuleBuilder` is additive-only — avoids hidden coupling between modules                             |
| Module deduplication is not specified                                    | Object-identity deduplication + explicit reference counting                                           |
| `rebind` does not throw when the token is unbound                        | `RebindUnboundTokenError` — an explicit contract                                                      |
| Predicate ambiguity throws `InternalError`                               | `AmbiguousBindingError` with `candidateIds` — a user error, not an internal one                       |
| Concurrent async singleton resolution is not specified                   | Serialized through an in-flight Promise map — the factory runs exactly once                           |
| A container after dispose: undefined behaviour                           | `DisposedContainerError` + an `isDisposed` getter                                                     |
| Async unbind called synchronously: silent failure                        | `AsyncDeactivationError` — explicit                                                                   |
| No `lookupBindings`                                                      | `lookupBindings()` returns `BindingSnapshot[]` — never `undefined`                                    |
| `toService()` + hint semantics are not specified                         | `toAlias()` hint forwarding is documented                                                             |
| No testing guide                                                         | [Testing](./README.md#testing) with patterns for isolated containers, child overrides, MetadataReader |
| `autoRegister` through a global option or per-get                        | `createAutoRegisterRegistry()` — an explicit registry, no global state                                |
| `[Symbol.asyncDispose]()` is not specified                               | `dispose()` + `[Symbol.asyncDispose]()` — `await using` support                                       |
| `[Symbol.dispose]()` is not specified                                    | `[Symbol.dispose](): never` — throws `SyncDisposalNotSupportedError`, plainly                         |
| No `lookupBindings()`, `inspect()`, `generateDependencyGraph()`          | A full introspection API — typed snapshot, JSON graph, DOT export                                     |

---

### Not adopted from v8

| InversifyJS v8                                                           | Why not                                                                             |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `string \| symbol` as a service identifier                               | Not type-safe — use a branded `Token<Value>`                                        |
| `new Container({ parent })`                                              | Use `container.createChild()` — explicit, no mixing config with hierarchy           |
| `new Container({ autobind })`                                            | Not supported — the "zero magic" principle                                          |
| `new Container({ defaultScope })`                                        | No overriding the default scope at container level — avoids hidden behaviour        |
| `container.get(id, { autobind: true })` per resolve                      | Not supported — the "zero magic" principle                                          |
| `container.getAll(id, { chained: true })` chained resolution             | Absent — walking up the parent chain is automatic, no opt-in needed                 |
| `snapshot()` / `restore()`                                               | Module composition + `bind()` at a child replaces it in test workflows              |
| `container.register(PluginClass)`                                        | No plugin system — avoids a hidden extension mechanism                              |
| `toFactory(ctx => curriedFn)`                                            | `toConstantValue(fn)` or `toDynamic` — less indirection                             |
| `rebindAsync()` — async unbind then bind again                           | Use `unbindAsync()` then `bind()` — two clear steps, explicit semantics             |
| Parameter decorators `@inject` / `@optional` / `@named` / `@tagged`      | TS1206 — they do not exist in TC39 Stage 3                                          |
| `@multiInject(id)` on a parameter / property                             | `injectAll(token)` in the deps array — a plain function, no decorator needed        |
| `@injectFromBase()` / `@injectFromHierarchy()`                           | An explicit deps array replaces them — no implicit inheritance injection            |
| `@unmanaged()` on a parameter                                            | In a deps array, simply do not declare an arg that needs no injection               |
| `decorate(decorator, target, idx)`                                       | Third-party class integration is not a target                                       |
| `LazyServiceIdentifier<T>` — deferred evaluation for circular deps       | `accessor` property injection solves circular deps directly                         |
| The `ContainerModule` callback has `bind`, `unbind`, `rebind`, `isBound` | `ModuleBuilder` has only `bind` + `import` — avoids hidden coupling between modules |
| `when*` ancestor/parent constraints on the main API surface              | Present at the root, plus a dedicated subpath for anyone wanting a narrow import    |
| `inRequestScope()` per-resolve-tree semantics                            | `scoped()` per child container — a clearer lifecycle boundary                       |
| `toResolvedValue` with per-dep name/tag injection options                | `toResolved` takes a plain token array — for name/tag, use `toDynamic`              |

---

## License

Released under the [MIT License](./LICENSE).
