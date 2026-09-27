# Module system

**Mental model.** A module is a named, reusable description of bindings — a function that receives a builder and calls
`bind`/`import` on it, or a list of declared bindings. It holds no runtime state; a container decides when to load it
and remembers what it produced.

## Sync module

```ts
import { SyncModule } from "@codefast/di";

export const LoggerModule = SyncModule.create("app:Logger", (builder) => {
  builder.bind(Logger).to(ConsoleLogger).singleton();
});

export const AppModule = SyncModule.create("app:Root", (builder) => {
  builder.import(LoggerModule);
  builder.bind(Config).toConstantValue(loadConfig());
  builder.bind(App).toSelf().singleton();
});
```

## Async module

```ts
export const DatabaseModule = AsyncModule.create("app:Database", async (builder) => {
  const config = await loadRemoteConfig();

  builder.import(LoggerModule); // a SyncModule can be imported by an AsyncModuleBuilder
  builder.bind(Config).toConstantValue(config);
  builder
    .bind(Database)
    .toDynamicAsync(async (ctx) => {
      const db = new PostgresDatabase(config.dbUrl);
      await db.connect();
      return db;
    })
    .singleton()
    .onDeactivation(async (db) => db.disconnect());
});

// An async module must use loadAsync
const container = Container.create();
await container.loadAsync(DatabaseModule);
```

## Declared module

**Mental model.** A declared module is a module written as a list rather than a function: each entry states one binding
as data, so the whole list is checked once, where it is written, and a container files it in one pass when it loads the
module. It is a `SyncModule` like any other — `load`, `fromModules`, `import`, reference counting and `unload` treat it
exactly as they treat one built by `SyncModule.create`.

```ts
import { binding, Module } from "@codefast/di";

export const InfraModule = Module.fromBindings("app:Infra", [
  binding(Logger, { to: ConsoleLogger, scope: "singleton" }),
  binding(Logger, { to: FileLogger, whenNamed: "file", scope: "singleton", onDeactivation: (log) => log.flush() }),
  binding(Config, { toConstantValue: loadConfig() }),
  binding(Clock, { toDynamic: () => new SystemClock() }),
  binding(Repository, { toResolved: (db, log) => new Repository(db, log), deps: [Database, Logger] }),
  binding(Storage, { to: S3Storage, whenTagged: Region.of("eu") }),
  binding(Plugin, { toConstantValue: auditPlugin, many: true }),
  binding(ConsoleLogger, { toSelf: true }),
  binding(AuditLogger, { toAlias: Logger }),
]);

const container = Container.fromModules(InfraModule);
```

`binding(key, definition)` returns a `BindingDeclaration`; `Module.fromBindings(name, declarations)` — also reachable as
`SyncModule.fromBindings` — returns a `SyncModule`. A `BindingDefinition` spells a binding with the fluent chain's own
vocabulary, one key per step:

| Key                                               | The fluent step it stands for                                                   |
| ------------------------------------------------- | ------------------------------------------------------------------------------- |
| `to`, `toSelf: true`, `toConstantValue`           | `to(Class)`, `toSelf()`, `toConstantValue(value)`                               |
| `toDynamic`, `toDynamicAsync`                     | `toDynamic(factory)`, `toDynamicAsync(factory)`                                 |
| `toResolved` + `deps`, `toResolvedAsync` + `deps` | `toResolved(factory, deps)`, `toResolvedAsync(factory, deps)`                   |
| `toAlias`                                         | `toAlias(target)`                                                               |
| `whenNamed`, `whenTagged`, `when`, `many: true`   | `whenNamed(name)`, `whenTagged(criterion)` once per criterion, `when`, `many`   |
| `scope`                                           | `singleton()` / `transient()` / `scoped()`; absent means the strategy's default |
| `onActivation`, `onDeactivation`                  | `onActivation(handler)`, `onDeactivation(handler)`                              |

> **Normative — a definition is typed exactly as the chain is.** The key alone decides the value type and the slot names
> — a `Token<Value, Names>` or a `Constructor<Value>` — and the definition never widens them. The compiler rejects, as
> the chain's return types do:
>
> - no strategy key, or more than one;
> - a value, class or factory whose type is not the key's value type, and a `whenNamed` outside the token's `Names`;
> - `toSelf` on a key that is not a class;
> - `scope` on `toConstantValue` or `toAlias`, and a hook on `toAlias`;
> - `onDeactivation` on any scope but `"singleton"` — `toConstantValue` excepted, as it is always a singleton;
> - `many: true` beside `whenNamed` or `whenTagged`.
>
> `toResolved` / `toResolvedAsync` infer the factory's parameters from `deps` exactly as their chain steps do.

