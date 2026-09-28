# Container API

**Mental model.** A container holds bindings, resolves tokens into values, owns the instances it caches, and can spawn
child containers that see its bindings. Everything a container does falls into nine groups, listed in
[The Container interface](#the-container-interface).

## Creating a container

```ts
import { Container } from "@codefast/di";

// Static factory — never new Container()
const container = Container.create();

// Construction-time options — what the container must know before it exists
const container = Container.create({ metadataReader: customReader });

// From modules — load all modules, then return the container
const container = Container.fromModules(AppModule, DatabaseModule);
const container = await Container.fromModulesAsync(AppModule, DatabaseModule);
```

`fromModules`/`fromModulesAsync` take modules variadically, so there is no room for options. When you need both, use
`Container.create(options)` followed by `load(...)`/`loadAsync(...)` — exactly what those two factories do.

## Resolution

**Mental model.** Six resolve methods cover three questions — one value, an optional value, or every value — each in a
sync and an async form. Sync never returns a `Promise` it created; if anything on the path is async, the sync form
throws. A `Promise` that is itself the bound value — `toConstantValue(somePromise)` — is returned as the value it is.

| Method                 | Returns                       | When there is no binding | When the binding is async |
| ---------------------- | ----------------------------- | ------------------------ | ------------------------- |
| `resolve`              | `Value`                       | `TokenNotBoundError`     | `AsyncResolutionError`    |
| `resolveAsync`         | `Promise<Value>`              | `TokenNotBoundError`     | Resolves                  |
| `resolveOptional`      | `Value \| undefined`          | `undefined`              | `AsyncResolutionError`    |
| `resolveOptionalAsync` | `Promise<Value \| undefined>` | `undefined`              | Resolves                  |
| `resolveAll`           | `Value[]`                     | `[]`                     | `AsyncResolutionError`    |
| `resolveAllAsync`      | `Promise<Value[]>`            | `[]`                     | Resolves                  |

```ts
// Sync resolve — throws AsyncResolutionError if the binding has an async factory
const logger = container.resolve(Logger); // ^? LoggerService

// Async resolve — safe for both sync and async bindings
const db = await container.resolveAsync(Database); // ^? DatabaseService

// Optional — undefined if there is no binding, no TokenNotBoundError
const logger = container.resolveOptional(Logger); // ^? LoggerService | undefined
const db = await container.resolveOptionalAsync(Database); // ^? DatabaseService | undefined

// Multi — resolve every binding of a token, [] when there are none
const plugins = container.resolveAll(Plugin); // ^? Plugin[]
const plugins = await container.resolveAllAsync(Plugin); // ^? Plugin[]

// Named / tagged hint
const fileLogger = container.resolve(Logger, { name: "file" });
const petrolEngine = container.resolve(Engine, { tag: Fuel.of("petrol") });
```

### `resolveOptionalAsync` error semantics

> **Normative.**
>
> - The token has no binding → returns `undefined` (no `TokenNotBoundError`).
> - The token has a binding but the async binding throws at runtime (a failed DB connect, say) → **re-throw** that
>   error, do not turn it into `undefined`.
> - The token has a binding but nothing matches the hint → returns `undefined` (no `NoMatchingBindingError`).
> - The token is an alias whose chain ends at a token nothing matches → returns `undefined`: an alias is transparent, so
>   a dangling chain is the same miss the target would be. An alias **cycle** still throws `CircularDependencyError` — a
>   cycle has no absent reading. The same holds for `resolveAll` / `resolveAllAsync`: a dangling alias member is
>   skipped, never thrown.

### `resolveAll` + `ResolveOptions` — filter semantics

```ts
container.bind(Logger).to(ConsoleLogger); // default slot
container.bind(Logger).whenNamed("file").to(FileLogger); // named "file" slot

container.resolveAll(Logger); // → [ConsoleLogger, FileLogger]
container.resolveAll(Logger, { name: "file" }); // → [FileLogger]
container.resolveAll(Logger, { name: "x" }); // → [] (empty array, no throw)
```

> **Normative.** `resolveAll` / `resolveAllAsync` **never throw `TokenNotBoundError`** — they return `[]` when nothing
> matches.

### Async contamination — the propagation rule

**Mental model.** Async is contagious along the dependency path: one async link makes every consumer above it async.

> **Normative.** If token `A` depends on token `B`, and `B` has a `toDynamicAsync`/`toResolvedAsync` factory or an async
> `@postConstruct()`, then `A` is async too. Async contamination spreads along the entire dependency path, and
> `container.resolve(A)` throws, at resolve time. The error names what is async:
>
> - an **async factory** throws `AsyncResolutionError`, whose message and `asyncSourceToken` name the token in the chain
>   that carries it;
> - an **async hook** — `@postConstruct()` or `onActivation` returning a `Promise` — throws `AsyncActivationError`,
>   carrying `hookKind` and, for a method, `methodName`
>   ([`AsyncActivationError` vs `AsyncResolutionError`](errors.md#asyncactivationerror-vs-asyncresolutionerror)).

```
AsyncResolutionError: Token 'app:Api' requires async resolution because 'app:Database'
in its dependency chain has an async factory. Use container.resolveAsync(app:Api).
  asyncSourceToken: "app:Database"
```

### Singleton async creation — serialized

**Mental model.** Two callers racing for the same async singleton wait on the same creation, so the factory runs once.

> **Normative.** Concurrent `resolveAsync(Token)` calls for the same singleton token **share one in-flight Promise**.
> The implementation must guarantee:
>
> 1. When the factory starts running and has not completed synchronously, the Promise is stored in the in-flight map.
> 2. The next concurrent call awaits that same Promise — no new instance is created. What it is handed back is a
>    `Promise` of its own that settles with the shared result, not the stored object itself.
> 3. When the Promise settles (resolved or rejected), the in-flight map entry is cleared.
> 4. If the factory rejected, the next resolve creates a new Promise (retry).
> 5. A materialization that completes without awaiting — a synchronous factory, a class whose dependencies and hooks all
>    settle synchronously — is cached before `resolveAsync` returns, so a synchronous `resolve` issued in the same tick
>    reads the instance instead of throwing `AsyncResolutionError`; only a materialization still pending refuses it.

```ts
// Both get the same instance — the factory runs only once
const [a, b] = await Promise.all([container.resolveAsync(Database), container.resolveAsync(Database)]);
// a === b: true
```

### Code generation and Content Security Policy

A transient class, `toResolved` or `toResolvedAsync` binding a container has resolved many times, through `resolve` or
`resolveAsync`, has its compiled plan generated as a function of its own through the `Function` constructor; a runtime
that refuses the constructor (a Content Security Policy without `unsafe-eval`) leaves every plan a closure.

> **Normative.** The two paths are indistinguishable to a caller — the same instances, the same errors, the same cycle
> detection — and only the throughput of a hot plan differs. A container reports how many plans it has generated as
> `generatedPlanCount`, through the `RESOLUTION_DIAGNOSTICS` symbol ([Public API](README.md#public-api)).

## Managing bindings

```ts
// Add a binding
container.bind(Logger).to(ConsoleLogger);

// Unbind by token — removes every binding of the token (all named/tagged slots included)
container.unbind(Logger);
await container.unbindAsync(Database); // when the binding has an async onDeactivation

// Unbind exactly one binding by BindingIdentifier
container.unbind(consoleLoggerBindingId);
await container.unbindAsync(dbBindingId);

// Unbind every binding in the container (the parent is untouched)
container.unbindAll();
await container.unbindAllAsync();
// unbindAll also clears module bookkeeping, so a previously-loaded module can be load()ed again

// Rebind — remove every own binding of the token, then bind again
// If the token has no own binding yet → throws RebindUnboundTokenError
container.rebind(Logger).to(FileLogger).singleton();
```

> **Normative — `unbindAll` resets module bookkeeping.** Clearing every binding also clears the module ref-counts,
> binding-id lists and import records, so a module loaded before `unbindAll` can be `load()`ed again rather than being
> silently skipped as already-loaded. Deactivation runs first, so a module singleton's hook still fires.

### `rebind` semantics

**Mental model.** `rebind` means "replace a binding that already exists in _this_ container". It is an atomic
unbind-then-bind, never a way to override a parent.

> **Normative.** `rebind(token)` only affects the **own** bindings of the current container. If the token is only bound
> at the parent (not at the child), `child.rebind(token)` throws `RebindUnboundTokenError`. When the old bindings owe no
> deactivation, `rebind()` removes nothing up front and `to*()` swaps in place — there is no gap between the unbind and
> the bind. When they owe one, `rebind()` unbinds and deactivates them itself, before any replacement exists.

> **`rebind` and the parent chain.** To override a parent binding from a child container (the common test pattern), use
> `bind()` at the child — resolution prefers the child over the parent:
>
> ```ts
> const testContainer = container.createChild();
> // Right — use bind() to create the override at the child
> testContainer.bind(Database).toConstantValue(mockDatabase);
> // No rebind() needed, because the child has no own binding yet
> ```

### `unbind` and singleton deactivation

> **Normative.** When `unbind(token)` or `unbind(bindingId)` is called:
>
> - The binding is removed from the registry immediately (no gap).
> - If the binding is a singleton and already cached, `onDeactivation` and `@preDestroy()` **are called synchronously**
>   when the handlers are sync.
> - If a handler is async, `unbindAsync()` must be used — a sync `unbind()` on a binding with async deactivation throws
>   `AsyncDeactivationError`.
> - `unbind(bindingId)` reaches a binding a later last-wins bind displaced, too: its cached singleton, or a constant's
>   owed `onDeactivation`, runs then rather than at `dispose()`.

### `rebind` and async deactivation

> **Normative.** Deactivation of the old singleton follows the same rule as `unbind`:
>
> - If the old binding has **no** async `onDeactivation` (or no `onDeactivation` at all): a sync `rebind()` is safe.
> - If the old binding **does** have an async `onDeactivation`: a sync `rebind()` throws `AsyncDeactivationError` — the
>   same behaviour as a sync `unbind()`. The throw comes from `rebind()` itself, the old bindings are already removed,
>   and no replacement is committed, whatever shape the token had.

There is no `rebindAsync()` (see [Not adopted from v8](../DECISIONS.md#not-adopted-from-v8)), so the required workaround
is:

```ts
// When the old binding has an async onDeactivation:
await container.unbindAsync(Logger); // deactivate the old singleton
container.bind(Logger).to(FileLogger).singleton(); // create the new binding
```

> **Rationale — why there is no `rebindAsync()`.** `rebind` is a test/reconfiguration utility — it always happens when
> there is no traffic. If the binding has async deactivation, splitting it into two explicit steps (`unbindAsync` +
> `bind`) states the intent more clearly.

## Module management

```ts
// Load a module synchronously
container.load(FeatureModule);

// Load a module asynchronously (when there is an AsyncModule)
await container.loadAsync(AsyncFeatureModule);

// Unload — only accepts SyncModule
// Reason: a SyncModule only has sync onDeactivation — safe to unbind synchronously
container.unload(FeatureModule);

// Unload asynchronously — accepts both SyncModule and AsyncModule
await container.unloadAsync(AsyncFeatureModule);

// Load auto-registered classes from an explicit registry
const count = container.loadAutoRegistered(appRegistry);
```

### Reference counting for shared deps

**Mental model.** A module imported by several others is set up once and torn down once — when the last importer is
gone.

> **Normative.** The container tracks ownership per `(module, container)` pair with a reference count. If `ModuleA`
> imports `ModuleB`, and `AppModule` also imports `ModuleB`, then `ModuleB` is set up only once. `ModuleB` is only
> unbound when its ref-count reaches 0.

```ts
container.load(ModuleA); // ModuleA (ref:1) + ModuleB (ref:1)
container.load(AppModule); // AppModule (ref:1) + ModuleB (ref:2 — setup is a no-op)

container.unload(ModuleA); // ModuleA unloaded; ModuleB ref:2→1 — not unbound
container.unload(AppModule); // AppModule unloaded; ModuleB ref:1→0 — ModuleB unbound
```

### `Container.fromModules` dedup behaviour

```ts
// ModuleA and ModuleB both import(LoggerModule)
const container = Container.fromModules(ModuleA, ModuleB);
// LoggerModule.setup() runs only once — deduped by object identity
// LoggerModule ref-count = 2 (from ModuleA and ModuleB)
```

> **Normative.** Dedup is based on **object identity**, not on `name`. Two different module objects with the same `name`
> are two different modules — no dedup. `name` exists only for error messages and logging.

### `unload` and cached singletons

> **Normative.** When `unload(module)` or `unloadAsync(module)` is called and the ref-count reaches 0:
>
> - The bindings are removed from the registry.
> - Cached singleton instances belonging to that module are **deactivated** — `onDeactivation` and `@preDestroy()` are
>   called.
> - A binding the module registered that a later last-wins bind displaced is torn down the same way: its cached
>   singleton, or a constant's owed `onDeactivation`, runs at this unload rather than waiting for `dispose()`.
> - A sync `unload()` is only safe if every deactivation handler is sync. If any is async, `unloadAsync()` must be used.

## Container-level activation hooks

Besides per-binding `.onActivation()`, the container supports container-level hooks — they apply to **every** binding of
a token, including bindings added after the hook was registered:

```ts
container.onActivation(Logger, (ctx, logger) => {
  logger.setCorrelationId?.(ctx.graph.currentResolveOptions?.name ?? "default");
  return logger;
});

container.onDeactivation(Database, async (db) => {
  await db.flushMetrics();
});
```

> **Normative — a child container does not inherit container-level hooks.** A hook fires only for bindings of the
> container it was registered on. When a child resolves a token from the parent (walking up the parent chain), the
> parent's hooks fire because the binding belongs to the parent.

> **Order.** Accessor initializers (inside `new`) → `@postConstruct()` → per-binding `onActivation()` → container-level
> `onActivation()`. Deactivation runs in reverse: container-level `onDeactivation()` → per-binding `onDeactivation()` →
> `@preDestroy()`. The full diagram is in [Lifecycle hooks](binding.md#lifecycle-hooks).

## Child containers

**Mental model.** A child sees every parent binding and may add or override its own. Instances the child creates for its
own bindings belong to the child; parent singletons stay with the parent.

```ts
// A child inherits every parent binding (resolution walks up when the child has none)
// Parent singletons are not re-created at the child
const requestContainer = container.createChild();
requestContainer.bind(RequestId).toConstantValue(crypto.randomUUID());

const handler = requestContainer.resolve(RequestHandler);

// Dispose: deactivate the child's scoped instances, then every singleton DEFINED at it (the parent is untouched)
await requestContainer.dispose();

// `await using` — TC39 Explicit Resource Management
{
  await using scoped = container.createChild();
  scoped.bind(RequestId).toConstantValue(crypto.randomUUID());
  const handler = scoped.resolve(RequestHandler);
  // scoped[Symbol.asyncDispose]() is called automatically at the end of the block
}
```

> **Normative — asynchronous disposal only.** The container implements `Symbol.asyncDispose` and not `Symbol.dispose`,
> because `onDeactivation` may be async: `await using` disposes it, and a synchronous `using` is a compile error.

**Scoped bindings — the request scope pattern.** A `scoped` binding is a singleton within one child container, and is
deactivated with it: disposing the child runs the `onDeactivation` hooks and `@preDestroy()` of every scoped instance it
cached, latest first and before its own singletons, with the hooks of the container that owns each binding — the same
container whose hooks activated it. The pattern for request scope in a web framework:

```ts
// One child container per request
app.use(async (req, res, next) => {
  await using requestScope = container.createChild();
  requestScope.bind(RequestContext).toConstantValue({ req, res });
  req.container = requestScope;
  next();
});

// The handler uses requestScope
const handler = req.container.resolve(UserController);
// When the request ends, await using calls requestScope.dispose() for you
```

> **The cost of `createChild()`.** `createChild()` creates one new container object holding a parent reference — O(1),
> with no binding copies. `dispose()` only clears the child's singleton cache. The pattern is safe for high-throughput
> request handling.

> **Normative — disposing a container reaches its descendants.** A container whose parent (or any ancestor) has been
> disposed is itself disposed: `isDisposed` reads `true`, and every resolve, `has` and mutation is refused with
> `DisposedContainerError`, including the child's own bindings — a child never keeps building instances from a torn-down
> chain. `createChild()` stays O(1), and the resolve path stays cheap: a root reads only its own disposed flag, and a
> child adds one call-free dispose-epoch compare, walking the ancestors only after some container in the process is
> disposed. A child of a disposed ancestor cannot be revived — open a fresh `Container.create()` for an independent one.
>
> Disposing an ancestor refuses the child's operations but does **not** tear the child down: the child's own singletons
> are deactivated only by the child's own `dispose()`, which stays callable after its ancestor is gone. Dispose each
> child you created — `await using` does it at scope exit.

## Container state lifecycle

> **Normative.** A container has an `isDisposed` state, exposed as a readonly property. After `dispose()` is called:
>
> - Every mutation (`bind`, `unbind`, `rebind`, `load`, `unload`) throws `DisposedContainerError`.
> - Resolution operations (`resolve*`, `has*`, `inspect`) are refused with `DisposedContainerError` too.
> - A method that returns a promise — `resolveAsync`, `resolveOptionalAsync`, `resolveAllAsync`, `loadAsync`,
>   `unloadAsync`, `unbindAsync`, `unbindAllAsync`, `initializeAsync` — refuses with a promise rejected with
>   `DisposedContainerError`, never a synchronous throw, so `.catch()` and `Promise.allSettled` observe the refusal.
> - `dispose()` is idempotent: calling it again is a no-op — no throw, no double-deactivation. This holds for a child
>   whose ancestor is already disposed, so an `await using` child still tears down cleanly at scope exit.
> - A descendant of a disposed container is disposed too — it reports `isDisposed` and refuses the same operations,
>   because its resolution walks a chain that is gone.

```ts
const container = Container.create();
container.bind(Logger).to(ConsoleLogger);

await container.dispose();

container.resolve(Logger); // throws DisposedContainerError
container.bind(Logger).toSelf(); // throws DisposedContainerError
await container.resolveAsync(Logger); // rejects with DisposedContainerError

// Idempotent: calling dispose() again is a no-op
await container.dispose(); // safe — no throw, no double-deactivation
```

## `initializeAsync` — warm up singletons

```ts
await container.initializeAsync();
```

Resolves and caches every `singleton` binding in **the current container** (the parent is not included). The purpose:
fail fast at startup on a config error, and remove lazy-init latency from the first request.

> **Normative — scope, cross-container behaviour, and idempotency.**
>
> - Only singletons defined at the current container are warmed up — it does not walk up to the parent.
> - **Each singleton binding is instantiated directly, not re-selected** — warming never runs another binding whose
>   criteria happen to be a subset of the singleton's slot.
> - If singleton A at the child depends on singleton B at the parent, resolving A triggers resolving B at the parent and
>   caches B there. `initializeAsync()` on a child can therefore indirectly trigger parent singletons.
> - A `toConstantValue` binding is **not skipped** when it has an `onActivation` — the activation runs and the result is
>   cached. A `toConstantValue` with no `onActivation` is skipped (there is nothing to resolve).
> - **Idempotent:** calling it repeatedly is safe — an already-cached singleton is not recreated and its factory does
>   not run again.
> - Bindings added **after** `initializeAsync()` is called are not warmed up automatically — call it again if needed.
> - A singleton carrying a `when()` predicate is **skipped**: a predicate reads the resolution path, and warm-up has no
>   path to hand it, so such a singleton is created by its first real resolve.

## `validate` — checking the graph before the first resolve

```ts
container.validate();
```

Walks the dependency graph and throws `ScopeViolationError` for any violation of the scope matrix in
[Scope](binding.md#scope). An `optional()` dependency counts whenever it is bound — a singleton captures it just the
same — and imposes nothing when it is not.

> **Normative — analysis scope.** `validate()` can only statically analyse bindings whose deps are declared explicitly:
>
> | Binding kind                     | Can `validate()` analyse it?         |
> | -------------------------------- | ------------------------------------ |
> | `to(Class)` with `@injectable`   | ✅ Fully analysed                    |
> | `toSelf()` with `@injectable`    | ✅ Fully analysed                    |
> | `toResolved(factory, deps)`      | ✅ Analyses the deps array           |
> | `toResolvedAsync(factory, deps)` | ✅ Analyses the deps array           |
> | `toAlias(target)`                | ✅ Traced to the target — transitive |
> | `toDynamic(ctx => ...)`          | ❌ Its own deps are opaque           |
> | `toDynamicAsync(ctx => ...)`     | ❌ Its own deps are opaque           |
> | `toConstantValue(value)`         | ✅ No deps — always OK               |

**Alias chains.** When tracing an alias (`toAlias(target)`), `validate()` follows the chain to the final binding. If a
`singleton` consumer aliases to a `scoped` target, that is a scope violation. `validate()` checks transitively — not
only direct dependencies.

**Dynamic factories.** What a `toDynamic` or `toDynamicAsync` factory resolves inside its body is **opaque** to
`validate()`: it never reports a violation there, so it has no false positives but can miss one. The binding itself is
still checked as a dependency — a singleton that depends on a transient `toDynamic` binding is a violation like any
other. At runtime, a factory's own captive dependency is caught only when it breaks something: a singleton factory
resolving a `scoped` binding from the root throws `MissingScopeContextError`, while one capturing a `transient`
dependency raises nothing.

**Dependencies that cannot resolve.** Every binding the walk reaches is a singleton, which resolves its dependencies
from the chain of the container that owns it — so a parent-owned singleton reached from a child is read from the
parent's chain, as `resolve` reads it. A required dependency nothing in that chain selects therefore fails however the
graph is entered, and so does a binding met twice on one path. `validate()` throws what `resolve` would:
`TokenNotBoundError` or `NoMatchingBindingError` with the `path` from the singleton down to the miss, alias hops
included, or `CircularDependencyError` with the cycle. An optional dependency and an `injectAll` collection never miss.

> **Normative — what `validate()` leaves to `resolve`.** A transient or scoped consumer's dependencies are not reported
> missing, since a child container may bind them before it resolves the consumer; and neither is a request whose only
> slot-matching candidates carry a `when()` predicate, since the predicate reads a resolution path the walk does not
> have. Both keep the check free of false positives.

Call `validate()` after loading every module, before serving the first request.

## Introspection

```ts
// Check whether there is any binding at all — checks the whole parent chain
// Returns true if the token has a binding, even if only named/tagged slots (no default)
container.has(Logger);
container.has(Logger, { name: "file" }); // check a binding exists AND matches the hint

// Check a binding exists — the current container only (own)
container.hasOwn(Logger);
container.hasOwn(Logger, { name: "file" });

// Every binding of a token (own only, no walk up to the parent)
// Returns [] rather than undefined when there is no binding
const bindings = container.lookupBindings(Logger); // readonly BindingSnapshot[]

// A snapshot at the moment of the call
const snapshot = container.inspect(); // ContainerSnapshot

// Why a request selects the binding it does — read-only, nothing is instantiated
const explanation = container.explain(Logger, { name: "file" }); // ResolutionExplanation

// The dependency graph as JSON
const graph = container.generateDependencyGraph({ includeParent: false }); // ContainerGraphJson
```

### `has(token)` vs `has(token, hint)`

**Mental model.** `has(token)` asks "is this token bound at all?". `has(token, hint)` asks "would this hint find a
binding?". Neither asks "will a hintless resolve succeed" — that needs a default slot.

```ts
container.bind(Logger).whenNamed("file").to(FileLogger);
// There is no default slot

container.has(Logger); // true  — there is a binding (named "file")
container.has(Logger, { name: "file" }); // true  — a binding matches the hint
container.has(Logger, { name: "console" }); // false — no binding matches the hint

container.resolve(Logger); // throws NoMatchingBindingError — there is no default slot
container.resolve(Logger, { name: "file" }); // FileLogger
```

> **`has(token)` returns `true` but `resolve(token)` throws — this is the correct behaviour.** `has` checks that any
> binding exists; `resolve` with no hint asks for the default slot. When you only need to know "is this token bound at
> all" without resolving, use `has(token)`. When you need to know "will a hintless resolve succeed", `has(token)`
> returning `true` is not enough — with no default slot it will still throw at resolve.

> **`has` vs `hasOwn`.** `has(token)` checks the whole parent chain. `hasOwn(token)` checks the current container only —
> useful when you need to know whether a binding is defined at the child or inherited from the parent.

> **`lookupBindings` returns `[]` rather than `undefined`.** Consistent with `resolveAll` — no bindings means an empty
> array, not `undefined`. To check whether a binding exists, use `has()`.

### The `ContainerSnapshot` interface

`ContainerSnapshot` carries: `ownBindings` (every binding at this container, excluding the parent),
`cachedSingletonCount` (how many singletons are cached here, also excluding the parent), `hasParent`, and `isDisposed`.
`inspect()` on a disposed container throws `DisposedContainerError`, like every other read, so a snapshot you hold
always reads `isDisposed: false` — the field records the state the snapshot was taken in. `ownBindings` lists one
token's bindings in registration order; the order between tokens is unspecified.

Each `BindingSnapshot` carries: `tokenName`, `kind`, `scope`, `slot`, `id`, and `isMany` — `true` for a collection
member, the binding `resolveAll` takes and `resolve` never selects
([Slots and last-wins](binding.md#slots-and-last-wins--the-exact-definition)).

> **Exact shape:** `src/introspection/inspector.ts` — `ContainerSnapshot`, `BindingSnapshot`.

### `explain(token, options?)` — why this binding and not another

`explain()` answers for one request what `resolve(token, options)` would do with it, without instantiating anything: the
bindings each registry offered, what selection made of each, the rule that settled it, and the binding the request ends
on. It reads the chain in the order `resolve` does — the container asked, then each parent — and decides by the same
rules, so its answer is the engine's, not a model of it.

```ts
container.bind(Settlement).toSelf();
container.bind(Logger).to(ConsoleLogger);
container.bind(Logger).when(whenParentIs(Settlement)).to(AuditLogger);

container.explain(Logger).steps[0].candidates.map((candidate) => candidate.verdict);
// ["eligible", "predicate-refused"] — no parent, so the predicate refuses

container.explain(Logger, { ancestors: [Settlement] }).steps[0].rule;
// "sole-predicate" — inside Settlement's factory, the guarded binding wins
```

- **`steps`** holds one entry per registry that holds a token the lookup asked for, in reading order, and again for each
  alias the lookup follows. Each step carries `tokenName`, `depth` (`0` is the container asked, `1` its parent), every
  binding the registry holds for the token as `candidates` in registration order, the `rule` that settled the step, and
  the binding it `selected`. A step with no eligible candidate has neither, and the lookup moves up.
- **A candidate's `verdict`** is `eligible`, `slot-mismatch` (the slot declares a criterion the request does not carry,
  or the request carries criteria and the slot is the default one), `predicate-refused` (the slot matched and `when()`
  returned `false`), or `collection-member` (a `many()` binding, which only `resolveAll` takes).
- **The `rule`** is the step of [the more-specific rule](binding.md#the-more-specific-rule) that decided, in its order:
  `sole-candidate`, `sole-predicate` (the only eligible candidate carrying a predicate), `most-criteria` (the slot
  declaring more criteria than every other), or `ambiguous`. `default-alias` marks a request whose criteria matched no
  slot and that the token's default-slot alias forwards ([`toAlias`](binding.md#toalias--hint-forwarding)).
- **`selected`** is the binding the request resolves to after every alias hop, and **`outcome`** says how the lookup
  ended: `selected`, or the error `resolve` throws in its place — `unbound` (`TokenNotBoundError`), `unmatched`
  (`NoMatchingBindingError`), `ambiguous` (`AmbiguousBindingError`), `alias-cycle` (`CircularDependencyError`).
- **`options.ancestors`** names the resolutions the request is nested in, outermost first. Each is selected as a request
  with no criteria nested in the ones before it, and becomes a frame of the path the request's predicates read — the
  parent is the last one. An ancestor that selects nothing makes `explain()` throw the error its own `resolve` would.
  The lookup runs on the container asked, the way a factory's `ctx.resolve()` runs on its own container.

`explain()` runs `when()` predicates exactly as `resolve` does, which is safe because the contract makes a predicate
pure. On a disposed container it throws `DisposedContainerError`, like every other read.

> **Exact shape:** `src/introspection/explanation.ts` — `ResolutionExplanation`, `ExplanationStep`,
> `CandidateExplanation`, `ExplainOptions`.

### Resolving what a snapshot points at

A snapshot's `slot` states the binding's criteria; `bindingSlotToResolveOptions(slot)` turns them into the
`ResolveOptions` that selects it, so a caller can go from introspection back to a resolve without rebuilding the hint by
hand. It is the binding-side twin of `injectionSlotToResolveOptions`
([`DependencySlot`](foundation-types.md#dependencyslot)).

```ts
for (const binding of container.lookupBindings(Logger)) {
  const value = container.resolve(Logger, bindingSlotToResolveOptions(binding.slot));
}
```

> **Normative.** The default slot — no name, no criteria — yields `undefined`, the hint a `resolve` with no criteria
> takes. Otherwise the reserved criterion **folds into `name`** rather than being restated in `tags`, an already-present
> `name` winning over it, and the remaining criteria are returned as `tags`, omitted when none remain
> ([`ResolveOptions`](foundation-types.md#resolveoptions)). The result therefore matches exactly the slot it came from,
> whichever spelling declared it.

A collection member's slot is the default slot, so the options it yields select the token's ordinary default binding
rather than the member — read members with `resolveAll`.

### The `ContainerGraphJson` interface

`ContainerGraphJson` has three parts: `nodes`, `edges`, and `includesParent` (whether parent bindings were folded in —
it depends on `GraphOptions`).

Each **`GraphNode`** carries `id` (the `BindingIdentifier` rendered as a decimal string, or `"unbound:<tokenKey>"` for a
placeholder node), `tokenName`, `tokenKey` (the token's own identity — two tokens sharing a name still differ by key;
stable within one process), `kind` (or `"unbound"`), `scope` (or `"unbound"`), and `fromParent`.

Each **`GraphEdge`** runs from the consumer (`from`) to the dependency (`to`), with `optional` and `slotName` (the named
slot the edge points at, if the binding declares one). The `label` field is **for display only** — read
`optional`/`slotName` rather than parsing the string. The label forms: `"[0]"`, `"[1]"`, … for deps by index;
`"name:file"` for a named dep; `"tag:fuel=petrol"` for a tagged dep; `"alias"` for an alias edge; and the suffix
`" optional"` when the dep is optional.

`GraphOptions` currently has one field: `includeParent`, defaulting to `false`.

> **Exact shape:** `src/introspection/dependency-graph.ts` — `ContainerGraphJson`, `GraphNode`, `GraphEdge`,
> `GraphOptions`.

**What the graph represents — and what it does not:**

- **An optional dep that is not bound still appears**, as a placeholder node with `kind`/`scope` = `"unbound"` and an
  edge carrying `optional: true`. That keeps "optional but absent" distinct from "not a dependency". "Bound" means bound
  within the graph: with `includeParent: false`, an optional dep that only an ancestor binds is a placeholder too.
- **A required dep that is not bound is skipped** — `validate()` reports one a singleton needs; the graph draws what is
  bound.
- **`injectAll` fans out to every binding** of the token, each edge carrying its `slotName`.
- **Edge targets are filtered by resolution's own slot rules**
  ([`validate`](#validate--checking-the-graph-before-the-first-resolve)): a request that names nothing will not connect
  to a named binding it could never have resolved.
- **Predicates (`when...`) are not evaluated** — a predicate needs a real resolve context, so the graph keeps every
  candidate that has one.
- **With `includeParent: true`**, every ancestor's bindings join the graph (`fromParent: true`), and each edge follows
  resolution's own walk up the chain: a single dependency connects to the nearest container holding a binding its slot
  matches — a child binding the request cannot select shadows nothing — and an `injectAll` connects to every match in
  the chain, as `resolveAll` does.

## The Container interface

Put together, a container exposes nine groups:

| Group                 | Members                                                                                               |
| --------------------- | ----------------------------------------------------------------------------------------------------- |
| State                 | `isDisposed`                                                                                          |
| Binding               | `bind`, `unbind`, `unbindAsync`, `unbindAll`, `unbindAllAsync`, `rebind`                              |
| Module                | `load`, `loadAsync`, `unload`, `unloadAsync`, `loadAutoRegistered`                                    |
| Container-level hooks | `onActivation`, `onDeactivation`                                                                      |
| Resolution            | `resolve`, `resolveAsync`, `resolveOptional`, `resolveOptionalAsync`, `resolveAll`, `resolveAllAsync` |
| Child                 | `createChild`                                                                                         |
| Disposal              | `dispose`, `[Symbol.asyncDispose]`                                                                    |
| Initialise & check    | `initializeAsync`, `validate`                                                                         |
| Introspection         | `has`, `hasOwn`, `lookupBindings`, `inspect`, `generateDependencyGraph`                               |

At the static level there are three: `create(options?)`, `fromModules(...)`, `fromModulesAsync(...)`. `ContainerOptions`
currently has only `metadataReader` — defaulting to the decorator reader, and inherited by children.

> **Exact shape:** `src/container/container.ts` — `Container`, `ContainerOptions`, `ContainerStatic`.
