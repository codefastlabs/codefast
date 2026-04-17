# @codefast/di

Lightweight, type-safe dependency injection for TypeScript — powered by TC39 Stage 3 decorators and zero runtime reflection.

[![CI](https://github.com/codefastlabs/codefast/actions/workflows/release.yml/badge.svg)](https://github.com/codefastlabs/codefast/actions/workflows/release.yml)
[![npm version](https://img.shields.io/npm/v/@codefast/di.svg)](https://www.npmjs.com/package/@codefast/di)
[![npm downloads](https://img.shields.io/npm/dm/@codefast/di.svg)](https://www.npmjs.com/package/@codefast/di)
[![license](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Requirements](#requirements)
- [Core Concepts](#core-concepts)
- [Quick Start](#quick-start)
- [Tokens](#tokens)
- [Binding API](#binding-api)
  - [Binding strategies](#binding-strategies)
  - [Scopes](#scopes)
  - [Lifecycle hooks](#lifecycle-hooks)
  - [Constraints](#constraints)
- [Decorators](#decorators)
- [Container API](#container-api)
  - [Resolution](#resolution)
  - [Async resolution](#async-resolution)
  - [Child containers](#child-containers)
  - [Validation](#validation)
  - [Introspection](#introspection)
  - [Disposable resources](#disposable-resources)
- [Modules](#modules)
- [Error handling](#error-handling)
- [Package exports](#package-exports)
- [Contributing](#contributing)
- [License](#license)
- [Changelog](#changelog)

---

## Overview

`@codefast/di` is a small **ESM-only** IoC container for TypeScript applications.

**Key features:**

- **Type-safe tokens** — `Token<Value>` ensures `resolve()` returns the exact type you registered; no accidental `get<WrongType>(…)` at compile time.
- **TC39 Stage 3 decorators** — `@injectable`, `@inject`, `@optional`, `@singleton`, `@scoped` write metadata via `Symbol.metadata`. No `reflect-metadata`, no `experimentalDecorators`.
- **Fluent binding API** — constants, classes, sync and async factories, scopes, tags, named hints, constraint predicates, and lifecycle hooks.
- **Module system** — organize registrations into reusable `Module` / `AsyncModule` units.
- **Scope safety** — detects singleton → transient/scoped captive dependencies in development.
- **Async-first** — parallel inflight deduplication for async singleton initialization.
- **Tree-shakeable subpaths** — import only the surface you need.

---

## Installation

```bash
# pnpm
pnpm add @codefast/di

# npm
npm install @codefast/di
```

---

## Requirements

| Dependency | Version                       |
| ---------- | ----------------------------- |
| Node.js    | `>= 22.0.0`                   |
| TypeScript | `>= 5.2` (Stage 3 decorators) |

Enable native decorators in `tsconfig.json` (do **not** enable `experimentalDecorators`):

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

## Core Concepts

| Concept                | Description                                                                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Token**              | Branded key that pairs a name string with a TypeScript type. Tokens use reference equality — pass the same object to `bind` and `inject`.         |
| **Binding**            | Associates a token (or constructor) with a value strategy (constant, class, factory, alias) and optional scope, constraints, and lifecycle hooks. |
| **Container**          | Stores bindings in a `BindingRegistry` and resolves them on demand via a `DependencyResolver`.                                                    |
| **Module**             | An immutable bundle of bindings. Loaded into any container and unloaded cleanly.                                                                  |
| **Scope**              | Controls instance lifetime: `singleton` (one per container), `scoped` (one per child), or `transient` (new each time).                            |
| **Decorator metadata** | `@injectable([…])` writes constructor dependency descriptors into `Symbol.metadata`, which the container reads at resolution time.                |

---

## Quick Start

```typescript
import { Container, inject, injectable, token } from "@codefast/di";

// 1. Define an interface and a token for it
interface Logger {
  log(message: string): void;
}

const LoggerToken = token<Logger>("Logger");

// 2. Implement and annotate the class
@injectable([inject(LoggerToken)])
class AppService {
  constructor(private readonly logger: Logger) {}

  run(): void {
    this.logger.log("App started");
  }
}

// 3. Create a container and register bindings
const container = Container.create();

container.bind(LoggerToken).toConstantValue({ log: console.log });
container.bind(AppService).toSelf().singleton();

// 4. Resolve and use
const app = container.resolve(AppService);
app.run(); // "App started"
```

---

## Tokens

A `Token<Value>` is a branded object that acts as a type-safe registry key.

```typescript
import { token } from "@codefast/di";

const DbToken = token<Database>("Database");
const CacheToken = token<Cache>("Cache");
```

The type parameter flows through the binding and resolution chain — `container.resolve(DbToken)` returns `Database`, not `unknown`.

> **Token identity** — tokens use reference equality. Always import and reuse the same `const` value for both `bind()` and `inject()`. Creating two tokens with the same name produces two distinct keys.

You can also use a constructor directly as a key:

```typescript
container.bind(MyService).toSelf();
container.resolve(MyService); // returns MyService
```

---

## Binding API

### Binding strategies

Start a binding with `container.bind(key)` and chain a strategy method:

| Method                       | Description                                                            |
| ---------------------------- | ---------------------------------------------------------------------- |
| `.toConstantValue(value)`    | Bind to a fixed value. Always treated as singleton.                    |
| `.toSelf()`                  | Bind a constructor to itself. Reads `@injectable()` metadata.          |
| `.to(Constructor)`           | Bind a token to a class constructor.                                   |
| `.toDynamic(factory)`        | Bind to a synchronous factory `(ctx: ResolutionContext) => Value`.     |
| `.toDynamicAsync(factory)`   | Bind to an async factory `(ctx: ResolutionContext) => Promise<Value>`. |
| `.toResolved(factory, deps)` | Bind to a factory with an explicit typed dependency array.             |
| `.toAlias(targetToken)`      | Redirect this token to another token.                                  |

```typescript
// Constant
container.bind(AppConfigToken).toConstantValue({ port: 3000 });

// Class
container.bind(UserRepository).toSelf().singleton();
container.bind(UserServiceToken).to(UserService).transient();

// Factory — receive resolution context to resolve nested deps
container.bind(DbToken).toDynamic((ctx) => {
  const config = ctx.resolve(AppConfigToken);
  return new Database(config.dbUrl);
});

// Async factory
container.bind(DbToken).toDynamicAsync(async (ctx) => {
  const config = ctx.resolve(AppConfigToken);
  const db = new Database(config.dbUrl);
  await db.connect();
  return db;
});

// Alias
container.bind(LegacyServiceToken).toAlias(NewServiceToken);
```

### Scopes

After setting the strategy, chain a scope method:

| Method         | Lifetime                                                                    |
| -------------- | --------------------------------------------------------------------------- |
| `.singleton()` | One instance per container. Created once, reused forever.                   |
| `.transient()` | New instance on every `resolve()`. Default for most bindings.               |
| `.scoped()`    | One instance per child container scope. Useful for request-scoped services. |

```typescript
container.bind(DatabaseToken).toDynamic(createDb).singleton();
container.bind(RequestContextToken).toSelf().scoped();
container.bind(QueryBuilderToken).toSelf().transient();
```

### Lifecycle hooks

Attach activation and deactivation callbacks to any binding:

```typescript
container
  .bind(DbToken)
  .toDynamicAsync(async (ctx) => new Database(ctx.resolve(ConfigToken)))
  .singleton()
  .onActivation(async (instance, ctx) => {
    await instance.connect();
    return instance; // must return the instance
  })
  .onDeactivation(async (instance) => {
    await instance.disconnect();
  });
```

`onActivation` runs after the instance is created. It must return the (optionally modified) instance.
`onDeactivation` runs when `container.dispose()` is called.

### Constraints

Constraints let multiple bindings share the same token and select one based on resolution context.

**Named bindings** — disambiguate with a string name:

```typescript
container.bind(LoggerToken).toConstantValue(fileLogger).whenNamed("file");
container.bind(LoggerToken).toConstantValue(consoleLogger).whenNamed("console");

// Resolve by name
container.resolve(LoggerToken, { name: "file" });
```

**Tagged bindings** — disambiguate with a tag + value pair:

```typescript
container.bind(StorageToken).to(S3Storage).whenTagged("provider", "s3");
container.bind(StorageToken).to(LocalStorage).whenTagged("provider", "local");

container.resolve(StorageToken, { tag: "provider", tagValue: "s3" });
```

**Custom predicate** — inspect the full resolution context:

```typescript
import { whenParentIs } from "@codefast/di";

container.bind(LoggerToken).toConstantValue(verboseLogger).when(whenParentIs(DiagnosticsService));
```

Built-in predicate helpers:

| Helper                         | Description                                                        |
| ------------------------------ | ------------------------------------------------------------------ |
| `whenParentIs(key)`            | Matches when the direct parent binding is for the given key.       |
| `whenAnyAncestorIs(key)`       | Matches when any ancestor binding is for the given key.            |
| `whenTargetTagged(tag, value)` | Matches when the immediate parent was injected with the given tag. |

---

## Decorators

Decorators use TC39 Stage 3 syntax and write metadata to `Symbol.metadata`.

### `@injectable(deps)`

Registers constructor dependency metadata. Every dependency must be listed.

```typescript
import { inject, injectable, optional, token } from "@codefast/di";

const ConfigToken = token<AppConfig>("AppConfig");
const CacheToken = token<Cache>("Cache");

@injectable([inject(ConfigToken), optional(CacheToken)])
class AppService {
  constructor(
    private readonly config: AppConfig,
    private readonly cache?: Cache,
  ) {}
}
```

- `inject(token, options?)` — required dependency. Throws `TokenNotBoundError` if absent.
- `optional(token, options?)` — optional dependency. Resolves to `undefined` if not bound.

Both accept `InjectOptions` for named or tagged resolution hints:

```typescript
inject(LoggerToken, { name: "console" });
inject(StorageToken, { tag: "provider", tagValue: "s3" });
```

### `@singleton()` and `@scoped()`

Scope hints on the class itself. The container reads these when you call `.to(Constructor)` without chaining an explicit scope method.

```typescript
@singleton()
@injectable([inject(DbToken)])
class UserRepository {
  constructor(private readonly db: Database) {}
}

// No .singleton() needed — decorator provides the hint
container.bind(UserRepository).toSelf();
```

`@singleton()` and `@scoped()` cannot be combined on the same class.

---

## Container API

### Resolution

```typescript
const container = Container.create();

// Single binding
const service = container.resolve(ServiceToken);

// Named or tagged hint
const logger = container.resolve(LoggerToken, { name: "console" });

// All matching bindings
const handlers = container.resolveAll(HandlerToken);

// Optional — returns undefined if not bound
const cache = container.resolveOptional(CacheToken);
```

Check binding existence before resolving:

```typescript
if (container.has(CacheToken)) {
  const cache = container.resolve(CacheToken);
}
```

### Async resolution

Use `resolveAsync` / `resolveAllAsync` / `resolveOptionalAsync` when any dependency in the chain uses `toDynamicAsync`:

```typescript
const db = await container.resolveAsync(DbToken);
const handlers = await container.resolveAllAsync(HandlerToken);
```

### Rebinding and unbinding

```typescript
// Replace all bindings for a token
container.rebind(LoggerToken).toConstantValue(testLogger);

// Remove bindings (sync)
container.unbind(CacheToken);

// Remove with deactivation hooks (async)
await container.unbindAsync(CacheToken);
```

### Child containers

Child containers share the parent's singleton cache but maintain an isolated scoped cache — ideal for per-request isolation.

```typescript
const requestContainer = container.createChild();

requestContainer.bind(RequestContextToken).toConstantValue(req).scoped();

const service = requestContainer.resolve(RequestScopedService);

// Clean up scoped instances
await requestContainer.dispose();
```

### Validation

`validate()` checks for captive dependency violations (a singleton depending on a transient or scoped binding). In development and test environments this runs automatically after `load()` and the first `resolve()`.

```typescript
container.validate(); // throws ScopeViolationError if invalid
```

### Introspection

```typescript
// Snapshot of all registered bindings
const snapshot = container.inspect();

// Graphviz DOT format for dependency graph visualization
const dot = container.generateDependencyGraphDot({ hideInternals: true });

// JSON format
const graph = container.generateDependencyGraphJson();
```

### Disposable resources

`Container` implements `AsyncDisposable`, enabling `await using` syntax:

```typescript
{
  await using container = Container.create();
  container.bind(DbToken).toDynamicAsync(connectDb).singleton().onDeactivation(disconnectDb);

  const db = await container.resolveAsync(DbToken);
  // ...
} // container.dispose() called automatically — runs all deactivation hooks
```

Or call explicitly:

```typescript
await container.dispose();
```

---

## Modules

Modules group related bindings into reusable, composable units.

### Synchronous modules

```typescript
import { Module } from "@codefast/di";

const InfraModule = Module.create("Infra", (api) => {
  api.bind(LoggerToken).toConstantValue(console);
  api.bind(ConfigToken).toConstantValue(loadConfig());
});

const AppModule = Module.create("App", (api) => {
  api.import(InfraModule); // load dependency module
  api.bind(UserRepository).toSelf().singleton();
  api.bind(UserServiceToken).to(UserService).transient();
});

const container = Container.fromModules(AppModule);
```

### Async modules

```typescript
import { Module } from "@codefast/di";

const DbModule = Module.createAsync("Database", async (api) => {
  const config = await fetchRemoteConfig();
  api.bind(DbToken).toConstantValue(await Database.connect(config.dbUrl));
});

const container = await Container.fromModulesAsync(DbModule, AppModule);
```

`Module.createAsync` returns an `AsyncModule`. Use `Container.fromModulesAsync` (or `container.loadAsync`) to load async modules.

### Loading and unloading

```typescript
// Load into existing container
container.load(InfraModule, AppModule);
await container.loadAsync(DbModule);

// Remove and run deactivation hooks
container.unload(AppModule);
await container.unloadAsync(DbModule);
```

---

## Error handling

All errors extend `DiError` and expose a stable `code` property for `switch` / `instanceof` checks.

| Error class               | `code`                  | When thrown                                         |
| ------------------------- | ----------------------- | --------------------------------------------------- |
| `TokenNotBoundError`      | `"TOKEN_NOT_BOUND"`     | `resolve()` called for an unregistered token        |
| `NoMatchingBindingError`  | `"NO_MATCHING_BINDING"` | Name/tag hint matches no binding                    |
| `CircularDependencyError` | `"CIRCULAR_DEPENDENCY"` | Circular dependency detected during resolution      |
| `MissingMetadataError`    | `"MISSING_METADATA"`    | Class binding lacks `@injectable()` metadata        |
| `AsyncModuleLoadError`    | `"ASYNC_MODULE_LOAD"`   | `load()` (sync) called with an `AsyncModule`        |
| `AsyncResolutionError`    | `"ASYNC_RESOLUTION"`    | Async dependency encountered during sync resolution |
| `ScopeViolationError`     | `"SCOPE_VIOLATION"`     | Singleton depends on transient/scoped binding       |

```typescript
import { DiError, TokenNotBoundError, ScopeViolationError } from "@codefast/di";

try {
  const service = container.resolve(ServiceToken);
} catch (error) {
  if (error instanceof TokenNotBoundError) {
    console.error(`Not registered: ${error.tokenName}`);
  } else if (error instanceof DiError) {
    console.error(`DI error [${error.code}]: ${error.message}`);
  }
}
```

---

## Package exports

The root entry `@codefast/di` re-exports the complete public API. Subpath exports are available for fine-grained imports and tree-shaking:

| Subpath                              | Contents                                                     |
| ------------------------------------ | ------------------------------------------------------------ |
| `@codefast/di`                       | Full public façade — everything below, combined              |
| `@codefast/di/container`             | `Container` interface, `DefaultContainer`, and related types |
| `@codefast/di/token`                 | `token()`, `Token<Value>`, `TokenValue`                      |
| `@codefast/di/binding`               | `BindingBuilder`, `bind()`, binding type definitions         |
| `@codefast/di/binding-select`        | `filterMatchingBindings`, `selectBindingForRegistry`         |
| `@codefast/di/module`                | `Module`, `AsyncModule`, module builder types                |
| `@codefast/di/decorators`            | `@injectable`, `@singleton`, `@scoped`, `inject`, `optional` |
| `@codefast/di/decorators/inject`     | `inject`, `optional`, `isInjectionDescriptor`                |
| `@codefast/di/decorators/injectable` | `@injectable`                                                |
| `@codefast/di/decorators/singleton`  | `@singleton`                                                 |
| `@codefast/di/decorators/scoped`     | `@scoped`                                                    |
| `@codefast/di/registry`              | `BindingRegistry`, `registryKeyLabel`                        |
| `@codefast/di/resolver`              | Resolution internals                                         |
| `@codefast/di/scope`                 | `ScopeManager`, scope cache management                       |
| `@codefast/di/scope-validation`      | `validateScopeRules`                                         |
| `@codefast/di/lifecycle`             | `runActivation`, `runActivationAsync`, activation types      |
| `@codefast/di/constraints`           | `whenParentIs`, `whenAnyAncestorIs`, `whenTargetTagged`      |
| `@codefast/di/dependency-graph`      | `collectStaticDependencyEdges`, `listResolvedDependencies`   |
| `@codefast/di/inspector`             | `ContainerInspector`, `ContainerSnapshot`                    |
| `@codefast/di/errors`                | Complete `DiError` hierarchy                                 |
| `@codefast/di/environment`           | `isDevelopmentOrTestEnvironment`, `isProductionEnvironment`  |

See `package.json → exports` for the authoritative list.

---

## Contributing

This package lives in the [Codefast monorepo](https://github.com/codefastlabs/codefast). From the repo root:

```bash
pnpm --filter @codefast/di build
pnpm --filter @codefast/di test
```

---

## License

[MIT](https://opensource.org/licenses/MIT) — see `license` in [`package.json`](./package.json).

## Changelog

Version history is published on [npm](https://www.npmjs.com/package/@codefast/di?activeTab=versions) with each release.