> **Normative — `whenTagged` takes one criterion or several.** `whenTagged: Region.of("eu")` and
> `whenTagged: [Region.of("eu"), Size.of("l")]` are both accepted. An array stands for one `whenTagged()` per element,
> in order, so a key repeated within it keeps its last criterion — the rule a slot applies to any repeated key
> ([Slots and last-wins](binding.md#slots-and-last-wins--the-exact-definition)).

> **Normative — equivalence.** Loading a declared module is indistinguishable from loading a `SyncModule.create` whose
> setup binds each declaration, in list order, through the chain steps its keys stand for — strategy, then slot
> (`whenNamed`, each `whenTagged`), then `when`, then `many`, then scope, then hooks. Slot last-wins, the displacement
> of an earlier binding and what it still owes, registration order, the binding ids the module records, `unload`,
> `validate`, `inspect` and `generateDependencyGraph` all answer exactly as they would for that setup. Each load builds
> bindings of its own, so one declared module loaded into several containers shares nothing between them, as any module
> does.

> **Normative — a malformed declaration fails where it is written.** `binding()` checks its definition when it is
> called, for callers the compiler cannot reach — plain JavaScript, a value built from `any`:
>
> - a slot on a member throws `ManyBindingSlotError`, and `toSelf` on a non-class throws
>   `SelfBindingRequiresClassError`, as the chain does;
> - no strategy key, several, or a key the strategy does not allow (a hook on an alias, `onDeactivation` on a
>   non-singleton, a `scope` on a constant or an alias) throws `InvalidBindingDeclarationError`, naming the token and
>   the rule.
>
> `Module.fromBindings()` throws `InvalidBindingDeclarationError` for a list entry that is not a `BindingDeclaration`. A
> declared module that was built can therefore always be loaded; loading it raises only what binding itself raises.

**What a declared module deliberately cannot do.** It has no per-declaration `.id()` — its bindings are removed by
`unload` or by token — and no logic that runs at load time: a binding that depends on something only known when the
module loads, or on an `await`, belongs in `Module.create` or `Module.createAsync`. The two compose without a third API:
a fluent module mixes in a declared one with `builder.import(InfraModule)`.

> **Non-normative — why it exists.** A declared module's list is checked and normalised once, when the module is
> defined, and a load registers each binding already in its final shape, where a fluent setup pays every chain step — a
> slot, a scope change, a hook — each time the module loads. It changes nothing a resolve reads.

## Using modules

```ts
// Sync — every module must be a SyncModule
const container = Container.fromModules(AppModule, LoggerModule);

// Async — when at least one AsyncModule is involved
const container = await Container.fromModulesAsync(AppModule, DatabaseModule);

// Overriding a binding in a test — bind() again at the same container
const testContainer = await Container.fromModulesAsync(AppModule, DatabaseModule);
testContainer.bind(Database).toConstantValue(mockDatabase); // last-wins replaces DatabaseModule's default binding
// Or rebind, which also tears down what the replaced binding owns
testContainer.rebind(Database).toConstantValue(mockDatabase);
// Or keep the app container intact and override in a child
const scoped = container.createChild();
scoped.bind(Database).toConstantValue(mockDatabase); // the child's binding shadows the parent's
```

> **Normative — a module is a pure description, holding no runtime state.** The same `SyncModule` / `AsyncModule` object
> can be loaded into several independent containers in parallel. A module only holds its `name` and either its `setup`
> callback or its declarations; the container tracks "which modules are loaded" and "which binding belongs to which
> module".

> **Normative — deduplication.** Calling `container.load(M)` repeatedly, or `m.import(M)` from several modules, is a
> no-op from the second time on. Dedup is based on **object identity**, not on `name`. Unload reference-counting uses
> the same identity — see [Module management](container.md#module-management).

## A `SyncModule` cannot import an `AsyncModule`

> **Normative.** `ModuleBuilder` (used inside `SyncModule.create()`) only accepts `SyncModule[]` in `import()`. A
> `SyncModule` callback is sync and cannot await an async setup.

```ts
// Compile error — a SyncModule cannot import an AsyncModule
export const AppModule = SyncModule.create("app:Root", (builder) => {
  builder.import(DatabaseModule); // TypeScript error: AsyncModule is not assignable to SyncModule
});

// Right — convert to an AsyncModule when you need to import one
export const AppModule = AsyncModule.create("app:Root", async (builder) => {
  builder.import(DatabaseModule); // OK — AsyncModuleBuilder accepts both SyncModule and AsyncModule
});
```

## Module interface

| Type                 | What it offers                                                                                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ModuleBuilder`      | Exists only inside a `SyncModule.create()` callback. Exactly two things: `bind(token)` and `import(...modules)` accepting **only** `SyncModule`              |
| `AsyncModuleBuilder` | The same two things, but its `import` accepts both `SyncModule` and `AsyncModule`                                                                            |
| `SyncModule`         | Carries a `name` and a **branded field**; built by `SyncModule.create(name, setup)` with a sync `setup`, or by `SyncModule.fromBindings(name, declarations)` |
| `AsyncModule`        | Carries a `name` and a **branded field**; built by `AsyncModule.create(name, setup)` with an async `setup`                                                   |
| `Module`             | `Module.create` / `Module.createAsync` / `Module.fromBindings` only forward to the factories above, for call sites that prefer importing a single name       |
| `binding`            | Builds one `BindingDeclaration` from a key and a `BindingDefinition` ([Declared module](#declared-module))                                                   |
| `isSyncModule`       | Type guard for telling the two apart at runtime when all you hold is the union                                                                               |

> **Exact shape:** `src/core/module.ts` — `ModuleBuilder`, `AsyncModuleBuilder`, `SyncModule`, `AsyncModule`, `Module`,
> `isSyncModule`.

> **Rationale — why a branded field.** TypeScript uses structural typing — if the two interfaces only had
> `name: string`, `container.load(asyncModule)` would compile without complaint. The branded field makes
> `load(asyncModule)` a TypeScript error at compile time.

> **Rationale — `ModuleBuilder` has no `unbind` / `rebind`.** A module is _additive_ — it only declares, it never
> removes another module's bindings. Overriding in a test uses `container.bind()` or `container.rebind()` after loading.
> This avoids hidden coupling between modules.
