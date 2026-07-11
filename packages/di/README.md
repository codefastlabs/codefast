# @codefast/di

Lightweight, type-safe dependency injection for modern TypeScript — built on TC39 Stage 3 decorators, with no `reflect-metadata` and no `experimentalDecorators`.

[![npm version](https://img.shields.io/npm/v/@codefast/di)](https://www.npmjs.com/package/@codefast/di)
[![license](https://img.shields.io/npm/l/@codefast/di)](https://github.com/codefastlabs/codefast/blob/main/LICENSE)

- **Typed tokens.** `Token<Value>` flows through every `bind → resolve` path; `resolve()` returns the type you registered.
- **Native Stage 3 decorators.** `@injectable`, `inject`, `optional`, `@postConstruct`, `@preDestroy` — no runtime reflection tricks.
- **Fluent bindings.** Constants, classes, sync/async factories, aliases, named/tagged/predicate constraints, lifecycle hooks.
- **Scopes with validation.** `singleton` / `scoped` / `transient`, plus `validate()` to catch captive dependencies early.
- **Modules.** Bundle bindings into reusable units; load, unload, and compose them across containers.
- **Async-aware.** Async factories, deduped async singleton construction, and `await using` disposal.

> Currently published as `1.0.0-canary.x` pre-releases on the way to a stable 1.0.

## Requirements

- **Node.js 26 or later — required.** The container uses the native `Map.prototype.getOrInsert` (ES2025), which ships in Node 26+. On older Node versions the package throws at runtime.
- **TypeScript 5.2+** with native Stage 3 decorators — leave `experimentalDecorators` **off** (it is off by default).

## Installation

```bash
pnpm add @codefast/di
# or: npm install @codefast/di
```

## Quick Start

```typescript
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

`@injectable([...])` lists constructor dependencies in parameter order — no parameter-type reflection, so it works in any ESM runtime that supports Stage 3 decorators.

## Tokens

A token pairs a name with a TypeScript type. Tokens compare by reference — always reuse the same `const`.

```typescript
import { token } from "@codefast/di";

const DbToken = token<Database>("Database");
```

A class constructor can also be a key directly: `container.bind(UserService).toSelf()` then `container.resolve(UserService)`.

## Bindings

Start with `container.bind(key)`, chain a strategy, then optional constraints and a scope.

| Strategy                          | Produces                                                    |
| --------------------------------- | ----------------------------------------------------------- |
| `.toConstantValue(value)`         | A fixed value (always singleton)                            |
| `.toSelf()` / `.to(Constructor)`  | A class instance built from `@injectable` metadata          |
| `.toDynamic(factory)`             | Sync factory `(ctx: ResolutionContext) => Value`            |
| `.toDynamicAsync(factory)`        | Async factory — resolve with the `*Async` container methods |
| `.toResolved(factory, deps)`      | Factory with a typed dependency tuple, resolved in order    |
| `.toResolvedAsync(factory, deps)` | Same, returning a `Promise`                                 |
| `.toAlias(targetToken)`           | Redirects resolution to another token                       |

```typescript
container.bind(ConfigToken).toConstantValue({ dbUrl: "postgres://…" });

container.bind(DbToken).toDynamicAsync(async (ctx) => {
  const db = new Database(ctx.resolve(ConfigToken).dbUrl);
  await db.connect();
  return db;
});

container
  .bind(UserServiceToken)
  .toResolved((repo, config) => new UserService(repo, config), [UserRepository, ConfigToken] as const);
```

### Scopes

| Scope          | Lifetime                                                   |
| -------------- | ---------------------------------------------------------- |
| `.singleton()` | One instance per root container, shared with children      |
| `.scoped()`    | One instance per child container (request-scoped services) |
| `.transient()` | New instance on every resolution — the default             |

```typescript
container.bind(DbToken).toDynamic(createDb).singleton();
container.bind(RequestContextToken).toSelf().scoped();
```

### Constraints

Multiple bindings can share one token; a constraint picks the winner at resolution time.

```typescript
container.bind(LoggerToken).toConstantValue(fileLogger).whenNamed("file");
container.bind(StorageToken).to(S3Storage).whenTagged("provider", "s3");

container.resolve(LoggerToken, { name: "file" });
container.resolve(StorageToken, { tag: ["provider", "s3"] });
```

For graph-aware selection, pass a predicate to `.when(...)` — helpers like `whenParentIs`, `whenAnyAncestorNamed`, and `whenParentTagged` ship in `@codefast/di/constraints`.

## Decorators

All decorators use TC39 Stage 3 syntax. `inject()` wraps a dependency with resolve options, `optional()` resolves to `undefined` when unbound, and `injectAll()` collects every matching binding into an array.

```typescript
import { inject, injectable, optional, postConstruct, preDestroy } from "@codefast/di";

@injectable([DbToken, optional(CacheToken)])
class UserRepository {
  constructor(
    private readonly db: Database,
    private readonly cache?: Cache,
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

`inject` also works as an accessor decorator for post-construction property injection:

```typescript
@injectable()
class Controller {
  @inject(LoggerToken) accessor logger!: Logger;
}
```

## Container

```typescript
const container = Container.create();

container.resolve(ServiceToken); // throws TokenNotBoundError when unbound
container.resolveOptional(CacheToken); // undefined when unbound
container.resolveAll(HandlerToken); // every matching binding

const db = await container.resolveAsync(DbToken); // required for async bindings
```

Mixing an async binding into a sync `resolve()` throws `AsyncResolutionError` — use `resolveAsync` / `resolveAllAsync` / `resolveOptionalAsync` whenever the chain contains async work.

### Child containers

Children fall through to the parent's bindings and share its singleton cache, while `scoped` bindings get one instance per child — ideal for per-request wiring.

```typescript
const requestContainer = container.createChild();
const service = requestContainer.resolve(RequestScopedService);
await requestContainer.dispose(); // releases scoped instances owned by this child
```

### Validation

`validate()` fails fast on captive dependencies — for example a `singleton` depending on a `scoped` or `transient` binding.

```typescript
container.validate(); // throws ScopeViolationError on the first violation
```

### Disposal

`Container` implements `AsyncDisposable`, so `await using` runs deactivation hooks automatically:

```typescript
{
  await using container = Container.create();
  container.bind(DbToken).toDynamicAsync(connectDb).singleton().onDeactivation(disconnectDb);
  const db = await container.resolveAsync(DbToken);
} // dispose() runs here
```

## Modules

Modules bundle related bindings into reusable, stateless units.

```typescript
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

`Module.createAsync` supports awaiting during setup (remote config, connections); load those with `Container.fromModulesAsync` or `container.loadAsync`. Modules are ref-counted: re-loading is a no-op and `unload` only removes bindings once the count reaches zero.

## Errors

Every error extends `DiError` and carries a stable `code` — `TokenNotBoundError` (`"TOKEN_NOT_BOUND"`), `CircularDependencyError`, `ScopeViolationError`, `AsyncResolutionError`, `AmbiguousBindingError`, and friends. Import them from the root or from `@codefast/di/errors`.

## Subpath exports

The root entry re-exports the full public API. Every internal area is also published as a tree-shakeable subpath — `@codefast/di/container`, `@codefast/di/token`, `@codefast/di/module`, `@codefast/di/constraints`, `@codefast/di/errors`, and graph adapters under `@codefast/di/graph-adapters/*` (DOT, Cytoscape, React Flow) for visualizing `container.generateDependencyGraph()` output.

## Benchmarks

A head-to-head benchmark suite against InversifyJS 8 lives in the monorepo: [benchmarks/di-inversify](https://github.com/codefastlabs/codefast/tree/main/benchmarks/di-inversify). Each library runs in its canonical decorator mode, in isolated subprocesses, reported as per-trial medians with interquartile range — designed so the results are re-runnable rather than taken on faith. On the production-shaped scenarios measured there, `@codefast/di` resolves faster than InversifyJS; run `pnpm bench` in that package to reproduce the numbers on your machine.

## License

[MIT](https://github.com/codefastlabs/codefast/blob/main/LICENSE) — part of the [codefast monorepo](https://github.com/codefastlabs/codefast). See [CHANGELOG.md](https://github.com/codefastlabs/codefast/blob/main/packages/di/CHANGELOG.md) for release history.
