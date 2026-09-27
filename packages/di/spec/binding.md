# Binding API

**Mental model.** A binding tells the container how to produce a value for a token. It has four parts, declared in the
fixed chain order `to*() → when*() → scope() → on*()`: a **strategy** (class, constant, factory, alias), optional
**selection criteria** (a slot and/or a predicate), a **scope** (how long an instance lives), and optional **lifecycle
hooks**.

## Binding kinds

| Method                                 | InversifyJS v8 equivalent         | When to use it                           |
| -------------------------------------- | --------------------------------- | ---------------------------------------- |
| `.to(Class)`                           | `.to(Class)`                      | The container `new`s it and injects deps |
| `.toSelf()`                            | `.toSelf()`                       | The token is the class                   |
| `.toConstantValue(value)`              | `.toConstantValue(value)`         | A constant — config, primitive           |
| `.toDynamic(ctx => ...)`               | `.toDynamicValue(ctx => ...)`     | Sync factory using `ctx.resolve()`       |
| `.toDynamicAsync(ctx => Promise)`      | (uses `toDynamicValue` async)     | I/O at construction time                 |
| `.toResolved(factory, deps)`           | `.toResolvedValue(factory, deps)` | Explicit sync deps, no `ctx` needed      |
| `.toResolvedAsync(asyncFactory, deps)` | —                                 | Explicit async deps, no `ctx` needed     |
| `.toAlias(otherToken)`                 | `.toService(otherId)`             | Alias this token → another token         |

> **`toDynamic` vs `toDynamicAsync`.** `toDynamic` forces the factory to return `Value` (never a `Promise`);
> `toDynamicAsync` forces it to return `Promise<Value>`. The compiler then enforces `resolveAsync()` where it is needed.
> _Compatibility:_ InversifyJS v8 uses `toDynamicValue` for both sync and async factories — the compiler enforces
> nothing.

> **`toResolved` vs `toResolvedAsync`.** `toResolved` is shorthand for `toDynamic` when the deps are simple and the
> factory is sync. `toResolvedAsync` is shorthand for `toDynamicAsync` when the deps are simple but the factory needs to
> be async (initialising a cache from config, say). Both are pure syntactic sugar — they add no capability over
> `toDynamic`/`toDynamicAsync`.

> **`toAlias` chains.** An alias may point at another alias — the container follows the chain to the final binding. A
> cycle (`A → B → A`) is detected and throws `CircularDependencyError`. `toAlias` returns an `AliasBindingBuilder` so it
> can carry constraints and `.id()` — the only builder with no value type parameter, because an alias produces no value
> of its own; it keeps the `Names` parameter so its `whenNamed()` stays checked.

## Scope

**Mental model.** Scope decides how many instances a binding produces and who owns them: one per container hierarchy
(`singleton`), one per child container (`scoped`), or one per resolve (`transient`).

```ts
.singleton()  // ←→ .inSingletonScope()  — created once, reused forever
.transient()  // ←→ .inTransientScope()  — every resolve = new (the default if unspecified)
.scoped()     // ←→ .inRequestScope()   — once per child container
```

