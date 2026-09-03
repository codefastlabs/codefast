# @codefast/di

Lightweight, type-safe dependency injection for TypeScript applications, built on TC39 Stage 3 decorators with no
`reflect-metadata` and no `experimentalDecorators`.

[![npm version](https://img.shields.io/npm/v/@codefast/di)](https://www.npmjs.com/package/@codefast/di)
[![license](https://img.shields.io/npm/l/@codefast/di)](./LICENSE)

## Overview

`@codefast/di` manages the services your app depends on. You describe how to build each service once, then ask a
container for it by a typed key. The container constructs that service — and everything it depends on — in the right
order.

Two calls carry the whole model: `bind` registers a service, and `resolve` returns a fully wired instance.

Use dependency injection when you want swappable implementations, scoping, and lifecycle handled for you, with the
wiring checked by the TypeScript compiler. Reach for plain `new` while a few objects still do the job; the library earns
its keep as the dependency graph grows.

- **Typed tokens.** `Token<Value>` flows through every `bind → resolve` path, so `resolve()` returns exactly the type
  you registered.
- **Native Stage 3 decorators.** `@injectable`, `inject`, `optional`, `injectAll`, `@postConstruct`, and `@preDestroy`
  declare dependencies explicitly — no runtime reflection.
- **Fluent bindings.** Constants, classes, sync and async factories, aliases, named/tagged/predicate constraints, and
  lifecycle hooks compose in one invariant chain order.
- **Scopes with validation.** Choose `singleton`, `scoped`, or `transient`, and call `validate()` to catch captive
  dependencies before the first request.
- **Modules and introspection.** Bundle bindings into reusable modules, and inspect a container or render its dependency
  graph as DOT, Mermaid, Cytoscape, or React Flow.

## Installation

```bash
pnpm add @codefast/di
```

`@codefast/di` requires Node.js 24 or later and TypeScript 5.9 or later, with native Stage 3 decorators. Leave
`experimentalDecorators` off — it's off by default. The package is published on 0.x and versioned on its own track:
breaking changes ship as minor versions, so pin the minor version when you need stability.

## Quick start

```ts
import { Container, injectable, token } from "@codefast/di";

interface Logger {
  info(message: string): void;
}

const LoggerToken = token<Logger>("Logger");

@injectable([LoggerToken])
class CheckoutService {
  constructor(private readonly logger: Logger) {}

  complete(orderId: string): void {
    this.logger.info(`Order ${orderId} completed`);
  }
}

const container = Container.create();

container.bind(LoggerToken).toConstantValue({
  info: (message) => console.log(`[app] ${message}`),
});
container.bind(CheckoutService).toSelf();

container.resolve(CheckoutService).complete("ORD-1001");

// Swap infrastructure without touching business classes
container.rebind(LoggerToken).toConstantValue({
  info: (message) => console.log(`[test] ${message}`),
});
```

`@injectable([...])` declares a class's constructor dependencies, in parameter order. The decorator checks the list
against the constructor signature, so a dependency of the wrong type — or a list of the wrong length — is a compile-time
error.

## Tokens

A token is a typed key that identifies a service. It pairs a name with a TypeScript type, and it's the identity you bind
and resolve against. Tokens compare by reference, so declare each one once and reuse the `const`.

```ts
import { token } from "@codefast/di";

const DbToken = token<Database>("Database");
```

A class constructor works as a key too: `container.bind(UserService).toSelf()`, then `container.resolve(UserService)`.

## Bindings

A binding describes how the container produces a value for a token. You declare it as a chain, in one fixed order: a
strategy (the `to*` step, which produces the value), then optional constraints, a scope, and lifecycle hooks. Only
`container.bind(key).to*(…)` is required; everything after it is optional.

| Strategy                          | Produces                                                          |
| --------------------------------- | ----------------------------------------------------------------- |
| `.toConstantValue(value)`         | A fixed value (always singleton)                                  |
| `.toSelf()` / `.to(Constructor)`  | A class instance built from its `@injectable` metadata            |
| `.toDynamic(factory)`             | A sync factory `(ctx: ResolutionContext) => Value`                |
| `.toDynamicAsync(factory)`        | An async factory — resolve it with the `*Async` container methods |
| `.toResolved(factory, deps)`      | A factory called with its typed dependency tuple already resolved |
| `.toResolvedAsync(factory, deps)` | The same, returning a `Promise`                                   |
| `.toAlias(targetToken)`           | An alias — a redirect to another token's binding                  |

```ts
container.bind(ConfigToken).toConstantValue({ dbUrl: "postgres://…" });

container.bind(DbToken).toDynamicAsync(async (ctx) => {
  const db = new Database(ctx.resolve(ConfigToken).dbUrl);
  await db.connect();
  return db;
});

container
  .bind(UserServiceToken)
  .toResolved((repo, config) => new UserService(repo, config), [UserRepository, ConfigToken]);
```

### Scopes

A scope determines how long an instance lives and which container owns it. The default is `transient`, so a binding with
no scope produces a new instance every time.

| Scope          | Lifetime                                                                                 |
| -------------- | ---------------------------------------------------------------------------------------- |
| `.singleton()` | One instance for the container that owns the binding; children resolve the same instance |
| `.scoped()`    | One instance per child container — resolving from a container with no child scope throws |
| `.transient()` | A new instance on every resolution — the default                                         |

```ts
container.bind(DbToken).toDynamic(createDb).singleton();
container.bind(RequestContextToken).toSelf().scoped();
```

> **Important.** Resolving a `scoped` binding from a container with no child scope throws `MissingScopeContextError`.
> Open a scope with [`createChild()`](#child-containers) first.

### Lifecycle hooks

A lifecycle hook runs your code as an instance is created or torn down. `.onActivation(fn)` runs right after an instance
is created, and may replace it; `.onDeactivation(fn)` runs when the owning container is disposed or the binding is
unbound. Both are also available container-wide, through `container.onActivation(token, fn)` and
`container.onDeactivation(token, fn)`:

```ts
container
  .bind(DbToken)
  .toDynamicAsync(connectDb)
  .singleton()
  .onDeactivation((db) => db.close());
```

### Constraints

Several bindings can share one token, and a constraint decides which one a given `resolve` receives. A binding's set of
constraints is its slot — think of a slot as a labelled variant of the token.

**Named — the common case.** A named slot is keyed by a plain string. Declare it with `whenNamed`, and request it with
`{ name }`:

```ts
container.bind(LoggerToken).toConstantValue(consoleLogger).whenNamed("console");
container.bind(LoggerToken).toConstantValue(fileLogger).whenNamed("file");

container.resolve(LoggerToken, { name: "file" }); // → fileLogger
```

**Tagged — for typed, collision-proof keys.** A criterion is a `[key, value]` pair. Declare the key once with
`tag<Value>(name)`, then mint a criterion with `key.of(value)`. The bind site and the resolve site share the same typed
key: a key declared `tag<"s3" | "gcs">` refuses any other value, so the two sites can't drift apart.

```ts
import { tag } from "@codefast/di";

const Provider = tag<"s3" | "gcs">("provider");

container.bind(StorageToken).to(S3Storage).whenTagged(Provider.of("s3"));
container.resolve(StorageToken, { tag: Provider.of("s3") }); // → S3Storage
```

**How a request selects a slot.** In one line: a request matches a slot when it carries every tag the slot declares.

- Adding tags to a request makes it match more slots, not fewer — it's a superset filter.
- When several slots match, the slot declaring more of the request's tags wins (most-specific-wins).
- A tie between equally specific slots throws `AmbiguousBindingError`.
- A request with no criteria selects the binding marked `.whenDefault()` — or, equivalently, the binding that declares
  no constraint at all.

> **Note.** `key.of(value)` interns each value: the same value always yields the same criterion object, which lets
> lookup compare by identity. A criterion built by hand — not through `.of()` — matches nothing.

`{ tag: criterion }` and `{ tags: [criterion] }` are the same request — for `resolve`, and for `inject`, `optional`, and
`injectAll` alike. Chain `.whenTagged(...)` once per criterion a slot carries, and request several at once with
`{ tags: [...] }`.

**Predicate constraints — graph-aware selection.** When a slot isn't enough — when you need to choose based on _who_ is
resolving — pass a predicate to `.when(ctx => boolean)`. It runs at resolve time, after slot matching. These ready-made
predicates ship from the root entry:

| Predicate                            | Matches when                                           |
| ------------------------------------ | ------------------------------------------------------ |
| `whenParentIs(token)`                | the direct parent resolves `token`                     |
| `whenNoParentIs(token)`              | there is no parent, or it resolves a different token   |
| `whenAnyAncestorIs(token)`           | some ancestor resolves `token`                         |
| `whenNoAncestorIs(token)`            | no ancestor resolves `token`                           |
| `whenParentNamed(name)`              | the parent's slot carries that name                    |
| `whenAnyAncestorNamed(name)`         | some ancestor's slot carries that name                 |
| `whenParentTagged(criterion)`        | the parent's slot carries that criterion               |
| `whenAnyAncestorTagged(criterion)`   | some ancestor's slot carries that criterion            |
| `whenParentTaggedAll(criteria)`      | the parent's slot carries all criteria in the array    |
| `whenAnyAncestorTaggedAll(criteria)` | some ancestor's slot carries all criteria in the array |

For the exact matching and most-specific-wins rules, see [`SPEC.md` → Slots and last-wins](./SPEC.md#slot-matching).

## Decorators

Decorators are optional: you can wire an entire app with explicit bindings and never write one. When you do reach for
them:

- `@injectable([...deps])` — declares a class's constructor dependencies, in parameter order.
- `inject(token, options)` — wraps one dependency with slot options (`name`, `tag`, `tags`).
- `optional(token)` — resolves to `undefined` when nothing is bound.
- `injectAll(token)` — collects every matching binding into an array.
- `@postConstruct()` — runs after wiring; `@preDestroy()` runs on disposal. An async `@postConstruct` needs
  `resolveAsync`.

```ts
import { inject, injectable, injectAll, optional, postConstruct, preDestroy } from "@codefast/di";

@injectable([DbToken, optional(CacheToken), injectAll(PluginToken), inject(LoggerToken, { name: "audit" })])
class UserRepository {
  constructor(
    private readonly db: Database,
    private readonly cache: Cache | undefined,
    private readonly plugins: Array<Plugin>,
    private readonly audit: Logger,
  ) {}

  @postConstruct()
  async init(): Promise<void> {
    await this.db.warmCache();
  }

  @preDestroy()
  async shutdown(): Promise<void> {
    await this.db.flush();
  }
}
```

### Accessor injection

Accessor injection sets a property from the container instead of through the constructor. `inject` doubles as an
accessor decorator:

```ts
import { inject, injectable, runWithContainer } from "@codefast/di";

@injectable()
class Controller {
  @inject(LoggerToken) accessor logger!: Logger;
}

const fromContainer = container.resolve(Controller);
const byHand = runWithContainer(container, () => new Controller());
```

An accessor resolves from the container that's constructing the instance. When something else owns the `new` — a router,
an ORM, a test helper — open that context with `runWithContainer`. Without one, the accessor throws
`MissingContainerContextError`. `getActiveContainer()` reads the open context.

### Auto-registration

To avoid binding classes one by one, let them register themselves.
`@injectable(deps, { autoRegister: registry, scope })` records the class in a registry from
`createAutoRegisterRegistry()`, and `container.loadAutoRegistered(registry)` binds the whole set in one call.

### Custom metadata

Some classes you can't decorate — a dependency's class, generated code, plain JavaScript. Wire them by supplying their
metadata through a `MetadataReader`, passed as `Container.create({ metadataReader })`. A reader reports constructor
parameters, lifecycle method names, and `@inject` accessors; delegate misses to `defaultMetadataReader` so decorated
classes keep working. The reader is fixed when the container is created, and inherited by its children.

## Container

```ts
const container = Container.create();

container.resolve(ServiceToken); // throws TokenNotBoundError when unbound
container.resolveOptional(CacheToken); // undefined when unbound
container.resolveAll(HandlerToken); // every matching binding
container.has(ServiceToken); // true when this container or an ancestor binds it

const db = await container.resolveAsync(DbToken); // required for async bindings
```

### Sync vs async resolution

The rule is simple: if anything in the chain is async, resolve with an `*Async` method. A synchronous `resolve()` that
reaches an async factory — its own, or a dependency's — throws `AsyncResolutionError` rather than silently returning a
`Promise`.

| Sync              | Async counterpart      |
| ----------------- | ---------------------- |
| `resolve`         | `resolveAsync`         |
| `resolveOptional` | `resolveOptionalAsync` |
| `resolveAll`      | `resolveAllAsync`      |

An async `@postConstruct` or `onActivation` hook needs an `*Async` resolve too; on a synchronous path, it throws
`AsyncActivationError`. `initializeAsync()` warms every eligible singleton up front, so later `resolve()` calls stay
synchronous.

### Child containers

A child container implements the request-scope pattern. It falls through to its parent's bindings and shares the
parent's singletons, while each `scoped` binding gets a fresh instance per child.

```ts
{
  await using requestContainer = container.createChild();
  requestContainer.bind(RequestIdToken).toConstantValue(crypto.randomUUID());
  const service = requestContainer.resolve(RequestScopedService);
} // dispose() runs here and releases what this child owns
```

### Validation

A captive dependency is a long-lived binding that holds a shorter-lived one — a `singleton` that depends on a `scoped`
or `transient` binding — which silently freezes that dependency for the singleton's whole life. `validate()` fails fast
on captive dependencies, and on constraints no request can satisfy, before the first resolve.

```ts
container.validate(); // throws ScopeViolationError on the first violation
```

### Disposal

`Container` implements `AsyncDisposable`, so `await using` runs every deactivation hook automatically as the block
exits. Synchronous `using` isn't supported — `onDeactivation` may be async — and `Symbol.dispose` throws
`SyncDisposalNotSupportedError`.

### Introspection

`container.inspect()` returns a `ContainerSnapshot`; `container.lookupBindings(token)` returns the snapshots of one
token's bindings; and `container.generateDependencyGraph()` returns a JSON graph. Adapters render that graph for common
viewers: `toDotGraph`, `toMermaidGraph`, `toCytoscapeGraph`, and `toReactFlowGraph`.

## Modules

A module is a reusable, stateless bundle of related bindings. Group them once, then load them into any container.

```ts
import { Container, Module } from "@codefast/di";

const InfrastructureModule = Module.create("Infra", (api) => {
  api.bind(LoggerToken).toConstantValue(console);
});

const AppModule = Module.create("App", (api) => {
  api.import(InfrastructureModule);
  api.bind(UserRepository).toSelf().singleton();
});

const container = Container.fromModules(AppModule);
```

`Module.createAsync` lets you await during setup — for remote config or connections. Load those with
`Container.fromModulesAsync` or `container.loadAsync`. Modules are ref-counted: loading one twice counts once, and
`unload` removes its bindings only when the count reaches zero.

## Errors

Every error extends `DiError` and carries a stable `code`, so you can branch on the code rather than the message:

| Error                          | Code                        | Raised when                                                                |
| ------------------------------ | --------------------------- | -------------------------------------------------------------------------- |
| `TokenNotBoundError`           | `TOKEN_NOT_BOUND`           | No binding exists for the token in the container chain                     |
| `NoMatchingBindingError`       | `NO_MATCHING_BINDING`       | The token has bindings but none matches the request's slot                 |
| `AmbiguousBindingError`        | `AMBIGUOUS_BINDING`         | Several bindings match with no more-specific winner                        |
| `CircularDependencyError`      | `CIRCULAR_DEPENDENCY`       | A cycle appears on the resolution path                                     |
| `AsyncResolutionError`         | `ASYNC_RESOLUTION`          | A sync `resolve()` reaches an async factory                                |
| `AsyncActivationError`         | `ASYNC_ACTIVATION`          | A `@postConstruct` or `onActivation` hook returns a promise on a sync path |
| `ScopeViolationError`          | `SCOPE_VIOLATION`           | `validate()` finds a captive dependency                                    |
| `MissingScopeContextError`     | `MISSING_SCOPE_CONTEXT`     | A `scoped` binding is resolved outside a child container                   |
| `MissingContainerContextError` | `MISSING_CONTAINER_CONTEXT` | An `@inject` accessor initializes with no container open                   |
| `DisposedContainerError`       | `DISPOSED_CONTAINER`        | A disposed container is used                                               |

The full taxonomy — including `MissingMetadataError`, `InvalidMetadataError`, `RebindUnboundTokenError`,
`AsyncModuleLoadError`, and the rest — is exported from the root entry and from `@codefast/di/errors/errors`.

## Subpath exports

Prefer the root entry: it re-exports the whole public API. Reach for a subpath only to trim a bundle, or to pull in
something the root doesn't surface.

Every module is also published as a subpath that mirrors the source layout: the model under `@codefast/di/core/*`
(`core/token`, `core/tag`, `core/module`, …), errors under `errors/*`, the runtime under `container/*`, `injection/*`,
`lifecycle/*`, and `resolution/*` (for example `@codefast/di/resolution/select/constraints`), and decorators and
metadata under `decorators/*` and `metadata/*`. Introspection ships at flat specifiers: `@codefast/di/inspector`,
`@codefast/di/dependency-graph`, and `@codefast/di/graph-adapters/{dot,mermaid,cytoscape,reactflow}`.

## Benchmarks

A first-party benchmark suite lives in the monorepo, at [`benchmarks/di-inversify`](../../benchmarks/di-inversify). It
runs the same workloads through `@codefast/di`, InversifyJS, Awilix, and tsyringe, and its `RESULTS.md` ledger records
the numbers alongside the method that produced them. Run it yourself rather than taking any figure on faith.

## Documentation

- [Rendered docs on codefastlabs.com](https://codefastlabs.com/docs/di)
- [`SPEC.md`](./SPEC.md) — the behavioural contract: public API, semantics, and errors.
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — the internal shape and the invariants the hot paths depend on.
- [`LEARNING.md`](./LEARNING.md) — a guided tour of the techniques the engine applies, pointing at the code.
- [`examples/`](./examples/README.md) — runnable examples from basic tokens to a multi-file Ports & Adapters app.
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — the package workflow: build, exports mirror, tests, and the perf guard.
- [`CHANGELOG.md`](./CHANGELOG.md) — release history.

## Contributing

See the repo-wide [contributing guide](../../CONTRIBUTING.md) for setup and conventions, and this package's
[`CONTRIBUTING.md`](./CONTRIBUTING.md) for the resolver perf guard and the exports mirror.

## License

Released under the [MIT License](./LICENSE).
