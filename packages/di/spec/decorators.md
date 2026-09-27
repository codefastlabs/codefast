# Decorator layer

**Mental model.** Decorators only _record metadata_ — which tokens a class needs, which methods are lifecycle hooks. The
container reads that metadata through a swappable port and does the actual work. Decorators are syntactic sugar; the
core container does not depend on them.

They use **TC39 Decorator Stage 3** and `Symbol.metadata`. Neither `experimentalDecorators: true` nor `reflect-metadata`
is needed.

## Usage

TC39 Decorator Stage 3 **does not support parameter decorators** (TS1206). `@inject` on a constructor parameter is only
available with `experimentalDecorators: true` (legacy). The solution: `@injectable()` takes a **deps array** that
declares the constructor order explicitly — the same pattern as Angular Ivy.

> **Normative — the deps array is checked against the constructor at compile time, in both directions.**
>
> - Each element's resolved value must match its parameter (order, `optional`, `injectAll`).
> - For a **literal deps tuple the arity must match exactly** — a list longer than the constructor is rejected rather
>   than resolved and discarded.
> - Optional trailing parameters admit every arity they declare, and a rest parameter admits any list.
> - A deps array whose length the compiler cannot know skips the arity check. That spelling is also how a class
>   deliberately declares more dependencies than its constructor takes (for the dependency graph's edges); the surplus
>   values are resolved and discarded.

```ts
import { injectable, inject, injectAll, optional } from "@codefast/di";

// A class with no deps
@injectable()
class ConsoleLogger implements LoggerService {
  log(msg: string) {
    console.log(msg);
  }
}

// A class with deps — declared explicitly through the deps array
@injectable([Logger, Config])
class App {
  constructor(
    private logger: LoggerService,
    private config: AppConfig,
  ) {}
}

// Optional dependency
@injectable([Logger, Config, optional(Analytics)])
class App {
  constructor(
    private logger: LoggerService,
    private config: AppConfig,
    private analytics?: AnalyticsService,
  ) {}
}

// Multi dependency — inject every binding of a token as an array
@injectable([injectAll(Plugin)])
class PluginRunner {
  constructor(private plugins: ReadonlyArray<Plugin>) {}
}
```

## Named / tagged / multi inject

`inject()`, `optional()` and `injectAll()` are plain functions returning an `InjectionDescriptor`:

```ts
@injectable([inject(Logger, { name: "console" }), inject(Engine, { tag: Fuel.of("electric") })])
class Dashboard {
  constructor(
    private logger: LoggerService,
    private engine: Engine,
  ) {}
}

// Combining optional + named
@injectable([inject(Logger, { name: "file" }), optional(Analytics)])
class Reporter {
  constructor(
    private logger: LoggerService,
    private analytics?: AnalyticsService,
  ) {}
}

// injectAll — inject every matching binding as a read-only array, with an optional named filter
@injectable([injectAll(Plugin), injectAll(Logger, { name: "audit" })])
class Runner {
  constructor(
    private plugins: ReadonlyArray<Plugin>,
    private auditLoggers: ReadonlyArray<LoggerService>,
  ) {}
}
```

**Type signatures.** All three take a token plus the same optional `InjectOptions`, and return an `InjectionDescriptor`:
`inject` for a required dependency, `optional` returning `undefined` when there is no binding, `injectAll` collecting
every matching binding into an array.

- `InjectOptions` has three fields: `name`, `tag` (shorthand for one criterion, folded into `tags` when the descriptor
  is built — see [`ResolveOptions`](foundation-types.md#resolveoptions)), and `tags`.
- `InjectionDescriptor` is a [`DependencySlot`](foundation-types.md#dependencyslot) carrying a value type parameter —
  `multi` is `true` exactly when `injectAll` created it. It comes with the type guard `isInjectionDescriptor(value)`.

> **Exact shape:** `src/injection/descriptor.ts` — `injectAll`, `optional`, `isInjectionDescriptor`,
> `InjectionDescriptor`, `InjectOptions`; `src/decorators/inject.ts` — `inject`.

### `InjectableDependency` — one element of the deps array

```ts
/**
 * A valid element in the deps array of @injectable().
 * - Token<Value>       → plain inject: resolve the token, throw if there is no binding
 * - Constructor<Value> → plain inject: resolve the class, throw if there is no binding
 * - InjectionDescriptor → decorated inject: inject(), optional(), injectAll()
 *                          Use it for named/tagged/optional/multi injection
 */
type InjectableDependency<Value = unknown> = Token<Value> | Constructor<Value> | InjectionDescriptor<Value>;
```

> **Normative — normalization at decoration time.** `@injectable([...])` normalizes the whole `InjectableDependency[]`
> into `ParamMetadata[]` when the class is decorated, so the resolver only ever reads plain records:
>
> - `Token<Value>` or `Constructor<Value>` → `{ index, token, optional: false, multi: false }`
> - `InjectionDescriptor<Value>` → `{ index, token, optional, multi }` plus `name` and `tags` when it carries them — a
>   plain record, even when the descriptor came from the dual-role `inject()` function
>
> An absent `name` or `tags` is left out of the record, never set to `undefined` — the shape
> `exactOptionalPropertyTypes` expects.

`InjectableDependency` is exported from `@codefast/di` (see [Public API](README.md#public-api)).

### `InjectableOptions` and the full signature

`InjectableOptions` has two fields: `autoRegister` (the registry a class registers itself into; leave it out and it does
not self-register — see [Auto-registration](#auto-registration)) and `scope` (the scope used when self-registering,
ignored without `autoRegister`, defaulting to `"transient"`). It is exported from `@codefast/di`.

`injectable` has two overloads, each returning a class decorator: `injectable()` for a class with no deps, and
`injectable(deps, options?)`, where `deps` is a `readonly InjectableDependency[]` and `options` an `InjectableOptions`.
`options` needs `deps` beside it — `@injectable([], { autoRegister })` for a dependency-free class that self-registers.

## Inheritance — explicit, no magic

> **Normative.** Every dep must be declared explicitly — there is no implicit inheritance injection. A subclass that
> declares none of its own constructor metadata yet inherits a base that declares some — the natural
> `class Derived extends Base {}` with an implicit constructor — is **rejected with `MissingMetadataError`**, not built
> with `undefined` arguments. Give it its own `@injectable([...])` — `@injectable([])` if it really takes none — or bind
> it with `toDynamic()`/`toResolved()`. An explicit constructor alone does not help: one without parameters is rejected
> the same way, and one with parameters is rejected as any undecorated class is. A subclass whose own `@injectable([])`
> declares zero deps is built with zero arguments, as declared, and one extending a base that declares no deps needs no
> metadata of its own at all.

```ts
@injectable([Logger])
class BaseService {
  constructor(protected logger: LoggerService) {}
}

// The child redeclares everything — explicit
@injectable([Logger, UserRepo])
class UserService extends BaseService {
  constructor(
    logger: LoggerService,
    private repo: UserRepository,
  ) {
    super(logger);
  }
}
```

## MetadataReader — the port interface

**Mental model.** The container never touches `Symbol.metadata` itself. It asks a `MetadataReader` three questions about
a class — constructor deps, lifecycle methods, accessor fields — and a test can answer those questions with a fake.

The port has three methods:

| Method                           | Answers                                                                                                                               | Required? |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | :-------: |
| `getConstructorMetadata(target)` | The constructor's dependencies: a list of `ParamMetadata` — a [`DependencySlot`](foundation-types.md#dependencyslot) plus its `index` |    Yes    |
| `getLifecycleMetadata(target)`   | Two lists of method names, `postConstruct` and `preDestroy`, called in the order they appear in the class                             |    Yes    |
| `getAccessorMetadata(target)`    | The list of `@inject accessor` fields, each with `key` and `descriptor`                                                               | Optional  |

If a reader omits `getAccessorMetadata`, no class ever gets a container context opened for it, so every accessor
injection throws `MissingContainerContextError` unless the caller opens one with `runWithContainer`
([Property injection](#property-injection-through-the-accessor-field-decorator)).

> **Exact shape:** `src/metadata/types.ts` — `MetadataReader`, `ConstructorMetadata`, `ParamMetadata`,
> `LifecycleMetadata`.

### Installing your own reader

> **Normative.** The resolver is **handed** its reader when it is constructed, which happens inside the container's
> constructor. The only source resolution is guaranteed to read is therefore `ContainerOptions.metadataReader`
> ([Creating a container](container.md#creating-a-container)). This reader outranks any `MetadataReaderToken` binding,
> and children inherit it (a child calls the parent's `#getMetadataReader()` again when building its own resolver).

```ts
import { Container } from "@codefast/di";

const container = Container.create({ metadataReader: customReader });
```

### `MetadataReaderToken` — the binding, and its limits

```ts
import { MetadataReaderToken } from "@codefast/di";

const root = Container.create();
root.bind(MetadataReaderToken).toConstantValue(customReader);
const app = root.createChild(); // app's resolver is built after the binding exists → it sees the reader
```

Binding the token **on the very container you are using** is invisible to every path: the constructor already ran before
the binding existed, so the resolver keeps the default reader, and an undecorated class whose constructor declares
parameters throws `MissingMetadataError`.

> **Normative — one container, one reader.** The reader is fixed when the container's resolver is built; `validate()`,
> `inspect()`, `generateDependencyGraph()` and `unbind*` all answer using that same reader. Introspection cannot
> disagree with resolution.

> **Normative — a reader is asked about a class once.** Every container that reads through the same reader (a child
> inherits its parent's) shares that reader's answers for the life of the process, so a reader must answer from the
> class alone — never from state that changes after the class is defined.

`MetadataReaderToken` has type `Token<MetadataReader>` and is exported from `@codefast/di`.

### `SymbolMetadataReader` — reading metadata

The default implementation reads straight from `Symbol.metadata` — there is no WeakMap mirror. Because `Symbol.metadata`
is not yet defined natively on every runtime (current Node.js returns `undefined`), the codebase normalizes it once at
module load: `METADATA_SYMBOL = Symbol.metadata ?? Symbol.for("Symbol.metadata")`. Babel and esbuild use the same
fallback when transforming decorators, which keeps the symbol consistent. TypeScript does not: it creates no metadata
object at all when `Symbol.metadata` is missing, which is why such a runtime installs the symbol first
([tsconfig setup](#tsconfig-setup)). Once a runtime has a native `Symbol.metadata`, `??` picks the native symbol.

The list of `@inject accessor` fields is obtained through `getAccessorMetadata(target)`.
`getConstructorMetadata(target)` only describes the constructor's dependencies; it does not stand in for accessor
fields.

> **Normative — no leaking of parent metadata.** If a child extends a parent but has no `@injectable()`,
> `getConstructorMetadata` returns `undefined` for it — the parent class's metadata is never silently leaked. What the
> container then does follows [Inheritance](#inheritance--explicit-no-magic): it throws `MissingMetadataError` when the
> parent declares deps, and builds the child with no arguments when the parent declares none.

## Property injection through the `accessor` field decorator

**Mental model.** `@inject(Token) accessor field` fills a field from the container _during_ `new`, in the same call
frame, as the class's fields initialize — so the constructor body already sees the field, and nothing outside the class
has seen the instance yet. It works because the resolver opens a "current container" context around the `new` and the
field's initializer reads it.

TC39 Stage 3 supports `accessor`. `@inject(token)` is a **field decorator** on an **instance `accessor`**.

```ts
@injectable()
class Dashboard {
  @inject(Logger) accessor logger!: LoggerService;
  @inject(Database) accessor db!: DatabaseService;
}
```

> **Normative — `static accessor` is not supported.** A static initializer runs when the class is defined, outside the
> reach of both `runWithContainer` and `new`. The decorator **throws** when `context.static === true`. On toolchains
> that do not invoke decorators for static fields, the error only surfaces if the decorator actually runs.

### The mechanism — initialization order

`@inject(token)` on an `accessor` writes the token into `Symbol.metadata` through `context.metadata`, and installs an
initializer through `context.addInitializer` that injects the value into each instance. The order:

```
1. accessor initializers run as the fields initialize — the property-injected fields are set
2. the constructor body runs — it can already read the injected fields
3. @postConstruct() runs — so can it
```

```ts
// The container handles property injection for you
const dash = container.resolve(Dashboard);
// dash.logger → LoggerService from the same container
// dash.db → DatabaseService from the same container
```

**Construction (TC39) and activation (container).** One resolve consists of (1) **construction** — the field and
accessor initializers, then the constructor body, all before `new` returns (see the
[decorators proposal](https://github.com/tc39/proposal-decorators)); and (2) **activation** — `@postConstruct()` then
`onActivation()`, called by the resolver/lifecycle after (1) has completed.

### Outside a container context

If the class is `new`-ed by hand (not through the container), the accessor initializer has no container → it throws
`MissingContainerContextError`, carrying the class name (`className`) and the accessor name (`accessorName`) separately.

When other code (a router, an ORM, a test helper) owns the `new`, wrap the call site in `runWithContainer` — both it and
`getActiveContainer` are exported from `@codefast/di`:

```ts
import { runWithContainer } from "@codefast/di";

const instance = runWithContainer(container, () => new Dashboard());
```

> **Normative.** Only accessor injection is bridged. Lifecycle belongs to the resolver, so a hand-built instance does
> **not** run `@postConstruct`, and the container does not dispose it either.

### How the container context is passed — a module-level active container

> **Normative.** An accessor's `context.addInitializer` callback runs synchronously as the instance's fields initialize,
> in the same call frame as `new`. The container exploits this with a **module-level active container variable**:
>
> - `runWithContainer(container, fn)` sets the active variable to the given container, runs `fn`, then restores the
>   previous value in a `finally` block — so it is correct even when the constructor throws, and nested calls (A builds
>   B builds C) restore in the right order. It is **synchronous only**: the `finally` restores the previous value the
>   moment `fn`'s synchronous run returns, so the context does not survive an `await`. A callback returning a `Promise`
>   is rejected by the return type (it resolves to `never`).
> - `getActiveContainer()` reads the currently active container, returning `undefined` when no context is open.

> **Exact shape:** `src/ambient-container.ts`.

The container opens that context itself around every `new` it performs for a class with accessor injection, so a resolve
needs no `runWithContainer` at the call site — only a hand-built instance does.

**The `inject()` accessor decorator reads the active context in the initializer.** In its accessor-decorator role, the
implementation of `inject()` does three things:

1. It throws if `context.static` is `true`.
2. It writes `{ key, descriptor }` into `Symbol.metadata` through `context.metadata` so `MetadataReader` can read it
   back.
3. It installs an initializer via `context.addInitializer`. During a container resolve, that initializer resolves
   through the engine's own resolution path, which the resolver opens beside the active container: the accessor's
   dependency is resolved as a dependency of the class being built, so a `when()` constraint sees that class as its
   parent and a cycle through an accessor raises `CircularDependencyError`. Outside a resolve it falls back to
   `getActiveContainer()` — with no container it throws `MissingContainerContextError` carrying the class name and the
   accessor name — and with one it calls `container.resolve` as any caller would. Either way the `resolveOptional`
   variant is used for an optional descriptor, and the value is written through `context.access.set`.

It does not override `get`/`set`; it only adds an initializer.

> **Exact shape:** `src/decorators/inject.ts`.

**The flow with `runWithContainer`:**

```
resolver.resolve(Dashboard)
  → opens the active container and the engine's resolution path, then new Dashboard(...args)
    → accessor initializers run (addInitializer callbacks)
      → the engine path resolves each field's token      // read in the same call frame
      → context.access.set(this, value)                   // inject the value
    → Dashboard constructor body runs                     // the fields are already set
    → the context is restored                             // the previous one, in a finally
  → @postConstruct() runs (after the context is closed)
```

A hand-built instance under `runWithContainer(container, () => new Dashboard())` takes the same steps with only the
active container open, so its initializers go through `container.resolve`.

> **Concurrency safety.** `_activeContainer` is a module-level variable. In a single-threaded environment (the Node.js
> event loop) this is safe, because JS has no true parallelism. `runWithContainer` with `try/finally` guarantees that
> nested construction (A injects B injects C) stacks correctly. Should the library ever need to support Worker threads,
> each Worker has its own module scope — there is no shared state.

### Design choices

> **Constructor injection is still preferred** — immutable, easy to test, no container context needed. Property
> injection through `accessor` is useful when a class extends a framework that owns the constructor, or when you need to
> break a circular dependency.

> **`@inject` on a plain field is not supported** (`@inject(Logger) logger!`). Property injection only goes through
> `accessor` (`@inject(Logger) accessor logger`, …). A Stage 3 field decorator does have `context.access`; restricting
> this to `accessor` is an **API choice** (a narrower surface), not a limitation of the proposal.

### `inject()` is dual-role

`inject()` works both as a plain function (in a deps array) and as an accessor decorator. Its return type is the
**intersection** of `InjectionDescriptor<Value>` and `ClassAccessorDecorator<unknown, Value>`. Used in a deps array,
TypeScript matches the first half; used as a decorator, it matches the second. One function, one import — there is no
separate import for either role.

> **Decorator toolchain.** Vitest uses its default transform (OXC). Test snippets that need Stage 3 decorators go
> through `@rolldown/plugin-babel` with `@babel/plugin-proposal-decorators` (`version: "2023-11"`). A transform around
> decorator metadata must keep `inject()` a callable object; use `isInjectionDescriptor(value)` before processing a deps
> array.

## Method lifecycle decorators

`@postConstruct()` and `@preDestroy()` are method decorators on **instance methods**; the method name is written into
`Symbol.metadata`, and nowhere else. **Static methods are not supported** — the lifecycle manager only calls hooks on an
instance.

```ts
@injectable([Config])
class DatabaseService {
  constructor(private config: AppConfig) {}

  @postConstruct()
  async initialize(): Promise<void> {
    await this.connect(this.config.dbUrl);
  }

  @preDestroy()
  async cleanup(): Promise<void> {
    await this.disconnect();
  }
}

container.bind(Database).to(DatabaseService).singleton();
```

> **Normative.**
>
> - **Several per class:** a class may have several `@postConstruct()` methods and several `@preDestroy()` methods. All
>   of them are called in declaration order (top-down). If one throws, the remaining methods are not called and the
>   error is propagated.
> - **Across an inheritance chain:** `@postConstruct()` methods run base class first, `@preDestroy()` methods derived
>   class first — teardown unwinds construction.
> - **Scope:** `@postConstruct()` runs for every scope — each time a new instance is created. `@preDestroy()` only runs
>   for `singleton`, when the container is disposed or the binding unbound. `scoped` and `transient` instances get no
>   `@preDestroy()`.
> - **Async contamination:** an async `@postConstruct()` forces `resolveAsync()` — async contamination spreads along the
>   entire dependency path.

## Auto-registration

**Mental model.** A class can put itself on a list at module-load time; a container later binds everything on that list.
The list is an ordinary object you create and pass around — never a global.

`@injectable()` supports `autoRegister` — a class registers itself into an **explicit registry** at module load time.
There is no global singleton.

```ts
// An explicit registry — not a global
const appRegistry = createAutoRegisterRegistry();

@injectable([Logger, Config], { autoRegister: appRegistry, scope: "singleton" })
class UserService { ... }

@injectable([Logger], { autoRegister: appRegistry })
class PostService { ... }  // default scope: transient

const container = Container.create();
const count = container.loadAutoRegistered(appRegistry);
// count = 2
```

> **Scope in auto-register.** The default is `transient`. Override it with
> `{ autoRegister: registry, scope: "singleton" | "scoped" }`.

> **Coexisting with explicit bind.** `container.bind(UserService)` after `loadAutoRegistered()` applies slot-aware
> last-wins — the explicit binding replaces the auto-registered one when the slot is the same.

**The `AutoRegisterRegistry` interface.** `AutoRegisterRegistry` has two methods: `register(target, scope)` — called
automatically by `@injectable({ autoRegister })` — and `entries()`, returning everything registered.
`createAutoRegisterRegistry()` builds a fresh registry.

> **Exact shape:** `src/decorators/injectable.ts`.

> **Rationale — why not a global registry.** Global state creates an implicit side effect at module import time — hard
> to tree-shake, hard to isolate in tests. `createAutoRegisterRegistry()` returns an ordinary object that can be passed
> around, mocked, or reset independently.

## The decorator and helper list

| API                            | Kind                          | Target                        | Effect                                                                                                   |
| ------------------------------ | ----------------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------- |
| `@injectable(deps, options?)`  | decorator                     | class                         | Writes param metadata into `Symbol.metadata`. `options.autoRegister` registers into an explicit registry |
| `inject(token, options?)`      | plain fn + accessor decorator | deps array / `accessor` field | An `InjectionDescriptor`, or injection through an accessor                                               |
| `optional(token, options?)`    | plain fn                      | deps array                    | Like `inject`, but returns `undefined` when there is no binding                                          |
| `injectAll(token, options?)`   | plain fn                      | deps array                    | Resolves every matching binding into an array                                                            |
| `isInjectionDescriptor(v)`     | type guard fn                 | —                             | Checks whether a value is an `InjectionDescriptor`                                                       |
| `@postConstruct()`             | decorator                     | method                        | Writes the method name into `Symbol.metadata` — runs after construction, before caching                  |
| `@preDestroy()`                | decorator                     | method                        | Writes the method name into `Symbol.metadata` — runs at deactivation (singleton only)                    |
| `MetadataReaderToken`          | `Token<MetadataReader>`       | —                             | The token for swapping the MetadataReader in tests                                                       |
| `createAutoRegisterRegistry()` | fn                            | —                             | Creates the explicit registry `options.autoRegister` takes                                               |
| `runWithContainer(c, fn)`      | fn                            | —                             | Runs `fn` with `c` active, so a hand-built instance's accessors can inject                               |
| `getActiveContainer()`         | fn                            | —                             | The container active in the current synchronous call, or `undefined`                                     |
| `SymbolMetadataReader`         | class                         | —                             | The `MetadataReader` that reads what these decorators write                                              |
| `defaultMetadataReader`        | `SymbolMetadataReader`        | —                             | The shared instance a container uses when given no reader                                                |

> **`@singleton()` and `@scoped()` do not exist.** Scope is a binding-time concern — declared at `.singleton()` /
> `.transient()` / `.scoped()` in the fluent chain. A class does not decide its own scope.

> **There are no parameter decorators.** TC39 Stage 3 does not support them (TS1206). The deps array replaces them
> entirely.

## tsconfig setup

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "NodeNext",
    "strict": true
  }
}
```

`experimentalDecorators: true` is not needed: Stage 3 decorators are TypeScript's default.

> **Normative — the program declares explicit resource management; the package does not.** The published declarations
> name `Symbol.asyncDispose` and `Symbol.dispose`, and `await using` checks a container against `AsyncDisposable` and
> `Disposable`. A Node program gets all four from `@types/node` 24 or later (`types: ["node"]`), which loads
> TypeScript's `ESNext.Disposable` lib. Any other program adds `ESNext.Disposable` to its own `lib`. In a browser
> program it goes beside `DOM`, and there it also asserts that the targeted browsers ship explicit resource management,
> which Safari does not yet — so the `@codefast/typescript-config` presets leave it out, and a browser program on them
> keeps `skipLibCheck` on and calls `dispose()`. `target: "ESNext"`, as above, loads all of `ESNext` and needs nothing
> more. Without the types, `container.d.ts` fails with TS2550 under `skipLibCheck: false`, and the program's own
> `await using` fails with TS2318 even under `skipLibCheck: true`.
>
> At runtime, `await using` needs `Symbol.asyncDispose` when `@codefast/di` is evaluated, because the container's
> methods are keyed by it then. Every supported Node line ships it. On a browser that does not, `dispose()` still works.

> **Normative — `Symbol.metadata` must exist before a decorated class is defined.** TypeScript emits `context.metadata`
> as `undefined` on a runtime without `Symbol.metadata`, and every decorator here then throws
> `MissingDecoratorMetadataError` at the declaration. The library does not install it — the package declares no side
> effects — so an app on such a runtime installs it in a module imported first:
>
> ```ts
> (Symbol as { metadata?: symbol }).metadata ??= Symbol.for("Symbol.metadata");
> ```
>
> The widening is what lets it type-check: TypeScript declares `Symbol.metadata` `readonly`, and a `lib` without
> `ESNext.Decorators` does not declare it at all, so the bare `Symbol.metadata ??= …` compiles only in a `.js` file.
> `Symbol.for` is the key the default reader falls back to and the one esbuild emits, so every toolchain agrees on it.
> Node also cannot parse decorator syntax itself: `target: "ESNext"` leaves decorators in the output, so the code must
> go through a transpiler that lowers them (a lower `target`, esbuild, or Babel's `2023-11` decorators plugin).
