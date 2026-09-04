# DI Library — Design Specification

> Inspired by InversifyJS v8 · Built from scratch · Zero `reflect-metadata` · TC39 Decorators Stage 3 · TypeScript 5.9+
> · ESM-only

---

## How to read this document

This is a **design specification and behavioural contract**, not a tutorial and not an architecture guide. It states
what `@codefast/di` guarantees to callers and what an implementer must satisfy. Each section follows the same order:
what a concept is, the rule that governs it, a short example, the edge cases and case tables, and — last — the rationale
or compatibility note.

Three kinds of callout recur:

- **Normative** — the contract. An implementer must satisfy it; a caller may rely on it.
- **Exact shape** — a pointer to the source file that declares a type. The source is authoritative for field-level
  shape; this document is authoritative for behaviour.
- **Rationale / Compatibility** — explanation of _why_ a rule exists, or how it relates to InversifyJS. These notes
  never add a rule.

---

## Background and goals

### What InversifyJS v8 solved

InversifyJS v8 (released March 2026) brought substantial improvements over v7: a consistent naming convention
(unqualified = sync, `Async` suffix = async), `Provider` dropped in favour of `Factory`, better type safety for
`ServiceIdentifier`, and a move to ESM-only. Those are the right calls, and this library learns from them.

### What InversifyJS v8 still has not solved

**`reflect-metadata` is still there.** The v8 getting-started guide still requires:

```
npm install inversify reflect-metadata
```

And it still needs `experimentalDecorators: true` plus `emitDecoratorMetadata: true` in tsconfig — two legacy flags tied
to a TC39 proposal that has since been replaced. v8 has no plan to drop `reflect-metadata`, because its entire decorator
layer still depends on `emitDecoratorMetadata` to read constructor types.