> **Normative.**
>
> - Scope **always** comes after `when*` in the chain
>   ([Fluent chain](README.md#fluent-chain--the-canonical-invariant-order)).
> - The default when no scope is declared is `transient`.
> - The `on*()` lifecycle hooks are **only available after `scope()` is called** explicitly. If you do not need
>   lifecycle hooks, you can skip `scope()` and take the transient default.
> - A `scoped` binding is only a singleton within the child container that first resolves it. Resolving `scoped`
>   directly from a parent container (with no child scope context) throws `MissingScopeContextError`.
> - **Singleton cache ownership:** a singleton is cached at the container where the binding is defined — not at the
>   container that called resolve. When `child.resolve(SomeToken)` walks up to the parent and finds a singleton binding
>   there, the instance is cached at the **parent**. `child.dispose()` only deactivates singletons defined at the child.

**Scope validation matrix — captive dependency.** A _captive dependency_ is a long-lived consumer holding a
shorter-lived dependency, which silently freezes that dependency for the consumer's whole life.

| Consumer ╲ Dependency | `singleton` | `scoped`     | `transient`  |
| --------------------- | ----------- | ------------ | ------------ |
| `singleton`           | ✅ OK       | ❌ Violation | ❌ Violation |
| `scoped`              | ✅ OK       | ✅ OK        | ✅ OK        |
| `transient`           | ✅ OK       | ✅ OK        | ✅ OK        |

`container.validate()` walks the whole dependency graph and throws `ScopeViolationError` for any violation. See
[`validate`](container.md#validate--detecting-captive-dependencies) for the limits of `validate()`.

> **Rationale — why `transient` is the default.** It is the safest row of the matrix — a `transient` consumer may depend
> on any scope without a captive dependency, so the default can never introduce a violation on its own. It is also a
> fixed constant inlined at each `to*()`, never a container-level setting: `bind(X).to(Y)` means the same thing in every
> file, which keeps with the no-hidden-behaviour principle. Reach for `singleton()` or `scoped()` explicitly the moment
> a binding needs shared state or a lifecycle.

## `toConstantValue` — semantics

`toConstantValue(value)` creates a binding that always returns the same value. It is treated as a singleton — there is
no scope choice.

> **Normative — lifecycle of a constant.**
>
> - `onActivation` may be registered and **will be called** the first time the value is resolved. The post-activation
>   result is cached; activation does not run again on later resolves.
> - If `onActivation` returns a `Promise`, the resolve must use `resolveAsync()`.
> - `onDeactivation` may be registered and will be called when the binding is unbound or the container is disposed.
> - The original value is considered immutable — `onActivation` may return a Proxy wrapper. After activation, the cached
>   value is the activation result, not the original.

## Constraints — `when*`

**Mental model.** A constraint decides _when_ a binding is eligible for a request. There are two mechanisms:

- **Slot criteria** — `whenNamed`, `whenTagged`, `whenDefault`. Static, declared at bind time, matched at constant cost
  against the request's hint. They define the binding's _slot_
  ([Slots and last-wins](#slots-and-last-wins--the-exact-definition)).
- **Predicates** — `when(ctx => boolean)`. Dynamic, evaluated at resolve time against the `ConstraintContext`, after
  slot matching.

`when*` comes before `to*()`, which registers the binding in the slot the constraints declare. A binding may carry one
or several combined constraints.

```ts
// Named binding
container.bind(Logger).whenNamed("console").to(ConsoleLogger).singleton();
container.bind(Logger).whenNamed("file").to(FileLogger).singleton();

// Tagged binding — a criterion can only be minted from a tag key, never by hand
const Fuel = tag<"petrol" | "electric">("app:fuel");
const Size = tag<"v8" | "v6">("app:size");

container.bind(Engine).whenTagged(Fuel.of("petrol")).to(PetrolEngine);
container.bind(Engine).whenTagged(Fuel.of("electric")).to(ElectricEngine);

// Several tags on one binding — a specialisation of the petrol binding above. The hint
// {fuel:petrol} gets PetrolEngine; the hint {fuel:petrol, size:v8} gets TurboV8 because it
// declares more tags, i.e. it is more specific.
container.bind(Engine).whenTagged(Fuel.of("petrol")).whenTagged(Size.of("v8")).to(TurboV8);

// Explicit default slot — matches when there is no name and no tag
container.bind(Logger).whenDefault().to(NoopLogger);

// Custom predicate — uses ConstraintContext
container
  .bind(Logger)
  .when((ctx) => ctx.ancestors.some((f) => f.tokenName === "DebugModule"))
  .to(VerboseLogger);

// Combining a name with a custom predicate on one binding
container
  .bind(Logger)
  .whenNamed("audit")
  .when((ctx) => ctx.parent?.scope === "singleton")
  .to(AuditLogger);
```

**Slot criteria — the three verbs:**

> **`whenTagged` takes a criterion, not a loose pair.** A criterion can only be minted by `TagKey.of()`, so the key must
> be declared up front with `tag<Value>(name)` — that is what makes identity comparison enough to stand in for
> `Object.is` ([`ResolveOptions`](foundation-types.md#resolveoptions)). The key name is still a `string`, so it follows
> the display-name convention ([Display names](token.md#display-names)): `tag("mylib:fuel")`, `tag("@scope/pkg:env")`.

> **`whenNamed` is sugar.** A name is a criterion of the reserved key `slotName` — `whenNamed("console")` ≡
> `whenTagged(slotName.of("console"))`, single-valued per slot
> ([Slots and last-wins](#slots-and-last-wins--the-exact-definition)).

> **Explicit `whenDefault()` vs declaring no constraint.** A binding with no `when*` at all also matches the default
> slot. `whenDefault()` is useful when you want to document the intent explicitly, or to combine it with a custom
> `when()`. It declares the slot a fresh binding already holds, so it changes nothing — in particular it does not clear
> a name or tag an earlier `whenNamed()`/`whenTagged()` in the same chain set.

**Predicates — `when()`:**

> **Normative — rules for a `when()` predicate.**
>
> - The predicate **must be pure and deterministic** — no side effects, no I/O. Breaking this rule is undefined
>   behaviour and may cause an infinite loop or incorrect caching.
> - Because it is pure, the engine may evaluate it once per container state and reuse the answer where the context
>   cannot differ: a root-level `resolveAll` with no options keeps its candidate list until any registry in the chain
>   changes, and keeps the value list too while every member is a hook-free constant or a hook-free singleton whose
>   instance is cached. A read carrying options, or made from inside a factory, evaluates every predicate afresh.
> - The predicate **must not** call `ctx.resolve*()` — that causes circular resolution.

> **Performance note.** For a `transient` binding on a hot path (resolved on every request), a complex `when()`
> predicate is called a great many times. Prefer `whenNamed` / `whenTagged` (O(1) lookup) on hot paths; keep custom
> `when()` predicates for configuration-time bindings.

**Resolving with a hint:**

```ts
const Env = tag<"production" | "staging">("app:env");

// Named
container.resolve(Logger, { name: "file" });

// One tag — `tag` is shorthand for exactly one criterion
container.resolve(Engine, { tag: Fuel.of("electric") });

// Several tags — the request must name every tag the binding declares
container.resolve(Engine, { tags: [Fuel.of("petrol"), Size.of("v8")] });

// Name and tag combined
container.resolve(Logger, { name: "audit", tag: Env.of("production") });
```

## `toAlias` — hint forwarding

An alias points at another token. When the alias is resolved, the hint is **forwarded** to the target token's
resolution.

> **Normative — a default-slot alias is transparent.** An alias with no slot, predicate or membership of its own answers
> a request whose criteria no slot of its token matches, and forwards those criteria to its target unchanged. An exact
> slot on the alias's own token is tried first and still wins, and the nearest container that can answer does, as for
> any binding. This holds for `resolve`, `resolveOptional` and their async forms, and `has` agrees with them;
> `resolveAll` filters the alias's token by its own slots, so a default-slot alias does not join a collection read that
> carries criteria.

```ts
container.bind(Logger).whenNamed("console").to(ConsoleLogger).singleton();
container.bind(Logger).whenNamed("file").to(FileLogger).singleton();
container.bind(AbstractLogger).toAlias(Logger);

// The hint is forwarded to the Logger resolution
const fileLogger = container.resolve(AbstractLogger, { name: "file" });
// → FileLogger (the hint { name: "file" } is forwarded to Logger)
```

If the alias carries its own constraint (`whenNamed("audit")`), that constraint is used to **select the alias binding**;
it does not affect what gets forwarded:

```ts
container.bind(AbstractAuditLogger).whenNamed("audit").toAlias(Logger);
// This binding is only selected when resolving AbstractAuditLogger with the hint { name: "audit" }
// Once selected, the hint { name: "audit" } is forwarded to the Logger resolution
const logger = container.resolve(AbstractAuditLogger, { name: "audit" });
// → the Logger binding matching { name: "audit" }; with none, NoMatchingBindingError names Logger
```

> **An alias has no scope of its own.** The scope is decided by the target binding. An alias is only a pointer — it
> caches no instance.

> **A dangling alias is a miss, not an error.** Because an alias is transparent, an optional or collection read whose
> alias chain ends at a token nothing matches answers `undefined` / skips the member, exactly as it would for the target
> directly; only a required `resolve` / `resolveAsync` throws. An alias **cycle** always throws
> `CircularDependencyError`.

## Builder type interfaces

**Mental model.** Each step in the chain returns a different builder, and it is precisely that builder's method set
which enforces the order in [Fluent chain](README.md#fluent-chain--the-canonical-invariant-order). Reading the table row
by row tells you what you may call next.

| Builder returned by | Constraint | Scope | `onActivation` | `onDeactivation` | `id()` |
| ------------------- | :--------: | :---: | :------------: | :--------------: | :----: |
| `bind(token)`       |     —      |   —   |       —        |        —         |   —    |
| `to*()`             |     ✅     |  ✅   |       —        |        —         |   ✅   |
| `toConstantValue()` |     ✅     |   —   |       ✅       |        ✅        |   ✅   |
| `toAlias()`         |     ✅     |   —   |       —        |        —         |   ✅   |
| `singleton()`       |     —      |   —   |       ✅       |        ✅        |   ✅   |
| `transient()`       |     —      |   —   |       ✅       |        —         |   ✅   |
| `scoped()`          |     —      |   —   |       ✅       |        —         |   ✅   |

How to read the rows:

- **`bind(token)`** returns a builder with **only** the `to*` group and nothing else.
- **The shared part** — the four constraint methods (`when`, `whenNamed`, `whenTagged`, `whenDefault`) plus `many()` and
  `id()` — is factored into a `SlotConstrainedBuilder` interface that the three concrete builders inherit. It never
  appears in the chain, and no call returns it.
- **`toConstantValue()`** has no scope step because a constant binding is always a singleton. Calling a lifecycle hook
  on it moves to a builder with only lifecycle and `id()` left — a one-way state: calling a hook locks the constraint
  part.
- **`toAlias()`** is the only builder **without a value type parameter** — an alias produces no value of its own, so
  there is nothing to infer. It still carries the token's slot names, so `whenNamed` stays checked.
- **`transient()` and `scoped()`** have no `onDeactivation` because those two scopes have no deactivation
  ([`ActivationHandler` and `DeactivationHandler`](foundation-types.md#activationhandler-and-deactivationhandler)).

> **Exact shape:** `src/core/binding-builders.ts` — `BindToBuilder`, `SlotConstrainedBuilder`, `BindingBuilder`,
> `ConstantBindingBuilder`, `AliasBindingBuilder`, `SingletonBindingBuilder`, `TransientBindingBuilder`,
> `ScopedBindingBuilder`, `SingletonLifecycleBuilder`.

> **Normative — a repeated `on*()` on one chain replaces the hook it already carries.** The three chain verbs compose
> three different ways:
>
> - `when()` **narrows** — a candidate passes every predicate.
> - Container-level hooks **accumulate** — each registration is another listener.
> - A chain's `onActivation`/`onDeactivation` **replaces** — a chain held in a variable is a reconfiguration handle, and
>   re-calling its lifecycle verb means "this hook now", not "this hook too".
>
> A caller who wants several activation steps composes them in one handler or registers container-level hooks. Pinned by
> `tests/unit/resolution/cache-invalidation.test.ts` ("drops a hook that was replaced on the same chain"); changing this
> to accumulate is a behavior change, not a clarification.

> **Rationale — why `BindingBuilder` has no `on*()`.** Lifecycle hooks need the scope context to have clear semantics:
> `onDeactivation` only makes sense for a singleton, while `onActivation` on a transient fires every time a new instance
> is created. Forcing scope to be declared before lifecycle removes the ambiguity entirely — the compiler will not let
> you confuse them.

> **`ConstantBindingBuilder.onActivation` → `SingletonLifecycleBuilder`.** After `onActivation()` or `onDeactivation()`
> is called, the builder no longer exposes `when*` — a one-way state: calling lifecycle "locks" the constraint and moves
> into the lifecycle phase.

## `toResolved` and `toResolvedAsync` — explicit deps

```ts
// toDynamic — use it when the logic is complex or the resolve is conditional
container.bind(App).toDynamic((ctx) => {
  const logger = ctx.resolve(Logger);
  const config = ctx.resolve(Config);
  return new App(logger, config);
});

// toResolved — deps declared explicitly, the factory receives the right types
container.bind(App).toResolved(
  (logger, config) => new App(logger, config),
  [Logger, Config] as const, // `as const` is required — TypeScript infers a tuple, not a union
);

// toResolvedAsync — explicit deps, async factory
container.bind(Cache).toResolvedAsync(async (config) => Cache.connect(config.redisUrl), [Config] as const);
```

With `deps: [Logger, Config] as const`, TypeScript infers the factory params as `[LoggerService, AppConfig]` — no manual
annotation needed.

> **`toResolved`/`toResolvedAsync` and named/tagged deps.** Each element of `deps` is an `InjectableDependency`: a plain
> token, or a descriptor from `inject(token, { name, tag, tags })`, `optional(token, ...)` or `injectAll(token, ...)` —
> the same forms `@injectable([...])` takes. A named, tagged, optional or collection dependency is declared there
> directly; `toDynamic`/`toDynamicAsync` is only needed when the resolve itself is conditional.

```ts
container
  .bind(Audit)
  .toResolved((logger, plugins) => new Audit(logger, plugins), [
    inject(Logger, { name: "file" }),
    injectAll(Plugin),
  ] as const);
```

## `BindingIdentifier` — precise unbinding

The builder has `.id()` to obtain a `BindingIdentifier` — used to unbind one specific binding out of several:

```ts
const consoleId = container.bind(Logger).whenNamed("console").to(ConsoleLogger).singleton().id();
const fileId = container.bind(Logger).whenNamed("file").to(FileLogger).singleton().id();

// Unbind only the "console" binding — "file" is untouched
container.unbind(consoleId);
```

> **`.id()` and chain order.** `.id()` may be called at any step after `to*()`. The builder can keep chaining afterwards
> — `.id()` is not terminal. The id is **stable for the whole chain**: a value taken right after `to*()` still points at
> the binding once its scope and hooks are set.

## Lifecycle hooks

`onActivation` runs after `@postConstruct()`, before the instance is cached into its scope. It must return an instance.

`onDeactivation` is only available on `singleton` and `toConstantValue` — enforced at compile time by the builder type.
The container-level `container.onDeactivation(token, handler)` takes any token, so the type gate does not apply there;
`validate()` reports an `UnreachableLifecycleHookError` when such a hook is keyed to a token whose every binding is
`scoped` or `transient` (nothing it could ever deactivate). An `onActivation` hook stays valid on any scope.

```ts
container
  .bind(Database)
  .to(PostgresDatabase)
  .singleton()
  .onActivation(async (ctx, db) => {
    await db.connect();
    return db; // must return — may return a Proxy wrapper
  })
  .onDeactivation(async (db) => {
    await db.disconnect();
  });
```

**The full lifecycle order.** One resolve has two phases — _construction_ (everything inside the single `new`) and
_activation_ (everything the resolver does once the instance exists). Deactivation runs the activation steps in reverse.

```
Construction (within one `new`, usually wrapped in `runWithContainer` when the class has @inject accessors):
  1. Accessor initializers — property injection via @inject accessor, run as the class's fields initialize
  2. Constructor body — already sees every injected accessor field

Activation (after the instance exists):
  3. @postConstruct() — LifecycleManager (sync/async depending on the resolve path)
  4. per-binding onActivation()
  5. container-level onActivation()

Deactivation (reverse):
  1. container-level onDeactivation()
  2. per-binding onDeactivation()
  3. @preDestroy() — every method, in declaration order; across an inheritance chain, the derived class's before the base's
```

Step by step:

1. **Accessor initializers** — an `@inject accessor` is a field, so its initializer runs when the class's fields are
   initialized: at the start of the constructor for a base class, right after `super()` for a derived one. Every
   injected field is set before the constructor body runs.
2. **Constructor body** — the class's own code, which can already read the injected accessor fields.
3. **`@postConstruct()`** — the resolver calls it once `new` has returned; across an inheritance chain, the base class's
   methods run before the derived class's.
4. **Per-binding `onActivation`** — may wrap the instance; its return value is what proceeds.
5. **Container-level `onActivation`** — runs last, over the value returned by step 4.

In short: accessor initializers (`@inject accessor`) → constructor body → `@postConstruct()` → `onActivation`. The
constructor body and `@postConstruct()` both run after the accessor fields have been injected.

> **`@postConstruct` / `@preDestroy` require a string-named method.** The lifecycle reader keys methods by name, so a
> symbol-keyed method cannot be found again. Decorating one throws `SymbolKeyedLifecycleError` at the declaration,
> rather than a misleading metadata error at resolve.

**Type inference — no annotation needed:**

```ts
// InversifyJS v8 — must be annotated by hand
.onActivation((_ctx: ResolutionContext, db: Database) => { ... })

// This library — the compiler infers from the binding
container.bind(Database).to(PostgresDatabase)
  .singleton()
  .onActivation((ctx, db) => {
  //                   ^? PostgresDatabase
    return db;
  });
```

## Full examples

```ts
// Class binding
container.bind(Logger).to(ConsoleLogger).singleton();

// Self binding
container.bind(ConsoleLogger).toSelf().singleton();

// Constant value
container.bind(Config).toConstantValue({
  port: 3000,
  env: "production",
  dbUrl: "postgres://localhost/app",
  redisUrl: "redis://localhost",
});

// Named bindings
container.bind(Logger).whenNamed("console").to(ConsoleLogger).singleton();
container.bind(Logger).whenNamed("file").to(FileLogger).singleton();

// Tagged binding
container.bind(Engine).whenTagged(Fuel.of("petrol")).to(PetrolEngine);
container.bind(Engine).whenTagged(Fuel.of("electric")).to(ElectricEngine);
container.bind(Engine).whenTagged(Fuel.of("petrol")).whenTagged(Size.of("v8")).to(TurboV8);

// Sync dynamic factory
container
  .bind(App)
  .toDynamic((ctx) => new App(ctx.resolve(Logger), ctx.resolve(Config)))
  .singleton();

// Async factory
container
  .bind(Database)
  .toDynamicAsync(async (ctx) => {
    const config = ctx.resolve(Config);
    const db = new PostgresDatabase(config.dbUrl);
    await db.connect();
    return db;
  })
  .singleton()
  .onDeactivation(async (db) => db.disconnect());

// Resolved sync — explicit deps
container
  .bind(Mailer)
  .toResolved((logger, config) => new Mailer(logger, config), [Logger, Config] as const)
  .singleton();

// Resolved async — explicit deps
container
  .bind(Cache)
  .toResolvedAsync(async (config) => Cache.connect(config.redisUrl), [Config] as const)
  .singleton()
  .onDeactivation(async (cache) => cache.close());

// Alias
container.bind(AbstractLogger).toAlias(Logger);
container.bind(AbstractAuditLogger).whenNamed("audit").toAlias(Logger);
```

## Slots and last-wins — the exact definition

**Mental model.** A **slot** is the set of conditions a binding declares about the request that may select it — its
name, its tags, or nothing at all. The registry uses the slot as the key for last-wins: two bindings of one token with
the same slot replace each other; different slots coexist. At resolve time a slot matches when the request states every
condition the slot declares. The slot with no conditions is the **default slot**.

### Vocabulary

> **Normative — `BindingSlot`.** A binding slot is the key that uniquely identifies a slot in the registry — the
> binding's **criterion set**, computed from its constraints:
>
> ```
> BindingSlot = {
>   tags: ReadonlyArray<BindingTag>, // from EVERY whenTagged(), plus slotName.of(n) when the binding declares whenNamed(n)
>   name: string | undefined,        // derived view: the reserved criterion's value, undefined when the slot carries none
>   keyMask: TagKeyMask,             // derived view: one bit per tag key present, for a cheap first test
> }
> ```
>
> `tags` holds each criterion once, one per key, and is compared as a set: order carries no meaning.

> **Normative — a name is a criterion.** The package exports a reserved tag key `slotName: TagKey<string>`, and a name
> is a criterion of that key. One selection model covers names and tags alike:
>
> - `whenNamed(n)` ≡ `whenTagged(slotName.of(n))` — the binding-side sugar. `whenParentTagged(slotName.of(n))` is the
>   token-free ancestor spelling; `whenParentNamed(T, n)` adds the token check
>   ([Advanced Constraints](constraints.md#advanced-constraints)).
> - `{ name: n }` in `ResolveOptions` / `InjectOptions` ≡ `{ tag: slotName.of(n) }` — the request-side sugar
>   ([`ResolveOptions`](foundation-types.md#resolveoptions)).
> - **One criterion per key, reserved key included:** a slot carries at most one criterion of any key — re-declaring a
>   key, through either verb, replaces that key's criterion. `whenNamed` inherits this rule rather than adding one.
> - What reserves the key is its **identity**, not its display name. Diagnostics render its criterion as `name:<value>`,
>   never `tag:…`, and `BindingSlot.name` is the derived view of it that `ResolutionFrame.slot`
>   ([`ConstraintContext`](foundation-types.md#constraintcontext)) and the `when*Named` constraints read.
> - A tag key types its values; the reserved key is shared, so a name's values are typed by the **token** instead:
>   `Token<Value, Names>` narrows `whenNamed`, every request-side `name`, and the `name` of `whenParentNamed(T, name)` /
>   `whenAnyAncestorNamed(T, name)` to the `Names` of the token they name ([Token API](token.md#token-api)). A name is a
>   label on one token's slots; a label shared across tokens is what a tag key is for.

> **Normative — slot equality.** Two binding slots are **equal** when their criterion sets are equal by the identity of
> each criterion (order does not matter). Because criteria are interned
> ([`ResolveOptions`](foundation-types.md#resolveoptions)), identity here gives exactly the result of `Object.is` on
> `[key, value]`. The `default` slot is the empty criterion set.

> **Normative — predicate-only `when()`.** A binding carrying only `.when(predicate)` (with no `whenNamed`/`whenTagged`)
> **does not take part in slot last-wins** — several bindings for one token can coexist with the same binding slot. If ≥
> 2 candidates remain after runtime filtering, `resolve`/`resolveAsync` throws `AmbiguousBindingError` (not
> `InternalError` — this is a user error, not an internal one).

> **Normative — collection members: `many()`.** A binding declared with `.many()` is a **collection member**: several
> members of one token coexist on the default slot, `resolveAll`/`resolveAllAsync` return every member (plus whatever
> else the request matches, in registration order), and `resolve`/`resolveAsync` **never select** a member — a token
> holding only members has nothing a single resolve can select, so `resolve` throws `NoMatchingBindingError` (the token
> is bound, just not on a slot the request can pick) and `resolveOptional` answers `undefined`. A member takes no part
> in slot last-wins: it neither displaces nor is displaced by the ordinary default binding or by other members. A member
> keeps the default slot — `many()` on a named or tagged binding, or `whenNamed`/`whenTagged` on a member, throws
> `ManyBindingSlotError` — and may carry `when()` predicates, which apply as for any candidate. This is the intended
> form of a strategy set; a predicate that always passes is not.

**Candidate:** a binding whose slot matches the request's criterion set and that passes every `when(ctx)` predicate.

### The matching rule

> **Normative — filtering `ResolveOptions` → slot.** One rule, whatever mix of spellings the request uses:
>
> - **The request's criterion set** is the union of `tags`, `tag`, and — when `name` is present — `slotName.of(name)`
>   ([`ResolveOptions`](foundation-types.md#resolveoptions)); `tags: []` counts as no criteria.
> - **A slot matches when every criterion it declares is in the request's criterion set** — a superset filter. Adding a
>   criterion to the request makes it match **more**, not fewer.
> - **The default slot is the one exception:** a slot with no criteria matches only a request with no criteria — a
>   request carrying any criterion never falls back to the default slot.
> - A slot that declares no name states **no condition on the name** — it does not demand the request drop its `name`,
>   exactly as a slot without `size` does not demand the request drop `size`.
> - Criteria compare by identity — `Object.is` on `[key, value]` — and predicates are evaluated **after** slot matching.

| Request                          | Slot `{}` | Slot `{name:x}` | Slot `{fuel:petrol}` | Slot `{name:x, fuel:petrol}` |
| -------------------------------- | --------- | --------------- | -------------------- | ---------------------------- |
| `{name:"x"}`                     | ✗         | ✓               | ✗                    | ✗                            |
| `{tags:[fuel:petrol]}`           | ✗         | ✗               | ✓                    | ✗                            |
| `{name:"x", tags:[fuel:petrol]}` | ✗         | ✓               | ✓                    | ✓                            |

### No criteria — `resolve` and `resolveAll` differ

> **Normative.** When `ResolveOptions` is absent or carries no criteria, `resolve`/`resolveOptional` read that as a
> request for **the default slot exactly**, so a binding with only a named/tagged slot is **not** selected. `resolveAll`
> instead takes **every** binding of the token, named and tagged included.

### Case table

| #   | Case                                                                      | Resulting slot         | `resolve` with no hint                                                       | `resolveAll` / hint                                                                               |
| --- | ------------------------------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 1   | `bind(T).to*(A)`                                                          | Default                | A                                                                            | `[A]`                                                                                             |
| 2   | `bind(T).to*(A)` then `bind(T).to*(B)`                                    | Default last-wins      | B                                                                            | `[B]`                                                                                             |
| 3   | `whenNamed("a").to*(A)` then `whenNamed("a").to*(B)`                      | Named "a" last-wins    | `NoMatchingBindingError` (no default)                                        | Hint `{name:"a"}` → B                                                                             |
| 4   | `whenNamed("a").to*(A)` and `whenNamed("b").to*(B)`                       | Named "a" + Named "b"  | `NoMatchingBindingError`                                                     | `resolveAll` → `[A, B]`                                                                           |
| 5   | `to*(A)` and `whenNamed("x").to*(B)`                                      | Default + Named "x"    | A                                                                            | `resolveAll` → `[A, B]`                                                                           |
| 6   | `rebind(T).to*(C)`                                                        | Explicit reset         | C                                                                            | `[C]`                                                                                             |
| 7   | Tags `{fuel:petrol, size:v8}.to*(A)` then the same tags `.to*(B)`         | Tag-set last-wins      | Hint `{tags:[...]}` → B                                                      | Hint → B                                                                                          |
| 8   | Tags `{fuel:petrol}.to*(A)` and tags `{fuel:petrol, size:v8}.to*(B)`      | Two different tag-sets | Hint `{tags:[fuel]}` → A; hint `{tags:[fuel, size]}` → **B** (more specific) | `resolveAll` → `[A, B]`                                                                           |
| 9   | Tags `{fuel:petrol}.to*(A)` and named `"x"` + tags `{fuel:petrol}.to*(B)` | Tagged + named-tagged  | `NoMatchingBindingError` (no default)                                        | Hint `{tags:[fuel]}` → A; hint `{name:"x", tags:[fuel]}` → **B** (A matches too; B more specific) |

**Row 3 — `resolve` with no hint** throws `NoMatchingBindingError` (not `TokenNotBoundError`) because the token has
bindings but no slot matches the empty hint. The message lists the available slots — `"Available slots: [name:a]"` here,
since B replaced A on the one slot both declared; row 4 lists `[name:a, name:b]`.

> **Normative — a displaced binding still deactivates.** When a plain last-wins `bind()` (rows 2, 3, 7) displaces a
> binding that owns a deactivation — a `singleton` or `toConstantValue` with an `onDeactivation` hook — the displaced
> binding leaves the selection but its instance is still torn down — at `dispose()`, or earlier when its id is unbound
> ([`unbind` and singleton deactivation](container.md#unbind-and-singleton-deactivation)) or the module that registered
> it is unloaded ([`unload` and cached singletons](container.md#unload-and-cached-singletons)). Last-wins changes which
> binding answers a resolve; it does not silently drop a lifecycle the container still owes. The same holds when the
> displacing bind runs inside a module load — `Module.create` setup or a declared module alike — and unloading that
> module does not restore the displaced binding: it stays out of the selection, and its deactivation stays owed.

**Rows 8 and 9 — a more detailed hint satisfies more bindings, hence the need for a tie-breaker.** A binding's criteria
are **its conditions**, not a filter that must match exactly. In row 8 the hint `{fuel:petrol}` rules out B because B
also demands `size`; the hint `{fuel:petrol, size:v8}` satisfies **both** A and B, because A's only condition is stated
too. Row 9 is the same shape with the name as the extra criterion: `{name:"x", tags:[fuel]}` satisfies A — whose only
condition, `fuel`, is stated — and B, which states both; B wins on specificity. This is a dispatch model (like routing,
media queries, overload resolution), and every dispatch model needs a tie-breaker.

### The more-specific rule

> **Normative — for `resolve` / `resolveOptional`.** Applied in order, stopping at the first step that picks exactly one
> candidate:
>
> 1. **Predicate:** if exactly one candidate carries a `when()` predicate, that candidate wins. With two or more, this
>    step decides nothing and the next one weighs every candidate.
> 2. **Criterion count:** the candidate declaring **more criteria than every other candidate** wins — it matches more of
>    what was asked. A name, when the slot carries one, counts as one criterion like any other.
> 3. If no step decides, throw `AmbiguousBindingError`.

So row 8 resolves in both directions: `{fuel}` → A, `{fuel, size}` → B. An equal criterion count is still ambiguous —
`{fuel:petrol}.to*(A)` and `{size:v8}.to*(B)` with a hint carrying both tags leaves neither more specific.

`resolveAll` does **not** apply this rule: it returns every matching candidate, and specificity only comes into play
when exactly one must be chosen.

> **Normative — the more-specific rule is container-local.** Selection answers from the nearest container whose
> candidates match before consulting the parent. A child's matching subset slot (say, tag-only) therefore answers a
> `{name, tags}` request even when the parent declares a slot carrying more of its criteria — locality outranks
> specificity across the chain.

> **`has(token)` and slot semantics.** `container.has(token)` returns `true` if the token has **any binding at all**
> (even if only named/tagged slots, with no default). `container.resolve(token)` with no hint can still throw
> `NoMatchingBindingError` even when `has(token)` is `true`. See [Introspection](container.md#introspection) for the
> right way to use `has` + `hasOwn`.

> **Compatibility — the one-rule model vs. the earlier two-rule model.** Under the earlier model, a request's `name` was
> compared by equality (absence included), which excluded every slot that declared no name. Under the one-rule model
> above, those slots match whenever their criteria are covered (the `{fuel:petrol}` cell in the last row of the matrix),
> and specificity decides as usual (case-table row 9). Outcomes differ **only** for a request carrying both a `name` and
> at least one tag. A request carrying only a name, only tags, or nothing resolves exactly as before.

## The `Binding` discriminated union

`Binding<Value>` is the committed form of a binding: what the registry holds, what selection matches against, and what
`BindingSnapshot` and `GraphNode` are the public views of. What a binding declares is `readonly`; a handful of fields
the engine keeps for itself — `inFlight`, `frame`, `rootContext`, `activationStamp`, `registrationOrder`, and the cached
singleton `instance` — are writable, owned by the engine, and never set by callers.

**`BindingSlot` — used for slot-aware last-wins and for resolution matching.** `BindingSlot` carries `tags` — the
binding's whole criterion set, the reserved name criterion included (`[]` = the default slot) — `name`, the derived view
of the reserved criterion (`undefined` when the slot carries none), and `keyMask`, the derived bitmask of its tag keys.
Order inside `tags` does not affect equality.

Two `BindingSlot`s are equal when their criterion sets are equal by the identity of each criterion (order does not
matter) — equivalent to `Object.is` on `[key, value]` thanks to interning; `name`, being derived, needs no separate
comparison.

**Fields common to every binding (except where noted).** Every committed binding carries: `identifier`, `token`, `slot`,
`isMany` (whether it is a `many()` collection member), and an optional `predicate` coming from `.when()`.
`whenNamed`/`whenTagged` do **not** become part of the predicate — they go into the slot. When a binding declares both a
slot and a predicate, both must pass: the slot matches first at constant cost, the predicate is checked afterwards at
runtime.

**Seven binding kinds**, each adding its own fields on top of the common part above:

| `kind`           | From                      | Own fields                                                                                           |
| ---------------- | ------------------------- | ---------------------------------------------------------------------------------------------------- |
| `class`          | `.to(Class)`, `.toSelf()` | `target` (constructor), `scope`, `activationHook?`, `deactivationHook?`                              |
| `dynamic`        | `.toDynamic()`            | sync `factory`, `scope`, both hooks                                                                  |
| `dynamic-async`  | `.toDynamicAsync()`       | `factory` returning a `Promise`, `scope`, both hooks                                                 |
| `resolved`       | `.toResolved()`           | sync `factory`, normalized `deps`, `scope`, both hooks                                               |
| `resolved-async` | `.toResolvedAsync()`      | `factory` returning a `Promise`, `deps`, `scope`, both hooks                                         |
| `constant`       | `.toConstantValue()`      | `value`; `scope` is always `"singleton"`, with no choice                                             |
| `alias`          | `.toAlias()`              | `target` token; `scope` is always `"transient"` (a placeholder), no lifecycle — it is only a pointer |

The hook fields are named `activationHook`/`deactivationHook` rather than after the fluent `onActivation()`/
`onDeactivation()` steps, because the chain that registers them is the binding object itself and a field cannot share a
name with a method. A deactivation hook only means anything when `scope` is `"singleton"`; that is enforced by the
builder's type, not at runtime. For `constant`, `onActivation` runs the first time the value is resolved and its result
is what gets cached.

> **Exact shape:** `src/core/binding.ts` — `Binding` and its seven member interfaces.

> **Normative — normalization at commit time.**
>
> - `toSelf()` → a `ClassBinding` with `target === token` (the token must be a `Constructor<Value>`).
> - The deps array of `toResolved`/`toResolvedAsync`: each element is a `Token | Constructor | InjectionDescriptor`. At
>   commit time, a plain `Token`/`Constructor` is normalized into an `InjectionDescriptor` with
>   `{ token, optional: false, multi: false }`. The `deps` in `ResolvedBinding`/`ResolvedAsyncBinding` is always
>   `readonly InjectionDescriptor[]` — never a raw token.
> - A `BindingIdentifier` is generated **once per fluent chain**, unique across the whole container hierarchy (not
>   merely within one container), from a process-wide monotonic counter. A later scope or hook (`.singleton()`,
>   `.onActivation()`, …) does **not** mint a new id — the id taken from `.id()` at any step of the chain stays valid
>   until the chain ends.

**The scope of an alias is its target's — at resolve time.** An `AliasBinding` does carry a `scope` field, but it is
always `"transient"`: a placeholder declared only so the engine reads `scope` as a plain field on every kind rather than
testing for the one that would lack it. An alias is followed to its terminal binding before anything is built, so the
resolved value's scope and lifecycle are the terminal binding's, never the alias's own `"transient"`. If the chain ends
at another `AliasBinding`, keep following. If there is a cycle → `CircularDependencyError`.
