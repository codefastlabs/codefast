# @codefast/di

Type-safe, ESM-only dependency injection for modern TypeScript — built on TC39 Stage 3 decorators with no runtime reflection.

[![CI](https://github.com/codefastlabs/codefast/actions/workflows/release.yml/badge.svg)](https://github.com/codefastlabs/codefast/actions/workflows/release.yml)
[![npm version](https://img.shields.io/npm/v/@codefast/di.svg)](https://www.npmjs.com/package/@codefast/di)
[![npm downloads](https://img.shields.io/npm/dm/@codefast/di.svg)](https://www.npmjs.com/package/@codefast/di)
[![license](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

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
  - [`inject` / `optional` / `injectAll`](#inject--optional--injectall)
  - [Accessor injection](#accessor-injection)
  - [`@postConstruct` / `@preDestroy`](#postconstruct--predestroy)
  - [Auto-registration](#auto-registration)
- [Container](#container)
  - [Resolution](#resolution)
  - [Async resolution](#async-resolution)
  - [Container API surface](#container-api-surface)
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
- **Native Stage 3 decorators.** `@injectable`, `inject`, `optional`, `@postConstruct`, `@preDestroy` record metadata for the resolver. Implementations use a `WeakMap` and mirror into `Symbol.metadata` when the decorator runtime supplies it — no `reflect-metadata`, no `experimentalDecorators`.
- **Fluent binding API.** Constants, classes, sync/async factories, resolved factories, aliases, named/tagged/predicate constraints, activation + deactivation hooks.
- **Module system.** `Module` / `AsyncModule` bundle bindings into reusable units that can be loaded, unloaded, and re-used across containers.
- **Scope checks.** Call `validate()` to detect captive dependencies (for example a `singleton` depending on a `scoped` or `transient` binding).
- **Async resolution.** Dedupes in-flight async singleton construction and supports `await using` for automatic cleanup.
- **Tree-shakeable subpaths.** Import only the surface you need.

---

## Requirements

- Node.js `>= 22.0.0` (see `package.json` → `engines`)
- TypeScript `>= 5.2` with native Stage 3 decorators (TypeScript `5.9+` recommended for best inference, consistent with other Codefast packages)

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

// Production wiring
container.bind(LoggerToken).toConstantValue({
  info: (message) => console.log(`[prod] ${message}`),
});
container.bind(CheckoutService).toSelf();

container.resolve(CheckoutService).complete("ORD-1001");

// Same service, test wiring
container.rebind(LoggerToken).toConstantValue({
  info: (message) => console.log(`[test] ${message}`),
});

container.resolve(CheckoutService).complete("ORD-1002");
```

`@injectable([...])` lists constructor dependencies in parameter order. Business classes (`CheckoutService`) stay unchanged while infrastructure (`LoggerToken`) swaps per environment.

---

## Core Concepts

| Concept       | Description                                                                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Token**     | Branded identifier pairing a name string with a TypeScript type. Tokens compare by reference — always reuse the same `const`.                          |
| **Binding**   | Associates a token (or constructor) with a value strategy (constant / class / factory / alias), a scope, optional constraints, and lifecycle hooks.    |
| **Container** | Holds a `BindingRegistry` and a `ScopeManager`; resolves bindings through the `DependencyResolver`. Supports child containers and async disposal.      |
| **Scope**     | Instance lifetime: `singleton` (one per root container, shared with children), `scoped` (one per child container), `transient` (new on every resolve). |
| **Module**    | Reusable bundle of bindings. Loaded once per container; loading the same module twice is a no-op.                                                      |
| **Metadata**  | `@injectable([...])` stores constructor parameter descriptors so the resolver knows what to inject at each index.                                      |

---

## Tokens

```typescript
import { token } from "@codefast/di";

const DbToken = token<Database>("Database");
const CacheToken = token<Cache>("Cache");
```

- The type parameter flows through the binding and resolution chain.
- Tokens use reference equality; two tokens with the same name string are still two distinct keys.
- A class constructor can itself be a key:

```typescript
container.bind(UserService).toSelf();
container.resolve(UserService); // returns UserService
```

---

## Bindings

Start with `container.bind(key)` and chain a strategy, then optional constraints and hooks. For strategies that support it, call `.singleton()`, `.scoped()`, or `.transient()` after constraints.

### Strategies

| Method                            | Description                                                                                                 |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `.toConstantValue(value)`         | Fixed value. Stored as a `constant` binding with scope `singleton` (no `.scoped()` / `.transient()` chain). |
| `.toSelf()`                       | Bind a constructor to itself. Uses `@injectable()` metadata.                                                |
| `.to(Constructor)`                | Bind a token to a class constructor.                                                                        |
| `.toDynamic(factory)`             | Sync factory `(ctx: ResolutionContext) => Value`.                                                           |
| `.toDynamicAsync(factory)`        | Async factory `(ctx: ResolutionContext) => Promise<Value>`.                                                 |
| `.toResolved(factory, deps)`      | Factory with a typed dependency tuple; dependencies are resolved in order.                                  |
| `.toResolvedAsync(factory, deps)` | Like `toResolved`, but the factory returns a `Promise`.                                                     |
| `.toAlias(targetToken)`           | Redirect resolution to another token; the alias follows the target’s materialization.                       |

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

container
  .bind(MetricsToken)
  .toResolvedAsync(async (db) => new MetricsCollector(db), [DbToken] as const);

container.bind(LegacyServiceToken).toAlias(NewServiceToken);
```

### Scopes

| Method         | Lifetime                                                                   |
| -------------- | -------------------------------------------------------------------------- |
| `.singleton()` | One instance per root container, shared with descendants.                  |
| `.scoped()`    | One instance per child container. Useful for request-scoped services.      |
| `.transient()` | New instance on every resolution. Default when no scope method is chained. |

`toConstantValue` does not expose scope chaining: constants are always treated as singletons internally.

```typescript
container.bind(DatabaseToken).toDynamic(createDb).singleton();
container.bind(RequestContextToken).toSelf().scoped();
container.bind(QueryBuilderToken).toSelf().transient();
```

### Constraints

Multiple bindings can share the same token. A constraint picks the right one at resolution time.

**Named**

```typescript
container.bind(LoggerToken).toConstantValue(fileLogger).whenNamed("file");
container.bind(LoggerToken).toConstantValue(consoleLogger).whenNamed("console");

container.resolve(LoggerToken, { name: "file" });
```

**Tagged** — the hint is a tuple `[tag, value]`:

```typescript
container.bind(StorageToken).to(S3Storage).whenTagged("provider", "s3");
container.bind(StorageToken).to(LocalStorage).whenTagged("provider", "local");

container.resolve(StorageToken, { tag: ["provider", "s3"] });
```

**Default slot**

Use `.whenDefault()` so the binding participates in resolution when no `name` / `tag` hint is provided (subject to multi-binding selection rules).

**Predicate** — inspect the full resolution graph:

```typescript
import { whenAnyAncestorIs, whenParentIs, whenParentTagged } from "@codefast/di/constraints";

container.bind(LoggerToken).toConstantValue(verboseLogger).when(whenParentIs(DiagnosticsService));
```

Built-in predicates (all from `@codefast/di/constraints`):

| Helper                              | Matches when …                                                             |
| ----------------------------------- | -------------------------------------------------------------------------- |
| `whenParentIs(key)`                 | The direct parent binding was registered for `key`.                        |
| `whenNoParentIs(key)`               | There is no parent, or the parent is not registered for `key`.             |
| `whenAnyAncestorIs(key)`            | Any ancestor on the materialization stack was registered for `key`.        |
| `whenNoAncestorIs(key)`             | No ancestor was registered for `key`.                                      |
| `whenParentNamed(name)`             | The immediate parent binding’s slot name is `name`.                        |
| `whenAnyAncestorNamed(name)`        | Some ancestor’s slot name is `name`.                                       |
| `whenParentTagged(tag, value)`      | The immediate parent binding carries `tag` with `value` (via `Object.is`). |
| `whenAnyAncestorTagged(tag, value)` | Some ancestor carries `tag` with `value`.                                  |

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

- `onActivation(ctx, instance)` on the **binding** runs after `@postConstruct` and before **container-level** `onActivation` handlers registered with `container.onActivation(token, …)`. See `LifecycleManager.runActivation`.
- `onDeactivation(instance)` on the **binding** runs after **container-level** `onDeactivation` hooks and before `@preDestroy`. See `LifecycleManager.runDeactivation`.

---

## Decorators

All decorators use TC39 Stage 3 syntax. Metadata is stored for resolution as described in [Core Concepts](#core-concepts).

### `@injectable`

Registers constructor dependencies in **parameter order** (index `0` → first constructor parameter). Each entry is either a `Token` / `Constructor` or an `InjectionDescriptor` from `inject()` / `optional()` / `injectAll()`.

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

Keep the metadata array aligned with the constructor parameter list. Too few entries means `new` receives `undefined` for missing positions; too many adds unused metadata entries.

### `inject` / `optional` / `injectAll`

```typescript
inject(LoggerToken, { name: "console" });
inject(StorageToken, { tag: ["provider", "s3"] });
optional(CacheToken);
injectAll(PluginToken);
```

- `inject(token, options?)` — required. Throws `TokenNotBoundError` when the dependency cannot be resolved.
- `optional(token, options?)` — optional. Resolves to `undefined` when unbound.
- `injectAll(token, options?)` — resolves every matching binding into an array (`Value[]`), applying `name` / `tag` filters when provided.

### Accessor injection

`inject` doubles as a TC39 accessor-field decorator for post-construction property injection:

```typescript
@injectable([])
class Controller {
  @inject(LoggerToken) accessor logger!: Logger;
}
```

The container injects the accessor after construction, so accessor fields do not use slots in the `@injectable([...])` arity list.

### `@postConstruct` / `@preDestroy`

Method decorators that hook into the instance lifecycle.

**Activation** (after `new`): `@postConstruct` → binding `onActivation` → `container.onActivation(token)` hooks (in registration order).

**Deactivation** (on eviction): `container.onDeactivation(token)` hooks → binding `onDeactivation` → `@preDestroy`.

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

Pass an `AutoRegisterRegistry` from `createAutoRegisterRegistry()` into `@injectable` options. Each decorated class registers itself with an optional `scope` (`"transient"` by default).

```typescript
import { Container, createAutoRegisterRegistry, injectable, token } from "@codefast/di";

const DbToken = token<Database>("Database");
const autoRegister = createAutoRegisterRegistry();

@injectable([DbToken], { autoRegister, scope: "singleton" })
class UserRepository {
  constructor(private readonly db: Database) {}
}

const container = Container.create();
container.loadAutoRegistered(autoRegister);
```

To bind manually, iterate `autoRegister.entries()` and call `container.bind(entry.target).toSelf()` (and apply the desired scope).

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
container.hasOwn(LoggerToken, { name: "console" });
```

`resolveAll()` and `ctx.resolveAll()` preserve the current resolution context (path + parent/ancestors stack), so `when(...)` predicates and scope checks behave the same as `resolve()`.

### Async resolution

Use the `*Async` variants when any binding in the resolution chain uses `toDynamicAsync`, `toResolvedAsync`, async `onActivation`, or async `@postConstruct`. Mixing async into a sync resolve throws `AsyncResolutionError`.

```typescript
const db = await container.resolveAsync(DbToken);
const handlers = await container.resolveAllAsync(HandlerToken);
const cache = await container.resolveOptionalAsync(CacheToken);

// Eagerly construct eligible singleton bindings
await container.initializeAsync();
```

### Container API surface

| Area               | Methods / properties                                                                                  |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| **Lifecycle**      | `dispose()`, `[Symbol.asyncDispose]()`, `[Symbol.dispose]()` (throws `SyncDisposalNotSupportedError`) |
| **Bindings**       | `bind`, `rebind`, `unbind`, `unbindAsync`, `unbindAll`, `unbindAllAsync`                              |
| **Modules**        | `load`, `loadAsync`, `unload`, `unloadAsync`, `loadAutoRegistered`                                    |
| **Global hooks**   | `onActivation`, `onDeactivation`                                                                      |
| **Resolve**        | `resolve`, `resolveAsync`, `resolveOptional`, `resolveOptionalAsync`, `resolveAll`, `resolveAllAsync` |
| **Scopes / graph** | `createChild`, `validate`, `initializeAsync`                                                          |
| **Introspection**  | `has`, `hasOwn`, `lookupBindings`, `inspect`, `generateDependencyGraph`                               |
| **State**          | `isDisposed`                                                                                          |

### Rebinding and unbinding

```typescript
container.rebind(LoggerToken).toConstantValue(testLogger);

container.unbind(CacheToken); // sync deactivation only
await container.unbindAsync(CacheToken); // awaits async deactivation

container.unbindAll();
await container.unbindAllAsync();
```

### Child containers

Child containers fall through to the parent’s bindings and share the parent’s singleton cache, but maintain their own scoped cache.

```typescript
const requestContainer = container.createChild();

requestContainer
  .bind(RequestContextToken)
  .toDynamic(() => req)
  .scoped();
const service = requestContainer.resolve(RequestScopedService);

await requestContainer.dispose(); // releases scoped instances owned by this child
```

### Validation

`validate()` walks singleton bindings and fails fast when a captive dependency is detected (for example `singleton` → `scoped` / `transient`).

```typescript
container.validate(); // throws ScopeViolationError on the first violation
```

Call it after meaningful registry changes (or in tests) — the container does **not** auto-invoke `validate()` based on `NODE_ENV`.

### Introspection

```typescript
import { toCytoscapeGraph } from "@codefast/di/graph-adapters/cytoscape";
import { toDotGraph } from "@codefast/di/graph-adapters/dot";
import { toReactFlowGraph } from "@codefast/di/graph-adapters/reactflow";

const snapshot = container.inspect();
const json = container.generateDependencyGraph({ includeParent: true });
const dot = toDotGraph(json);

const cytoscape = toCytoscapeGraph(json);
const reactflow = toReactFlowGraph(json);
```

`generateDependencyGraph` returns the canonical `ContainerGraphJson` (`nodes`, `edges`, `includesParent`). Adapters are pure converters; import them from `@codefast/di/graph-adapters/*`.

### Disposal

`Container` implements `AsyncDisposable`, so `await using` runs `dispose()` automatically:

```typescript
{
  await using container = Container.create();
  container.bind(DbToken).toDynamicAsync(connectDb).singleton().onDeactivation(disconnectDb);

  const db = await container.resolveAsync(DbToken);
  // …
} // dispose() runs deactivation hooks for owned singletons
```

Synchronous `using` is rejected: `[Symbol.dispose]()` throws `SyncDisposalNotSupportedError`. Use `await using` or `await container.dispose()`.

---

## Modules

Modules bundle related bindings into reusable units. A module holds no runtime state and can be loaded into any number of containers.

Use the same fluent order everywhere (including inside modules): `bind(token).to*(…).when*(…)` then, when supported, `.singleton()` / `.scoped()` / `.transient()`.

- Register **multiple** implementations for one token with separate chains, e.g. `api.bind(T).to(A).whenNamed("a")` and `api.bind(T).to(B).whenNamed("b")`.
- **Last-wins** applies per slot (default vs named vs tag-set), matching the container API.

```typescript
import { Container, Module } from "@codefast/di";

const InfrastructureModule = Module.create("Infra", (api) => {
  api.bind(LoggerToken).toConstantValue(console);
  api.bind(ConfigToken).toConstantValue(loadConfig());
});

const AppModule = Module.create("App", (api) => {
  api.import(InfrastructureModule);
  api.bind(UserRepository).toSelf().singleton();
  api.bind(UserServiceToken).to(UserService).transient();
});

const container = Container.fromModules(AppModule);
```

`Module.create` returns a `SyncModule`. `Module.createAsync` returns an `AsyncModule` (same as `AsyncModule.create`). `SyncModule`, `AsyncModule`, and `isSyncModule()` are available from `@codefast/di/module`.

Async modules may `await` during setup (for example remote config):

```typescript
const DbModule = Module.createAsync("Database", async (api) => {
  const config = await fetchRemoteConfig();
  api.bind(DbToken).toConstantValue(await Database.connect(config.dbUrl));
});

const container = await Container.fromModulesAsync(DbModule, AppModule);
```

Load and unload on an existing container:

```typescript
container.load(InfrastructureModule, AppModule);
await container.loadAsync(DbModule);

container.unload(AppModule);
await container.unloadAsync(DbModule);
```

Re-loading a module that is already loaded is a no-op. Circular imports between modules throw `CircularDependencyError`.

---

## Errors

All errors extend `DiError` and expose a stable `code` property.

| Error class                     | `code`                          | Thrown when                                                             |
| ------------------------------- | ------------------------------- | ----------------------------------------------------------------------- |
| `AmbiguousBindingError`         | `"AMBIGUOUS_BINDING"`           | Multiple bindings matched without a single decisive constraint winner   |
| `AsyncDeactivationError`        | `"ASYNC_DEACTIVATION"`          | Async `onDeactivation` reached through `unbind` / sync paths            |
| `AsyncModuleLoadError`          | `"ASYNC_MODULE_LOAD"`           | Sync `load()` used with an `AsyncModule`                                |
| `AsyncResolutionError`          | `"ASYNC_RESOLUTION"`            | Async work required during a sync `resolve()`                           |
| `CircularDependencyError`       | `"CIRCULAR_DEPENDENCY"`         | Cycle in dependency or module graph                                     |
| `DisposedContainerError`        | `"DISPOSED_CONTAINER"`          | Operation after `dispose()`                                             |
| `InternalError`                 | `"INTERNAL_ERROR"`              | Invariant violations (should not surface in correct consumer code)      |
| `MissingContainerContextError`  | `"MISSING_CONTAINER_CONTEXT"`   | `@inject` accessor resolved without an active container                 |
| `MissingMetadataError`          | `"MISSING_METADATA"`            | Class resolution missing `@injectable()` metadata                       |
| `MissingScopeContextError`      | `"MISSING_SCOPE_CONTEXT"`       | `scoped` binding resolved without a child container context             |
| `NoMatchingBindingError`        | `"NO_MATCHING_BINDING"`         | Hint matches no registered binding                                      |
| `RebindUnboundTokenError`       | `"REBIND_UNBOUND_TOKEN"`        | `rebind` targets a token with no binding owned by this container        |
| `ScopeViolationError`           | `"SCOPE_VIOLATION"`             | Captive dependency found by `validate()` (`details` describes the path) |
| `SyncDisposalNotSupportedError` | `"SYNC_DISPOSAL_NOT_SUPPORTED"` | Sync `using` / `[Symbol.dispose]` on the container                      |
| `TokenNotBoundError`            | `"TOKEN_NOT_BOUND"`             | Required token has no binding                                           |

```typescript
import {
  AmbiguousBindingError,
  DiError,
  ScopeViolationError,
  TokenNotBoundError,
} from "@codefast/di";

try {
  container.resolve(ServiceToken);
} catch (error) {
  if (error instanceof TokenNotBoundError) {
    console.error(`Not registered: ${error.tokenName}`);
  } else if (error instanceof ScopeViolationError) {
    console.error(
      `Scope violation: ${error.details.consumerToken} → ${error.details.dependencyToken}`,
    );
  } else if (error instanceof AmbiguousBindingError) {
    console.error(`Ambiguous: ${error.tokenName}`, error.candidateIds);
  } else if (error instanceof DiError) {
    console.error(`DI error [${error.code}]: ${error.message}`);
  }
}
```

---

## Package exports

The root entry re-exports the full façade (`package.json` → `"."`). Subpaths mirror `package.json` → `exports` for tree-shaking.

| Subpath                                        | Primary contents                                                                                                                                                     |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@codefast/di`                                 | Tokens, `Container`, modules, decorators, errors, graph types, `MetadataReaderToken`, helpers from `binding-scope` / `resolve-options`, `createAutoRegisterRegistry` |
| `@codefast/di/binding`                         | `BindingBuilder` surface and binding model types                                                                                                                     |
| `@codefast/di/binding-scope`                   | `effectiveBindingScope`                                                                                                                                              |
| `@codefast/di/binding-select`                  | `selectBinding`, `selectAllBindings`                                                                                                                                 |
| `@codefast/di/constraints`                     | `whenParentIs`, `whenNoParentIs`, `whenAnyAncestorIs`, `whenNoAncestorIs`, `whenParentNamed`, `whenAnyAncestorNamed`, `whenParentTagged`, `whenAnyAncestorTagged`    |
| `@codefast/di/constructor-type`                | `Constructor`, `ConstructorInvocation`                                                                                                                               |
| `@codefast/di/container`                       | `Container`, `ContainerStatic`                                                                                                                                       |
| `@codefast/di/decorators/inject`               | `inject`, `optional`, `injectAll`, `isInjectionDescriptor`, descriptor types                                                                                         |
| `@codefast/di/decorators/injectable`           | `injectable`, `createAutoRegisterRegistry`, `AutoRegisterRegistry`                                                                                                   |
| `@codefast/di/decorators/lifecycle-decorators` | `postConstruct`, `preDestroy`                                                                                                                                        |
| `@codefast/di/dependency-graph`                | `buildDependencyGraph`, `ContainerGraphJson`, `GraphOptions`, …                                                                                                      |
| `@codefast/di/environment`                     | `runWithContainer`, `getActiveContainer`, `DefaultResolutionContext`, `ResolverCallbacks`, `buildMaterializationFrame`                                               |
| `@codefast/di/errors`                          | Full `DiError` hierarchy                                                                                                                                             |
| `@codefast/di/graph-adapters/cytoscape`        | `toCytoscapeGraph`                                                                                                                                                   |
| `@codefast/di/graph-adapters/dot`              | `toDotGraph`                                                                                                                                                         |
| `@codefast/di/graph-adapters/reactflow`        | `toReactFlowGraph`                                                                                                                                                   |
| `@codefast/di/graph-adapters/types`            | Re-exports graph JSON types from `dependency-graph`                                                                                                                  |
| `@codefast/di/inspector`                       | `Inspector`, `BindingSnapshot`, `ContainerSnapshot`                                                                                                                  |
| `@codefast/di/lifecycle`                       | `LifecycleManager`                                                                                                                                                   |
| `@codefast/di/metadata/metadata-keys`          | Metadata keys + `WeakMap` registries                                                                                                                                 |
| `@codefast/di/metadata/metadata-reader-token`  | `MetadataReaderToken`                                                                                                                                                |
| `@codefast/di/metadata/metadata-types`         | `MetadataReader`, lifecycle metadata types                                                                                                                           |
| `@codefast/di/metadata/symbol-metadata-reader` | `SymbolMetadataReader`, `defaultMetadataReader`                                                                                                                      |
| `@codefast/di/module`                          | `Module`, `AsyncModule`, `SyncModule`, `isSyncModule`, builders                                                                                                      |
| `@codefast/di/registry`                        | `BindingRegistry`                                                                                                                                                    |
| `@codefast/di/resolve-options`                 | `injectableSlotToResolveOptions`, `slotKeyToResolveOptions`                                                                                                          |
| `@codefast/di/resolver`                        | `DependencyResolver`                                                                                                                                                 |
| `@codefast/di/scope`                           | `ScopeManager`                                                                                                                                                       |
| `@codefast/di/token`                           | `token`, `Token`, `tokenName`, …                                                                                                                                     |
| `@codefast/di/types`                           | Core DI types (`BindingScope`, `ResolutionContext`, `ResolveOptions`, …)                                                                                             |
| `@codefast/di/package.json`                    | Package manifest                                                                                                                                                     |

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