**`ServiceIdentifier` is still not a branded type.** v8 narrowed it from `string | symbol | Function` down to
`string | symbol | AbstractNewable<T> | Newable<T>` (the `T` spelling is kept verbatim from Inversify's own API) — a
small improvement over v7 — but it is still not branded. `container.get<WrongType>('my-service')` still compiles and
still returns the wrong type.

### Goals of this library

- **Zero `reflect-metadata`** — no polyfill, no legacy flags
- **TC39 Decorator Stage 3** — `Symbol.metadata` stable (TypeScript 5.9+), no `experimentalDecorators`
- **Branded `Token<Value>`** — fully type-safe, never leaks `any`
- **ESM-only** — like InversifyJS v8, no dual build
- **Learn the good API from v8** — lifecycle hooks, fluent builder, naming convention — but rebuild it from scratch
- **No backward compatibility** with any version of InversifyJS

---

## Design principles

<a id="naming"></a>

### Naming — no `I` or `T` prefix

A name states what a thing is or does; a prefix or suffix that carries no information is dropped.

| Avoid                   | Use                              | Why                                                  |
| ----------------------- | -------------------------------- | ---------------------------------------------------- |
| `IContainer`            | `Container`                      | An interface describes behaviour; the name is enough |
| `ILogger`               | `Logger`                         | —                                                    |
| `ContainerImpl`         | `DefaultContainer`               | `Impl` is lazy naming                                |
| `T` (a lone type param) | `Value`, `Target`, `Deps`, `Ctx` | A name that says what it holds                       |
| `TResult`               | `Result`                         | —                                                    |

This rule applies to the library's own code and to every illustrative snippet in this SPEC. Where the document quotes an
external API verbatim (Inversify's `Newable<T>`, for instance), the original spelling may stay so the comparison does
not distort the source.

### Naming — sync/async convention

One consistent rule: **unqualified = sync, `Async` suffix = async**. There is never a `Sync` suffix.

```ts
container.resolve(Logger); // sync
container.resolveAsync(Database); // async — an async factory is in the chain
container.load(AppModule); // sync
container.loadAsync(LazyModule); // async — the module has async setup
```

### Token replaces ServiceIdentifier

The sole identifier is `Token<Value>` — a **branded type** (a type carrying a phantom, non-constructible marker so that
only the library's factory can produce one). A class may also be used directly as a token; `Token<Value>` is the
preferred form when an abstraction is needed.

> **Compatibility.** InversifyJS uses `string | symbol | Newable<T>` as the service identifier — flexible, but not
> type-safe: `container.get<WrongType>('my-service')` compiles and returns the wrong type. A branded token makes that
> call impossible.

<a id="chain-order"></a>

### Fluent chain — the canonical, invariant order

A binding is declared as a chain of four steps. Only the first is required, and the order never changes.

```
bind(token)
  .to*(…)       // 1. Strategy — required
  .when*(…)     // 2. Constraint — optional, always after to*
  .scope()      // 3. Scope — optional, always after when*
  .on*(…)       // 4. Lifecycle — optional, always after scope
```

> **Normative.** The compiler enforces this order through each step's return type:
>
> - `when*` **cannot** be called before `to*()` — `bind(token)` returns only a `BindToBuilder`, which has no `when*`.
> - `when*` **cannot** be called after `scope()` — scope builders do not expose `when*`.
> - Lifecycle hooks **cannot** be called before `scope()` — `BindingBuilder` (the result of `to*()`) does not expose
>   `on*`.

> **Rationale — why lifecycle comes after scope.** If `onActivation` could be called before scope, it would be unclear
> whether activation fires for a transient instance (every resolve) or a singleton (only the first). Forcing scope to be
> declared first removes the ambiguity entirely — a reader knows immediately which context the activation runs in.

### Other principles

- **Zero magic.** Decorators are optional. An entire app can be written with explicit bindings and not a single
  decorator.
- **Last-wins / override.** `bind()` applies **slot-aware last-wins at registration time**. Same slot (`default`, same
  `whenNamed`, same `whenTagged`) means the new binding replaces the old one; a different slot appends, which is what
  serves `resolveAll`. The exact definition is in [Slots and last-wins](#slot-matching); worked examples are in
  [Full examples](#binding-examples).
- **Eager commit.** `to*()` commits the binding into the registry immediately — exactly **once** for the whole chain.
  Every read after that (`has`, `resolve*`, `validate`, `inspect`) sees the latest state, even if the chain is abandoned
  midway.
- **Async must be explicit.** `resolve()` on an async binding throws `AsyncResolutionError` with a clear message. It
  never silently returns a `Promise`.
- **Lifecycle is first-class.** `onActivation` and `onDeactivation` per binding — learned from InversifyJS v8 — but more
  type-safe. The container also has container-level hooks that apply to every binding of a token.
- **Singleton async creation is serialized.** Concurrent `resolveAsync` calls for the same singleton token share one
  in-flight Promise — the factory runs once, `onActivation` runs once. See [Resolution](#resolution).

---

## Foundation types

This section declares every foundation type used throughout the spec. The implementer must export all of them from
`@codefast/di`. The table below is a map; each type is specified in its own subsection.

| Type                                        | What it is                                             | Where you meet it                                   |
| ------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------- |
| `BindingScope`                              | The three instance lifetimes                           | `.singleton()` / `.transient()` / `.scoped()`       |
| `BindingIdentifier`                         | An opaque id for one committed binding                 | `.id()`, `unbind(id)`                               |
| `Constructor`                               | A concrete `new`-able class                            | `.to(Class)`, `.toSelf()`, deps arrays              |
| `ActivationHandler` / `DeactivationHandler` | The two per-instance lifecycle callbacks               | `.onActivation()`, `.onDeactivation()`              |
| `ResolveOptions`                            | The hint a single resolve carries (name and/or tags)   | `resolve(token, options)`, `inject(token, options)` |
| `ResolutionContext`                         | What a dynamic factory receives                        | `.toDynamic((ctx) => …)`                            |
| `ConstraintContext`                         | Where the current resolve sits in the dependency graph | `.when((ctx) => …)`, advanced constraints           |
| `TokenValue`                                | Extracts `Value` from a token or constructor           | Type-level helper                                   |

### `BindingScope`

```ts
type BindingScope = "singleton" | "transient" | "scoped";
```

### `BindingIdentifier`

An opaque branded type — it cannot be constructed by hand from outside the library. It is only obtained through `.id()`
on a builder.

```ts
declare const BINDING_ID_BRAND: unique symbol;
type BindingIdentifier = string & { readonly [BINDING_ID_BRAND]: true };
```

### `Constructor`

```ts
/**
 * Concrete constructor — can be called with `new`.
 * An abstract class does not satisfy this type; use Token<Value> for abstract classes.
 */
type Constructor<Value = unknown> = new (...args: unknown[]) => Value;
```

> **Abstract classes.** TypeScript does not allow `new AbstractClass()`, so an abstract class does not satisfy
> `Constructor<Value>`. To bind an abstract class as a token, use `Token<Value>` instead.
> `container.bind(AbstractLogger)` with `AbstractLogger` as an abstract class is a TypeScript error.

<a id="lifecycle-handlers"></a>

### `ActivationHandler` and `DeactivationHandler`

An **activation handler** is the last step before an instance is handed out and cached: it can initialise or wrap the
instance. A **deactivation handler** is the teardown step when an instance leaves its scope.

> **Normative — activation.**
>
> - The handler receives the resolution context and the instance.
> - It runs after `@postConstruct()` and before the instance is cached into its scope. By then the instance has been
>   fully `new`-ed, accessor initializers included.
> - It **must** return an instance — either the same one, or a Proxy wrapping it.
> - If it returns a `Promise`, the resolve must be `resolveAsync()`.

> **Normative — deactivation.**
>
> - The handler receives the instance and runs when the instance is evicted from its scope. Its return value is ignored.
> - It is called only for the scopes in the table below.

| Scope / kind      | Deactivation runs?                                                            | When                                       |
| ----------------- | ----------------------------------------------------------------------------- | ------------------------------------------ |
| `singleton`       | Yes                                                                           | Container disposed, or the binding unbound |
| `toConstantValue` | Yes — treated as a singleton, **even if never resolved**                      | `dispose()` / `unbind()`                   |
| `transient`       | No — each instance is an orphan once handed to the caller                     | —                                          |
| `scoped`          | No — a child container only clears its cache, it does not notify the instance | —                                          |

> **Why a constant deactivates without a resolve.** A singleton only exists after the first resolve, so if it is never
> resolved there is nothing to deactivate. A constant is the opposite — the value is supplied by the caller at bind
> time, so it exists from that moment. If the constant was resolved through `onActivation`, the hook receives the value
> **after activation**, not the original.

> **Exact shape:** `src/core/types.ts` — `ActivationHandler`, `DeactivationHandler`.

<a id="resolve-options"></a>

### `ResolveOptions`

**Mental model.** A single resolve may carry a hint made of _criteria_. A criterion is one `[key, value]` pair minted
from a declared tag key. A **name is also a criterion** — one of the reserved key `slotName` — so `name` and `tags` feed
one selection model, not two.

**Fields.** All three are optional:

| Field  | Meaning                                                                                                                                                                | Relationship to the others                  |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `name` | Selects a binding declared with `whenNamed(name)`                                                                                                                      | Sugar for the criterion `slotName.of(name)` |
| `tag`  | Exactly one criterion                                                                                                                                                  | Equivalent to a single element of `tags`    |
| `tags` | An array of criteria, read as a **superset filter**: it matches a binding whose _every_ declared tag is in this array — not "the binding must carry all of these tags" | Several criteria require `tags`             |

The full matching rule is in [Slots and last-wins](#slot-matching). `InjectOptions` accepts both `tag` and `tags` and
folds `tag` into `tags`, so an `InjectionDescriptor` only ever carries one spelling.

> **Exact shape:** `src/core/types.ts` — `ResolveOptions`.

#### Tag keys and criteria

> **Normative — a criterion is minted by `TagKey.of()`, and only by it.**
>
> - A tag key is declared with `tag<Value>(name)`.
> - `key.of(value)` returns an **interned** `BindingTag`: the same value always yields the **same object**. (_Interning_
>   means keeping one canonical object per distinct value and returning it on every request.)
> - `BindingTag` is branded, so it cannot be constructed by hand.
> - `key.peek(value)` reads the intern cache without minting. The engine folds a request's `name` through it, so a name
>   no binding ever declared is never retained.

```ts
const Region = tag<"eu" | "us">("region");
container.bind(Storage).to(S3).whenTagged(Region.of("eu"));
container.resolve(Storage, { tag: Region.of("eu") });
```

#### Tag value comparison

> **Normative — tag values compare by `Object.is`, on the fast path too.** The intern cache must keep `-0` separate from
> `+0` to preserve this rule. `NaN` folds to one criterion, because `Object.is(NaN, NaN)` is `true`.

Interning is _how_ the rule is implemented: since each value has exactly one criterion, comparing criteria by
**identity** gives the same answer as `Object.is` on the value.

> **Implementer note.** An index keyed by **criterion** is exact and needs no recheck. An index keyed by _value_ instead
> answers with **SameValueZero**, treating `-0` and `+0` as one key — which contradicts `Object.is` (see
> [Slots and last-wins](#slot-matching), [Advanced Constraints](#advanced-constraints)) — and forces the fast path to
> recheck with the matcher.

#### Passing `tag` and `tags` together

> **Normative.** The request carries the **union** of both sources — equivalent to `tags: [tag, ...tags]`, and
> `InjectOptions` folds it into exactly that shape.

Such a request asks for two or more tags, so it cannot use the single-tag index; it takes the full selection path.

#### Key sets as a bitmask (implementation note)

The **subset rule is normative**: a slot only matches when the request carries **every** key the slot declares
([Slots and last-wins](#slot-matching)). The bitmask is not normative — it is how the implementation rejects early. It
ORs the keys into a word and rejects with `(requestMask & slotMask) !== slotMask` before reading any criterion. Bits
wrap every 32 keys, so two keys can share a bit: that is a **false positive** which identity eliminates afterwards,
never a false negative.

### `ResolutionContext`

`ctx` is what a dynamic factory (`toDynamic` / `toDynamicAsync`) receives. It is **not** a full container — it opens up
exactly the ability to resolve within the current context.

- Six methods, each taking a token plus the same optional hint: `resolve`, `resolveAsync`, `resolveOptional`,
  `resolveOptionalAsync`, `resolveAll`, `resolveAllAsync`.
- `resolveAll` throws `AsyncResolutionError` if any matching binding is async, and returns `[]` when nothing matches.
- `graph` holds the `ConstraintContext` — the dependency-graph context used inside a `when()` predicate. An ordinary
  resolve never needs it.

> **Exact shape:** `src/core/types.ts` — `ResolutionContext`.

### `ConstraintContext`

**Mental model.** `ConstraintContext` answers "where am I in the current resolve?" — which token is being built, which
binding asked for it, and every binding above that. A `when()` predicate reads it to decide whether a candidate applies.

**Five fields:**

| Field                   | Contents                                                                                                  |
| ----------------------- | --------------------------------------------------------------------------------------------------------- |
| `resolutionPath`        | The token names along the current resolve path, readonly — a chain of labels                              |
| `resolutionStack`       | The full `ResolutionFrame`s along the construction chain — enough metadata to detect a captive dependency |
| `parent`                | The frame directly above, `undefined` at the root                                                         |
| `ancestors`             | Every frame above `parent`                                                                                |
| `currentResolveOptions` | The hint passed into the current resolve, `undefined` if there is none                                    |

**A `ResolutionFrame`** holds: `tokenName` (for display in error messages), `scope`, `bindingId`, `kind`, and the
**`slot`** of the binding matched for that frame. A slot is the binding's criterion set: `tags` (every criterion, the
reserved name criterion included) plus `name`, the derived view of the reserved criterion (`undefined` if the binding
declares no `whenNamed()`) — see [Slots and last-wins](#slot-matching).

> **Normative.** A frame's `slot` reflects the **constraint registered at bind time**, not the hint passed at resolve
> time. The advanced constraints in [Advanced Constraints](#advanced-constraints) read exactly this field.

**`BindingKind`** is one of seven values: `class`, `dynamic`, `dynamic-async`, `resolved`, `resolved-async`, `constant`,
`alias`.

> **Exact shape:** `src/core/types.ts` — `ConstraintContext`, `ResolutionFrame`, `BindingKind`.

#### `resolutionStack` ordering and its views

> **Normative.**
>
> - `resolutionStack` is a readonly snapshot of the entire resolution path **above** the current token — it does not
>   include the token being resolved.
> - Order: from the root (index 0) to the direct parent (last index).
> - `parent` and `ancestors` are computed views over the same data, and the implementer must keep them consistent:
>
> ```ts
> ctx.parent === ctx.resolutionStack.at(-1); // nearest frame, undefined at the root
> ctx.ancestors === ctx.resolutionStack.slice(0, -1); // everything but the nearest frame
> ```

Example — the resolve chain `App → Database → Logger` (root `App`, direct parent `Database`, currently resolving
`Logger`):

```
resolutionStack = [App_frame, Database_frame]  // index 0 = root
parent          = Database_frame               // resolutionStack.at(-1)
ancestors       = [App_frame]                  // resolutionStack.slice(0, -1)
```

When resolving `App` at the root (nothing injects `App`):

```
resolutionStack = []
parent          = undefined
ancestors       = []
```

> **`resolutionPath` vs `resolutionStack`.** `resolutionPath` is an array of `tokenName` strings, enough to display in
> an error message (`"App → Database → Logger"`). `resolutionStack` holds full `ResolutionFrame`s (scope, bindingId,
> slot) — used by advanced constraints and by validate. The implementer must maintain both structures in parallel inside
> the resolver: the string path (cheaper) and the frame stack (richer).

### `TokenValue`

A helper type that extracts `Value` from `Token<Value>` or `Constructor<Value>`:

```ts
type TokenValue<Type> = Type extends Token<infer Value> ? Value : Type extends Constructor<infer Value> ? Value : never;
```

---

## Token API

### Creating a token

`token()` is a factory function — consistent with how modern TypeScript reads (much like `signal()`, `ref()`).

```ts
import { token } from "@codefast/di";

// Basic
const Logger = token<LoggerService>("Logger");
const Database = token<DatabaseService>("Database");
const Config = token<AppConfig>("Config");

// Token for a primitive
const Port = token<number>("Port");
const Env = token<"development" | "production">("Env");

// Organised by domain
export const Tokens = {
  Logger: token<LoggerService>("Logger"),
  Database: token<DatabaseService>("Database"),
  Config: token<AppConfig>("Config"),
} as const;
```

### Type signature

```ts
// Branded type — cannot be forged with an ordinary object literal
declare const TOKEN_BRAND: unique symbol;

interface Token<Value> {
  readonly name: string;
  readonly [TOKEN_BRAND]: Value; // unique symbol, not exported
}
```

```ts
// Resolve always returns the right type — the wrong token cannot be passed
const logger = container.resolve(Logger); // ^? LoggerService
const port = container.resolve(Port); // ^? number
```

### A class as a token

A class can be used directly as a token when no abstraction is needed:

```ts
// No separate token needed — the class is the token
container.bind(ConsoleLogger).toSelf();
const logger = container.resolve(ConsoleLogger); // ^? ConsoleLogger

// When injecting through an interface → use a Token
container.bind(Logger).to(ConsoleLogger);
const logger = container.resolve(Logger); // ^? LoggerService
```

> **`toSelf()` without `@injectable()`.** If `ConsoleLogger` has no `@injectable()` and its constructor takes deps, the
> container throws `MissingMetadataError` — it does not assume zero deps. To use `toSelf()` with constructor deps but no
> decorator, use `toDynamic()` or `toResolved()` instead.

---

## Binding API

**Mental model.** A binding tells the container how to produce a value for a token. It has four parts, declared in the
fixed chain order `to*() → when*() → scope() → on*()`: a **strategy** (class, constant, factory, alias), optional
**selection criteria** (a slot and/or a predicate), a **scope** (how long an instance lives), and optional **lifecycle
hooks**.

### Binding kinds

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
> can carry constraints and `.id()` — the only builder with no type parameter, because an alias produces no value of its
> own.

### Scope

**Mental model.** Scope decides how many instances a binding produces and who owns them: one per container hierarchy
(`singleton`), one per child container (`scoped`), or one per resolve (`transient`).

```ts
.singleton()  // ←→ .inSingletonScope()  — created once, reused forever
.transient()  // ←→ .inTransientScope()  — every resolve = new (the default if unspecified)
.scoped()     // ←→ .inRequestScope()   — once per child container
```

> **Normative.**
>
> - Scope **always** comes after `when*` in the chain ([Fluent chain](#chain-order)).
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
[`validate`](#validate) for the limits of `validate()`.

> **Rationale — why `transient` is the default.** It is the safest row of the matrix — a `transient` consumer may depend
> on any scope without a captive dependency, so the default can never introduce a violation on its own. It is also a
> fixed constant inlined at each `to*()`, never a container-level setting: `bind(X).to(Y)` means the same thing in every
> file, which keeps with the no-hidden-behaviour principle. Reach for `singleton()` or `scoped()` explicitly the moment
> a binding needs shared state or a lifecycle.

### `toConstantValue` — semantics

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

<a id="constraints"></a>

### Constraints — `when*`

**Mental model.** A constraint decides _when_ a binding is eligible for a request. There are two mechanisms:

- **Slot criteria** — `whenNamed`, `whenTagged`, `whenDefault`. Static, declared at bind time, matched at constant cost
  against the request's hint. They define the binding's _slot_ ([Slots and last-wins](#slot-matching)).
- **Predicates** — `when(ctx => boolean)`. Dynamic, evaluated at resolve time against the `ConstraintContext`, after
  slot matching.

`when*` comes immediately after `to*()`, before scope. A binding may carry one or several combined constraints.

```ts
// Named binding
container.bind(Logger).to(ConsoleLogger).whenNamed("console").singleton();
container.bind(Logger).to(FileLogger).whenNamed("file").singleton();

// Tagged binding — a criterion can only be minted from a tag key, never by hand
const Fuel = tag<"petrol" | "electric">("fuel");
const Size = tag<"v8" | "v6">("size");

container.bind(Engine).to(PetrolEngine).whenTagged(Fuel.of("petrol"));
container.bind(Engine).to(ElectricEngine).whenTagged(Fuel.of("electric"));

// Several tags on one binding — a specialisation of the petrol binding above. The hint
// {fuel:petrol} gets PetrolEngine; the hint {fuel:petrol, size:v8} gets TurboV8 because it
// declares more tags, i.e. it is more specific.
container.bind(Engine).to(TurboV8).whenTagged(Fuel.of("petrol")).whenTagged(Size.of("v8"));

// Explicit default slot — matches when there is no name and no tag
container.bind(Logger).to(NoopLogger).whenDefault();

// Custom predicate — uses ConstraintContext
container
  .bind(Logger)
  .to(VerboseLogger)
  .when((ctx) => ctx.ancestors.some((f) => f.tokenName === "DebugModule"));

// Combining a name with a custom predicate on one binding
container
  .bind(Logger)
  .to(AuditLogger)
  .whenNamed("audit")
  .when((ctx) => ctx.parent?.scope === "singleton");
```

**Slot criteria — the three verbs:**

> **`whenTagged` takes a criterion, not a loose pair.** A criterion can only be minted by `TagKey.of()`, so the key must
> be declared up front with `tag<Value>(name)` — that is what makes identity comparison enough to stand in for
> `Object.is` ([`ResolveOptions`](#resolve-options)). The key name is still a `string`, so use a namespace prefix to
> avoid collisions: `tag("mylib:fuel")`, `tag("@scope/pkg:env")`.

> **`whenNamed` is sugar.** A name is a criterion of the reserved key `slotName` — `whenNamed("console")` ≡
> `whenTagged(slotName.of("console"))`, single-valued per slot ([Slots and last-wins](#slot-matching)).

> **Explicit `whenDefault()` vs declaring no constraint.** A binding with no `when*` at all also matches the default
> slot. `whenDefault()` is useful when you want to document the intent explicitly, or to combine it with a custom
> `when()`.

**Predicates — `when()`:**

> **Normative — rules for a `when()` predicate.**
>
> - The predicate is called every time a resolve needs to pick a candidate (never cached).
> - The predicate **must be pure and deterministic** — no side effects, no I/O. Breaking this rule is undefined
>   behaviour and may cause an infinite loop or incorrect caching.
> - The predicate **must not** call `ctx.resolve*()` — that causes circular resolution.

> **Performance note.** For a `transient` binding on a hot path (resolved on every request), a complex `when()`
> predicate is called a great many times. Prefer `whenNamed` / `whenTagged` (O(1) lookup) on hot paths; keep custom
> `when()` predicates for configuration-time bindings.

**Resolving with a hint:**

```ts
const Env = tag<"production" | "staging">("env");

// Named
container.resolve(Logger, { name: "file" });

// One tag — `tag` is shorthand for exactly one criterion
container.resolve(Engine, { tag: Fuel.of("electric") });

// Several tags — the request must name every tag the binding declares
container.resolve(Engine, { tags: [Fuel.of("petrol"), Size.of("v8")] });

// Name and tag combined
container.resolve(Logger, { name: "audit", tag: Env.of("production") });
```

### `toAlias` — hint forwarding

An alias points at another token. When the alias is resolved, the hint is **forwarded** to the target token's
resolution.

```ts
container.bind(Logger).to(ConsoleLogger).whenNamed("console").singleton();
container.bind(Logger).to(FileLogger).whenNamed("file").singleton();
container.bind(AbstractLogger).toAlias(Logger);

// The hint is forwarded to the Logger resolution
const fileLogger = container.resolve(AbstractLogger, { name: "file" });
// → FileLogger (the hint { name: "file" } is forwarded to Logger)
```

If the alias carries its own constraint (`whenNamed("audit")`), that constraint is used to **select the alias binding**;
it does not affect what gets forwarded:

```ts
container.bind(AbstractAuditLogger).toAlias(Logger).whenNamed("audit");
// This binding is only selected when resolving AbstractAuditLogger with the hint { name: "audit" }
// Once selected, the hint { name: "audit" } is forwarded to the Logger resolution
const logger = container.resolve(AbstractAuditLogger, { name: "audit" });
// → the Logger binding matching { name: "audit" } (if any), otherwise the default
```

> **An alias has no scope of its own.** The scope is decided by the target binding. An alias is only a pointer — it
> caches no instance.

### Builder type interfaces

**Mental model.** Each step in the chain returns a different builder, and it is precisely that builder's method set
which enforces the order in [Fluent chain](#chain-order). Reading the table row by row tells you what you may call next.

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
- **The shared part** — the four constraint methods (`when`, `whenNamed`, `whenTagged`, `whenDefault`) plus `id()` — is
  factored into a `SlotConstrainedBuilder` interface that the three concrete builders inherit. It never appears in the
  chain, and no call returns it.
- **`toConstantValue()`** has no scope step because a constant binding is always a singleton. Calling a lifecycle hook
  on it moves to a builder with only lifecycle and `id()` left — a one-way state: calling a hook locks the constraint
  part.
- **`toAlias()`** is the only builder **without a type parameter** — an alias produces no value, so there is nothing to
  infer.
- **`transient()` and `scoped()`** have no `onDeactivation` because those two scopes have no deactivation
  ([`ActivationHandler` and `DeactivationHandler`](#lifecycle-handlers)).

> **Exact shape:** `src/core/binding.ts` — `BindToBuilder`, `SlotConstrainedBuilder`, `BindingBuilder`,
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

### `toResolved` and `toResolvedAsync` — explicit deps

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

> **`toResolved`/`toResolvedAsync` and named/tagged deps.** They only support plain tokens, not named or tagged
> injection. When you need `{ name: "file" }` or `{ tags: [...] }`, use `toDynamic`/`toDynamicAsync` with
> `ctx.resolve(token, hint)`.

### `BindingIdentifier` — precise unbinding

The builder has `.id()` to obtain a `BindingIdentifier` — used to unbind one specific binding out of several:

```ts
const consoleId = container.bind(Logger).to(ConsoleLogger).whenNamed("console").singleton().id();
const fileId = container.bind(Logger).to(FileLogger).whenNamed("file").singleton().id();

// Unbind only the "console" binding — "file" is untouched
container.unbind(consoleId);
```

> **`.id()` and chain order.** `.id()` may be called at any step after `to*()`. The builder can keep chaining afterwards
> — `.id()` is not terminal. The id is **stable for the whole chain**: a value taken early still points at the right
> binding after the chain is refined.

### Lifecycle hooks

`onActivation` runs after `@postConstruct()`, before the instance is cached into its scope. It must return an instance.

`onDeactivation` is only available on `singleton` and `toConstantValue` — enforced at compile time by the builder type.

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
  1. Constructor body
  2. Accessor initializers — property injection via @inject accessor (`context.addInitializer`), same call frame as `new`, before `new` returns

Activation (after the instance exists):
  3. @postConstruct() — LifecycleManager (sync/async depending on the resolve path)
  4. per-binding onActivation()
  5. container-level onActivation()

Deactivation (reverse):
  1. container-level onDeactivation()
  2. per-binding onDeactivation()
  3. @preDestroy() — every method, in declaration order
```

Step by step:

1. **Constructor body** — the class's own code runs first.
2. **Accessor initializers** — `context.addInitializer` runs immediately after the constructor body, before the `new`
   expression returns, so every `@inject accessor` field is set before anything outside the class sees the instance.
3. **`@postConstruct()`** — the resolver calls it once `new` has returned; it can rely on the accessor fields.
4. **Per-binding `onActivation`** — may wrap the instance; its return value is what proceeds.
5. **Container-level `onActivation`** — runs last, over the value returned by step 4.

In short: constructor → accessor initializers (`@inject accessor`) → `@postConstruct()` → `onActivation`.
`@postConstruct()` always runs after the accessor fields have been injected.

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

<a id="binding-examples"></a>

### Full examples

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
container.bind(Logger).to(ConsoleLogger).whenNamed("console").singleton();
container.bind(Logger).to(FileLogger).whenNamed("file").singleton();

// Tagged binding
container.bind(Engine).to(PetrolEngine).whenTagged(Fuel.of("petrol"));
container.bind(Engine).to(ElectricEngine).whenTagged(Fuel.of("electric"));
container.bind(Engine).to(TurboV8).whenTagged(Fuel.of("petrol")).whenTagged(Size.of("v8"));

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
container.bind(AbstractAuditLogger).toAlias(Logger).whenNamed("audit");
```

<a id="slot-matching"></a>

### Slots and last-wins — the exact definition

**Mental model.** A **slot** is the set of conditions a binding declares about the request that may select it — its
name, its tags, or nothing at all. The registry uses the slot as the key for last-wins: two bindings of one token with
the same slot replace each other; different slots coexist. At resolve time a slot matches when the request states every
condition the slot declares. The slot with no conditions is the **default slot**.

#### Vocabulary

> **Normative — `BindingSlot`.** A binding slot is the key that uniquely identifies a slot in the registry — the
> binding's **criterion set**, computed from its constraints:
>
> ```
> BindingSlot = {
>   tags: ReadonlySet<BindingTag>, // from EVERY whenTagged(), plus slotName.of(n) when the binding declares whenNamed(n)
>   name: string | undefined,      // derived view: the reserved criterion's value, undefined when the slot carries none
> }
> ```

> **Normative — a name is a criterion.** The package exports a reserved tag key `slotName: TagKey<string>`, and a name
> is a criterion of that key. One selection model covers names and tags alike:
>
> - `whenNamed(n)` ≡ `whenTagged(slotName.of(n))` — the binding-side sugar; `whenParentNamed(n)` is likewise
>   `whenParentTagged(slotName.of(n))` ([Advanced Constraints](#advanced-constraints)).
> - `{ name: n }` in `ResolveOptions` / `InjectOptions` ≡ `{ tag: slotName.of(n) }` — the request-side sugar
>   ([`ResolveOptions`](#resolve-options)).
> - **One criterion per key, reserved key included:** a slot carries at most one criterion of any key — re-declaring a
>   key, through either verb, replaces that key's criterion. `whenNamed` inherits this rule rather than adding one.
> - What reserves the key is its **identity**, not its display name. Diagnostics render its criterion as `name:<value>`,
>   never `tag:…`, and `BindingSlot.name` is the derived view of it that `ResolutionFrame.slot`
>   ([`ConstraintContext`](#constraintcontext)) and the `when*Named` constraints read.

> **Normative — slot equality.** Two binding slots are **equal** when their criterion sets are equal by the identity of
> each criterion (order does not matter). Because criteria are interned ([`ResolveOptions`](#resolve-options)), identity
> here gives exactly the result of `Object.is` on `[key, value]`. The `default` slot is the empty criterion set.

> **Normative — predicate-only `when()`.** A binding carrying only `.when(predicate)` (with no `whenNamed`/`whenTagged`)
> **does not take part in slot last-wins** — several bindings for one token can coexist with the same binding slot. If ≥
> 2 candidates remain after runtime filtering, `resolve`/`resolveAsync` throws `AmbiguousBindingError` (not
> `InternalError` — this is a user error, not an internal one).

**Candidate:** a binding whose slot matches the request's criterion set and that passes every `when(ctx)` predicate.

#### The matching rule

> **Normative — filtering `ResolveOptions` → slot.** One rule, whatever mix of spellings the request uses:
>
> - **The request's criterion set** is the union of `tags`, `tag`, and — when `name` is present — `slotName.of(name)`
>   ([`ResolveOptions`](#resolve-options)); `tags: []` counts as no criteria.
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

#### No criteria — `resolve` and `resolveAll` differ

> **Normative.** When `ResolveOptions` is absent or carries no criteria, `resolve`/`resolveOptional` read that as a
> request for **the default slot exactly**, so a binding with only a named/tagged slot is **not** selected. `resolveAll`
> instead takes **every** binding of the token, named and tagged included.

#### Case table

| #   | Case                                                                      | Resulting slot         | `resolve` with no hint                                                       | `resolveAll` / hint                                                                               |
| --- | ------------------------------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 1   | `bind(T).to*(A)`                                                          | Default                | A                                                                            | `[A]`                                                                                             |
| 2   | `bind(T).to*(A)` then `bind(T).to*(B)`                                    | Default last-wins      | B                                                                            | `[B]`                                                                                             |
| 3   | `to*(A).whenNamed("a")` then `to*(B).whenNamed("a")`                      | Named "a" last-wins    | `NoMatchingBindingError` (no default)                                        | Hint `{name:"a"}` → B                                                                             |
| 4   | `to*(A).whenNamed("a")` and `to*(B).whenNamed("b")`                       | Named "a" + Named "b"  | `NoMatchingBindingError`                                                     | `resolveAll` → `[A, B]`                                                                           |
| 5   | `to*(A)` and `to*(B).whenNamed("x")`                                      | Default + Named "x"    | A                                                                            | `resolveAll` → `[A, B]`                                                                           |
| 6   | `rebind(T).to*(C)`                                                        | Explicit reset         | C                                                                            | `[C]`                                                                                             |
| 7   | Tags `{fuel:petrol, size:v8}.to*(A)` then the same tags `.to*(B)`         | Tag-set last-wins      | Hint `{tags:[...]}` → B                                                      | Hint → B                                                                                          |
| 8   | Tags `{fuel:petrol}.to*(A)` and tags `{fuel:petrol, size:v8}.to*(B)`      | Two different tag-sets | Hint `{tags:[fuel]}` → A; hint `{tags:[fuel, size]}` → **B** (more specific) | `resolveAll` → `[A, B]`                                                                           |
| 9   | Tags `{fuel:petrol}.to*(A)` and named `"x"` + tags `{fuel:petrol}.to*(B)` | Tagged + named-tagged  | `NoMatchingBindingError` (no default)                                        | Hint `{tags:[fuel]}` → A; hint `{name:"x", tags:[fuel]}` → **B** (A matches too; B more specific) |

**Row 3 — `resolve` with no hint** throws `NoMatchingBindingError` (not `TokenNotBoundError`) because the token has
bindings but no slot matches the empty hint. The message lists the available slots:
`"Available slots: [name:a, name:b]"`.

**Rows 8 and 9 — a more detailed hint satisfies more bindings, hence the need for a tie-breaker.** A binding's criteria
are **its conditions**, not a filter that must match exactly. In row 8 the hint `{fuel:petrol}` rules out B because B
also demands `size`; the hint `{fuel:petrol, size:v8}` satisfies **both** A and B, because A's only condition is stated
too. Row 9 is the same shape with the name as the extra criterion: `{name:"x", tags:[fuel]}` satisfies A — whose only
condition, `fuel`, is stated — and B, which states both; B wins on specificity. This is a dispatch model (like routing,
media queries, overload resolution), and every dispatch model needs a tie-breaker.

#### The more-specific rule

> **Normative — for `resolve` / `resolveOptional`.** Applied in order, stopping at the first step that picks exactly one
> candidate:
>
> 1. **Predicate:** if exactly one candidate carries a `when()` predicate, that candidate wins. Two or more is genuine
>    ambiguity.
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
> `NoMatchingBindingError` even when `has(token)` is `true`. See [Introspection](#introspection) for the right way to
> use `has` + `hasOwn`.

> **Compatibility — the one-rule model vs. the earlier two-rule model.** Under the earlier model, a request's `name` was
> compared by equality (absence included), which excluded every slot that declared no name. Under the one-rule model
> above, those slots match whenever their criteria are covered (the `{fuel:petrol}` cell in the last row of the matrix),
> and specificity decides as usual (case-table row 9). Outcomes differ **only** for a request carrying both a `name` and
> at least one tag. A request carrying only a name, only tags, or nothing resolves exactly as before.

### The `Binding` discriminated union — internal data model

`Binding<Value>` is the union type representing a binding committed into the registry. The implementer must define it in
`binding.ts`. Fields are `readonly` to library users.

> **Internal refinement.** A fluent chain **may refine in place** exactly those fields no registry index depends on
> (`scope`, `onActivation`, `onDeactivation`) on the very object already registered; changing `slot`/`predicate`
> requires re-indexing, so those still build a new object. See `ARCHITECTURE.md`.

**`BindingSlot` — used for slot-aware last-wins and for resolution matching.** `BindingSlot` carries `tags` — the
binding's whole criterion set, the reserved name criterion included (`[]` = the default slot) — and `name`, the derived
view of the reserved criterion (`undefined` when the slot carries none). Order inside `tags` does not affect equality.

Two `BindingSlot`s are equal when their criterion sets are equal by the identity of each criterion (order does not
matter) — equivalent to `Object.is` on `[key, value]` thanks to interning; `name`, being derived, needs no separate
comparison. The implementer should provide a `bindingSlotEquals(left: BindingSlot, right: BindingSlot): boolean` helper.

**Fields common to every binding (except where noted).** Every committed binding carries: `id`, `token`, `slot`, and an
optional `predicate` coming from `.when()`. `whenNamed`/`whenTagged` do **not** become part of the predicate — they go
into the slot. When a binding declares both a slot and a predicate, both must pass: the slot matches first at constant
cost, the predicate is checked afterwards at runtime.

**Seven binding kinds**, each adding its own fields on top of the common part above:

| `kind`           | From                      | Own fields                                                          |
| ---------------- | ------------------------- | ------------------------------------------------------------------- |
| `class`          | `.to(Class)`, `.toSelf()` | `target` (constructor), `scope`, `onActivation?`, `onDeactivation?` |
| `dynamic`        | `.toDynamic()`            | sync `factory`, `scope`, both hooks                                 |
| `dynamic-async`  | `.toDynamicAsync()`       | `factory` returning a `Promise`, `scope`, both hooks                |
| `resolved`       | `.toResolved()`           | sync `factory`, normalized `deps`, `scope`, both hooks              |
| `resolved-async` | `.toResolvedAsync()`      | `factory` returning a `Promise`, `deps`, `scope`, both hooks        |
| `constant`       | `.toConstantValue()`      | `value`; `scope` is always `"singleton"`, with no choice            |
| `alias`          | `.toAlias()`              | `target` token. No `scope`, no lifecycle — it is only a pointer     |

`onDeactivation` only means anything when `scope` is `"singleton"`; that is enforced by the builder's type, not at
runtime. For `constant`, `onActivation` runs the first time the value is resolved and its result is what gets cached.

> **Exact shape:** `src/core/binding.ts` — `Binding` and its seven member interfaces.

> **Normative — normalization at commit time.**
>
> - `toSelf()` → a `ClassBinding` with `target === token` (the token must be a `Constructor<Value>`).
> - The deps array of `toResolved`/`toResolvedAsync`: each element is a `Token | Constructor | InjectionDescriptor`. At
>   commit time, a plain `Token`/`Constructor` is normalized into an `InjectionDescriptor` with
>   `{ token, optional: false, multi: false }`. The `deps` in `ResolvedBinding`/`ResolvedAsyncBinding` is always
>   `readonly InjectionDescriptor[]` — never a raw token.
> - A `BindingIdentifier` is generated **once per fluent chain**, unique across the whole container hierarchy (not
>   merely within one container). Use `crypto.randomUUID()` or a monotonic counter. Later refinement (`.singleton()`,
>   `.whenNamed()`, …) does **not** mint a new id — the id taken from `.id()` at any step of the chain stays valid until
>   the chain ends.

**Reaching the scope of an `AliasBinding` — at resolve time.** `AliasBinding` has no `scope` field. When the scope is
needed (to build a `ResolutionFrame`, for instance), the resolver must follow the alias chain to the final binding and
take the scope from there. If the chain ends at another `AliasBinding`, keep following. If there is a cycle →
`CircularDependencyError`.

---

## Container API

**Mental model.** A container holds bindings, resolves tokens into values, owns the instances it caches, and can spawn
child containers that see its bindings. Everything a container does falls into nine groups, listed in
[The Container interface](#the-container-interface).

<a id="container-create"></a>

### Creating a container

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

### Resolution

**Mental model.** Six resolve methods cover three questions — one value, an optional value, or every value — each in a
sync and an async form. Sync never returns a `Promise`; if anything on the path is async, the sync form throws.

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

#### `resolveOptionalAsync` error semantics

> **Normative.**
>
> - The token has no binding → returns `undefined` (no `TokenNotBoundError`).
> - The token has a binding but the async binding throws at runtime (a failed DB connect, say) → **re-throw** that
>   error, do not turn it into `undefined`.
> - The token has a binding but nothing matches the hint → returns `undefined` (no `NoMatchingBindingError`).

#### `resolveAll` + `ResolveOptions` — filter semantics

```ts
container.bind(Logger).to(ConsoleLogger); // default slot
container.bind(Logger).to(FileLogger).whenNamed("file"); // named "file" slot

container.resolveAll(Logger); // → [ConsoleLogger, FileLogger]
container.resolveAll(Logger, { name: "file" }); // → [FileLogger]
container.resolveAll(Logger, { name: "x" }); // → [] (empty array, no throw)
```

> **Normative.** `resolveAll` / `resolveAllAsync` **never throw `TokenNotBoundError`** — they return `[]` when nothing
> matches.

#### Async contamination — the propagation rule

**Mental model.** Async is contagious along the dependency path: one async link makes every consumer above it async.

> **Normative.** If token `A` depends on token `B`, and `B` has a `toDynamicAsync`/`toResolvedAsync` factory or an async
> `@postConstruct()`, then `A` is async too. Async contamination spreads along the entire dependency path.
> `container.resolve(A)` in that case throws `AsyncResolutionError`. The container detects the contamination at resolve
> time and the message names which token in the chain is the async source.

```
AsyncResolutionError: Token 'App' requires async resolution because 'Database'
in its dependency chain has an async factory. Use container.resolveAsync(App).
  asyncSourceToken: "Database"
```

#### Singleton async creation — serialized

**Mental model.** Two callers racing for the same async singleton get the same Promise, so the factory runs once.

> **Normative.** Concurrent `resolveAsync(Token)` calls for the same singleton token **share one in-flight Promise**.
> The implementation must guarantee:
>
> 1. When the factory starts running, the Promise is stored in the in-flight map.
> 2. The next concurrent call receives that same Promise — no new instance is created.
> 3. When the Promise settles (resolved or rejected), the in-flight map entry is cleared.
> 4. If the factory rejected, the next resolve creates a new Promise (retry).

```ts
// Both get the same instance — the factory runs only once
const [a, b] = await Promise.all([container.resolveAsync(Database), container.resolveAsync(Database)]);
// a === b: true
```

### Managing bindings

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

// Rebind — remove every own binding of the token, then bind again
// If the token has no own binding yet → throws RebindUnboundTokenError
container.rebind(Logger).to(FileLogger).singleton();
```

#### `rebind` semantics

**Mental model.** `rebind` means "replace a binding that already exists in _this_ container". It is an atomic
unbind-then-bind, never a way to override a parent.

> **Normative.** `rebind(token)` only affects the **own** bindings of the current container. If the token is only bound
> at the parent (not at the child), `child.rebind(token)` throws `RebindUnboundTokenError`. After the unbind, `to*()`
> commits immediately — there is no gap between the unbind and the bind.

> **`rebind` and the parent chain.** To override a parent binding from a child container (the common test pattern), use
> `bind()` at the child — resolution prefers the child over the parent:
>
> ```ts
> const testContainer = container.createChild();
> // Right — use bind() to create the override at the child
> testContainer.bind(Database).toConstantValue(mockDatabase);
> // No rebind() needed, because the child has no own binding yet
> ```

#### `unbind` and singleton deactivation

> **Normative.** When `unbind(token)` or `unbind(bindingId)` is called:
>
> - The binding is removed from the registry immediately (no gap).
> - If the binding is a singleton and already cached, `onDeactivation` and `@preDestroy()` **are called synchronously**
>   when the handlers are sync.
> - If a handler is async, `unbindAsync()` must be used — a sync `unbind()` on a binding with async deactivation throws
>   `AsyncDeactivationError`.

#### `rebind` and async deactivation

> **Normative.** Deactivation of the old singleton follows the same rule as `unbind`:
>
> - If the old binding has **no** async `onDeactivation` (or no `onDeactivation` at all): a sync `rebind()` is safe.
> - If the old binding **does** have an async `onDeactivation`: a sync `rebind()` throws `AsyncDeactivationError` — the
>   same behaviour as a sync `unbind()`.

There is no `rebindAsync()` (see [Not adopted from v8](#not-adopted-from-v8)), so the required workaround is:

```ts
// When the old binding has an async onDeactivation:
await container.unbindAsync(Logger); // deactivate the old singleton
container.bind(Logger).to(FileLogger).singleton(); // create the new binding
```

> **Rationale — why there is no `rebindAsync()`.** `rebind` is a test/reconfiguration utility — it always happens when
> there is no traffic. If the binding has async deactivation, splitting it into two explicit steps (`unbindAsync` +
> `bind`) states the intent more clearly.

### Module management

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

#### Reference counting for shared deps

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

#### `Container.fromModules` dedup behaviour

```ts
// ModuleA and ModuleB both import(LoggerModule)
const container = Container.fromModules(ModuleA, ModuleB);
// LoggerModule.setup() runs only once — deduped by object identity
// LoggerModule ref-count = 2 (from ModuleA and ModuleB)
```

> **Normative.** Dedup is based on **object identity**, not on `name`. Two different module objects with the same `name`
> are two different modules — no dedup. `name` exists only for error messages and logging.

#### `unload` and cached singletons

> **Normative.** When `unload(module)` or `unloadAsync(module)` is called and the ref-count reaches 0:
>
> - The bindings are removed from the registry.
> - Cached singleton instances belonging to that module are **deactivated** — `onDeactivation` and `@preDestroy()` are
>   called.
> - A sync `unload()` is only safe if every deactivation handler is sync. If any is async, `unloadAsync()` must be used.

### Container-level activation hooks

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
> `@preDestroy()`. The full diagram is in [Lifecycle hooks](#lifecycle-hooks).

### Child containers

**Mental model.** A child sees every parent binding and may add or override its own. Instances the child creates for its
own bindings belong to the child; parent singletons stay with the parent.

```ts
// A child inherits every parent binding (resolution walks up when the child has none)
// Parent singletons are not re-created at the child
const requestContainer = container.createChild();
requestContainer.bind(RequestId).toConstantValue(crypto.randomUUID());

const handler = requestContainer.resolve(RequestHandler);

// Dispose: deactivate every singleton DEFINED at the child (the parent is untouched)
await requestContainer.dispose();

// `await using` — TC39 Explicit Resource Management (TypeScript 5.2+)
{
  await using scoped = container.createChild();
  scoped.bind(RequestId).toConstantValue(crypto.randomUUID());
  const handler = scoped.resolve(RequestHandler);
  // scoped[Symbol.asyncDispose]() is called automatically at the end of the block
}
```

> **Normative — `[Symbol.dispose](): never`.** The container implements `Symbol.dispose` but always throws
> `SyncDisposalNotSupportedError`, because `onDeactivation` may be async. Use `await using` (which calls
> `Symbol.asyncDispose`) rather than `using` (which calls `Symbol.dispose`).

**Scoped bindings — the request scope pattern.** A `scoped` binding is a singleton within one child container. The
pattern for request scope in a web framework:

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

### Container state lifecycle

> **Normative.** A container has an `isDisposed` state, exposed as a readonly property. After `dispose()` is called:
>
> - Every mutation (`bind`, `unbind`, `rebind`, `load`, `unload`) throws `DisposedContainerError`.
> - Resolution operations (`resolve*`, `has*`, `inspect`) throw `DisposedContainerError` too.
> - `dispose()` is idempotent: calling it again is a no-op — no throw, no double-deactivation.

```ts
const container = Container.create();
container.bind(Logger).to(ConsoleLogger);

await container.dispose();

container.resolve(Logger); // throws DisposedContainerError
container.bind(Logger).toSelf(); // throws DisposedContainerError

// Idempotent: calling dispose() again is a no-op
await container.dispose(); // safe — no throw, no double-deactivation
```

### `initializeAsync` — warm up singletons

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

<a id="validate"></a>

### `validate` — detecting captive dependencies

```ts
container.validate();
```

Walks the dependency graph and throws `ScopeViolationError` for any violation of the scope matrix in [Scope](#scope).

> **Normative — analysis scope.** `validate()` can only statically analyse bindings whose deps are declared explicitly:
>
> | Binding kind                     | Can `validate()` analyse it?         |
> | -------------------------------- | ------------------------------------ |
> | `to(Class)` with `@injectable`   | ✅ Fully analysed                    |
> | `toSelf()` with `@injectable`    | ✅ Fully analysed                    |
> | `toResolved(factory, deps)`      | ✅ Analyses the deps array           |
> | `toResolvedAsync(factory, deps)` | ✅ Analyses the deps array           |
> | `toAlias(target)`                | ✅ Traced to the target — transitive |
> | `toDynamic(ctx => ...)`          | ❌ Opaque — skipped                  |
> | `toDynamicAsync(ctx => ...)`     | ❌ Opaque — skipped                  |
> | `toConstantValue(value)`         | ✅ No deps — always OK               |

**Alias chains.** When tracing an alias (`toAlias(target)`), `validate()` follows the chain to the final binding. If a
`singleton` consumer aliases to a `scoped` target, that is a scope violation. `validate()` checks transitively — not
only direct dependencies.

**Dynamic factories.** `toDynamic` and `toDynamicAsync` are **opaque** to `validate()` — no false positives, no false
negatives. A scope violation inside a dynamic factory is only detected at runtime.

Call `validate()` after loading every module, before serving the first request.

### Introspection

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

// The dependency graph as JSON
const graph = container.generateDependencyGraph({ includeParent: false }); // ContainerGraphJson
```

#### `has(token)` vs `has(token, hint)`

**Mental model.** `has(token)` asks "is this token bound at all?". `has(token, hint)` asks "would this hint find a
binding?". Neither asks "will a hintless resolve succeed" — that needs a default slot.

```ts
container.bind(Logger).to(FileLogger).whenNamed("file");
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

#### The `ContainerSnapshot` interface

`ContainerSnapshot` carries: `ownBindings` (every binding at this container, excluding the parent),
`cachedSingletonCount` (how many singletons are cached here, also excluding the parent), `hasParent`, and `isDisposed`.

Each `BindingSnapshot` carries: `tokenName`, `kind`, `scope`, `slot`, and `id`.

> **Exact shape:** `src/introspection/inspector.ts` — `ContainerSnapshot`, `BindingSnapshot`.

#### The `ContainerGraphJson` interface

`ContainerGraphJson` has three parts: `nodes`, `edges`, and `includesParent` (whether parent bindings were folded in —
it depends on `GraphOptions`).

Each **`GraphNode`** carries `id` (the `BindingIdentifier` itself, or `"unbound:<tokenKey>"` for a placeholder node),
`tokenName`, `tokenKey` (the token's own identity — two tokens sharing a name still differ by key; stable within one
process), `kind` (or `"unbound"`), `scope` (or `"unbound"`), and `fromParent`.

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
  edge carrying `optional: true`. That keeps "optional but absent" distinct from "not a dependency".
- **A required dep that is not bound is skipped** — that is `validate()`'s job, not the graph's.
- **`injectAll` fans out to every binding** of the token, each edge carrying its `slotName`.
- **Edge targets are filtered by resolution's own slot rules** ([`validate`](#validate)): a request that names nothing
  will not connect to a named binding it could never have resolved.
- **Predicates (`when...`) are not evaluated** — a predicate needs a real resolve context, so the graph keeps every
  candidate that has one.
- **With `includeParent: true`**, a binding at the current container shadows a binding for the same token at the parent,
  exactly as resolution order walks up; an edge from the child connects directly to the parent binding that satisfies
  it.

### The Container interface

Put together, a container exposes nine groups:

| Group                 | Members                                                                                               |
| --------------------- | ----------------------------------------------------------------------------------------------------- |
| State                 | `isDisposed`                                                                                          |
| Binding               | `bind`, `unbind`, `unbindAsync`, `unbindAll`, `unbindAllAsync`, `rebind`                              |
| Module                | `load`, `loadAsync`, `unload`, `unloadAsync`, `loadAutoRegistered`                                    |
| Container-level hooks | `onActivation`, `onDeactivation`                                                                      |
| Resolution            | `resolve`, `resolveAsync`, `resolveOptional`, `resolveOptionalAsync`, `resolveAll`, `resolveAllAsync` |
| Child                 | `createChild`                                                                                         |
| Disposal              | `dispose`, `[Symbol.asyncDispose]`, `[Symbol.dispose]` (always throws)                                |
| Initialise & check    | `initializeAsync`, `validate`                                                                         |
| Introspection         | `has`, `hasOwn`, `lookupBindings`, `inspect`, `generateDependencyGraph`                               |

At the static level there are three: `create(options?)`, `fromModules(...)`, `fromModulesAsync(...)`. `ContainerOptions`
currently has only `metadataReader` — defaulting to the decorator reader, and inherited by children.

> **Exact shape:** `src/container/container.ts` — `Container`, `ContainerOptions`, `ContainerStatic`.

---

## Decorator layer

**Mental model.** Decorators only _record metadata_ — which tokens a class needs, which methods are lifecycle hooks. The
container reads that metadata through a swappable port and does the actual work. Decorators are syntactic sugar; the
core container does not depend on them.

They use **TC39 Decorator Stage 3** and `Symbol.metadata`. Neither `experimentalDecorators: true` nor `reflect-metadata`
is needed.

### Usage

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
  constructor(private plugins: Plugin[]) {}
}
```

### Named / tagged / multi inject

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

// injectAll — inject every matching binding as an array, with an optional named filter
@injectable([injectAll(Plugin), injectAll(Logger, { name: "audit" })])
class Runner {
  constructor(
    private plugins: Plugin[],
    private auditLoggers: LoggerService[],
  ) {}
}
```

**Type signatures.** All three take a token plus the same optional `InjectOptions`, and return an `InjectionDescriptor`:
`inject` for a required dependency, `optional` returning `undefined` when there is no binding, `injectAll` collecting
every matching binding into an array.

- `InjectOptions` has three fields: `name`, `tag` (shorthand for one criterion, folded into `tags` when the descriptor
  is built — see [`ResolveOptions`](#resolve-options)), and `tags`.
- `InjectionDescriptor` carries: `token`, `optional`, `multi` (true when created by `injectAll`), `name?`, `tags?`. It
  comes with the type guard `isInjectionDescriptor(value)`.

> **Exact shape:** `src/injection/descriptor.ts` — `injectAll`, `optional`, `isInjectionDescriptor`,
> `InjectionDescriptor`, `InjectOptions`; `src/decorators/inject.ts` — `inject`.

#### `InjectableDependency` — one element of the deps array

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

> **Normative — normalization at metadata-read time.** The resolver normalizes the whole `InjectableDependency[]` into
> `InjectionDescriptor[]` before resolving:
>
> - `Token<Value>` → `{ token, optional: false, multi: false, name: undefined, tags: undefined }`
> - `Constructor<Value>` → `{ token, optional: false, multi: false, name: undefined, tags: undefined }`
> - `InjectionDescriptor<Value>` → left as-is

`InjectableDependency` is exported from `@codefast/di` (see [Public API](#public-api)).

#### `InjectableOptions` and the full signature

`InjectableOptions` has two fields: `autoRegister` (the registry a class registers itself into; leave it out and it does
not self-register — see [Auto-registration](#auto-registration)) and `scope` (the scope used when self-registering,
ignored without `autoRegister`, defaulting to `"transient"`). It is exported from `@codefast/di`.

`injectable(deps?, options?)` returns a class decorator; `deps` is a `readonly InjectableDependency[]` and `options` is
an `InjectableOptions`.

### Inheritance — explicit, no magic

> **Normative.** Every dep must be declared explicitly — there is no implicit inheritance injection.

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

<a id="metadata-reader"></a>

### MetadataReader — the port interface

**Mental model.** The container never touches `Symbol.metadata` itself. It asks a `MetadataReader` three questions about
a class — constructor deps, lifecycle methods, accessor fields — and a test can answer those questions with a fake.

The port has three methods:

| Method                           | Answers                                                                                                                      | Required? |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | :-------: |
| `getConstructorMetadata(target)` | The constructor's dependencies: a list of `ParamMetadata`, each with `index`, `token`, `optional`, `multi`, `name?`, `tags?` |    Yes    |
| `getLifecycleMetadata(target)`   | Two lists of method names, `postConstruct` and `preDestroy`, called in the order they appear in the class (top-down)         |    Yes    |
| `getAccessorMetadata(target)`    | The list of `@inject accessor` fields, each with `key` and `descriptor`                                                      | Optional  |

If a reader omits `getAccessorMetadata`, no class ever gets a container context opened for it, so every accessor
injection throws `MissingContainerContextError` ([Property injection](#accessor-injection)).

> **Exact shape:** `src/metadata/metadata-types.ts` — `MetadataReader`, `ConstructorMetadata`, `ParamMetadata`,
> `LifecycleMetadata`.

#### Installing your own reader

> **Normative.** The resolver is **handed** its reader when it is constructed, which happens inside the container's
> constructor. The only source resolution is guaranteed to read is therefore `ContainerOptions.metadataReader`
> ([Creating a container](#container-create)). This reader outranks any `MetadataReaderToken` binding, and children
> inherit it (a child calls the parent's `#getMetadataReader()` again when building its own resolver).

```ts
import { Container } from "@codefast/di";

const container = Container.create({ metadataReader: customReader });
```

#### `MetadataReaderToken` — the binding, and its limits

```ts
import { MetadataReaderToken } from "@codefast/di";

const root = Container.create();
root.bind(MetadataReaderToken).toConstantValue(customReader);
const app = root.createChild(); // app's resolver is built after the binding exists → it sees the reader
```

Binding the token **on the very container you are using** is invisible to every path: the constructor already ran before
the binding existed, so the resolver keeps the default reader and an undecorated class throws `MissingMetadataError`.

> **Normative — one container, one reader.** The reader is fixed when the container's resolver is built; `validate()`,
> `inspect()`, `generateDependencyGraph()` and `unbind*` all answer using that same reader. Introspection cannot
> disagree with resolution.

`MetadataReaderToken` has type `Token<MetadataReader>` and is exported from `@codefast/di`.

#### `SymbolMetadataReader` — reading metadata

The default implementation reads straight from `Symbol.metadata` — there is no WeakMap mirror. Because `Symbol.metadata`
is not yet defined natively on every runtime (current Node.js returns `undefined`), the codebase normalizes it once at
module load: `METADATA_SYMBOL = Symbol.metadata ?? Symbol.for("Symbol.metadata")`. Babel and esbuild use the same
pattern when transforming decorators, which keeps the symbol consistent. Once a runtime has a native `Symbol.metadata`,
`??` picks the native symbol.

The list of `@inject accessor` fields is obtained through `getAccessorMetadata(target)`.
`getConstructorMetadata(target)` only describes the constructor's dependencies; it does not stand in for accessor
fields.

```ts
getConstructorMetadata(target: Constructor): ConstructorMetadata | undefined {
  const own = Object.getOwnPropertyDescriptor(target, METADATA_SYMBOL);
  if (own === undefined) return undefined;
  const meta = own.value;
  if (!meta || typeof meta !== "object" || !Object.hasOwn(meta, INJECTABLE_KEY)) {
    return undefined;
  }
  return meta[INJECTABLE_KEY] as ConstructorMetadata;
}
```

> **Normative — no leaking of parent metadata.** If a child extends a parent but has no `@injectable()`,
> `getConstructorMetadata` returns `undefined` and the container throws `MissingMetadataError`. The parent class's
> metadata is never silently leaked.

<a id="accessor-injection"></a>

### Property injection through the `accessor` field decorator

**Mental model.** `@inject(Token) accessor field` fills a field from the container _during_ `new`, in the same call
frame — so the constructor has run, but nothing outside the class has seen the instance yet. It works because the
resolver opens a "current container" context around the `new` and the field's initializer reads it.

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

#### The mechanism — initialization order

`@inject(token)` on an `accessor` writes the token into `Symbol.metadata` through `context.metadata`. When the container
resolves a class with `accessor` fields, it uses `context.addInitializer` to inject the value into each instance. The
order:

```
1. constructor() runs
2. accessor initializers run — the property-injected fields are set
3. @postConstruct() runs — it can read the injected fields
```

```ts
// The container handles property injection for you
const dash = container.resolve(Dashboard);
// dash.logger → LoggerService from the same container
// dash.db → DatabaseService from the same container
```

**Construction (TC39) and activation (container).** One resolve consists of (1) **construction** — the constructor body
then `addInitializer` (accessors are injected here, before `new` returns; see the
[decorators proposal](https://github.com/tc39/proposal-decorators)); and (2) **activation** — `@postConstruct()` then
`onActivation()`, called by the resolver/lifecycle after (1) has completed.

#### Outside a container context

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

#### How the container context is passed — a module-level active container

> **Normative.** TC39's `context.addInitializer` runs synchronously right after the constructor body, in the same call
> frame as `new`. The container exploits this with a **module-level active container variable**:
>
> - `runWithContainer(container, fn)` sets the active variable to the given container, runs `fn`, then restores the
>   previous value in a `finally` block — so it is correct even when the constructor throws, and nested calls (A builds
>   B builds C) restore in the right order.
> - `getActiveContainer()` reads the currently active container, returning `undefined` when no context is open.

> **Exact shape:** `src/ambient/active-container.ts`.

**The resolver uses `runWithContainer` when it `new`s a class:**

```ts
// resolver.ts — when instantiating a ClassBinding, or a class using @inject accessors
const instance = runWithContainer(this.container, () => new target(...constructorArgs));
```

**The `inject()` accessor decorator uses `getActiveContainer` in the initializer.** In its accessor-decorator role, the
implementation of `inject()` does three things:

1. It throws if `context.static` is `true`.
2. It writes `{ key, descriptor }` into `Symbol.metadata` through `context.metadata` so `MetadataReader` can read it
   back.
3. It installs an initializer via `context.addInitializer`. That initializer calls `getActiveContainer()` — with no
   container it throws `MissingContainerContextError` carrying the class name and the accessor name — and with one it
   resolves the token (the `resolveOptional` variant if the descriptor is optional) and writes the value through
   `context.access.set`.

It does not override `get`/`set`; it only adds an initializer.

> **Exact shape:** `src/decorators/inject.ts`.

**The flow with `runWithContainer`:**

```
resolver.resolve(Dashboard)
  → runWithContainer(container, () => new Dashboard(...args))
    → Dashboard constructor() runs                        // _activeContainer is already set
    → accessor initializers run (addInitializer callbacks)
      → getActiveContainer() returns the container        // read in the same call frame
      → context.access.set(this, container.resolve(...))  // inject the value
    → runWithContainer returns the instance               // _activeContainer is restored
  → @postConstruct() runs (after runWithContainer)
```

> **Concurrency safety.** `_activeContainer` is a module-level variable. In a single-threaded environment (the Node.js
> event loop) this is safe, because JS has no true parallelism. `runWithContainer` with `try/finally` guarantees that
> nested construction (A injects B injects C) stacks correctly. Should the library ever need to support Worker threads,
> each Worker has its own module scope — there is no shared state.

> **`INJECT_ACCESSOR_KEY`.** A `unique symbol` in `metadata-keys.ts`, not exported. `SymbolMetadataReader` reads it
> through `getAccessorMetadata(target)` and a WeakMap mirror keyed by `context.metadata`. The resolver uses
> `getAccessorMetadata` to detect accessor injection and to wrap `new` in `runWithContainer` when a class needs an
> active container inside its initializers.

#### Design choices

> **Constructor injection is still preferred** — immutable, easy to test, no container context needed. Property
> injection through `accessor` is useful when a class extends a framework that owns the constructor, or when you need to
> break a circular dependency.

> **`@inject` on a plain field is not supported** (`@inject(Logger) logger!`). Property injection only goes through
> `accessor` (`@inject(Logger) accessor logger`, …). A Stage 3 field decorator does have `context.access`; restricting
> this to `accessor` is an **API choice** (a narrower surface), not a limitation of the proposal.

#### `inject()` is dual-role

`inject()` works both as a plain function (in a deps array) and as an accessor decorator. Its return type is the
**intersection** of `InjectionDescriptor<Value>` and `ClassAccessorDecorator<unknown, Value>`. Used in a deps array,
TypeScript matches the first half; used as a decorator, it matches the second. One function, one import — there is no
separate import for either role.

> **Decorator toolchain.** Vitest uses its default transform (OXC). Test snippets that need Stage 3 decorators go
> through `@rolldown/plugin-babel` with `@babel/plugin-proposal-decorators` (`version: "2023-11"`). A transform around
> decorator metadata must keep `inject()` a callable object; use `isInjectionDescriptor(value)` before processing a deps
> array.

### Method lifecycle decorators

`@postConstruct()` and `@preDestroy()` are method decorators on **instance methods**; the method name is written into
`Symbol.metadata` and the corresponding WeakMap mirror. **Static methods are not supported** — the lifecycle manager
only calls hooks on an instance.

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
> - **Scope:** `@postConstruct()` runs for every scope — each time a new instance is created. `@preDestroy()` only runs
>   for `singleton`, when the container is disposed or the binding unbound. `scoped` and `transient` instances get no
>   `@preDestroy()`.
> - **Async contamination:** an async `@postConstruct()` forces `resolveAsync()` — async contamination spreads along the
>   entire dependency path.

### Auto-registration

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

### The decorator and helper list

| API                            | Kind                          | Target                        | Effect                                                                                                   |
| ------------------------------ | ----------------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------- |
| `@injectable(deps?, options?)` | decorator                     | class                         | Writes param metadata into `Symbol.metadata`. `options.autoRegister` registers into an explicit registry |
| `inject(token, options?)`      | plain fn + accessor decorator | deps array / `accessor` field | An `InjectionDescriptor`, or injection through an accessor                                               |
| `optional(token, options?)`    | plain fn                      | deps array                    | Like `inject`, but returns `undefined` when there is no binding                                          |
| `injectAll(token, options?)`   | plain fn                      | deps array                    | Resolves every matching binding into an array                                                            |
| `isInjectionDescriptor(v)`     | type guard fn                 | —                             | Checks whether a value is an `InjectionDescriptor`                                                       |
| `@postConstruct()`             | decorator                     | method                        | Writes the method name into `Symbol.metadata` — runs after construction, before caching                  |
| `@preDestroy()`                | decorator                     | method                        | Writes the method name into `Symbol.metadata` — runs at deactivation (singleton only)                    |
| `MetadataReaderToken`          | `Token<MetadataReader>`       | —                             | The token for swapping the MetadataReader in tests                                                       |

> **`@singleton()` and `@scoped()` do not exist.** Scope is a binding-time concern — declared at `.singleton()` /
> `.transient()` / `.scoped()` in the fluent chain. A class does not decide its own scope.

> **There are no parameter decorators.** TC39 Stage 3 does not support them (TS1206). The deps array replaces them
> entirely.

### tsconfig setup

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "NodeNext",
    "strict": true
  }
}
```

`experimentalDecorators: true` is not needed. Stage 3 decorators have been standard since TypeScript 5.0;
`Symbol.metadata` is stable from TypeScript 5.9.

---

## Advanced Constraints

**Mental model.** These helpers are convenience factories for `when()` predicates. Each takes a token, a name, or a
criterion and returns `(ctx: ConstraintContext) => boolean`. Nothing here adds a mechanism: everything an advanced
constraint does, a hand-written `when()` over `ctx.parent` and `ctx.ancestors` could do too.

Where `whenNamed` / `whenTagged` filter statically by slot (O(1)), advanced constraints inspect **where the binding sits
in the dependency graph at runtime**: which token is the direct parent, which slot of an ancestor is active. The typical
use case is injecting differently depending on the subtree being resolved — for example, `VerboseLogger` when an
ancestor is `DebugModule`, or `SandboxMailer` when some ancestor carries the tag `env=test`.

Advanced constraints are exported from the root `@codefast/di`, and also from the dedicated subpath
`@codefast/di/resolution/select/constraints`, which points at the same module. The examples in this section import from
the root — the shorter path, and always correct.

### Token name resolution

> **Normative.** Every constraint function takes a `Token<unknown> | Constructor` and resolves it to a `tokenName`
> string, which is compared against `ResolutionFrame.tokenName`:
>
> - `Token<Value>` → use `token.name` (the string given at `token("Logger")`)
> - `Constructor` → use `Constructor.name` (the JavaScript class name)

> **Unique names.** `ResolutionFrame.tokenName` is a `string`, not a branded type. If two different tokens share a
> `name` — say `token<A>("Config")` and `token<B>("Config")` — a constraint cannot tell them apart. Give tokens unique
> names (a namespace prefix such as `"@myapp/Config"`) to avoid false matches.

### Type signatures

Ten constraints, each taking configuration parameters and returning a predicate over `ConstraintContext`:

| Constraint                         | Matches when                                                     | With no parent / ancestor |
| ---------------------------------- | ---------------------------------------------------------------- | :-----------------------: |
| `whenParentIs(token)`              | the direct parent is that token                                  |          `false`          |
| `whenNoParentIs(token)`            | the direct parent is **not** that token                          |          `true`           |
| `whenParentNamed(name)`            | the parent binding's slot carries exactly that name              |          `false`          |
| `whenParentTagged(criterion)`      | the parent's slot contains that criterion                        |          `false`          |
| `whenParentTaggedAll(tags)`        | the parent's slot contains **all** the given criteria            |          `false`          |
| `whenAnyAncestorIs(token)`         | at least one ancestor is that token                              |          `false`          |
| `whenNoAncestorIs(token)`          | **no** ancestor is that token                                    |          `true`           |
| `whenAnyAncestorNamed(name)`       | some ancestor carries a slot with exactly that name              |          `false`          |
| `whenAnyAncestorTagged(criterion)` | some ancestor carries that criterion                             |          `false`          |
| `whenAnyAncestorTaggedAll(tags)`   | **at least one** ancestor's slot contains **all** given criteria |          `false`          |

The two negative forms returning `true` on absence are deliberate: "no parent is X" is trivially true when there is no
parent at all. The two `…TaggedAll` forms are equivalent to AND-composing several individual criteria, but cost one
predicate call and allocate no intermediate closure. Criteria compare by identity — equivalent to `Object.is` on
`[key, value]` thanks to interning, consistent with slot equality in [Slots and last-wins](#slot-matching).

> **Normative — an empty criterion list is rejected.** `whenParentTaggedAll([])` reads literally as "the parent carries
> all of nothing", which is true of every parent — the constraint would silently weaken into "there is some parent",
> while still winning specificity over an unconstrained binding. Both `…TaggedAll` variants throw
> `EmptyTagCriteriaError` right at the call site.

> **Normative — a slot name nobody declares.** `whenParentNamed`/`whenAnyAncestorNamed` expect a string, so a typo
> produces a constraint that is never true and that nobody reports. `validate()` throws `UnreachableConstraintError`
> when no binding anywhere in the container chain declares that slot name. The requirement survives `when()` chaining: a
> composed predicate carries both sides' requirements, so narrowing a helper-built constraint does not hide it from
> `validate()`.

> **Exact shape:** `src/resolution/select/constraints.ts`.

### Semantics

`ctx.parent` is the `ResolutionFrame` of the binding directly above in the stack (the binding currently injecting this
token). `ctx.ancestors` is every frame above `ctx.parent`, ordered from nearest to furthest — it does not include
`ctx.parent`.

> **Normative — the canonical implementation table.**
>
> | Function                           | Logic                                                                           |
> | ---------------------------------- | ------------------------------------------------------------------------------- |
> | `whenParentIs(token)`              | `ctx.parent !== undefined && ctx.parent.tokenName === tokenNameOf(token)`       |
> | `whenNoParentIs(token)`            | `ctx.parent === undefined \|\| ctx.parent.tokenName !== tokenNameOf(token)`     |
> | `whenAnyAncestorIs(token)`         | `ctx.ancestors.some(f => f.tokenName === tokenNameOf(token))`                   |
> | `whenNoAncestorIs(token)`          | `ctx.ancestors.every(f => f.tokenName !== tokenNameOf(token))`                  |
> | `whenParentNamed(name)`            | `ctx.parent !== undefined && ctx.parent.slot.name === name`                     |
> | `whenAnyAncestorNamed(name)`       | `ctx.ancestors.some(f => f.slot.name === name)`                                 |
> | `whenParentTagged(criterion)`      | `ctx.parent !== undefined && ctx.parent.slot.tags.includes(criterion)`          |
> | `whenAnyAncestorTagged(criterion)` | `ctx.ancestors.some(f => f.slot.tags.includes(criterion))`                      |
> | `whenParentTaggedAll(tags)`        | `ctx.parent !== undefined && tags.every(t => ctx.parent.slot.tags.includes(t))` |
> | `whenAnyAncestorTaggedAll(tags)`   | `ctx.ancestors.some(f => tags.every(t => f.slot.tags.includes(t)))`             |

> **The named variants read `slot.name`, not `currentResolveOptions`.** `whenParentNamed("console")` asks "does the
> parent's binding have `whenNamed("console")`?" — not "was the parent resolved with the hint `{ name: "console" }`?".
> Those are different questions: a binding can match the slot `"console"` without any resolve hint when it is the only
> candidate, and vice versa.

> **Why identity comparison is enough.** Criteria are interned, so each `[key, value]` has exactly one object; comparing
> by identity therefore gives the same answer as `Object.is` on the value — handling `NaN` correctly and keeping `+0`
> distinct from `-0`, consistent with slot equality in [Slots and last-wins](#slot-matching). This is also why the table
> above has no pairwise comparison loop.

### Examples

**`whenParentIs` — a verbose logger only when the parent is `DebugService`:**

```ts
import { whenParentIs } from "@codefast/di";

container.bind(Logger).to(ConsoleLogger);
container.bind(Logger).to(VerboseLogger).when(whenParentIs(DebugService));
```

When `DebugService` asks for `Logger`, the predicate matches and `VerboseLogger` is chosen. Every other service gets
`ConsoleLogger` (the default slot).

> **Make them mutually exclusive.** Both bindings above use predicate-only `when()`. If both predicates are `true`
> during one resolve, the resolver throws `AmbiguousBindingError`. Make the predicates exclude each other — for
> instance, add `.when((ctx) => !whenParentIs(DebugService)(ctx))` to the first binding as the negation.

**`whenAnyAncestorIs` — inject a different config across the whole `TestHarness` subtree:**

```ts
import { whenAnyAncestorIs, whenNoAncestorIs } from "@codefast/di";

container.bind(Config).toConstantValue(prodConfig).when(whenNoAncestorIs(TestHarness));

container.bind(Config).toConstantValue(testConfig).when(whenAnyAncestorIs(TestHarness));
```

Any service resolved within the subtree rooted at `TestHarness` receives `testConfig`. Services outside the subtree
receive `prodConfig`.

**`whenParentNamed` — a logger that knows which slot of `Database` it serves:**

```ts
import { whenParentNamed } from "@codefast/di";

container.bind(Database).to(PrimaryDatabase).whenNamed("primary").singleton();
container.bind(Database).to(ReplicaDatabase).whenNamed("replica").singleton();

container.bind(Logger).to(PrimaryLogger).when(whenParentNamed("primary"));

container.bind(Logger).to(ReplicaLogger).when(whenParentNamed("replica"));
```

When `PrimaryDatabase` is resolved (binding slot `"primary"`), it injects `PrimaryLogger` because
`ctx.parent.slot.name === "primary"`.

**`whenAnyAncestorTagged` — pick different infrastructure by environment tag:**

```ts
import { tag, whenAnyAncestorTagged } from "@codefast/di";

const Env = tag<"test" | "prod">("env");

// Some ancestor in the chain carries env=test → use the sandbox
container
  .bind(Mailer)
  .to(SandboxMailer)
  .when(whenAnyAncestorTagged(Env.of("test")));

// No ancestor carries env=test → use real SMTP
container
  .bind(Mailer)
  .to(SmtpMailer)
  .when((ctx) => !whenAnyAncestorTagged(Env.of("test"))(ctx));
```

**`whenParentTaggedAll` — inject differently when the parent carries several tags at once:**

```ts
import { tag, whenParentTaggedAll } from "@codefast/di";

const Env = tag<"test" | "prod">("env");
const Tier = tag<"basic" | "premium">("tier");

// PremiumPlugin is only injected when the parent has BOTH env=prod AND tier=premium
container
  .bind(Plugin)
  .to(PremiumPlugin)
  .when(whenParentTaggedAll([Env.of("prod"), Tier.of("premium")]));

// The default fallback for every other case
container.bind(Plugin).to(BasicPlugin);
```

Equivalent to writing it by hand, but without the intermediate closure:

```ts
// Avoid — each resolve calls two separate predicates, each doing its own lookup
.when((ctx) => whenParentTagged(Env.of("prod"))(ctx) && whenParentTagged(Tier.of("premium"))(ctx))

// Use — one predicate call, one walk over `parentTags`
.when(whenParentTaggedAll([Env.of("prod"), Tier.of("premium")]))
```

### Composability

The constraint functions return `(ctx: ConstraintContext) => boolean`, so they compose naturally with JavaScript
operators:

```ts
import { whenAnyAncestorIs, whenParentIs } from "@codefast/di";

// AND — both conditions must hold
container
  .bind(Logger)
  .to(AuditVerboseLogger)
  .when((ctx) => whenParentIs(AuditService)(ctx) && whenAnyAncestorIs(ProductionModule)(ctx));

// OR — either one is enough
container
  .bind(Logger)
  .to(OperationsLogger)
  .when((ctx) => whenParentIs(OrderService)(ctx) || whenParentIs(PaymentService)(ctx));
```

**Closure reuse — create once, use many times:**

```ts
// Good — the closure is created once
const isInsideDebugModule = whenAnyAncestorIs(DebugModule);

container.bind(Logger).to(VerboseLogger).when(isInsideDebugModule);
container.bind(Tracer).to(VerboseTracer).when(isInsideDebugModule);

// Avoid — a new closure each time (not wrong, just a needless allocation)
container.bind(Logger).to(VerboseLogger).when(whenAnyAncestorIs(DebugModule));
container.bind(Tracer).to(VerboseTracer).when(whenAnyAncestorIs(DebugModule));
```

### Rules (normative)

The rules in [Constraints](#constraints) apply in full to advanced constraints — these are ordinary `when()` predicates:

- The predicate is called every time a resolve needs to pick a candidate, never cached.
- The predicate must be pure and deterministic — no side effects, no I/O.
- The predicate must not call `ctx.resolve*()` — that causes circular resolution.
- Make the predicates mutually exclusive when several bindings of one token use predicate-only `when()`. If ≥ 2
  candidates remain after filtering, the resolver throws `AmbiguousBindingError`.

### Performance note

`whenAnyAncestorIs`, `whenAnyAncestorTagged` and `whenAnyAncestorTaggedAll` walk the whole of `ctx.ancestors` — O(depth)
per resolve. With the shallow dependency graphs that are typical (< 10 levels), the overhead is negligible. Avoid these
constraints on a hot path with a deep graph and `transient` bindings; prefer `whenParentIs` / `whenParentTaggedAll`
(O(1) parent lookup) when checking the direct parent is all you need.

`whenParentTaggedAll(tags)` walks `tags` × `parentTags` — O(m × n), where m is the number of tags in the condition and n
the number of tags on the parent slot. With small m and n (< 5) the overhead is negligible; prefer it over AND-composing
several `whenParentTagged` calls, to reduce the number of predicate invocations.

### Subpath export

```ts
// @codefast/di/resolution/select/constraints — src/resolution/select/constraints.ts
export {
  whenAnyAncestorIs,
  whenAnyAncestorNamed,
  whenAnyAncestorTagged,
  whenAnyAncestorTaggedAll,
  whenNoAncestorIs,
  whenNoParentIs,
  whenParentIs,
  whenParentNamed,
  whenParentTagged,
  whenParentTaggedAll,
} from "#/resolution/select/constraints";
```

Exported from both the root `@codefast/di` and the subpath `@codefast/di/resolution/select/constraints` — both import
paths are valid and point at the same module. The `exports` map is generated from `dist/`, so the subpath carries the
real source path; **there is no `@codefast/di/constraints` alias**.

---

## Module system

**Mental model.** A module is a named, reusable description of bindings — a function that receives a builder and calls
`bind`/`import` on it. It holds no runtime state; a container decides when to run it and remembers what it produced.

### Sync module

```ts
import { SyncModule } from "@codefast/di";

export const LoggerModule = SyncModule.create("Logger", (builder) => {
  builder.bind(Logger).to(ConsoleLogger).singleton();
});

export const AppModule = SyncModule.create("App", (builder) => {
  builder.import(LoggerModule);
  builder.bind(Config).toConstantValue(loadConfig());
  builder.bind(App).toSelf().singleton();
});
```

### Async module

```ts
export const DatabaseModule = AsyncModule.create("Database", async (builder) => {
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

### Using modules

```ts
// Sync — every module must be a SyncModule
const container = Container.fromModules(AppModule, LoggerModule);

// Async — when at least one AsyncModule is involved
const container = await Container.fromModulesAsync(AppModule, DatabaseModule);

// Overriding a binding in a test — use bind() at the testContainer
const testContainer = Container.fromModules(AppModule);
testContainer.bind(Database).toConstantValue(mockDatabase); // overrides the parent
// Or rebind, if Database is already bound by AppModule at the same container
testContainer.rebind(Database).toConstantValue(mockDatabase);
```

> **Normative — a module is a pure description, holding no runtime state.** The same `SyncModule` / `AsyncModule` object
> can be loaded into several independent containers in parallel. A module only holds its `name` and its `setup`
> callback; the container tracks "which modules are loaded" and "which binding belongs to which module".

> **Normative — deduplication.** Calling `container.load(M)` repeatedly, or `m.import(M)` from several modules, is a
> no-op from the second time on. Dedup is based on **object identity**, not on `name`. Unload reference-counting uses
> the same identity — see [Module management](#module-management).

### A `SyncModule` cannot import an `AsyncModule`

> **Normative.** `ModuleBuilder` (used inside `SyncModule.create()`) only accepts `SyncModule[]` in `import()`. A
> `SyncModule` callback is sync and cannot await an async setup.

```ts
// Compile error — a SyncModule cannot import an AsyncModule
export const AppModule = SyncModule.create("App", (builder) => {
  builder.import(DatabaseModule); // TypeScript error: AsyncModule is not assignable to SyncModule
});

// Right — convert to an AsyncModule when you need to import one
export const AppModule = AsyncModule.create("App", async (builder) => {
  builder.import(DatabaseModule); // OK — AsyncModuleBuilder accepts both SyncModule and AsyncModule
});
```

### Module interface

| Type                 | What it offers                                                                                                                                  |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `ModuleBuilder`      | Exists only inside a `SyncModule.create()` callback. Exactly two things: `bind(token)` and `import(...modules)` accepting **only** `SyncModule` |
| `AsyncModuleBuilder` | The same two things, but its `import` accepts both `SyncModule` and `AsyncModule`                                                               |
| `SyncModule`         | Carries a `name` and a **branded field**; built by `SyncModule.create(name, setup)` with a sync `setup`                                         |
| `AsyncModule`        | Carries a `name` and a **branded field**; built by `AsyncModule.create(name, setup)` with an async `setup`                                      |
| `Module`             | `Module.create` / `Module.createAsync` only forward to the two factories above, for call sites that prefer importing a single name              |
| `isSyncModule`       | Type guard for telling the two apart at runtime when all you hold is the union                                                                  |

> **Exact shape:** `src/core/module.ts` — `ModuleBuilder`, `AsyncModuleBuilder`, `SyncModule`, `AsyncModule`, `Module`,
> `isSyncModule`.

> **Rationale — why a branded field.** TypeScript uses structural typing — if the two interfaces only had
> `name: string`, `container.load(asyncModule)` would compile without complaint. The branded field makes
> `load(asyncModule)` a TypeScript error at compile time.

> **Rationale — `ModuleBuilder` has no `unbind` / `rebind`.** A module is _additive_ — it only declares, it never
> removes another module's bindings. Overriding in a test uses `container.bind()` or `container.rebind()` after loading.
> This avoids hidden coupling between modules.

---

## Error hierarchy

**Mental model.** Every error the library throws extends one abstract class, `DiError`, and carries a machine-readable
`code` plus the context fields a human needs to act. A `catch (error) { if (error instanceof DiError) … }` catches all
of them; a `switch` on `code` tells them apart without string-matching messages.

> **Normative.** Every error extends `DiError` — an abstract class that forces each subclass to declare a `code` string
> (machine-readable), alongside a message carrying enough context for a human reader.

| Error                           | `code`                        | Thrown when                                                            | Context fields                                   |
| ------------------------------- | ----------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------ |
| `InternalError`                 | `INTERNAL_ERROR`              | An internal assertion failed — **not** a user error                    | —                                                |
| `TokenNotBoundError`            | `TOKEN_NOT_BOUND`             | The token has no binding at all, even after walking the parent chain   | `tokenName`                                      |
| `NoMatchingBindingError`        | `NO_MATCHING_BINDING`         | The token **has** bindings but no slot matches the hint                | `tokenName`, `hint`, `availableSlots`            |
| `AmbiguousBindingError`         | `AMBIGUOUS_BINDING`           | ≥ 2 candidates remain and the more-specific rule cannot decide         | `tokenName`, `candidateIds`                      |
| `CircularDependencyError`       | `CIRCULAR_DEPENDENCY`         | A → B → A, including a cycle along an alias chain                      | `cycle`                                          |
| `AsyncResolutionError`          | `ASYNC_RESOLUTION`            | A sync `resolve()` on an async binding, directly or via the dep chain  | `tokenName`, `asyncSourceToken`                  |
| `AsyncActivationError`          | `ASYNC_ACTIVATION`            | `@postConstruct` or `onActivation` returned a `Promise` on a sync path | `tokenName`, `hookKind`, `methodName`            |
| `AsyncDeactivationError`        | `ASYNC_DEACTIVATION`          | A sync `unbind()` on a binding with an async `onDeactivation`          | `tokenName`                                      |
| `ScopeViolationError`           | `SCOPE_VIOLATION`             | Captive dependency — a singleton depending on scoped or transient      | `details`: both tokens + scopes, plus `path`     |
| `MissingMetadataError`          | `MISSING_METADATA`            | The container must construct a class but `@injectable()` is missing    | `targetName`                                     |
| `InvalidMetadataError`          | `INVALID_METADATA`            | The `MetadataReader` returned something the container cannot use       | `targetName`, `reason`                           |
| `AsyncModuleLoadError`          | `ASYNC_MODULE_LOAD`           | A sync `load()` received an `AsyncModule`                              | `moduleName`                                     |
| `SyncDisposalNotSupportedError` | `SYNC_DISPOSAL_NOT_SUPPORTED` | `[Symbol.dispose]()` was called                                        | —                                                |
| `MissingScopeContextError`      | `MISSING_SCOPE_CONTEXT`       | A `scoped` binding resolved from a container with no child scope       | `tokenName`                                      |
| `MissingContainerContextError`  | `MISSING_CONTAINER_CONTEXT`   | A class with `@inject accessor` was `new`-ed outside a container       | `className` (may be `undefined`), `accessorName` |
| `RebindUnboundTokenError`       | `REBIND_UNBOUND_TOKEN`        | `rebind()` on a token with no own binding in this container            | `tokenName`                                      |
| `DisposedContainerError`        | `DISPOSED_CONTAINER`          | Any operation on an already-disposed container                         | —                                                |
| `ChainNotRegisteredError`       | `CHAIN_NOT_REGISTERED`        | Refinement (`when*`, scope, `on*`, `id()`) called before `to*()`       | `tokenName`                                      |
| `SelfBindingRequiresClassError` | `SELF_BINDING_REQUIRES_CLASS` | `toSelf()` on a token that is not a class                              | `tokenName`                                      |
| `StaticMemberDecoratorError`    | `STATIC_MEMBER_DECORATOR`     | `@inject` / `@postConstruct` / `@preDestroy` on a static member        | `decoratorName`, `memberName`                    |
| `UnreachableLifecycleHookError` | `UNREACHABLE_LIFECYCLE_HOOK`  | `validate()` — a container-level hook for a token nobody binds         | `tokenName`, `phase`                             |
| `EmptyTagCriteriaError`         | `EMPTY_TAG_CRITERIA`          | `…TaggedAll()` received an empty criterion list                        | `helperName`                                     |
| `UnreachableConstraintError`    | `UNREACHABLE_CONSTRAINT`      | `validate()` — a constraint expects a slot name nobody declares        | `tokenName`, `requiredName`, `helperName`        |

> **Exact shape:** `src/errors/errors.ts` — every class above, plus `ScopeViolationDetails`.

Every message states the way out, not merely the symptom. Two representative examples:

```
No binding for 'Logger' matching { name: 'file' }. Available slots: [default, name:console].

Token 'App' requires async resolution because 'Database' in its dependency
chain has an async factory. Use container.resolveAsync(App).
```

### The boundary between a library bug and a caller error

> **Normative.** `InternalError` means **the library is broken** — a consumer catching one has caught a library bug. No
> user-caused error may therefore carry that type.

Three errors in the table exist precisely because of that rule: `AmbiguousBindingError` (predicates that do not exclude
each other), `StaticMemberDecoratorError`, and `ChainNotRegisteredError` — each is caller misuse, so each has its own
type rather than `InternalError`.

**Errors for callers outside the type system.** `ChainNotRegisteredError` and `SelfBindingRequiresClassError` are nearly
unreachable from TypeScript: the chain's return types ([Fluent chain](#chain-order)) and the type of `bind()` already
block most of the way. They exist for JavaScript callers, or callers who have cast through the types — so that misuse
**fails loudly** instead of silently doing nothing — and they belong to the `DiError` taxonomy so that a
`catch (error) { if (error instanceof DiError) … }` does not let them escape.

**Why static members are an error.** `StaticMemberDecoratorError` exists because all three of those decorators act on
**an instance**: `@inject` resolves through the container active while the instance is being constructed, and
`@postConstruct`/`@preDestroy` bracket one instance's lifecycle. A static member belongs to the class, and the container
does not construct classes.

### `MissingMetadataError` vs `InvalidMetadataError`

Missing metadata is a class the container was never told about; invalid metadata is a reader answering wrongly.

> **Normative.**
>
> - Only a **user-supplied** reader is checked — the default decorator reader writes the very metadata it reads back, so
>   there is nothing to check, and a container given no custom reader has nothing to answer for.
> - The check runs once per `(reader, class)` pair per process, and only over the fields the consumer dereferences
>   (`params`, and each entry's `token`).
> - The **lifecycle** answer also lands in `InvalidMetadataError`, with a different `reason`: if the reader names a
>   `postConstruct`/`preDestroy` method the instance does not have, it is reported
>   (`"lifecycle method 'strat' is not a method on the instance"`) rather than swallowed. The class name is taken from
>   the instance itself at the throw site, so the happy path carries no extra argument.

A silently skipped hook is a failure **the caller cannot see** — which is why the lifecycle case is reported rather than
swallowed.

### `AsyncActivationError` vs `AsyncResolutionError`

Both come from the rule in [`ActivationHandler` and `DeactivationHandler`](#lifecycle-handlers) — a hook returning a
`Promise` means the resolve must be `resolveAsync()`. The difference is _where_ the async source sits:

- `AsyncResolutionError` — the source is a binding's factory, known at the point the binding is selected.
- `AsyncActivationError` — the source is a hook, which only reveals itself **after** the instance has been created. The
  container cannot know in advance. `hookKind` says whether it was `postConstruct` or `onActivation`; `methodName` pins
  the exact method when a class has several `@postConstruct()`.

---

## File structure

```
packages/di/
├── ARCHITECTURE.md            Layering, hot-path invariants, and the rules for changing resolution/
│                              — read it before touching anything under src/resolution/
│                                (per-shape costs are measured by the benchmarks/di-inversify suite, not recorded here)
├── src/                       Directory = layer. Imports only flow downward in the order below.
│   │  ── layer 0: core/, errors/, injection/ ──────────────────────────────
│   ├── core/
│   │   ├── constructor-type.ts Constructor<Value>, ConstructorInvocation (re-exported via types.ts)
│   │   ├── types.ts           DependencyKey, BindingScope, BindingIdentifier, BindingKind,
│   │   │                      ActivationHandler, DeactivationHandler, ResolveOptions,
│   │   │                      ResolutionFrame, ConstraintContext, ResolutionContext, TokenValue
│   │   ├── token.ts           Token<Value> branded type; token(), tokenName()
│   │   ├── tag.ts             tag() — the one and only tag-key factory; interned BindingTag,
│   │   │                      TagKeyMask and the subset check over keys
│   │   ├── binding.ts         The Binding discriminated union + BindingSlot utilities;
│   │   │                      createBinding() — THE SINGLE BINDING CONSTRUCTION POINT, which
│   │   │                      guarantees one hidden class for every binding; generateBindingId(),
│   │   │                      refinableFields(); every public builder interface
│   │   ├── binding-scope.ts   effectiveBindingScope() — internal; use BindingSnapshot.scope
│   │   ├── registry.ts        BindingRegistry — slot-aware last-wins, the fast lookup indexes,
│   │   │                      a version counter for memoization; stores bindings BY REFERENCE (no re-copy)
│   │   ├── constraint-requirement.ts  What a constraint needs before it can match, so validate() can check for it
│   │   ├── map-upsert.ts      getOrInsert()/getOrInsertComputed() — the two Map upserts every index allocates through
│   │   └── module.ts          SyncModule / AsyncModule, MODULE_SETUP
│   ├── errors/
│   │   ├── errors.ts          Every error class
│   │   └── diagnostics.ts     RESOLUTION_DIAGNOSTICS — the channel for reading the resolver's runtime counters
│   ├── injection/
│   │   ├── descriptor.ts      The inject-descriptor layer: optional(), injectAll(),
│   │   │                      isInjectionDescriptor(), normalizeToDescriptor(); folds `tag`
│   │   │                      into `tags` so everything downstream sees one spelling
│   │   └── resolve-options.ts injectionSlotToResolveOptions(), bindingSlotToResolveOptions()
│   │
│   │  ── layer 1: lifecycle/, ambient/ ────────────────────────────────────
│   ├── lifecycle/
│   │   ├── scope-manager.ts   ScopeManager — singleton/scoped cache, async serialization
│   │   └── lifecycle-manager.ts LifecycleManager — the onActivation/onDeactivation chain
│   ├── ambient/
│   │   └── active-container.ts runWithContainer() / getActiveContainer() — the module-level
│   │                          active variable that accessor injection reads during `new`
│   │
│   │  ── layer 2: resolution/ (perf-critical core) ────────────────────────
│   ├── resolution/
│   │   ├── resolver.ts        DependencyResolver — the sync + async pipelines. One class because
│   │   │                      `#` privates cannot span files and both pipelines share the same
│   │   │                      private state at every hop
│   │   ├── context.ts         DefaultResolutionContext (pooled), AsyncLevelContext,
│   │   │                      AsyncCascadeContext, ResolverCallbacks
│   │   ├── cache/
│   │   │   ├── binding-lookup-cache.ts  Memo of option-free lookups per chain, aliases already
│   │   │   │                  folded; stamped with the summed version of the whole chain registry
│   │   │   ├── class-introspector.ts    Per-class cache: constructor metadata, detection of
│   │   │   │                  @postConstruct, accessor injection, and the `new` call itself
│   │   │   └── activation-need.ts  Per-binding cache: does the activation pipeline need to run
│   │   ├── plan/
│   │   │   └── instantiation-plan.ts   The compiler for a compiled plan + the escape to the runtime path
│   │   ├── path/
│   │   │   └── resolution-path.ts      Cycle guard over a path array (linear scan → Set
│   │   │                      once deep); OwnedBranchPath for async branches
│   │   └── select/
│   │       ├── binding-select.ts   selectBinding(), selectAllBindings(), matchesSlot()
│   │       └── constraints.ts      The advanced constraint predicates (whenParentNamed, …)
│   │
│   │  ── layer 3: decorators/, metadata/ ──────────────────────────────────
│   ├── decorators/
│   │   ├── injectable.ts      @injectable(), the auto-register registry
│   │   ├── inject.ts          inject() and the @inject accessor field decorator
│   │   └── lifecycle-decorators.ts  @postConstruct(), @preDestroy()
│   ├── metadata/
│   │   ├── metadata-types.ts  MetadataReader, ConstructorMetadata, ParamMetadata
│   │   ├── metadata-keys.ts   Symbol.metadata keys
│   │   ├── symbol-metadata-reader.ts   defaultMetadataReader
│   │   ├── verifying-metadata-reader.ts  Wraps a user-supplied reader, checking once
│   │   │                      per (reader, class) pair — the source of InvalidMetadataError
│   │   └── metadata-reader-token.ts    MetadataReaderToken
│   │
│   │  ── layer 4: container/, introspection/ ──────────────────────────────
│   ├── container/
│   │   ├── container.ts       DefaultContainer; collaborators built on first use
│   │   └── binding-builders.ts BindingChain — ONE object for the whole chain, registered ONCE
│   │                          then refined in place, committing itself into the registry;
│   │                          BindingRegistration (where the chain registered, and for whom)
│   ├── introspection/
│   │   ├── inspector.ts       inspect(), lookupBindings()
│   │   ├── dependency-graph.ts buildDependencyGraph()
│   │   └── graph-adapters/    dot.ts, cytoscape.ts, mermaid.ts, reactflow.ts
│   └── index.ts               Public API exports (root entrypoint)
│
├── tests/                     Mirrors the src/ path inside exactly one category
│   ├── unit/                  architecture, core/, container/, decorators/, lifecycle/,
│   │                          introspection/, resolution/{cache,plan,select}
│   ├── integration/           decorators end-to-end, validate-scope, support/ fixtures
│   └── types/                 expectTypeOf — inference, container API, resolve-options
│
├── package.json               #exports generated from dist/ by `codefast mirror`
├── tsconfig.json
└── tsconfig.build.json
```

> **Normative — a directory is a layer, and imports only go one way.** `{core, errors, injection}` →
> `{lifecycle, ambient}` → `resolution` → `{decorators, metadata}` → `{container, introspection}`. Imports within a
> layer are free; only a value import back up to a higher layer is a violation. `index.ts` is exempt — gathering every
> layer into a barrel is its job. Type-only imports do not count, because they evaporate at build time and constrain
> nothing at runtime.

**Ownership of `core/types.ts`.** The foundation types (`BindingScope`, `BindingIdentifier`, `BindingKind`,
`Constructor`, `ActivationHandler`, `DeactivationHandler`, `ResolveOptions`, `ResolutionContext`, `ConstraintContext`,
`ResolutionFrame`, `TokenValue`) are declared here — a file with a single responsibility that depends on no other file
in the package. `core/binding.ts`, `resolution/resolver.ts`, `lifecycle/scope-manager.ts` and the rest all import from
it. Re-exported from `index.ts`.

**Why `resolution/select/binding-select.ts` is separate from `core/registry.ts`.** The registry is the storage layer —
it stores bindings and handles slot-aware last-wins. `binding-select.ts` is the runtime filtering layer — it takes a
token plus `ResolveOptions` plus the `when()` predicates and returns candidates. `resolver.ts` consumes its result. This
split makes each layer independently testable, and keeps the registry at layer 0 while selection sits alongside the
resolver.

**Why `metadata/metadata-reader-token.ts` is its own file.** `MetadataReaderToken` is the bridge between the decorator
layer and the container. Keeping it separate avoids a circular import (`container/container.ts` →
`metadata-reader-token.ts` → nothing pointing back).

<a id="public-api"></a>

### Public API (`index.ts`)

```ts
// Foundation types
export type {
  ActivationHandler,
  BindingConstraint,
  BindingIdentifier,
  BindingKind,
  BindingScope,
  BindingTag,
  ConstraintContext,
  Constructor,
  DependencyKey,
  DeactivationHandler,
  ResolutionFrame,
  ResolveOptions,
  ResolutionContext,
  TokenValue,
} from "#/core/types";

// Token
export { token, tokenName } from "#/core/token";
export type { Token } from "#/core/token";

// Tag — the interned slot criteria a `whenTagged` and a resolve both take
export { coversTagKeys, NO_TAG_KEYS, slotName, tag, tagKeyMaskOf } from "#/core/tag";
export type { TagKey, TagKeyMask } from "#/core/tag";

// Binding builders — types only
export type {
  AliasBindingBuilder,
  BindToBuilder,
  BindingBuilder,
  ConstantBindingBuilder,
  ScopedBindingBuilder,
  SingletonBindingBuilder,
  SingletonLifecycleBuilder,
  SlotConstrainedBuilder,
  TransientBindingBuilder,
} from "#/core/binding";

// Container
export { Container } from "#/container/container";
export type { Container as ContainerInterface, ContainerOptions, ContainerStatic } from "#/container/container";

// Ambient container — the context an `@inject` accessor initializer resolves from. `resolution/context`
// stays internal: it hands out resolver callbacks, not public values.
export { getActiveContainer, runWithContainer } from "#/ambient/active-container";

// `effectiveBindingScope` is deliberately absent: it reads a `Binding`, which is internal, and no
// public API hands one out. `BindingSnapshot.scope` and `GraphNode.scope` are the public answers.
export {
  bindingSlotToResolveOptions,
  injectionSlotToResolveOptions,
  resolveOptionsForSlot,
} from "#/injection/resolve-options";
export type { DependencySlot } from "#/injection/resolve-options";

// Introspection types
export type { BindingSnapshot, ContainerSnapshot } from "#/introspection/inspector";

// Graph types
export type { ContainerGraphJson, GraphEdge, GraphNode, GraphOptions } from "#/introspection/dependency-graph";

// Module
export { AsyncModule, isSyncModule, Module, SyncModule } from "#/core/module";
export type { AsyncModuleBuilder, ModuleBuilder } from "#/core/module";

// Decorators
export { inject } from "#/decorators/inject";
export { injectAll, isInjectionDescriptor, optional } from "#/injection/descriptor";
export type { InjectionDescriptor, InjectOptions } from "#/injection/descriptor";
export { injectable } from "#/decorators/injectable";
export type { InjectableDependency, InjectableOptions } from "#/decorators/injectable";
export { postConstruct, preDestroy } from "#/decorators/lifecycle-decorators";

// Auto-register
export { createAutoRegisterRegistry } from "#/decorators/injectable";
export type { AutoRegisterRegistry } from "#/decorators/injectable";

// MetadataReader — everything a consumer needs to write one and pass it to Container.create()
export { MetadataReaderToken } from "#/metadata/metadata-reader-token";
export type {
  ConstructorMetadata,
  LifecycleMetadata,
  MetadataReader,
  MutableLifecycleMetadata,
  ParamMetadata,
} from "#/metadata/metadata-types";
export { defaultMetadataReader, SymbolMetadataReader } from "#/metadata/symbol-metadata-reader";

// Constraints — contextual injection predicates for .when()
export {
  whenAnyAncestorIs,
  whenAnyAncestorNamed,
  whenAnyAncestorTagged,
  whenAnyAncestorTaggedAll,
  whenNoAncestorIs,
  whenNoParentIs,
  whenParentIs,
  whenParentNamed,
  whenParentTagged,
  whenParentTaggedAll,
} from "#/resolution/select/constraints";

// Errors
export {
  AmbiguousBindingError,
  AsyncActivationError,
  AsyncDeactivationError,
  AsyncModuleLoadError,
  AsyncResolutionError,
  ChainNotRegisteredError,
  CircularDependencyError,
  DiError,
  DisposedContainerError,
  InternalError,
  InvalidMetadataError,
  MissingContainerContextError,
  MissingMetadataError,
  MissingScopeContextError,
  NoMatchingBindingError,
  RebindUnboundTokenError,
  ScopeViolationError,
  SelfBindingRequiresClassError,
  StaticMemberDecoratorError,
  SyncDisposalNotSupportedError,
  EmptyTagCriteriaError,
  TokenNotBoundError,
  UnreachableConstraintError,
  UnreachableLifecycleHookError,
} from "#/errors/errors";
export type { ScopeViolationDetails } from "#/errors/errors";

// Graph adapters — render `generateDependencyGraph()` output for common viewers
export { toDotGraph } from "#/introspection/graph-adapters/dot";
export { toCytoscapeGraph } from "#/introspection/graph-adapters/cytoscape";
export type { CytoscapeEdge, CytoscapeElements, CytoscapeNode } from "#/introspection/graph-adapters/cytoscape";
export { toReactFlowGraph } from "#/introspection/graph-adapters/reactflow";
export type { ReactFlowEdge, ReactFlowGraph, ReactFlowNode } from "#/introspection/graph-adapters/reactflow";
export { toMermaidGraph } from "#/introspection/graph-adapters/mermaid";

// ── Subpaths: a full mirror, nothing excluded ───────────────────────────────
//
// `codefast mirror` generates an entry for EVERY module under src/, so each file
// here is a subpath running parallel to the root. This package's config is a
// single line — `strip: "./introspection/"` — and there is no `exclude` key
// anywhere in codefast.config.js.
//
// @codefast/di/core/{token,types,binding,tag,registry,module,binding-scope,constructor-type}
// @codefast/di/errors/{errors,diagnostics}
// @codefast/di/injection/{descriptor,resolve-options}
// @codefast/di/lifecycle/{scope-manager,lifecycle-manager}
// @codefast/di/ambient/active-container
// @codefast/di/container/{container,binding-builders}
// @codefast/di/resolution/{resolver,context}
// @codefast/di/resolution/cache/{binding-lookup-cache,class-introspector,activation-need}
// @codefast/di/resolution/{plan/instantiation-plan,path/resolution-path}
// @codefast/di/resolution/select/{binding-select,constraints}
// @codefast/di/decorators/{inject,injectable,lifecycle-decorators}
// @codefast/di/metadata/{metadata-types,metadata-keys,symbol-metadata-reader,verifying-metadata-reader,metadata-reader-token}
//
// `strip` removes the introspection/ prefix, so those four modules sit at flat specifiers:
// @codefast/di/{inspector,dependency-graph}, @codefast/di/graph-adapters/{dot,cytoscape,mermaid,reactflow}
//
// Exposing the engine internals is deliberate: this package has exactly one
// consumer — this repo — so narrowing the export surface buys nothing, while
// opening it lets benchmarks and tests reach straight into the layer being
// measured. Their invariants live in ARCHITECTURE.md, not in hiding the module.
//
// buildDependencyGraph() from dependency-graph.ts — already wrapped as container.generateDependencyGraph()
```

### `package.json`

ESM-only. `engines.node >= 24.0.0` — the monorepo's floor, held by the package's own `core/map-upsert` helpers instead
of the ES2025 `Map.prototype.getOrInsert`, which would raise it to 26.

Each public subpath is a conditional entry: `source` → `src` for dev/test inside the repo (gated on the `source`
condition), `types`/`import` → `dist` for consumers. The whole `exports` map is **generated automatically by
`codefast mirror`** from `dist/` after a build — never written by hand (the list below is a partial excerpt to show the
shape of an entry).

```json
{
  "name": "@codefast/di",
  "type": "module",
  "scripts": {
    "build": "rm -rf dist && tsc -p tsconfig.build.json"
  },
  "exports": {
    ".": {
      "source": "./src/index.ts",
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./resolution/select/constraints": {
      "source": "./src/resolution/select/constraints.ts",
      "types": "./dist/resolution/select/constraints.d.ts",
      "import": "./dist/resolution/select/constraints.js"
    },
    // `strip: "./introspection/"` in codefast.config.js keeps the introspection
    // group's specifiers flat, so the subpath carries no source-directory prefix.
    "./graph-adapters/dot": {
      "source": "./src/introspection/graph-adapters/dot.ts",
      "types": "./dist/introspection/graph-adapters/dot.d.ts",
      "import": "./dist/introspection/graph-adapters/dot.js"
    }
    // … every other subpath follows the same shape (core/registry, resolution/resolver,
    // lifecycle/scope-manager, lifecycle/lifecycle-manager, resolution/select/binding-select,
    // inspector, decorators/*, injection/*, metadata/*, …)
  },
  "files": ["dist", "src", "CHANGELOG.md", "README.md", "LICENSE"],
  "engines": {
    "node": ">=24.0.0"
  }
}
```

> **Why `src` is in `files`, and why it never reaches npm.** In the repo, `src` earns its place three ways: the `source`
> condition lets dev/test run the TypeScript sources directly with no prior build, and the `dist` source maps
> (`declarationMap`/`sourceMap`, which point at `../src` without inlining sources) give in-repo consumers of the built
> `dist` — `apps/ui`, `examples` — go-to-definition and debugger step-into against the original `.ts`. None of that is a
> consumer's concern: `tsc` leaves `#/` verbatim in `dist/*.js`, and a consumer resolves those through the `imports`
> map's `types`/`default` → `dist` conditions, never the `source` one (nothing enables `source` unasked). So
> `codefast pack-slim` runs on the CI checkout right before `changeset publish` (never committed) and drops `src` from
> `files`, every `source` condition from `exports`/`imports`, and the `dist` source maps plus their now-dangling
> `sourceMappingURL` directives — the tarball ships `dist` runtime and types only.

<a id="tsconfig-build"></a>

### `tsconfig.build.json`

The build uses native `tsc` (TypeScript 7) following the Turborepo "Compiled Packages" model — emitting `.js` + `.d.ts`
file by file into `dist/`, with no bundler. `tsdown` is gone.

The shared emit flags live in the `@codefast/typescript-config/library-build.json` preset (`noEmit: false`,
`declaration`, `declarationMap`, `sourceMap`, `types: ["node"]`). The build file uses an **`extends` array** so it both
inherits the package base (flags + `paths`) and pulls in the emit block, keeping only a local `outDir`/`rootDir`
(relative paths — placing them in the preset would resolve them against the preset's directory) plus
`include`/`exclude`:

```json
{
  "extends": ["./tsconfig.json", "@codefast/typescript-config/library-build.json"],
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", ".turbo", "coverage", "src/**/*.test.ts", "tests"]
}
```

Array order decides the override: `library-build.json` comes last, so its `noEmit: false` and `types: ["node"]` beat
`tsconfig.json`. The bin package (`cli`) additionally overrides `declaration: false` + `declarationMap: false`, because
no consumer imports its types.

---

## Roadmap

### Core container

- `types.ts` — every foundation type: `BindingScope`, `BindingIdentifier`, `BindingKind`, `Constructor`,
  `ActivationHandler`, `DeactivationHandler`, `ResolveOptions`, `ResolutionContext`, `ConstraintContext`,
  `ResolutionFrame`, `TokenValue`
- `Token<Value>` branded type, the `token()` factory, `TOKEN_BRAND`
- The `Binding` discriminated union: `ClassBinding`, `ConstantBinding`, `DynamicBinding`, `DynamicAsyncBinding`,
  `ResolvedBinding`, `ResolvedAsyncBinding`, `AliasBinding`
- Builder interfaces with chain enforcement: `BindingBuilder` does not expose `on*()` — forcing scope before lifecycle
- `BindingRegistry` — slot-aware last-wins at registration time, eager commit
- `ScopeManager` — singleton cache per container, in-flight Promise map (async serialization), scoped cache per child
- `LifecycleManager` — per-binding + container-level, the canonical order, `AsyncDeactivationError` on a sync unbind
  with an async handler
- `DependencyResolver` — graph walk, circular detection via `Set`, async contamination propagation
- `DefaultContainer` — composes everything, `isDisposed` state, `DisposedContainerError` guard
- Child containers via `createChild()`, singleton cache ownership at the defining container
- `dispose()` idempotent, `[Symbol.asyncDispose]()`, `[Symbol.dispose](): never`
- `unbindAll()`, `unbindAllAsync()`, `initializeAsync()`
- `validate()` — the scope matrix, transitive alias checking, `toDynamic` treated as opaque
- `has()` / `hasOwn()` with the canonical hint semantics (any binding vs slot match)
- `lookupBindings()` returning `BindingSnapshot[]` (never `undefined`)
- `resolveAll` / `resolveAllAsync` with filter semantics, returning `[]`
- `resolveOptionalAsync` — `undefined` when there is no binding/hint match; runtime errors re-thrown
- `rebind()` throwing `RebindUnboundTokenError` when the token has no own binding
- `loadAutoRegistered(registry)` on the container

### Decorator layer

- `@injectable(deps?, options?)` — TC39 Stage 3, deps array, `autoRegister` taking an explicit registry
- `inject()` + `optional()` + `injectAll()` — plain fn + accessor decorator, `isInjectionDescriptor()` type guard
- `@postConstruct()` + `@preDestroy()` — several methods per class supported, top-down order
- `SymbolMetadataReader` with an `Object.hasOwn` guard — no leaking of parent metadata
- `MetadataReaderToken` — `Token<MetadataReader>` for swapping in tests
- `createAutoRegisterRegistry()` — explicit, not global

### Module system

- `SyncModule.create()` and `AsyncModule.create()` with branded types
- `ModuleBuilder.import()` accepting only `SyncModule[]` — enforced at compile time
- Import graph resolution; `ModuleBuilder` additive-only
- `Container.fromModules()` / `Container.fromModulesAsync()` with documented dedup
- `load` / `loadAsync` / `unload` / `unloadAsync` with reference-count tracking
- `unload` sync + deactivation behaviour: sync deactivation only; async needs `unloadAsync`

### Error classes

Every error subclass with a `readonly code` and full context fields, as in [Error hierarchy](#error-hierarchy).
Including the new `AmbiguousBindingError`, `AsyncDeactivationError` and `DisposedContainerError`.

### Introspection and diagnostics

- `inspect(): ContainerSnapshot` — a typed snapshot including `isDisposed`
- `lookupBindings(token)` — `BindingSnapshot[]` (never `undefined`)
- `generateDependencyGraph(options?): ContainerGraphJson` — with an `includeParent` option
- `toDotGraph()` from `@codefast/di/graph-adapters/dot`

### Advanced constraints

Fully spec'd in [Advanced Constraints](#advanced-constraints). Exported from the root `@codefast/di` and from the
subpath `@codefast/di/resolution/select/constraints`: `whenParentIs`, `whenNoParentIs`, `whenAnyAncestorIs`,
`whenNoAncestorIs`, `whenParentNamed`, `whenAnyAncestorNamed`, `whenParentTagged`, `whenAnyAncestorTagged`,
`whenParentTaggedAll`, `whenAnyAncestorTaggedAll`.

### Integration packages

- `@codefast/di-hono` — middleware + a scoped container per request, for Hono
- `@codefast/di-fastify` — plugin + a scoped container per request, for Fastify

---

## Technical stack

| Tool                    | Role                                                                                                                 |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------- |
| TypeScript 7            | Stage 3 decorators, stable `Symbol.metadata`, strict; `tsc` for both build and type-check                            |
| `tsc` (native TS 7)     | Emits ESM `.js` + `.d.ts` file by file into `dist/` (Turborepo Compiled model, no bundler)                           |
| Vitest (OXC by default) | Unit tests and integration tests                                                                                     |
| Babel decorators        | Test-time only, inside Vitest: `@rolldown/plugin-babel` + `@babel/plugin-proposal-decorators` (`version: "2023-11"`) |
| publint                 | Checks package exports correctness                                                                                   |
| `@arethetypeswrong/cli` | Checks type resolution correctness                                                                                   |
| pnpm                    | Package manager (workspace monorepo)                                                                                 |

### tsconfig

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist"
  },
  "include": ["src"]
}
```

In practice the emit options (`declaration`, `outDir`, …) are split out into `tsconfig.build.json`
([`tsconfig.build.json`](#tsconfig-build)); the base `tsconfig.json` keeps `noEmit: true` for type-checking.

---

## Testing guide

### An isolated container — no modules loaded

The simplest pattern: create a fresh container and bind only what the test needs:

```ts
import { Container } from "@codefast/di";
import { describe, expect, it } from "vitest";

describe("UserService", () => {
  it("registers user and logs action", () => {
    const noopLogger: LoggerService = { log: () => {} };
    const container = Container.create();
    container.bind(Logger).toConstantValue(noopLogger);
    container.bind(UserRepo).toConstantValue(mockUserRepo);
    container.bind(UserService).toSelf();

    const service = container.resolve(UserService);
    expect(service).toBeInstanceOf(UserService);
  });
});
```

<a id="test-child-override"></a>

### A child container — overriding a parent binding

To override a binding defined in a module, use `bind()` at the child container (no `rebind()` is needed, because the
child has no own binding):

```ts
const testContainer = Container.fromModules(AppModule);

// Override the Database binding — child resolution takes priority over the parent
testContainer.bind(Database).toConstantValue(mockDatabase);

const userService = testContainer.resolve(UserService);
// userService.database === mockDatabase
```

### Rebind — overriding a binding in the same container

Use `rebind()` when replacing a binding that **already exists** in the same container (hot-reload or reconfiguration,
for instance):

```ts
const container = Container.create();
container.bind(Logger).to(ConsoleLogger).singleton();

// Override within the same container
container.rebind(Logger).toConstantValue(mockLogger);
// Note: the old singleton is deactivated (onDeactivation is called if present)
```

<a id="test-metadata-reader"></a>

### Swapping the MetadataReader

The container takes its `MetadataReader` through `MetadataReaderToken`. To test container behaviour without depending on
`Symbol.metadata`:

```ts
import { MetadataReaderToken } from "@codefast/di";

const customReader: MetadataReader = {
  getConstructorMetadata: (target) => ({
    params: [{ index: 0, token: Logger, optional: false, multi: false }],
  }),
  getLifecycleMetadata: () => ({ postConstruct: [], preDestroy: [] }),
};

const container = Container.create();
container.bind(MetadataReaderToken).toConstantValue(customReader);
container.bind(UserService).toSelf();

const service = container.resolve(UserService);
```

### Testing a scoped binding

```ts
it("scoped binding isolated per child", () => {
  const container = Container.create();
  container.bind(RequestId).toConstantValue("request-1");
  container.bind(RequestHandler).toSelf().scoped();

  const child1 = container.createChild();
  child1.bind(RequestId).toConstantValue("req-1");

  const child2 = container.createChild();
  child2.bind(RequestId).toConstantValue("req-2");

  const h1 = child1.resolve(RequestHandler);
  const h2 = child2.resolve(RequestHandler);

  expect(h1).not.toBe(h2); // different instances — each child is its own scope
  expect(child1.resolve(RequestHandler)).toBe(h1); // the same instance within child1
});
```

### Testing an async binding

```ts
it("resolves async binding", async () => {
  const container = Container.create();
  container
    .bind(Database)
    .toDynamicAsync(async () => {
      return new MockDatabase();
    })
    .singleton();

  const db = await container.resolveAsync(Database);
  expect(db).toBeInstanceOf(MockDatabase);

  // Cleanup
  await container.dispose();
});
```

### Testing dispose behaviour

```ts
it("calls onDeactivation on dispose", async () => {
  const disconnected = vi.fn();
  const container = Container.create();
  container.bind(Database).to(MockDatabase).singleton().onDeactivation(disconnected);

  await container.resolveAsync(Database);
  await container.dispose();

  expect(disconnected).toHaveBeenCalledOnce();
});

it("throws DisposedContainerError after dispose", async () => {
  const container = Container.create();
  await container.dispose();

  expect(() => container.resolve(Logger)).toThrow(DisposedContainerError);
});
```

### Testing `validate()`

```ts
it("detects captive dependency violation", () => {
  const container = Container.create();
  container.bind(Cache).to(InMemoryCache).scoped();
  container.bind(UserService).to(UserServiceImpl).singleton();
  // UserServiceImpl depends on Cache — a singleton depending on scoped → violation

  expect(() => container.validate()).toThrow(ScopeViolationError);
});
```

### Anti-patterns to avoid

**Do not use a global container in tests:** global state makes tests depend on each other:

```ts
// ❌ Anti-pattern
const container = Container.create(); // global — leaks between tests

// ✅ Right — each test creates its own container
beforeEach(() => {
  container = Container.create();
});
afterEach(async () => {
  await container.dispose();
});
```

**Do not mock `Symbol.metadata` directly:** use `MetadataReaderToken` instead (see
[Swapping the MetadataReader](#test-metadata-reader)).

**Do not use `rebind()` to override a parent:** use `bind()` at the child container (see
[A child container](#test-child-override)).

---

## Comparison with InversifyJS v8

This section compares the whole public API of InversifyJS v8.0.0 (March 2026) against `@codefast/di`. Each feature group
is examined along three axes: **learned from v8**, **improved over v8**, **not adopted from v8**.

---

### API comparison by group

#### Setup and requirements

| Aspect             | InversifyJS v8                                                | `@codefast/di`                                    |
| ------------------ | ------------------------------------------------------------- | ------------------------------------------------- |
| Installation       | `npm install inversify reflect-metadata`                      | `npm install @codefast/di`                        |
| reflect-metadata   | Required — `import 'reflect-metadata'` at the entry point     | Not needed — zero dependencies                    |
| tsconfig flags     | `experimentalDecorators: true`, `emitDecoratorMetadata: true` | No special flags needed                           |
| Decorator standard | Legacy TC39 Stage 1 (experimentalDecorators)                  | TC39 Stage 3 (`Symbol.metadata`, TypeScript 5.9+) |
| Module format      | ESM-only                                                      | ESM-only                                          |
| Minimum Node.js    | Node ≥ 20.19.0                                                | Node ≥ 24.0.0                                     |

#### Binding API

| Feature                | InversifyJS v8                                    | `@codefast/di`                                                      |
| ---------------------- | ------------------------------------------------- | ------------------------------------------------------------------- |
| Async binding          | `toDynamicValue` takes both sync and async        | `toDynamic` vs `toDynamicAsync` — enforced by the compiler          |
| Explicit async deps    | No `toResolvedValueAsync`                         | `toResolvedAsync(factory, deps)` — symmetric with the sync one      |
| Scope naming           | `inSingletonScope()` / `inTransientScope()` / ... | `singleton()` / `transient()` / `scoped()`                          |
| Lifecycle after scope  | `when*` available after scope (v8)                | `on*()` only after scope — the chain order is invariant             |
| `onDeactivation` guard | Runtime error on a non-singleton                  | Compile time: only on `SingletonBindingBuilder`                     |
| Alias                  | `toService()` returns `void`                      | `toAlias()` returns an `AliasBindingBuilder` — with `when*`/`.id()` |
| Alias + hint forward   | Not specified                                     | The hint is forwarded to the target resolution                      |

#### Container API

| Feature                  | InversifyJS v8                                          | `@codefast/di`                                             |
| ------------------------ | ------------------------------------------------------- | ---------------------------------------------------------- |
| Creating a container     | `new Container()`                                       | `Container.create()` — a static factory                    |
| Child container          | `new Container({ parent })`                             | `container.createChild()` — explicit                       |
| Optional resolution      | `container.get(id, { optional: true })`                 | `resolveOptional()` / `resolveOptionalAsync()`             |
| Multi resolution         | `getAll()` is sync only                                 | `resolveAll()` + `resolveAllAsync()`                       |
| Singleton async safety   | Not specified                                           | Concurrent `resolveAsync` shares one in-flight Promise     |
| Container lifecycle      | No `isDisposed`; operations after dispose are undefined | An `isDisposed` getter, `DisposedContainerError`           |
| `isBound()`              | Unclear semantics with a hint                           | `has(token, hint?)` — has a binding / matches a given hint |
| `isCurrentBound()`       | An easily confused name                                 | `hasOwn(token, hint?)` — clearer                           |
| `lookupBindings()`       | Absent                                                  | `lookupBindings()` returns `[]` (never `undefined`)        |
| Disposed container guard | Absent                                                  | `DisposedContainerError` on every operation                |
| Warming up singletons    | Absent                                                  | `initializeAsync()` — fail fast at startup                 |
| Dependency graph export  | Absent                                                  | `generateDependencyGraph({ includeParent? })` → JSON + DOT |

#### Error handling

| Case                           | InversifyJS v8                    | `@codefast/di`                              |
| ------------------------------ | --------------------------------- | ------------------------------------------- |
| Predicate ambiguity            | `InternalError` (the wrong type)  | `AmbiguousBindingError` with `candidateIds` |
| Async handler on a sync unbind | Silent failure or a runtime error | `AsyncDeactivationError` — explicit         |
| Disposed container             | Undefined behaviour               | `DisposedContainerError`                    |
| No typed error hierarchy       | No `code` field                   | `DiError` abstract + a `code` string        |

#### Module system

| Feature                       | InversifyJS v8                                                   | `@codefast/di`                                                     |
| ----------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------ |
| Module type distinction       | `ContainerModule` / `AsyncContainerModule` are not distinguished | `SyncModule` / `AsyncModule` branded — `load(async)` is a TS error |
| Module coupling               | The `ContainerModule` callback has `unbind`, `rebind`            | `ModuleBuilder` is additive-only — avoids hidden coupling          |
| Module deduplication          | Not specified                                                    | Object-identity dedup + documented reference counting              |
| SyncModule importing an Async | Not guarded                                                      | Compile error — `ModuleBuilder.import()` only takes `SyncModule[]` |
| Unload + deactivation         | Not specified                                                    | Singletons deactivated when the ref-count reaches 0                |

---

### Summary: learned from v8

| v8 feature                                                     | How it is done here                                                                |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Naming: unqualified=sync, `Async`=async                        | Kept: `resolve`/`resolveAsync`, `load`/`loadAsync`, `unbind`/`unbindAsync`, …      |
| ESM-only                                                       | Same as v8                                                                         |
| Per-binding `onActivation` / `onDeactivation`                  | Kept, with the callback inferring its type from the binding — no manual annotation |
| Container-level `onActivation` / `onDeactivation`              | Kept; children do not inherit the parent's hooks                                   |
| `toResolvedValue(factory, injectOptions)`                      | `toResolved(factory, deps)` sync, plus the new `toResolvedAsync`                   |
| The `toService()` alias concept                                | `toAlias()` — a clearer name, with hint forwarding specified                       |
| `BindingIdentifier` / `.getIdentifier()`                       | Concept kept, renamed to `.id()` — shorter                                         |
| `whenNamed` / `whenTagged` / `whenDefault` / `when(predicate)` | Kept; tag keys are declared with `tag()`, criteria minted with `TagKey.of()`       |
| `isBound()` checking the hierarchy                             | `has()` — same semantics, with hint support                                        |
| `isCurrentBound()` checking the current container only         | `hasOwn()` — a clearer name                                                        |
| `unbindAll()` / `unbindAllAsync()`                             | Kept as-is                                                                         |
| `@postConstruct()` / `@preDestroy()` method decorators         | Kept, on TC39 Stage 3, supporting several methods per class rather than just one   |
| `getAll` filter semantics                                      | `resolveAll` — filter semantics, returning `[]` when nothing matches               |
| `bind(id).unbind(bindingId)` — unbinding one specific binding  | Kept, via `container.unbind(bindingId)`                                            |

---

### Summary: improved over v8

| InversifyJS v8                                                           | This library                                                                                           |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `reflect-metadata` + `experimentalDecorators` required                   | Zero `reflect-metadata` — TC39 Stage 3, no legacy flags                                                |
| `ServiceIdentifier` is a union type, not branded                         | `Token<Value>` branded — `resolve` always has the right type                                           |
| `container.get<WrongType>('id')` compiles                                | Impossible — `Token<Value>` carries the type at compile time                                           |
| `inSingletonScope()` / `inTransientScope()` / `inRequestScope()`         | `singleton()` / `transient()` / `scoped()` — shorter names, no `in` prefix                             |
| `toDynamicValue` takes sync and async, with no compiler enforcement      | `toDynamic` vs `toDynamicAsync` — the compiler enforces `resolveAsync()` where needed                  |
| No `toResolvedValueAsync`                                                | `toResolvedAsync(factory, deps)` — symmetric with `toResolved`                                         |
| `when*` available after scope                                            | `on*()` only after scope — an invariant chain order that removes the ambiguity                         |
| `onDeactivation` has no compile-time guard                               | Builder type narrowing — `onDeactivation` exists only on `SingletonBindingBuilder`                     |
| `toService()` returns `void`                                             | `toAlias()` returns an `AliasBindingBuilder` — with `when*`, `.id()` and hint forwarding               |
| `@inject` on a parameter needs `experimentalDecorators`                  | `@injectable([deps])` + `inject()` — pure TC39 Stage 3                                                 |
| `@inject` on a plain property                                            | `@inject accessor field` — using the TC39 `accessor` keyword                                           |
| `getAll()` is sync only                                                  | `resolveAll()` + `resolveAllAsync()`                                                                   |
| `container.get()` + `{ optional: true }` — hidden inside options         | `resolveOptional()` + `resolveOptionalAsync()` — an explicit method name                               |
| `tag` is a single tag object — no multi-tag support                      | `tags` is a `ReadonlyArray<BindingTag>`, interned — multi-tag, compared by identity                    |
| The `Symbol.metadata` prototype chain is not handled                     | `SymbolMetadataReader` uses an `Object.hasOwn` guard — no leaking of parent metadata                   |
| `ContainerModule` / `AsyncContainerModule` are not distinguished by type | `SyncModule` / `AsyncModule` branded — `load(asyncModule)` is a TypeScript error                       |
| `@postConstruct` allows only one method per class                        | Arrays supported — several `@postConstruct()` / `@preDestroy()` per class                              |
| No `validate()`                                                          | `container.validate()` — static captive-dependency detection, transitive through aliases               |
| No `initializeAsync()`                                                   | Idempotent warm-up, with the cross-container trigger documented                                        |
| No typed error hierarchy                                                 | `DiError` abstract + a `code` string + context fields on every subclass                                |
| A module can `unbind` / `rebind` another module's bindings               | `ModuleBuilder` is additive-only — avoids hidden coupling between modules                              |
| Module deduplication is not specified                                    | Object-identity deduplication + explicit reference counting                                            |
| `rebind` does not throw when the token is unbound                        | `RebindUnboundTokenError` — an explicit contract                                                       |
| Predicate ambiguity throws `InternalError`                               | `AmbiguousBindingError` with `candidateIds` — a user error, not an internal one                        |
| Concurrent async singleton resolution is not specified                   | Serialized through an in-flight Promise map — the factory runs exactly once                            |
| A container after dispose: undefined behaviour                           | `DisposedContainerError` + an `isDisposed` getter                                                      |
| Async unbind called synchronously: silent failure                        | `AsyncDeactivationError` — explicit                                                                    |
| No `lookupBindings`                                                      | `lookupBindings()` returns `BindingSnapshot[]` — never `undefined`                                     |
| `toService()` + hint semantics are not specified                         | `toAlias()` hint forwarding is documented                                                              |
| No testing guide                                                         | [Testing guide](#testing-guide) with patterns for isolated containers, child overrides, MetadataReader |
| `autoRegister` through a global option or per-get                        | `createAutoRegisterRegistry()` — an explicit registry, no global state                                 |
| `[Symbol.asyncDispose]()` is not specified                               | `dispose()` + `[Symbol.asyncDispose]()` — `await using` support                                        |
| `[Symbol.dispose]()` is not specified                                    | `[Symbol.dispose](): never` — throws `SyncDisposalNotSupportedError`, plainly                          |
| No `lookupBindings()`, `inspect()`, `generateDependencyGraph()`          | A full introspection API — typed snapshot, JSON graph, DOT export                                      |

---

<a id="not-adopted-from-v8"></a>

### Summary: not adopted from v8

| InversifyJS v8                                                           | Why not                                                                             |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `string \| symbol` as a service identifier                               | Not type-safe — use a branded `Token<Value>`                                        |
| `new Container({ parent })`                                              | Use `container.createChild()` — explicit, no mixing config with hierarchy           |
| `new Container({ autobind })`                                            | Not supported — the "zero magic" principle                                          |
| `new Container({ defaultScope })`                                        | No overriding the default scope at container level — avoids hidden behaviour        |
| `container.get(id, { autobind: true })` per resolve                      | Not supported — the "zero magic" principle                                          |
| `container.getAll(id, { chained: true })` chained resolution             | Absent — walking up the parent chain is automatic, no opt-in needed                 |
| `snapshot()` / `restore()`                                               | Module composition + `bind()` at a child replaces it in test workflows              |
| `container.register(PluginClass)`                                        | No plugin system — avoids a hidden extension mechanism                              |
| `toFactory(ctx => curriedFn)`                                            | `toConstantValue(fn)` or `toDynamic` — less indirection                             |
| `rebindAsync()` — async unbind then bind again                           | Use `unbindAsync()` then `bind()` — two clear steps, explicit semantics             |
| Parameter decorators `@inject` / `@optional` / `@named` / `@tagged`      | TS1206 — they do not exist in TC39 Stage 3                                          |
| `@multiInject(id)` on a parameter / property                             | `injectAll(token)` in the deps array — a plain function, no decorator needed        |
| `@injectFromBase()` / `@injectFromHierarchy()`                           | An explicit deps array replaces them — no implicit inheritance injection            |
| `@unmanaged()` on a parameter                                            | In a deps array, simply do not declare an arg that needs no injection               |
| `decorate(decorator, target, idx)`                                       | Third-party class integration is not a target                                       |
| `LazyServiceIdentifier<T>` — deferred evaluation for circular deps       | `accessor` property injection solves circular deps directly                         |
| The `ContainerModule` callback has `bind`, `unbind`, `rebind`, `isBound` | `ModuleBuilder` has only `bind` + `import` — avoids hidden coupling between modules |
| `when*` ancestor/parent constraints on the main API surface              | Present at the root, plus a dedicated subpath for anyone wanting a narrow import    |
| `inRequestScope()` per-resolve-tree semantics                            | `scoped()` per child container — a clearer lifecycle boundary                       |
| `toResolvedValue` with per-dep name/tag injection options                | `toResolved` takes a plain token array — for name/tag, use `toDynamic`              |

---

## Changelog of this rewrite

This revision changes how the specification is **presented**. It adds no rule, removes no rule, and softens no rule;
every normative statement, case table, scope matrix, lifecycle order, error code and source pointer of the previous
revision is carried over with its meaning intact.

**Structure and presentation**

- Added a [How to read this document](#how-to-read-this-document) preface naming the three callout kinds (_Normative_,
  _Exact shape_, _Rationale / Compatibility_). No hand-written table of contents: the docs site at codefastlabs.com
  generates one from the headings.
- Every section now follows one order: what the concept is, the governing rule, a short example, edge cases and tables,
  then rationale or compatibility notes last.
- Normative content that was previously inline bold prose is set in labelled `> **Normative.**` blockquotes; rationale
  that was previously interleaved with rules is set in labelled `> **Rationale.**` blockquotes at the end of its
  section.
- Long mixed paragraphs were split into bullet lists or tables: the deactivation-by-scope rules, the `ResolveOptions`
  fields, the `ConstraintContext` fields, the `MetadataReader` port, the six resolve methods, the module interface, and
  the "how to read the rows" notes under the builder table.
- Sub-headings were added inside the dense sections (`ResolveOptions`, `ConstraintContext`, Slots and last-wins,
  Resolution, Managing bindings, Module management, Introspection, MetadataReader, Property injection) so each rule has
  its own anchor.
- The lifecycle-order diagram is followed by a numbered step-by-step gloss; the Container-level hooks section links to
  it instead of restating it in full.
- Stale cross-references were corrected: "see 2.4" now cites [Fluent chain](#chain-order) by anchor, and the "Last-wins"
  principle now cites [Slots and last-wins](#slot-matching) for the definition (it previously pointed at the examples).
- The Container interface table is introduced as "nine groups", matching its nine rows.

**Current rule separated from history or compatibility**

- Slots and last-wins: the one-rule model is stated on its own; the comparison with the earlier two-rule model is a
  single _Compatibility_ note at the end of the section.
- Token replaces ServiceIdentifier: the branded-token rule is stated first; the InversifyJS `container.get<WrongType>`
  observation is a _Compatibility_ note.
- Binding kinds: the `toDynamicValue` comparison with InversifyJS is marked as compatibility text inside its note.
- The boundary between a library bug and a caller error: the three errors that exist because of the `InternalError` rule
  are named without recounting what they threw before.
- Advanced Constraints, "Why identity comparison is enough": the observation that the implementation table has no
  pairwise loop is stated in the present tense.
- Slots and last-wins, container-local rule: stated as a rule about locality, without the historical aside.

**Mental-model openers added**

`ResolveOptions` · `ConstraintContext` · `ActivationHandler` and `DeactivationHandler` · Binding API · Scope ·
Constraints — `when*` · Builder type interfaces · Slots and last-wins · Container API · Resolution · Async contamination
· Singleton async creation · `rebind` semantics · Reference counting · Child containers · `has(token)` vs
`has(token, hint)` · Decorator layer · MetadataReader · Property injection through `accessor` · Auto-registration ·
Advanced Constraints · Module system · Error hierarchy. The Foundation types section also gained a map table listing
each type, what it is, and where a reader meets it.

---

_Document version: 8.2 — September 2026_ _Inspired by InversifyJS v8.0.0 (March 2026) — researched from
docs.inversify.io_

## License

Released under the [MIT License](./LICENSE).
