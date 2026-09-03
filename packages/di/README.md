# @codefast/di

Lightweight, type-safe dependency injection for TypeScript applications, built on TC39 Stage 3 decorators with no
`reflect-metadata` and no `experimentalDecorators`.

[![npm version](https://img.shields.io/npm/v/@codefast/di)](https://www.npmjs.com/package/@codefast/di)
[![license](https://img.shields.io/npm/l/@codefast/di)](./LICENSE)

- **Typed tokens.** `Token<Value>` flows through every `bind → resolve` path; `resolve()` returns the type you
  registered.
- **Native Stage 3 decorators.** `@injectable`, `inject`, `optional`, `injectAll`, `@postConstruct`, `@preDestroy` —
  dependencies are declared explicitly, so no runtime reflection is involved.
- **Fluent bindings.** Constants, classes, sync and async factories, aliases, named/tagged/predicate constraints, and
  lifecycle hooks in one invariant chain order.
- **Scopes with validation.** `singleton` / `scoped` / `transient`, plus `validate()` to catch captive dependencies
  before the first request.
- **Modules and introspection.** Bundle bindings into reusable modules; inspect a container or render its dependency
  graph for DOT, Mermaid, Cytoscape, or React Flow.

## Installation

```bash
pnpm add @codefast/di
```

Requires Node.js 24 or later and TypeScript 5.2 or later with native Stage 3 decorators — leave `experimentalDecorators`
off (it is off by default). Published on 0.x and versioned on its own track: breaking changes ship as minor versions, so
pin the minor if you need stability.

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

`@injectable([...])` lists constructor dependencies in parameter order. The decorator checks that list against the
constructor signature, so a dependency of the wrong type or a list of the wrong length is a compile error.

## Tokens

A token pairs a name with a TypeScript type. Tokens compare by reference, so declare each one once and reuse the
`const`.

```ts
import { token } from "@codefast/di";

const DbToken = token<Database>("Database");
```

A class constructor is also a valid key: `container.bind(UserService).toSelf()` then `container.resolve(UserService)`.

## Bindings

Start with `container.bind(key)`, chain a strategy, then optional constraints, a scope, and lifecycle hooks.

| Strategy                          | Produces                                                          |
| --------------------------------- | ----------------------------------------------------------------- |
| `.toConstantValue(value)`         | A fixed value (always singleton)                                  |
| `.toSelf()` / `.to(Constructor)`  | A class instance built from its `@injectable` metadata            |
| `.toDynamic(factory)`             | A sync factory `(ctx: ResolutionContext) => Value`                |
| `.toDynamicAsync(factory)`        | An async factory — resolve it with the `*Async` container methods |
| `.toResolved(factory, deps)`      | A factory called with its typed dependency tuple already resolved |
| `.toResolvedAsync(factory, deps)` | The same, returning a `Promise`                                   |
| `.toAlias(targetToken)`           | A redirect to another token's binding                             |

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

| Scope          | Lifetime                                                                                 |
| -------------- | ---------------------------------------------------------------------------------------- |
| `.singleton()` | One instance for the container that owns the binding; children resolve the same instance |
| `.scoped()`    | One instance per child container — resolving from a container with no child scope throws |
| `.transient()` | A new instance on every resolution — the default                                         |

```ts
container.bind(DbToken).toDynamic(createDb).singleton();
container.bind(RequestContextToken).toSelf().scoped();
```

### Lifecycle hooks

`.onActivation(fn)` runs after an instance is created and may replace it; `.onDeactivation(fn)` runs when the owning
container is disposed or the binding is unbound. Both are also available container-wide through
`container.onActivation(token, fn)` / `container.onDeactivation(token, fn)`, for example
`container.bind(DbToken).toDynamicAsync(connectDb).singleton().onDeactivation((db) => db.close())`.

### Constraints

Several bindings can share one token; a constraint picks the winner at resolution time. Named slots take a plain string.
Tagged slots take a **criterion** minted from a tag key.

```ts
import { tag } from "@codefast/di";

const Provider = tag<"s3" | "gcs">("provider");

container.bind(LoggerToken).toConstantValue(fileLogger).whenNamed("file");
container.bind(StorageToken).to(S3Storage).whenTagged(Provider.of("s3"));

container.resolve(LoggerToken, { name: "file" });
container.resolve(StorageToken, { tag: Provider.of("s3") });
```

`tag<Value>(name)` declares the key once and types both ends: a key declared `tag<"s3" | "gcs">` refuses any other
value, so a bind site and a resolve site cannot drift apart silently. `key.of(value)` interns, so the same value always
yields the same criterion, which is what lets lookup compare by identity. A criterion built by hand matches nothing.

`{ tag: criterion }` and `{ tags: [criterion] }` are the same request, on `resolve` and on `inject` / `optional` /
`injectAll` alike. Chain `.whenTagged(...)` once per criterion when a slot carries more than one, and request it with
`{ tags: [...] }`.

A request matches a slot when it carries **every** tag that slot declares, so adding tags to a request makes it match
more slots, not fewer. When several slots match, the one declaring more of the request's tags wins; a tie is an
`AmbiguousBindingError`. `.whenDefault()` marks the binding a request with no criteria selects.

For graph-aware selection, pass a predicate to `.when(...)`. Ready-made predicates ship from the root entry:
`whenParentIs`, `whenNoParentIs`, `whenAnyAncestorIs`, `whenNoAncestorIs`, `whenParentNamed`, `whenAnyAncestorNamed`,
`whenParentTagged`, `whenAnyAncestorTagged`, `whenParentTaggedAll`, and `whenAnyAncestorTaggedAll`.

## Decorators

`inject(token, options)` wraps a dependency with slot options (`name`, `tag`, `tags`), `optional()` resolves to
`undefined` when nothing is bound, and `injectAll()` collects every matching binding into an array. `@postConstruct()`
runs after wiring and `@preDestroy()` on disposal; an async `@postConstruct` needs `resolveAsync`.

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

`inject` also works as an accessor decorator for property injection:

```ts
import { inject, injectable, runWithContainer } from "@codefast/di";

@injectable()
class Controller {
  @inject(LoggerToken) accessor logger!: Logger;
}

const fromContainer = container.resolve(Controller);
const byHand = runWithContainer(container, () => new Controller());
```

An accessor resolves from the container that is constructing the instance. When something else owns the `new` — a
router, an ORM, a test helper — open that context with `runWithContainer`; without one the accessor throws
`MissingContainerContextError`. `getActiveContainer()` reads the open context.

### Auto-registration

`@injectable(deps, { autoRegister: registry, scope })` records the class in a registry from
`createAutoRegisterRegistry()`, and `container.loadAutoRegistered(registry)` binds the whole set in one call.

### Custom metadata

Classes you cannot decorate — a dependency's class, generated code, plain JavaScript — are wired by supplying their
metadata through a `MetadataReader` passed as `Container.create({ metadataReader })`. A reader reports constructor
parameters, lifecycle method names, and `@inject` accessors — delegate misses to `defaultMetadataReader` so decorated
classes keep working. The reader is fixed when the container is created and inherited by its children.

## Container

```ts
const container = Container.create();

container.resolve(ServiceToken); // throws TokenNotBoundError when unbound
container.resolveOptional(CacheToken); // undefined when unbound
container.resolveAll(HandlerToken); // every matching binding
container.has(ServiceToken); // true when this container or an ancestor binds it

const db = await container.resolveAsync(DbToken); // required for async bindings
```

A sync `resolve()` of a token whose factory — or a dependency's factory — is async throws `AsyncResolutionError`. Use
`resolveAsync` / `resolveOptionalAsync` / `resolveAllAsync` whenever the chain contains async work. `initializeAsync()`
warms every eligible singleton up front so later resolutions stay synchronous.

### Child containers

A child falls through to its parent's bindings and resolves the parent's singletons, while `scoped` bindings get one
instance per child — the request-scope pattern.

```ts
{
  await using requestContainer = container.createChild();
  requestContainer.bind(RequestIdToken).toConstantValue(crypto.randomUUID());
  const service = requestContainer.resolve(RequestScopedService);
} // dispose() runs here and releases what this child owns
```

### Validation

`validate()` fails fast on captive dependencies — a `singleton` depending on a `scoped` or `transient` binding — and on
constraints no request can satisfy.

```ts
container.validate(); // throws ScopeViolationError on the first violation
```

### Disposal

`Container` implements `AsyncDisposable`, so `await using` runs every deactivation hook automatically. Sync `using` is
not supported because `onDeactivation` may be async; `Symbol.dispose` throws `SyncDisposalNotSupportedError`.

### Introspection

`container.inspect()` returns a `ContainerSnapshot`, `container.lookupBindings(token)` the snapshots of one token's
bindings, and `container.generateDependencyGraph()` a JSON graph. Adapters render that graph for common viewers:
`toDotGraph`, `toMermaidGraph`, `toCytoscapeGraph`, and `toReactFlowGraph`.

## Modules

Modules bundle related bindings into reusable, stateless units.

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

`Module.createAsync` supports awaiting during setup (remote config, connections); load those with
`Container.fromModulesAsync` or `container.loadAsync`. Modules are ref-counted: loading one twice counts once, and
`unload` removes its bindings only when the count reaches zero.

## Errors

Every error extends `DiError` and carries a stable `code`, so a caller can branch on the code rather than the message:

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

The root entry re-exports the whole public API, and it is the import to prefer. Every module is also published as a
subpath that mirrors the source layout: the model under `@codefast/di/core/*` (`core/token`, `core/tag`, `core/module`,
…), errors under `errors/*`, the runtime under `container/*`, `injection/*`, `lifecycle/*`, and `resolution/*` (for
example `@codefast/di/resolution/select/constraints`), and decorators and metadata under `decorators/*` and
`metadata/*`. Introspection ships at flat specifiers: `@codefast/di/inspector`, `@codefast/di/dependency-graph`, and
`@codefast/di/graph-adapters/{dot,mermaid,cytoscape,reactflow}`.

## Benchmarks

A first-party benchmark suite lives in the monorepo at [`benchmarks/di-inversify`](../../benchmarks/di-inversify). It
runs the same workloads through `@codefast/di`, InversifyJS, Awilix, and tsyringe, and its `RESULTS.md` ledger holds the
numbers together with the method that produced them. Run it yourself rather than taking a figure on faith.

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
