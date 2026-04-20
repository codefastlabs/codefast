# @codefast/di

Type-safe, ESM-only dependency injection for modern TypeScript — built on TC39 Stage 3 decorators with no runtime reflection.

[![CI](https://github.com/codefastlabs/codefast/actions/workflows/release.yml/badge.svg)](https://github.com/codefastlabs/codefast/actions/workflows/release.yml)
[![npm version](https://img.shields.io/npm/v/@codefast/di.svg)](https://www.npmjs.com/package/@codefast/di)
[![npm downloads](https://img.shields.io/npm/dm/@codefast/di.svg)](https://www.npmjs.com/package/@codefast/di)
[![license](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Table of Contents

- [Why @codefast/di](#why-codefastdi)
- [Requirements](#requirements)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [Tokens](#tokens)
- [Bindings](#bindings)
  - [Strategies](#strategies)
  - [Scopes](#scopes)
  - [Constraints](#constraints)
  - [Lifecycle hooks](#lifecycle-hooks)
- [Decorators](#decorators)
  - [`@injectable`](#injectable)
  - [`inject` / `optional`](#inject--optional)
  - [Accessor injection](#accessor-injection)
  - [`@postConstruct` / `@preDestroy`](#postconstruct--predestroy)
  - [Auto-registration](#auto-registration)
- [Container](#container)
  - [Resolution](#resolution)
  - [Async resolution](#async-resolution)
  - [Rebinding and unbinding](#rebinding-and-unbinding)
  - [Child containers](#child-containers)
  - [Validation](#validation)
  - [Introspection](#introspection)
  - [Disposal](#disposal)
- [Modules](#modules)
- [Errors](#errors)
- [Package exports](#package-exports)
- [Contributing](#contributing)
- [License](#license)
- [Changelog](#changelog)

---

## Why @codefast/di

`@codefast/di` is a small IoC container designed for applications that compile to ESM and want strong typing without metadata reflection tricks.

- **Typed tokens.** `Token<Value>` flows through every `bind → resolve` path; the return type of `resolve()` is the one you registered.
- **Native Stage 3 decorators.** `@injectable`, `inject`, `optional`, `@postConstruct`, `@preDestroy` write to `Symbol.metadata`. No `reflect-metadata`, no `experimentalDecorators`.
- **Fluent binding API.** Constants, classes, sync/async factories, aliases, named/tagged/predicate constraints, activation + deactivation hooks.
- **Module system.** `Module` and `AsyncModule` bundle bindings into reusable units that can be loaded, unloaded, and re-used across containers.
- **Scope safety.** Detects captive dependencies (a singleton depending on a scoped or transient binding) during development and test.
- **Async-first.** Dedupes in-flight async singleton construction and supports `await using` for automatic cleanup.
- **Tree-shakeable subpaths.** Import only the surface you need.

---

## Requirements

| Dependency | Version                       |
| ---------- | ----------------------------- |
| Node.js    | `>= 22.0.0`                   |
| TypeScript | `>= 5.2` (Stage 3 decorators) |

Enable native decorators in `tsconfig.json` — do **not** enable `experimentalDecorators`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "moduleResolution": "bundler"
  }
}
```

---

## Installation

```bash
pnpm add @codefast/di
# or
npm install @codefast/di
# or
yarn add @codefast/di
```

---

## Quick Start

```typescript
import { Container, inject, injectable, token } from "@codefast/di";

interface Logger {
  log(message: string): void;
}

const LoggerToken = token<Logger>("Logger");

@injectable([LoggerToken])
class AppService {
  constructor(private readonly logger: Logger) {}

  run(): void {
    this.logger.log("App started");
  }
}

const container = Container.create();

container.bind(LoggerToken).toConstantValue({ log: console.log });
container.bind(AppService).toSelf().singleton();

container.resolve(AppService).run(); // "App started"
```

The `@injectable([LoggerToken])` call lists constructor dependencies in order. Wrap an entry with `inject(token, options)` or `optional(token, options)` when you need a named/tagged hint or optional semantics.

---

## Core Concepts

| Concept       | Description                                                                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Token**     | Branded identifier pairing a name string with a TypeScript type. Tokens compare by reference — always reuse the same `const`.                          |
| **Binding**   | Associates a token (or constructor) with a value strategy (constant / class / factory / alias), a scope, optional constraints, and lifecycle hooks.    |
| **Container** | Holds a `BindingRegistry` and a `ScopeManager`; resolves bindings through the `DependencyResolver`. Supports child containers and async disposal.      |
| **Scope**     | Instance lifetime: `singleton` (one per root container, shared with children), `scoped` (one per child container), `transient` (new on every resolve). |
| **Module**    | Reusable bundle of bindings. Loaded once per container; loading the same module twice is a no-op.                                                      |
| **Metadata**  | `@injectable([...])` writes constructor descriptors into `Symbol.metadata`, which the container reads at resolution time.                              |

---

## Tokens

```typescript
import { token } from "@codefast/di";

const DbToken = token<Database>("Database");
const CacheToken = token<Cache>("Cache");
```

- The type parameter flows through the binding and resolution chain.
- Tokens use reference equality; two tokens with the same name are two distinct keys.
- A class constructor can itself be a key:

```typescript
container.bind(UserService).toSelf();
container.resolve(UserService); // returns UserService
```

---

## Bindings

Start with `container.bind(key)` and chain a strategy, then optionally a scope, constraints, and hooks.

### Strategies

| Method                       | Description                                                                 |
| ---------------------------- | --------------------------------------------------------------------------- |
| `.toConstantValue(value)`    | Bind to a fixed value. Always treated as a singleton.                       |
| `.toSelf()`                  | Bind a constructor to itself. Reads `@injectable()` metadata.               |
| `.to(Constructor)`           | Bind a token to a class constructor.                                        |
| `.toDynamic(factory)`        | Bind to a sync factory `(ctx: ResolutionContext) => Value`.                 |
| `.toDynamicAsync(factory)`   | Bind to an async factory `(ctx: ResolutionContext) => Promise<Value>`.      |
| `.toResolved(factory, deps)` | Bind to a factory whose dependency array is checked against the deps types. |
| `.toAlias(targetToken)`      | Redirect resolution to another token; the alias adopts the target's scope.  |

```typescript
container.bind(AppConfigToken).toConstantValue({ port: 3000 });

container.bind(UserRepository).toSelf().singleton();
container.bind(UserServiceToken).to(UserService).transient();

container.bind(DbToken).toDynamic((ctx) => {
  const config = ctx.resolve(AppConfigToken);
  return new Database(config.dbUrl);
});

container.bind(DbToken).toDynamicAsync(async (ctx) => {
  const config = ctx.resolve(AppConfigToken);
  const db = new Database(config.dbUrl);
  await db.connect();
  return db;
});

container
  .bind(UserServiceToken)
  .toResolved((repo, cfg) => new UserService(repo, cfg), [UserRepository, AppConfigToken] as const);

container.bind(LegacyServiceToken).toAlias(NewServiceToken);
```

### Scopes

| Method         | Lifetime                                                                   |
| -------------- | -------------------------------------------------------------------------- |
| `.singleton()` | One instance per root container, shared with descendants.                  |
| `.scoped()`    | One instance per child container. Useful for request-scoped services.      |
| `.transient()` | New instance on every resolution. Default when no scope method is chained. |

```typescript
container.bind(DatabaseToken).toDynamic(createDb).singleton();
container.bind(RequestContextToken).toSelf().scoped();
container.bind(QueryBuilderToken).toSelf().transient();
```

### Constraints

Multiple bindings can share the same token. A constraint picks the right one at resolution time.

**Named**

```typescript
container.bind(LoggerToken).whenNamed("file").toConstantValue(fileLogger);
container.bind(LoggerToken).whenNamed("console").toConstantValue(consoleLogger);

container.resolve(LoggerToken, { name: "file" });
```

**Tagged** — the hint is a tuple `[tag, value]`:

```typescript
container.bind(StorageToken).whenTagged("provider", "s3").to(S3Storage);
container.bind(StorageToken).whenTagged("provider", "local").to(LocalStorage);

container.resolve(StorageToken, { tag: ["provider", "s3"] });
```

**Predicate** — inspect the full resolution graph:

```typescript
import { whenAnyAncestorIs, whenParentIs, whenTargetTagged } from "@codefast/di";

container.bind(LoggerToken).when(whenParentIs(DiagnosticsService)).toConstantValue(verboseLogger);
```

Built-in predicates:

| Helper                         | Matches when …                                                              |
| ------------------------------ | --------------------------------------------------------------------------- |
| `whenParentIs(key)`            | the direct parent binding was registered for `key`.                         |
| `whenAnyAncestorIs(key)`       | any ancestor binding on the materialization stack was registered for `key`. |
| `whenTargetTagged(tag, value)` | the immediate parent binding carries `tag` with `value`.                    |

For anything else, pass a custom `(ctx: ConstraintContext) => boolean` to `.when(predicate)`.

### Lifecycle hooks

```typescript
container
  .bind(DbToken)
  .toDynamicAsync(async (ctx) => new Database(ctx.resolve(ConfigToken)))
  .singleton()
  .onActivation(async (ctx, instance) => {
    await instance.connect();
    return instance;
  })
  .onDeactivation(async (instance) => {
    await instance.disconnect();
  });
```

- `onActivation(ctx, instance)` runs after construction (and after `@postConstruct`). It must return the instance (possibly wrapped).
- `onDeactivation(instance)` runs when the instance is evicted: `container.dispose()`, `unbind`, `rebind`, or `unload`.

---

## Decorators

All decorators use TC39 Stage 3 syntax and write to `Symbol.metadata`.

### `@injectable`

Registers constructor dependencies. The array length must match the constructor arity; a mismatch throws `InternalError` at class-definition time.

```typescript
import { inject, injectable, optional, token } from "@codefast/di";

const ConfigToken = token<AppConfig>("AppConfig");
const CacheToken = token<Cache>("Cache");

@injectable([ConfigToken, optional(CacheToken)])
class AppService {
  constructor(
    private readonly config: AppConfig,
    private readonly cache?: Cache,
  ) {}
}
```

Each entry is either a plain `Token` / `Constructor` or an `InjectionDescriptor` produced by `inject()` / `optional()`.

### `inject` / `optional`

```typescript
inject(LoggerToken, { name: "console" });
inject(StorageToken, { tag: ["provider", "s3"] });
optional(CacheToken);
```

- `inject(token, options?)` — required. Throws `TokenNotBoundError` if the dependency is missing.
- `optional(token, options?)` — optional. Resolves to `undefined` when unbound.

### Accessor injection

`inject` doubles as a TC39 accessor-field decorator for post-construction property injection:

```typescript
@injectable([])
class Controller {
  @inject(LoggerToken) accessor logger!: Logger;
}
```

The container injects the accessor after construction, so it does not count toward the constructor arity declared in `@injectable([])`.

### `@postConstruct` / `@preDestroy`

Method decorators that hook into the instance lifecycle. Order:
`construct → @postConstruct → onActivation → cache … onDeactivation → @preDestroy`.

```typescript
import { postConstruct, preDestroy } from "@codefast/di";

@injectable([DbToken])
class UserRepository {
  constructor(private readonly db: Database) {}

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

Only one of each decorator is allowed per class.

### Auto-registration

Pass `autoRegister` to `@injectable` to have the class register itself in a module-scoped list:

```typescript
@injectable([DbToken], { autoRegister: true, scope: "singleton" })
class UserRepository {
  constructor(private readonly db: Database) {}
}

// Bind every auto-registered class at once
container.loadAutoRegistered();
```

`scope` defaults to `"transient"`. `getAutoRegistered()` returns the list if you prefer to iterate manually.

---

## Container

### Resolution

```typescript
const container = Container.create();

container.resolve(ServiceToken);
container.resolveOptional(CacheToken); // undefined when unbound
container.resolveAll(HandlerToken); // all matching multi-bindings

container.resolve(LoggerToken, { name: "console" });
container.resolve(StorageToken, { tag: ["provider", "s3"] });

container.has(CacheToken);
container.has(LoggerToken, { name: "console" });
```

### Async resolution

Use the `*Async` variants when any binding in the resolution chain uses `toDynamicAsync`, async `onActivation`, or async `@postConstruct`. Mixing async into a sync resolve throws `AsyncResolutionError`.

```typescript
const db = await container.resolveAsync(DbToken);
const handlers = await container.resolveAllAsync(HandlerToken);
// resolveOptional is sync-only — for async optional lookups, check `has` then `resolveAsync`
const cache = container.has(CacheToken) ? await container.resolveAsync(CacheToken) : undefined;

// Eagerly construct every singleton binding
await container.initializeAsync();
```

### Rebinding and unbinding

```typescript
container.rebind(LoggerToken).toConstantValue(testLogger);

container.unbind(CacheToken); // sync deactivation hooks only
await container.unbindAsync(CacheToken); // awaits async deactivation
```

### Child containers

Child containers fall through to the parent's bindings and share the parent's singleton cache, but have their own scoped cache.

```typescript
const requestContainer = container.createChild();

requestContainer.bind(RequestContextToken).toConstantValue(req).scoped();
const service = requestContainer.resolve(RequestScopedService);

await requestContainer.dispose(); // releases scoped instances
```

### Validation

`validate()` statically checks that no singleton binding depends on a `scoped` or `transient` binding (a captive dependency). In development and test environments the container runs `validate()` at most once after registry changes, so most scope violations surface without an explicit call.

```typescript
container.validate(); // throws ScopeViolationError on the first violation
```

Control the environment heuristic via `NODE_ENV` — see `isDevelopmentOrTestEnvironment` in `@codefast/di/environment`.

### Introspection

```typescript
const snapshot = container.inspect();
const dot = container.generateDependencyGraph({ hideInternals: true });
const json = container.generateDependencyGraph({ format: "json" });
```

`generateDependencyGraph` returns a Graphviz DOT string by default, or a typed `ContainerGraphJson` when `format: "json"` is passed.

### Disposal

`Container` implements `AsyncDisposable`, so `await using` runs `dispose()` automatically:

```typescript
{
  await using container = Container.create();
  container.bind(DbToken).toDynamicAsync(connectDb).singleton().onDeactivation(disconnectDb);

  const db = await container.resolveAsync(DbToken);
  // …
} // dispose() runs all deactivation hooks
```

Sync `using` is intentionally rejected: calling `Symbol.dispose` throws. Use `await using` or `await container.dispose()`.

---

## Modules

Modules bundle related bindings into reusable units. A module holds no runtime state and can be loaded into any number of containers.

```typescript
import { Container, Module } from "@codefast/di";

const InfraModule = Module.create("Infra", (api) => {
  api.bind(LoggerToken).toConstantValue(console);
  api.bind(ConfigToken).toConstantValue(loadConfig());
});

const AppModule = Module.create("App", (api) => {
  api.import(InfraModule);
  api.bind(UserRepository).toSelf().singleton();
  api.bind(UserServiceToken).to(UserService).transient();
});

const container = Container.fromModules(AppModule);
```

Async modules may `await` during setup (e.g. dynamic config):

```typescript
const DbModule = Module.createAsync("Database", async (api) => {
  const config = await fetchRemoteConfig();
  api.bind(DbToken).toConstantValue(await Database.connect(config.dbUrl));
});

const container = await Container.fromModulesAsync(DbModule, AppModule);
```

Load and unload on an existing container:

```typescript
container.load(InfraModule, AppModule);
await container.loadAsync(DbModule);

container.unload(AppModule);
await container.unloadAsync(DbModule);
```

Re-loading a module already present is a no-op. Circular imports between modules throw `CircularDependencyError`.

---

## Errors

All errors extend `DiError` and expose a stable `code` property.

| Error class               | `code`                  | Thrown when                                                 |
| ------------------------- | ----------------------- | ----------------------------------------------------------- |
| `TokenNotBoundError`      | `"TOKEN_NOT_BOUND"`     | A required token has no binding                             |
| `NoMatchingBindingError`  | `"NO_MATCHING_BINDING"` | A name/tag/predicate hint matches no registered binding     |
| `CircularDependencyError` | `"CIRCULAR_DEPENDENCY"` | A cycle is detected in dependency or module resolution      |
| `MissingMetadataError`    | `"MISSING_METADATA"`    | A class binding is missing `@injectable()` metadata         |
| `AsyncModuleLoadError`    | `"ASYNC_MODULE_LOAD"`   | Sync `load()` is called with an `AsyncModule`               |
| `AsyncResolutionError`    | `"ASYNC_RESOLUTION"`    | An async binding is reached during a sync `resolve()`       |
| `ScopeViolationError`     | `"SCOPE_VIOLATION"`     | A singleton depends on a scoped or transient binding        |
| `InternalError`           | `"INTERNAL"`            | Invariant violations (should never surface in correct code) |

```typescript
import { DiError, ScopeViolationError, TokenNotBoundError } from "@codefast/di";

try {
  container.resolve(ServiceToken);
} catch (error) {
  if (error instanceof TokenNotBoundError) {
    console.error(`Not registered: ${error.tokenName}`);
  } else if (error instanceof ScopeViolationError) {
    console.error(`Scope violation: ${error.message}`);
  } else if (error instanceof DiError) {
    console.error(`DI error [${error.code}]: ${error.message}`);
  }
}
```

---

## Package exports

The root entry re-exports the full public API. Subpath exports are provided for fine-grained imports and bundler tree-shaking.

| Subpath                                        | Contents                                                         |
| ---------------------------------------------- | ---------------------------------------------------------------- |
| `@codefast/di`                                 | Public façade — tokens, `Container`, modules, decorators, errors |
| `@codefast/di/container`                       | `Container` interface and related types                          |
| `@codefast/di/token`                           | `token()`, `Token<Value>`, `TokenValue`                          |
| `@codefast/di/binding`                         | `BindingBuilder`, binding type definitions                       |
| `@codefast/di/binding-select`                  | Binding selection internals (`filterMatchingBindings`, …)        |
| `@codefast/di/module`                          | `Module`, `AsyncModule`, module builders                         |
| `@codefast/di/decorators/inject`               | `inject`, `optional`, `isInjectionDescriptor`                    |
| `@codefast/di/decorators/injectable`           | `@injectable`, `getAutoRegistered`                               |
| `@codefast/di/decorators/lifecycle-decorators` | `@postConstruct`, `@preDestroy`                                  |
| `@codefast/di/constraints`                     | `whenParentIs`, `whenAnyAncestorIs`, `whenTargetTagged`          |
| `@codefast/di/registry`                        | `BindingRegistry`                                                |
| `@codefast/di/resolver`                        | `DependencyResolver` internals                                   |
| `@codefast/di/scope`                           | `ScopeManager`                                                   |
| `@codefast/di/scope-validation`                | `validateScopeRules`                                             |
| `@codefast/di/lifecycle`                       | Activation/deactivation runners                                  |
| `@codefast/di/dependency-graph`                | Dependency-edge collection helpers                               |
| `@codefast/di/inspector`                       | `ContainerInspector`, snapshot + graph types                     |
| `@codefast/di/errors`                          | Full `DiError` hierarchy                                         |
| `@codefast/di/environment`                     | `isDevelopmentOrTestEnvironment`, `isProductionEnvironment`      |
| `@codefast/di/metadata/*`                      | Metadata keys, types, readers, parameter registry                |

See `package.json → exports` for the authoritative list.

---

## Contributing

This package lives in the [Codefast monorepo](https://github.com/codefastlabs/codefast). From the repo root:

```bash
pnpm --filter @codefast/di build
pnpm --filter @codefast/di test
pnpm --filter @codefast/di check-types
```

---

## License

[MIT](https://opensource.org/licenses/MIT) — see [`package.json`](./package.json).

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for the full version history. Releases are also published on [npm](https://www.npmjs.com/package/@codefast/di?activeTab=versions).
