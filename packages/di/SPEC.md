# DI Library — Design Specification

> Inspired by InversifyJS v8 · Built from scratch · Zero `reflect-metadata` · TC39 Decorators Stage 3 · TypeScript 7+ ·
> ESM-only

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

Everything specified here is observable through the public API. What the engine is made of — its layers, caches and
compiled plans — is in [`ARCHITECTURE.md`](./ARCHITECTURE.md); why the API is shaped like this rather than InversifyJS
v8's is in [`DECISIONS.md`](./DECISIONS.md); how to use it is in [`README.md`](./README.md); and how to build, test and
release the package is in [`CONTRIBUTING.md`](./CONTRIBUTING.md). A rule a caller cannot see broken does not belong
here.

---

## Scope and requirements

`@codefast/di` is a dependency-injection container for TypeScript with no runtime dependencies. It is not compatible
with any version of InversifyJS, by design.

> **Normative — what a consumer must bring.**
>
> - **ESM only.** There is no CommonJS build and no dual build.
> - **Node.js ≥ 24**, the first line with explicit resource management built in.
> - **In a browser, Chrome and Edge 136, Firefox 136, or Safari 18.4**, the first releases that ship every ES2025
>   builtin ([support policy](../../SUPPORT.md#browsers)). `await using` also needs the browser to ship explicit
>   resource management, which Safari has not; `dispose()` needs nothing extra.
> - **TypeScript ≥ 7**, the one compiler that type-checks this package and emits its published declarations. Stage 3
>   decorators are TypeScript's default, so `experimentalDecorators` and `emitDecoratorMetadata` stay **off** and
>   `reflect-metadata` is never loaded ([tsconfig setup](#tsconfig-setup)).
> - **The explicit resource management types.** The declarations key `Container`'s disposal methods by
>   `Symbol.asyncDispose` and `Symbol.dispose`, which no numbered `lib` declares before ES2027. `@types/node` 24 or
>   later loads them, and so does `ESNext.Disposable` in `lib` ([tsconfig setup](#tsconfig-setup)).
> - Decorators themselves are optional: an application that declares every binding explicitly needs nothing beyond the
>   runtime and the module format.

The entry points a consumer imports from are in [Public API](#public-api).

---

## Design principles

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

One consistent rule: **unqualified = sync, `Async` suffix = async**. There is never a `Sync` suffix. The one exception
is `dispose()`, which is always async and returns a `Promise` — disposal has no sync form to tell it apart from, and it
is the name `Symbol.asyncDispose` pairs with.

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
>   `on*`. `toConstantValue()` is the exception: a constant is always a singleton, so its builder offers `on*` directly
>   with no scope step.

> **Rationale — why lifecycle comes after scope.** If `onActivation` could be called before scope, it would be unclear
> whether activation fires for a transient instance (every resolve) or a singleton (only the first). Forcing scope to be
> declared first removes the ambiguity entirely — a reader knows immediately which context the activation runs in.

### Other principles

- **Zero magic.** Decorators are optional. An entire app can be written with explicit bindings and not a single
  decorator.
- **Last-wins / override.** `bind()` applies **slot-aware last-wins at registration time**. Same slot (`default`, same
  `whenNamed`, same `whenTagged`) means the new binding replaces the old one; a different slot appends, which is what
  serves `resolveAll`. The exact definition is in [Slots and last-wins](#slots-and-last-wins--the-exact-definition);
  worked examples are in [Full examples](#full-examples).
- **Eager commit.** `to*()` commits the binding into the registry immediately — exactly **once** for the whole chain.
  Every read after that (`has`, `resolve*`, `validate`, `inspect`) sees the latest state, even if the chain is abandoned
  midway.
- **Async must be explicit.** `resolve()` on an async binding throws `AsyncResolutionError` with a clear message. It
  never silently returns a `Promise`. Once an async singleton is cached — by `resolveAsync()` or `initializeAsync()` — a
  plain `resolve()` returns that instance, since no async work is left to do.
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
| `DependencySlot`                            | What one resolvable dependency declares                | `@injectable([…])` deps, `ParamMetadata`            |
| `TokenValue`                                | Extracts `Value` from a token or constructor           | Type-level helper                                   |

### `BindingScope`

```ts
type BindingScope = "singleton" | "transient" | "scoped";
```

### `BindingIdentifier`

An opaque branded number — it cannot be constructed by hand from outside the library. It is handed out by `.id()` on a
builder, by `ResolutionFrame.bindingId`, and by `BindingSnapshot.id`, and it is an identity to hand back to
`unbind(id)`, never a value to parse or display.

```ts
declare const BINDING_ID_BRAND: unique symbol;
type BindingIdentifier = number & { readonly [BINDING_ID_BRAND]: true };
```

### `Constructor`

```ts
/**
 * Concrete constructor — can be called with `new`.
 * An abstract class does not satisfy this type; use Token<Value> for abstract classes.
 * `never[]` rest parameters keep a class with a typed constructor assignable under `strictFunctionTypes`.
 */
type Constructor<out Value = unknown> = new (...args: Array<never>) => Value;
```

> **Abstract classes.** TypeScript does not allow `new AbstractClass()`, so an abstract class does not satisfy
> `Constructor<Value>`. To bind an abstract class as a token, use `Token<Value>` instead.
> `container.bind(AbstractLogger)` with `AbstractLogger` as an abstract class is a TypeScript error.

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

### `ResolveOptions`

**Mental model.** A single resolve may carry a hint made of _criteria_. A criterion is one `[key, value]` pair minted
from a declared tag key. A **name is also a criterion** — one of the reserved key `slotName` — so `name` and `tags` feed
one selection model, not two.

**Fields.** All three are optional:

| Field  | Meaning                                                                                                                                                                | Relationship to the others                  |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `name` | Selects a binding declared with `whenNamed(name)`; typed as the names the token declares ([Token API](#token-api))                                                     | Sugar for the criterion `slotName.of(name)` |
| `tag`  | Exactly one criterion                                                                                                                                                  | Equivalent to a single element of `tags`    |
| `tags` | An array of criteria, read as a **superset filter**: it matches a binding whose _every_ declared tag is in this array — not "the binding must carry all of these tags" | Several criteria require `tags`             |

The full matching rule is in [Slots and last-wins](#slots-and-last-wins--the-exact-definition). `InjectOptions` accepts
both `tag` and `tags` and folds `tag` into `tags`, so an `InjectionDescriptor` only ever carries one spelling.

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
const Region = tag<"eu" | "us">("app:region");
container.bind(Storage).to(S3).whenTagged(Region.of("eu"));
container.resolve(Storage, { tag: Region.of("eu") });
```

#### Tag value comparison

> **Normative — tag values compare by `Object.is`, on the fast path too.** The intern cache must keep `-0` separate from
> `+0` to preserve this rule. `NaN` folds to one criterion, because `Object.is(NaN, NaN)` is `true`.

Because interning gives each value exactly one criterion, comparing criteria by **identity** answers exactly as
`Object.is` on the value does — which is why a criterion may never be constructed any other way.

#### Passing `tag` and `tags` together

> **Normative.** The request carries the **union** of both sources — equivalent to `tags: [tag, ...tags]`, and
> `InjectOptions` folds it into exactly that shape.

### `ResolutionContext`

`ctx` is what a dynamic factory (`toDynamic` / `toDynamicAsync`) receives. It is **not** a full container — it opens up
exactly the ability to resolve within the current context.

- Six methods, each taking a token plus the same optional hint: `resolve`, `resolveAsync`, `resolveOptional`,
  `resolveOptionalAsync`, `resolveAll`, `resolveAllAsync`.
- `resolveAll` throws `AsyncResolutionError` if any matching binding is async, and returns `[]` when nothing matches.
  Both collection reads return a `ReadonlyArray` that belongs to the caller: every read hands out a fresh array, the
  memoized root-level read included, so writing into one can never change what a later read returns.
- `graph` holds the `ConstraintContext` — the dependency-graph context used inside a `when()` predicate. An ordinary
  resolve never needs it. Read from a factory, it describes the factory's own level: its `resolutionStack` ends with the
  frame of the binding the factory is building, so `parent` is that binding — what a dependency the factory resolves
  sees as its parent.

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
| `ancestors`             | Every frame above `parent`, root first                                                                    |
| `currentResolveOptions` | The hint passed into the current resolve, `undefined` if there is none                                    |

**A `ResolutionFrame`** holds: `tokenName` (for display in error messages), `scope`, `bindingId`, `kind`, and the
**`slot`** of the binding matched for that frame. A slot is the binding's criterion set: `tags` (every criterion, the
reserved name criterion included) plus `name`, the derived view of the reserved criterion (`undefined` if the binding
declares no `whenNamed()`), and `keyMask`, a bitmask of the tag keys present that lets a constraint rule out a frame
without walking its tags — see [Slots and last-wins](#slots-and-last-wins--the-exact-definition).

> **Normative.** A frame's `slot` reflects the **constraint registered at bind time**, not the hint passed at resolve
> time. The advanced constraints in [Advanced Constraints](#advanced-constraints) read exactly this field.

**`BindingKind`** is one of seven values: `class`, `dynamic`, `dynamic-async`, `resolved`, `resolved-async`, `constant`,
`alias`.

> **Exact shape:** `src/core/types.ts` — `ConstraintContext`, `ResolutionFrame`, `BindingKind`.

#### `resolutionStack` ordering and its views

> **Normative.**
>
> - `resolutionStack` is a readonly view of the entire resolution path **above** the current token — it does not include
>   the token being resolved. It is valid while the predicate runs: the engine reuses the path it views, so a context
>   kept past its call is not guaranteed to stay consistent with itself.
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
> slot) — used by advanced constraints and by validate. Both describe the same path, and a rule stated over one holds
> over the other.

### `DependencySlot`

The shape **one resolvable dependency** declares, whichever source it came from: a constructor parameter read through
the `MetadataReader`, or an element of a `toResolved` deps array.

```ts
interface DependencySlot {
  readonly token: Token<unknown> | Constructor;
  readonly optional: boolean;
  readonly multi: boolean;
  readonly name?: string | undefined;
  readonly tags?: ReadonlyArray<BindingTag> | undefined;
}
```

> **Normative — both dependency sources are this shape.** `InjectionDescriptor` (what `inject`, `optional` and
> `injectAll` return) and `ParamMetadata` (what a `MetadataReader` reports per constructor parameter) each extend it,
> adding only what is theirs: a value type parameter and an `index` respectively. Every rule this document states about
> a dependency's `optional`, `multi`, `name` and `tags` therefore holds for both.

A slot's criteria are a request waiting to be made: `injectionSlotToResolveOptions(slot)` turns the `name` and `tags` of
one into the [`ResolveOptions`](#resolveoptions) that asks for them, omitting a key rather than setting it to
`undefined`, and answering `undefined` when the slot states no criteria. The binding side has its own converter
([Resolving what a snapshot points at](#resolving-what-a-snapshot-points-at)).

> **Exact shape:** `src/injection/resolve-options.ts` — `DependencySlot`.

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
const Logger = token<LoggerService>("app:Logger");
const Database = token<DatabaseService>("app:Database");
const Config = token<AppConfig>("app:Config");

// Token for a primitive
const Port = token<number>("app:Port");
const Env = token<"development" | "production">("app:Env");

// Organised by domain
export const Tokens = {
  Logger: token<LoggerService>("app:Logger"),
  Database: token<DatabaseService>("app:Database"),
  Config: token<AppConfig>("app:Config"),
} as const;
```

### Display names

The string a `token()`, `tag()` or module factory takes is its **display name**: what diagnostics print, what
`ResolutionFrame.tokenName` carries, and what the `when*Is` / `when*Named` constraints compare. It is not the thing's
identity — the object is — so two declarations may share one, and nothing but this rule stops them.

> **Normative — a display name is spelled like the TS symbol it stands for, under its owner's namespace:
> `<namespace>:<Name>`.**
>
> | Kind    | Stands for                        | Name half  | Example                            |
> | ------- | --------------------------------- | ---------- | ---------------------------------- |
> | token   | a type or class                   | PascalCase | `shop:Logger`, `di:MetadataReader` |
> | module  | a unit of composition             | PascalCase | `shop:Infra`, `app:Root`           |
> | tag key | an attribute a request selects on | camelCase  | `shop:cacheTier`, `di:name`        |
>
> The namespace is the owner — the kebab-case slug of the package, app or feature that declares the name, or a scoped
> package name (`@scope/pkg:Config`) — and the library's own names sit under `di:`. Slot names (`whenNamed("primary")`)
> and tag values (`Region.of("eu")`) are **values**, not display names: they mean something only within one token or one
> key, so they stay lowercase and take no prefix. The convention holds in the library, the docs and every example, and
> `pnpm cli:audit:display-names` fails the build where it does not; tests and benchmarks are outside it, since a name
> there is scoped by its file and meets no other author's.

What it buys: a diagnostic that says `No binding for 'shop:Logger'` names one owner; two features that each declare a
`Clock` cannot produce a `whenParentIs` false match; a reader tells a token from a tag key from a module by its shape;
and a doc sample carries the shape a real app needs.

### Type signature

```ts
// Branded type — cannot be forged with an ordinary object literal
declare const TOKEN_BRAND: unique symbol;
declare const TOKEN_NAMES_BRAND: unique symbol;

interface Token<Value, Names extends string = string> {
  readonly name: string;
  readonly [TOKEN_BRAND]: Value; // unique symbol, not exported
  readonly [TOKEN_NAMES_BRAND]?: Names; // phantom: the slot names this token's bindings may declare
}
```

```ts
// Declaring the slot names makes every `name` the token meets a checked, completable literal
const Logger = token<Logger, "console" | "file">("app:Logger");
container.bind(Logger).to(FileLogger).whenNamed("file");
container.resolve(Logger, { name: "file" }); // { name: "fiel" } is a compile error
type Names = SlotNamesOf<typeof Logger>; // "console" | "file"; `string` for a class or an undeclared token
```

`Names` is covariant and defaults to `string`, so a token declaring none behaves as before, and a declaring token is
still a `Token<unknown>` wherever the engine erases the value type. Only the token infers `Names`: the `options` bag of
`resolve*`, `has`, `hasOwn`, `inject`, `optional` and `injectAll` is `NoInfer`, so a request cannot widen the set.

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

> **`toSelf()` without `@injectable()`.** If `ConsoleLogger` has no `@injectable()` and its constructor declares
> parameters, the container throws `MissingMetadataError` — it does not assume zero deps. "Declares parameters" is the
> class's `length`, the count of parameters before the first one with a default or a rest: a constructor of `(...deps)`
> or `(a = x)` has a `length` of 0, so it is built with no arguments and nothing throws. To use `toSelf()` with
> constructor deps but no decorator, use `toDynamic()` or `toResolved()` instead.

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
> can carry constraints and `.id()` — the only builder with no value type parameter, because an alias produces no value
> of its own; it keeps the `Names` parameter so its `whenNamed()` stays checked.

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
> - Scope **always** comes after `when*` in the chain ([Fluent chain](#fluent-chain--the-canonical-invariant-order)).
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
[`validate`](#validate--detecting-captive-dependencies) for the limits of `validate()`.

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

### Constraints — `when*`

**Mental model.** A constraint decides _when_ a binding is eligible for a request. There are two mechanisms:

- **Slot criteria** — `whenNamed`, `whenTagged`, `whenDefault`. Static, declared at bind time, matched at constant cost
  against the request's hint. They define the binding's _slot_
  ([Slots and last-wins](#slots-and-last-wins--the-exact-definition)).
- **Predicates** — `when(ctx => boolean)`. Dynamic, evaluated at resolve time against the `ConstraintContext`, after
  slot matching.

`when*` comes immediately after `to*()`, before scope. A binding may carry one or several combined constraints.

```ts
// Named binding
container.bind(Logger).to(ConsoleLogger).whenNamed("console").singleton();
container.bind(Logger).to(FileLogger).whenNamed("file").singleton();

// Tagged binding — a criterion can only be minted from a tag key, never by hand
const Fuel = tag<"petrol" | "electric">("app:fuel");
const Size = tag<"v8" | "v6">("app:size");

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
> `Object.is` ([`ResolveOptions`](#resolveoptions)). The key name is still a `string`, so it follows the display-name
> convention ([Display names](#display-names)): `tag("mylib:fuel")`, `tag("@scope/pkg:env")`.

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

### `toAlias` — hint forwarding

An alias points at another token. When the alias is resolved, the hint is **forwarded** to the target token's
resolution.

> **Normative — a default-slot alias is transparent.** An alias with no slot, predicate or membership of its own answers
> a request whose criteria no slot of its token matches, and forwards those criteria to its target unchanged. An exact
> slot on the alias's own token is tried first and still wins, and the nearest container that can answer does, as for
> any binding. This holds for `resolve`, `resolveOptional` and their async forms, and `has` agrees with them;
> `resolveAll` filters the alias's token by its own slots, so a default-slot alias does not join a collection read that
> carries criteria.

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
// → the Logger binding matching { name: "audit" }; with none, NoMatchingBindingError names Logger
```

> **An alias has no scope of its own.** The scope is decided by the target binding. An alias is only a pointer — it
> caches no instance.

> **A dangling alias is a miss, not an error.** Because an alias is transparent, an optional or collection read whose
> alias chain ends at a token nothing matches answers `undefined` / skips the member, exactly as it would for the target
> directly; only a required `resolve` / `resolveAsync` throws. An alias **cycle** always throws
> `CircularDependencyError`.

### Builder type interfaces

**Mental model.** Each step in the chain returns a different builder, and it is precisely that builder's method set
which enforces the order in [Fluent chain](#fluent-chain--the-canonical-invariant-order). Reading the table row by row
tells you what you may call next.

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
  ([`ActivationHandler` and `DeactivationHandler`](#activationhandler-and-deactivationhandler)).

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
>   ([Advanced Constraints](#advanced-constraints)).
> - `{ name: n }` in `ResolveOptions` / `InjectOptions` ≡ `{ tag: slotName.of(n) }` — the request-side sugar
>   ([`ResolveOptions`](#resolveoptions)).
> - **One criterion per key, reserved key included:** a slot carries at most one criterion of any key — re-declaring a
>   key, through either verb, replaces that key's criterion. `whenNamed` inherits this rule rather than adding one.
> - What reserves the key is its **identity**, not its display name. Diagnostics render its criterion as `name:<value>`,
>   never `tag:…`, and `BindingSlot.name` is the derived view of it that `ResolutionFrame.slot`
>   ([`ConstraintContext`](#constraintcontext)) and the `when*Named` constraints read.
> - A tag key types its values; the reserved key is shared, so a name's values are typed by the **token** instead:
>   `Token<Value, Names>` narrows `whenNamed`, every request-side `name`, and the `name` of `whenParentNamed(T, name)` /
>   `whenAnyAncestorNamed(T, name)` to the `Names` of the token they name ([Token API](#token-api)). A name is a label
>   on one token's slots; a label shared across tokens is what a tag key is for.

> **Normative — slot equality.** Two binding slots are **equal** when their criterion sets are equal by the identity of
> each criterion (order does not matter). Because criteria are interned ([`ResolveOptions`](#resolveoptions)), identity
> here gives exactly the result of `Object.is` on `[key, value]`. The `default` slot is the empty criterion set.

> **Normative — predicate-only `when()`.** A binding carrying only `.when(predicate)` (with no `whenNamed`/`whenTagged`)
> **does not take part in slot last-wins** — several bindings for one token can coexist with the same binding slot. If ≥
> 2 candidates remain after runtime filtering, `resolve`/`resolveAsync` throws `AmbiguousBindingError` (not
> `InternalError` — this is a user error, not an internal one).

> **Normative — collection members: `many()`.** A binding refined with `.many()` is a **collection member**: several
> members of one token coexist on the default slot, `resolveAll`/`resolveAllAsync` return every member (plus whatever
> else the request matches, in registration order), and `resolve`/`resolveAsync` **never select** a member — a token
> holding only members has nothing a single resolve can select, so `resolve` throws `NoMatchingBindingError` (the token
> is bound, just not on a slot the request can pick) and `resolveOptional` answers `undefined`. A member takes no part
> in slot last-wins: it neither displaces nor is displaced by the ordinary default binding or by other members. A member
> keeps the default slot — `many()` on a named or tagged binding, or `whenNamed`/`whenTagged` on a member, throws
> `ManyBindingSlotError` — and may carry `when()` predicates, which apply as for any candidate. This is the intended
> form of a strategy set; a predicate that always passes is not.

**Candidate:** a binding whose slot matches the request's criterion set and that passes every `when(ctx)` predicate.

#### The matching rule

> **Normative — filtering `ResolveOptions` → slot.** One rule, whatever mix of spellings the request uses:
>
> - **The request's criterion set** is the union of `tags`, `tag`, and — when `name` is present — `slotName.of(name)`
>   ([`ResolveOptions`](#resolveoptions)); `tags: []` counts as no criteria.
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
bindings but no slot matches the empty hint. The message lists the available slots — `"Available slots: [name:a]"` here,
since B replaced A on the one slot both declared; row 4 lists `[name:a, name:b]`.

> **Normative — a displaced binding still deactivates.** When a plain last-wins `bind()` (rows 2, 3, 7) displaces a
> binding that owns a deactivation — a `singleton` or `toConstantValue` with an `onDeactivation` hook — the displaced
> binding leaves the selection but its instance is still torn down — at `dispose()`, or earlier when its id is unbound
> ([`unbind` and singleton deactivation](#unbind-and-singleton-deactivation)) or the module that registered it is
> unloaded ([`unload` and cached singletons](#unload-and-cached-singletons)). Last-wins changes which binding answers a
> resolve; it does not silently drop a lifecycle the container still owes. The same holds when the displacing bind runs
> inside a module load — `Module.create` setup or a declared module alike — and unloading that module does not restore
> the displaced binding: it stays out of the selection, and its deactivation stays owed.

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
> `NoMatchingBindingError` even when `has(token)` is `true`. See [Introspection](#introspection) for the right way to
> use `has` + `hasOwn`.

> **Compatibility — the one-rule model vs. the earlier two-rule model.** Under the earlier model, a request's `name` was
> compared by equality (absence included), which excluded every slot that declared no name. Under the one-rule model
> above, those slots match whenever their criteria are covered (the `{fuel:petrol}` cell in the last row of the matrix),
> and specificity decides as usual (case-table row 9). Outcomes differ **only** for a request carrying both a `name` and
> at least one tag. A request carrying only a name, only tags, or nothing resolves exactly as before.

### The `Binding` discriminated union

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
>   merely within one container), from a process-wide monotonic counter. Later refinement (`.singleton()`,
>   `.whenNamed()`, …) does **not** mint a new id — the id taken from `.id()` at any step of the chain stays valid until
>   the chain ends.

**The scope of an alias is its target's — at resolve time.** An `AliasBinding` does carry a `scope` field, but it is
always `"transient"`: a placeholder declared only so the engine reads `scope` as a plain field on every kind rather than
testing for the one that would lack it. An alias is followed to its terminal binding before anything is built, so the
resolved value's scope and lifecycle are the terminal binding's, never the alias's own `"transient"`. If the chain ends
at another `AliasBinding`, keep following. If there is a cycle → `CircularDependencyError`.

---

## Container API

**Mental model.** A container holds bindings, resolves tokens into values, owns the instances it caches, and can spawn
child containers that see its bindings. Everything a container does falls into nine groups, listed in
[The Container interface](#the-container-interface).

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
sync and an async form. Sync never returns a `Promise` it created; if anything on the path is async, the sync form
throws. A `Promise` that is itself the bound value — `toConstantValue(somePromise)` — is returned as the value it is.

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
> - The token is an alias whose chain ends at a token nothing matches → returns `undefined`: an alias is transparent, so
>   a dangling chain is the same miss the target would be. An alias **cycle** still throws `CircularDependencyError` — a
>   cycle has no absent reading. The same holds for `resolveAll` / `resolveAllAsync`: a dangling alias member is
>   skipped, never thrown.

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
> `@postConstruct()`, then `A` is async too. Async contamination spreads along the entire dependency path, and
> `container.resolve(A)` throws, at resolve time. The error names what is async:
>
> - an **async factory** throws `AsyncResolutionError`, whose message and `asyncSourceToken` name the token in the chain
>   that carries it;
> - an **async hook** — `@postConstruct()` or `onActivation` returning a `Promise` — throws `AsyncActivationError`,
>   carrying `hookKind` and, for a method, `methodName`
>   ([`AsyncActivationError` vs `AsyncResolutionError`](#asyncactivationerror-vs-asyncresolutionerror)).

```
AsyncResolutionError: Token 'app:Api' requires async resolution because 'app:Database'
in its dependency chain has an async factory. Use container.resolveAsync(app:Api).
  asyncSourceToken: "app:Database"
```

#### Singleton async creation — serialized

**Mental model.** Two callers racing for the same async singleton wait on the same creation, so the factory runs once.

> **Normative.** Concurrent `resolveAsync(Token)` calls for the same singleton token **share one in-flight Promise**.
> The implementation must guarantee:
>
> 1. When the factory starts running, the Promise is stored in the in-flight map.
> 2. The next concurrent call awaits that same Promise — no new instance is created. What it is handed back is a
>    `Promise` of its own that settles with the shared result, not the stored object itself.
> 3. When the Promise settles (resolved or rejected), the in-flight map entry is cleared.
> 4. If the factory rejected, the next resolve creates a new Promise (retry).

```ts
// Both get the same instance — the factory runs only once
const [a, b] = await Promise.all([container.resolveAsync(Database), container.resolveAsync(Database)]);
// a === b: true
```

#### Code generation and Content Security Policy

A transient class, `toResolved` or `toResolvedAsync` binding a container has resolved many times, through `resolve` or
`resolveAsync`, has its compiled plan generated as a function of its own through the `Function` constructor; a runtime
that refuses the constructor (a Content Security Policy without `unsafe-eval`) leaves every plan a closure.

> **Normative.** The two paths are indistinguishable to a caller — the same instances, the same errors, the same cycle
> detection — and only the throughput of a hot plan differs. A container reports how many plans it has generated as
> `generatedPlanCount`, through the `RESOLUTION_DIAGNOSTICS` symbol ([Public API](#public-api)).

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
// unbindAll also clears module bookkeeping, so a previously-loaded module can be load()ed again

// Rebind — remove every own binding of the token, then bind again
// If the token has no own binding yet → throws RebindUnboundTokenError
container.rebind(Logger).to(FileLogger).singleton();
```

> **Normative — `unbindAll` resets module bookkeeping.** Clearing every binding also clears the module ref-counts,
> binding-id lists and import records, so a module loaded before `unbindAll` can be `load()`ed again rather than being
> silently skipped as already-loaded. Deactivation runs first, so a module singleton's hook still fires.

#### `rebind` semantics

**Mental model.** `rebind` means "replace a binding that already exists in _this_ container". It is an atomic
unbind-then-bind, never a way to override a parent.

> **Normative.** `rebind(token)` only affects the **own** bindings of the current container. If the token is only bound
> at the parent (not at the child), `child.rebind(token)` throws `RebindUnboundTokenError`. When the old bindings owe no
> deactivation, `rebind()` removes nothing up front and `to*()` swaps in place — there is no gap between the unbind and
> the bind. When they owe one, `rebind()` unbinds and deactivates them itself, before any replacement exists.

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
> - `unbind(bindingId)` reaches a binding a later last-wins bind displaced, too: its cached singleton, or a constant's
>   owed `onDeactivation`, runs then rather than at `dispose()`, and no refinement of the displacing chain can restore
>   it afterwards.

#### `rebind` and async deactivation

> **Normative.** Deactivation of the old singleton follows the same rule as `unbind`:
>
> - If the old binding has **no** async `onDeactivation` (or no `onDeactivation` at all): a sync `rebind()` is safe.
> - If the old binding **does** have an async `onDeactivation`: a sync `rebind()` throws `AsyncDeactivationError` — the
>   same behaviour as a sync `unbind()`. The throw comes from `rebind()` itself, the old bindings are already removed,
>   and no replacement is committed, whatever shape the token had.

There is no `rebindAsync()` (see [Not adopted from v8](./DECISIONS.md#not-adopted-from-v8)), so the required workaround
is:

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
> - A binding the module registered that a later last-wins bind displaced is torn down the same way: its cached
>   singleton, or a constant's owed `onDeactivation`, runs at this unload rather than waiting for `dispose()`, and no
>   refinement of the displacing chain can restore it afterwards.
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

// `await using` — TC39 Explicit Resource Management
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

> **Normative — disposing a container reaches its descendants.** A container whose parent (or any ancestor) has been
> disposed is itself disposed: `isDisposed` reads `true`, and every resolve, `has` and mutation is refused with
> `DisposedContainerError`, including the child's own bindings — a child never keeps building instances from a torn-down
> chain. `createChild()` stays O(1), and the resolve path stays cheap: a root reads only its own disposed flag, and a
> child adds one call-free dispose-epoch compare, walking the ancestors only after some container in the process is
> disposed. A child of a disposed ancestor cannot be revived — open a fresh `Container.create()` for an independent one.
>
> Disposing an ancestor refuses the child's operations but does **not** tear the child down: the child's own singletons
> are deactivated only by the child's own `dispose()`, which stays callable after its ancestor is gone. Dispose each
> child you created — `await using` does it at scope exit.

### Container state lifecycle

> **Normative.** A container has an `isDisposed` state, exposed as a readonly property. After `dispose()` is called:
>
> - Every mutation (`bind`, `unbind`, `rebind`, `load`, `unload`) throws `DisposedContainerError`.
> - Resolution operations (`resolve*`, `has*`, `inspect`) throw `DisposedContainerError` too. `resolveAsync` guards
>   synchronously at the entry, so a disposed container refuses it with a throw rather than a rejected promise.
> - `dispose()` is idempotent: calling it again is a no-op — no throw, no double-deactivation. This holds for a child
>   whose ancestor is already disposed, so an `await using` child still tears down cleanly at scope exit.
> - A descendant of a disposed container is disposed too — it reports `isDisposed` and refuses the same operations,
>   because its resolution walks a chain that is gone.

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
> - A singleton carrying a `when()` predicate is **skipped**: a predicate reads the resolution path, and warm-up has no
>   path to hand it, so such a singleton is created by its first real resolve.

### `validate` — detecting captive dependencies

```ts
container.validate();
```

Walks the dependency graph and throws `ScopeViolationError` for any violation of the scope matrix in [Scope](#scope). An
`optional()` dependency counts whenever it is bound — a singleton captures it just the same — and imposes nothing when
it is not.

> **Normative — analysis scope.** `validate()` can only statically analyse bindings whose deps are declared explicitly:
>
> | Binding kind                     | Can `validate()` analyse it?         |
> | -------------------------------- | ------------------------------------ |
> | `to(Class)` with `@injectable`   | ✅ Fully analysed                    |
> | `toSelf()` with `@injectable`    | ✅ Fully analysed                    |
> | `toResolved(factory, deps)`      | ✅ Analyses the deps array           |
> | `toResolvedAsync(factory, deps)` | ✅ Analyses the deps array           |
> | `toAlias(target)`                | ✅ Traced to the target — transitive |
> | `toDynamic(ctx => ...)`          | ❌ Its own deps are opaque           |
> | `toDynamicAsync(ctx => ...)`     | ❌ Its own deps are opaque           |
> | `toConstantValue(value)`         | ✅ No deps — always OK               |

**Alias chains.** When tracing an alias (`toAlias(target)`), `validate()` follows the chain to the final binding. If a
`singleton` consumer aliases to a `scoped` target, that is a scope violation. `validate()` checks transitively — not
only direct dependencies.

**Dynamic factories.** What a `toDynamic` or `toDynamicAsync` factory resolves inside its body is **opaque** to
`validate()`: it never reports a violation there, so it has no false positives but can miss one. The binding itself is
still checked as a dependency — a singleton that depends on a transient `toDynamic` binding is a violation like any
other. At runtime, a factory's own captive dependency is caught only when it breaks something: a singleton factory
resolving a `scoped` binding from the root throws `MissingScopeContextError`, while one capturing a `transient`
dependency raises nothing.

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

// Why a request selects the binding it does — read-only, nothing is instantiated
const explanation = container.explain(Logger, { name: "file" }); // ResolutionExplanation

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
`inspect()` on a disposed container throws `DisposedContainerError`, like every other read, so a snapshot you hold
always reads `isDisposed: false` — the field records the state the snapshot was taken in. `ownBindings` lists one
token's bindings in registration order; the order between tokens is unspecified.

Each `BindingSnapshot` carries: `tokenName`, `kind`, `scope`, `slot`, `id`, and `isMany` — `true` for a collection
member, the binding `resolveAll` takes and `resolve` never selects
([Slots and last-wins](#slots-and-last-wins--the-exact-definition)).

> **Exact shape:** `src/introspection/inspector.ts` — `ContainerSnapshot`, `BindingSnapshot`.

#### `explain(token, options?)` — why this binding and not another

`explain()` answers for one request what `resolve(token, options)` would do with it, without instantiating anything: the
bindings each registry offered, what selection made of each, the rule that settled it, and the binding the request ends
on. It reads the chain in the order `resolve` does — the container asked, then each parent — and decides by the same
rules, so its answer is the engine's, not a model of it.

```ts
container.bind(Settlement).toSelf();
container.bind(Logger).to(ConsoleLogger);
container.bind(Logger).to(AuditLogger).when(whenParentIs(Settlement));

container.explain(Logger).steps[0].candidates.map((candidate) => candidate.verdict);
// ["eligible", "predicate-refused"] — no parent, so the predicate refuses

container.explain(Logger, { ancestors: [Settlement] }).steps[0].rule;
// "sole-predicate" — inside Settlement's factory, the guarded binding wins
```

- **`steps`** holds one entry per registry that holds a token the lookup asked for, in reading order, and again for each
  alias the lookup follows. Each step carries `tokenName`, `depth` (`0` is the container asked, `1` its parent), every
  binding the registry holds for the token as `candidates` in registration order, the `rule` that settled the step, and
  the binding it `selected`. A step with no eligible candidate has neither, and the lookup moves up.
- **A candidate's `verdict`** is `eligible`, `slot-mismatch` (the slot declares a criterion the request does not carry,
  or the request carries criteria and the slot is the default one), `predicate-refused` (the slot matched and `when()`
  returned `false`), or `collection-member` (a `many()` binding, which only `resolveAll` takes).
- **The `rule`** is the step of [the more-specific rule](#the-more-specific-rule) that decided, in its order:
  `sole-candidate`, `sole-predicate` (the only eligible candidate carrying a predicate), `most-criteria` (the slot
  declaring more criteria than every other), or `ambiguous`. `default-alias` marks a request whose criteria matched no
  slot and that the token's default-slot alias forwards ([`toAlias`](#toalias--hint-forwarding)).
- **`selected`** is the binding the request resolves to after every alias hop, and **`outcome`** says how the lookup
  ended: `selected`, or the error `resolve` throws in its place — `unbound` (`TokenNotBoundError`), `unmatched`
  (`NoMatchingBindingError`), `ambiguous` (`AmbiguousBindingError`), `alias-cycle` (`CircularDependencyError`).
- **`options.ancestors`** names the resolutions the request is nested in, outermost first. Each is selected as a request
  with no criteria nested in the ones before it, and becomes a frame of the path the request's predicates read — the
  parent is the last one. An ancestor that selects nothing makes `explain()` throw the error its own `resolve` would.
  The lookup runs on the container asked, the way a factory's `ctx.resolve()` runs on its own container.

`explain()` runs `when()` predicates exactly as `resolve` does, which is safe because the contract makes a predicate
pure. On a disposed container it throws `DisposedContainerError`, like every other read.

> **Exact shape:** `src/introspection/explanation.ts` — `ResolutionExplanation`, `ExplanationStep`,
> `CandidateExplanation`, `ExplainOptions`.

#### Resolving what a snapshot points at

A snapshot's `slot` states the binding's criteria; `bindingSlotToResolveOptions(slot)` turns them into the
`ResolveOptions` that selects it, so a caller can go from introspection back to a resolve without rebuilding the hint by
hand. It is the binding-side twin of `injectionSlotToResolveOptions` ([`DependencySlot`](#dependencyslot)).

```ts
for (const binding of container.lookupBindings(Logger)) {
  const value = container.resolve(Logger, bindingSlotToResolveOptions(binding.slot));
}
```

> **Normative.** The default slot — no name, no criteria — yields `undefined`, the hint a `resolve` with no criteria
> takes. Otherwise the reserved criterion **folds into `name`** rather than being restated in `tags`, an already-present
> `name` winning over it, and the remaining criteria are returned as `tags`, omitted when none remain
> ([`ResolveOptions`](#resolveoptions)). The result therefore matches exactly the slot it came from, whichever spelling
> declared it.

A collection member's slot is the default slot, so the options it yields select the token's ordinary default binding
rather than the member — read members with `resolveAll`.

#### The `ContainerGraphJson` interface

`ContainerGraphJson` has three parts: `nodes`, `edges`, and `includesParent` (whether parent bindings were folded in —
it depends on `GraphOptions`).

Each **`GraphNode`** carries `id` (the `BindingIdentifier` rendered as a decimal string, or `"unbound:<tokenKey>"` for a
placeholder node), `tokenName`, `tokenKey` (the token's own identity — two tokens sharing a name still differ by key;
stable within one process), `kind` (or `"unbound"`), `scope` (or `"unbound"`), and `fromParent`.

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
  edge carrying `optional: true`. That keeps "optional but absent" distinct from "not a dependency". "Bound" means bound
  within the graph: with `includeParent: false`, an optional dep that only an ancestor binds is a placeholder too.
- **A required dep that is not bound is skipped** — that is `validate()`'s job, not the graph's.
- **`injectAll` fans out to every binding** of the token, each edge carrying its `slotName`.
- **Edge targets are filtered by resolution's own slot rules**
  ([`validate`](#validate--detecting-captive-dependencies)): a request that names nothing will not connect to a named
  binding it could never have resolved.
- **Predicates (`when...`) are not evaluated** — a predicate needs a real resolve context, so the graph keeps every
  candidate that has one.
- **With `includeParent: true`**, every ancestor's bindings join the graph (`fromParent: true`), and each edge follows
  resolution's own walk up the chain: a single dependency connects to the nearest container holding a binding its slot
  matches — a child binding the request cannot select shadows nothing — and an `injectAll` connects to every match in
  the chain, as `resolveAll` does.

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
  constructor(private plugins: ReadonlyArray<Plugin>) {}
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
  is built — see [`ResolveOptions`](#resolveoptions)), and `tags`.
- `InjectionDescriptor` is a [`DependencySlot`](#dependencyslot) carrying a value type parameter — `multi` is `true`
  exactly when `injectAll` created it. It comes with the type guard `isInjectionDescriptor(value)`.

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

> **Normative — normalization at decoration time.** `@injectable([...])` normalizes the whole `InjectableDependency[]`
> into `ParamMetadata[]` when the class is decorated, so the resolver only ever reads plain records:
>
> - `Token<Value>` or `Constructor<Value>` → `{ index, token, optional: false, multi: false }`
> - `InjectionDescriptor<Value>` → `{ index, token, optional, multi }` plus `name` and `tags` when it carries them — a
>   plain record, even when the descriptor came from the dual-role `inject()` function
>
> An absent `name` or `tags` is left out of the record, never set to `undefined` — the shape
> `exactOptionalPropertyTypes` expects.

`InjectableDependency` is exported from `@codefast/di` (see [Public API](#public-api)).

#### `InjectableOptions` and the full signature

`InjectableOptions` has two fields: `autoRegister` (the registry a class registers itself into; leave it out and it does
not self-register — see [Auto-registration](#auto-registration)) and `scope` (the scope used when self-registering,
ignored without `autoRegister`, defaulting to `"transient"`). It is exported from `@codefast/di`.

`injectable` has two overloads, each returning a class decorator: `injectable()` for a class with no deps, and
`injectable(deps, options?)`, where `deps` is a `readonly InjectableDependency[]` and `options` an `InjectableOptions`.
`options` needs `deps` beside it — `@injectable([], { autoRegister })` for a dependency-free class that self-registers.

### Inheritance — explicit, no magic

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

### MetadataReader — the port interface

**Mental model.** The container never touches `Symbol.metadata` itself. It asks a `MetadataReader` three questions about
a class — constructor deps, lifecycle methods, accessor fields — and a test can answer those questions with a fake.

The port has three methods:

| Method                           | Answers                                                                                                            | Required? |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------ | :-------: |
| `getConstructorMetadata(target)` | The constructor's dependencies: a list of `ParamMetadata` — a [`DependencySlot`](#dependencyslot) plus its `index` |    Yes    |
| `getLifecycleMetadata(target)`   | Two lists of method names, `postConstruct` and `preDestroy`, called in the order they appear in the class          |    Yes    |
| `getAccessorMetadata(target)`    | The list of `@inject accessor` fields, each with `key` and `descriptor`                                            | Optional  |

If a reader omits `getAccessorMetadata`, no class ever gets a container context opened for it, so every accessor
injection throws `MissingContainerContextError` unless the caller opens one with `runWithContainer`
([Property injection](#property-injection-through-the-accessor-field-decorator)).

> **Exact shape:** `src/metadata/metadata-types.ts` — `MetadataReader`, `ConstructorMetadata`, `ParamMetadata`,
> `LifecycleMetadata`.

#### Installing your own reader

> **Normative.** The resolver is **handed** its reader when it is constructed, which happens inside the container's
> constructor. The only source resolution is guaranteed to read is therefore `ContainerOptions.metadataReader`
> ([Creating a container](#creating-a-container)). This reader outranks any `MetadataReaderToken` binding, and children
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
the binding existed, so the resolver keeps the default reader, and an undecorated class whose constructor declares
parameters throws `MissingMetadataError`.

> **Normative — one container, one reader.** The reader is fixed when the container's resolver is built; `validate()`,
> `inspect()`, `generateDependencyGraph()` and `unbind*` all answer using that same reader. Introspection cannot
> disagree with resolution.

> **Normative — a reader is asked about a class once.** Every container that reads through the same reader (a child
> inherits its parent's) shares that reader's answers for the life of the process, so a reader must answer from the
> class alone — never from state that changes after the class is defined.

`MetadataReaderToken` has type `Token<MetadataReader>` and is exported from `@codefast/di`.

#### `SymbolMetadataReader` — reading metadata

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

### Property injection through the `accessor` field decorator

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

#### The mechanism — initialization order

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

> **Normative.** An accessor's `context.addInitializer` callback runs synchronously as the instance's fields initialize,
> in the same call frame as `new`. The container exploits this with a **module-level active container variable**:
>
> - `runWithContainer(container, fn)` sets the active variable to the given container, runs `fn`, then restores the
>   previous value in a `finally` block — so it is correct even when the constructor throws, and nested calls (A builds
>   B builds C) restore in the right order. It is **synchronous only**: the `finally` restores the previous value the
>   moment `fn`'s synchronous run returns, so the context does not survive an `await`. A callback returning a `Promise`
>   is rejected by the return type (it resolves to `never`).
> - `getActiveContainer()` reads the currently active container, returning `undefined` when no context is open.

> **Exact shape:** `src/ambient/active-container.ts`.

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
> - `Token<Value>` → use `token.name` (the string given at `token("app:Logger")`)
> - `Constructor` → use `Constructor.name` (the JavaScript class name)

> **Unique names.** `ResolutionFrame.tokenName` is a `string`, not a branded type. If two different tokens share a
> `name` — say `token<A>("app:Config")` and `token<B>("app:Config")` — a constraint cannot tell them apart. This is why
> a display name is `<namespace>:<Name>` ([Display names](#display-names)): two owners never mint the same name by
> accident, so a false match can only come from one owner naming two tokens alike.

### Type signatures

Ten constraints, each taking configuration parameters and returning a predicate over `ConstraintContext`:

| Constraint                          | Matches when                                                     | With no parent / ancestor |
| ----------------------------------- | ---------------------------------------------------------------- | :-----------------------: |
| `whenParentIs(token)`               | the direct parent is that token                                  |          `false`          |
| `whenNoParentIs(token)`             | the direct parent is **not** that token                          |          `true`           |
| `whenParentNamed(token, name)`      | the direct parent is that token and its slot carries that name   |          `false`          |
| `whenParentTagged(criterion)`       | the parent's slot contains that criterion                        |          `false`          |
| `whenParentTaggedAll(tags)`         | the parent's slot contains **all** the given criteria            |          `false`          |
| `whenAnyAncestorIs(token)`          | at least one ancestor is that token                              |          `false`          |
| `whenNoAncestorIs(token)`           | **no** ancestor is that token                                    |          `true`           |
| `whenAnyAncestorNamed(token, name)` | some ancestor is that token and its slot carries that name       |          `false`          |
| `whenAnyAncestorTagged(criterion)`  | some ancestor carries that criterion                             |          `false`          |
| `whenAnyAncestorTaggedAll(tags)`    | **at least one** ancestor's slot contains **all** given criteria |          `false`          |

The two negative forms returning `true` on absence are deliberate: "no parent is X" is trivially true when there is no
parent at all. The two `…TaggedAll` forms are equivalent to AND-composing several individual criteria, but cost one
predicate call and allocate no intermediate closure. Criteria compare by identity — equivalent to `Object.is` on
`[key, value]` thanks to interning, consistent with slot equality in
[Slots and last-wins](#slots-and-last-wins--the-exact-definition).

> **Normative — an empty criterion list is rejected.** `whenParentTaggedAll([])` reads literally as "the parent carries
> all of nothing", which is true of every parent — the constraint would silently weaken into "there is some parent",
> while still winning specificity over an unconstrained binding. Both `…TaggedAll` variants throw
> `EmptyTagCriteriaError` right at the call site.

> **Normative — a slot name nobody declares.** A slot name is a bare string, so a name the token does not type — a token
> declaring no `Names`, or the reserved criterion `slotName.of(n)` handed to a `…Tagged` helper — can be a typo that
> produces a constraint that is never true and that nobody reports. `validate()` throws `UnreachableConstraintError`
> when the name is not declared where the constraint waits for it: for `whenParentNamed(T, n)` /
> `whenAnyAncestorNamed(T, n)`, on a binding **of `T`** in the container chain; for a reserved criterion in
> `whenParentTagged`, `whenAnyAncestorTagged` or either `…TaggedAll`, on a binding of any token. A criterion of any
> other key records nothing — it is minted from a typed key, so it cannot be a typo. The requirement survives `when()`
> chaining: a composed predicate carries both sides' requirements, so narrowing a helper-built constraint does not hide
> it from `validate()`.

> **Exact shape:** `src/resolution/select/constraints.ts`.

### Semantics

`ctx.parent` is the `ResolutionFrame` of the binding directly above in the stack (the binding currently injecting this
token). `ctx.ancestors` is every frame above `ctx.parent`, ordered from the root down to the grandparent — it does not
include `ctx.parent`.

> **Normative — the canonical implementation table.**
>
> | Function                            | Logic                                                                                                      |
> | ----------------------------------- | ---------------------------------------------------------------------------------------------------------- |
> | `whenParentIs(token)`               | `ctx.parent !== undefined && ctx.parent.tokenName === tokenNameOf(token)`                                  |
> | `whenNoParentIs(token)`             | `ctx.parent === undefined \|\| ctx.parent.tokenName !== tokenNameOf(token)`                                |
> | `whenAnyAncestorIs(token)`          | `ctx.ancestors.some(f => f.tokenName === tokenNameOf(token))`                                              |
> | `whenNoAncestorIs(token)`           | `ctx.ancestors.every(f => f.tokenName !== tokenNameOf(token))`                                             |
> | `whenParentNamed(token, name)`      | `ctx.parent !== undefined && ctx.parent.tokenName === tokenNameOf(token) && ctx.parent.slot.name === name` |
> | `whenAnyAncestorNamed(token, name)` | `ctx.ancestors.some(f => f.tokenName === tokenNameOf(token) && f.slot.name === name)`                      |
> | `whenParentTagged(criterion)`       | `ctx.parent !== undefined && ctx.parent.slot.tags.includes(criterion)`                                     |
> | `whenAnyAncestorTagged(criterion)`  | `ctx.ancestors.some(f => f.slot.tags.includes(criterion))`                                                 |
> | `whenParentTaggedAll(tags)`         | `ctx.parent !== undefined && tags.every(t => ctx.parent.slot.tags.includes(t))`                            |
> | `whenAnyAncestorTaggedAll(tags)`    | `ctx.ancestors.some(f => tags.every(t => f.slot.tags.includes(t)))`                                        |

> **The named variants read `slot.name`, not `currentResolveOptions`.** `whenParentNamed(Logger, "console")` asks "is
> the parent a `Logger` binding declaring `whenNamed("console")`?" — not "was the parent resolved with the hint
> `{ name: "console" }`?". Those are different questions: a hint-less `resolveAll(Logger)` builds the `"console"`
> binding with no hint naming it, and a hint can reach a binding whose slot records no name — through a default-slot
> alias that forwards it, say.

> **Why identity comparison is enough.** Criteria are interned, so each `[key, value]` has exactly one object; comparing
> by identity therefore gives the same answer as `Object.is` on the value — handling `NaN` correctly and keeping `+0`
> distinct from `-0`, consistent with slot equality in
> [Slots and last-wins](#slots-and-last-wins--the-exact-definition). This is also why the table above has no pairwise
> comparison loop.

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
import type { ConstraintContext } from "@codefast/di";
import { whenAnyAncestorIs, whenParentIs } from "@codefast/di";

// `ancestors` excludes the parent, so the harness's own direct dependencies need `whenParentIs` beside it.
const underHarness = (ctx: ConstraintContext): boolean =>
  whenParentIs(TestHarness)(ctx) || whenAnyAncestorIs(TestHarness)(ctx);

container
  .bind(Config)
  .toConstantValue(prodConfig)
  .when((ctx) => !underHarness(ctx));
container.bind(Config).toConstantValue(testConfig).when(underHarness);
```

Any service resolved within the subtree rooted at `TestHarness` — `TestHarness`'s own `Config` included — receives
`testConfig`. Services outside the subtree receive `prodConfig`. `whenAnyAncestorIs(TestHarness)` alone would miss the
harness's direct dependencies, and `whenNoAncestorIs(TestHarness)` would hand them `prodConfig`.

**`whenParentNamed` — a logger that knows which slot of `Database` it serves:**

```ts
import { token, whenParentNamed } from "@codefast/di";

const Database = token<Database, "primary" | "replica">("app:Database");

container.bind(Database).to(PrimaryDatabase).whenNamed("primary").singleton();
container.bind(Database).to(ReplicaDatabase).whenNamed("replica").singleton();

container.bind(Logger).to(PrimaryLogger).when(whenParentNamed(Database, "primary"));

container.bind(Logger).to(ReplicaLogger).when(whenParentNamed(Database, "replica"));
```

When `PrimaryDatabase` is resolved (binding slot `"primary"`), it injects `PrimaryLogger` because the parent frame is a
`Database` binding whose `slot.name` is `"primary"`. The token types the name, so `"primry"` is a compile error.

**`whenAnyAncestorTagged` — pick different infrastructure by environment tag:**

```ts
import { tag, whenAnyAncestorTagged } from "@codefast/di";

const Env = tag<"test" | "prod">("app:env");

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

const Env = tag<"test" | "prod">("app:env");
const Tier = tag<"basic" | "premium">("app:tier");

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

// Use — one predicate call, one walk over the parent frame's `slot.tags`
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

The rules in [Constraints](#constraints--when) apply in full to advanced constraints — these are ordinary `when()`
predicates:

- The predicate is called every time a resolve needs to pick a candidate, never cached.
- The predicate must be pure and deterministic — no side effects, no I/O.
- The predicate must not resolve anything. `ConstraintContext` exposes no resolve method, and reaching a container from
  inside a predicate re-enters the selection it is part of.
- Make the predicates mutually exclusive when several bindings of one token use predicate-only `when()`. If ≥ 2
  candidates remain after filtering and the more-specific rule decides nothing, the resolver throws
  `AmbiguousBindingError`.

### Performance note

`whenAnyAncestorIs`, `whenAnyAncestorTagged` and `whenAnyAncestorTaggedAll` walk the whole of `ctx.ancestors` — O(depth)
per resolve. With the shallow dependency graphs that are typical (< 10 levels), the overhead is negligible. Avoid these
constraints on a hot path with a deep graph and `transient` bindings; prefer `whenParentIs` / `whenParentTaggedAll`
(O(1) parent lookup) when checking the direct parent is all you need.

`whenParentTaggedAll(tags)` first compares the condition's tag keys against the parent slot's `keyMask`, ruling out a
parent that lacks one of them without a walk, then checks `tags` against `ctx.parent.slot.tags` — O(m × n) at worst,
where m is the number of tags in the condition and n the number of tags on the parent slot. With small m and n (< 5) the
overhead is negligible; prefer it over AND-composing several `whenParentTagged` calls, to reduce the number of predicate
invocations.

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
} from "#resolution/select/constraints";
```

Exported from both the root `@codefast/di` and the subpath `@codefast/di/resolution/select/constraints` — both import
paths are valid and point at the same module. The `exports` map is generated from `dist/`, so the subpath carries the
real source path; **there is no `@codefast/di/constraints` alias**.

---

## Module system

**Mental model.** A module is a named, reusable description of bindings — a function that receives a builder and calls
`bind`/`import` on it, or a list of declared bindings. It holds no runtime state; a container decides when to load it
and remembers what it produced.

### Sync module

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

### Async module

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

### Declared module

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
> ([Slots and last-wins](#slots-and-last-wins--the-exact-definition)).

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
> re-slot, a scope change, a hook — each time the module loads. It changes nothing a resolve reads.

### Using modules

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
> the same identity — see [Module management](#module-management).

### A `SyncModule` cannot import an `AsyncModule`

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

### Module interface

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

---

## Error hierarchy

**Mental model.** Every error the library throws extends one abstract class, `DiError`, and carries a machine-readable
`code` plus the context fields a human needs to act. A `catch (error) { if (error instanceof DiError) … }` catches all
of them; a `switch` on `code` tells them apart without string-matching messages.

> **Normative.** Every error extends `DiError` — an abstract class that forces each subclass to declare a `code` string
> (machine-readable), alongside a message carrying enough context for a human reader.

| Error                            | `code`                        | Thrown when                                                                    | Context fields                                                 |
| -------------------------------- | ----------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| `InternalError`                  | `INTERNAL_ERROR`              | An internal assertion failed — **not** a user error                            | —                                                              |
| `TokenNotBoundError`             | `TOKEN_NOT_BOUND`             | The token has no binding at all, even after walking the parent chain           | `tokenName`                                                    |
| `NoMatchingBindingError`         | `NO_MATCHING_BINDING`         | The token **has** bindings but no slot matches the hint                        | `tokenName`, `options`, `availableSlots`                       |
| `AmbiguousBindingError`          | `AMBIGUOUS_BINDING`           | ≥ 2 candidates remain and the more-specific rule cannot decide                 | `tokenName`, `candidateIds`                                    |
| `CircularDependencyError`        | `CIRCULAR_DEPENDENCY`         | A → B → A, including a cycle along an alias chain                              | `cycle`                                                        |
| `AsyncResolutionError`           | `ASYNC_RESOLUTION`            | A sync `resolve()` on an async binding, directly or via the dep chain          | `tokenName`, `asyncSourceToken`                                |
| `AsyncActivationError`           | `ASYNC_ACTIVATION`            | `@postConstruct` or `onActivation` returned a `Promise` on a sync path         | `tokenName`, `hookKind`, `methodName`                          |
| `AsyncDeactivationError`         | `ASYNC_DEACTIVATION`          | A sync `unbind()`/`rebind()` owing an async deactivation (a cached singleton)  | `tokenName`                                                    |
| `ScopeViolationError`            | `SCOPE_VIOLATION`             | `validate()` — a captive dependency: a singleton depending on scoped/transient | `details`: both tokens + scopes, plus `path`                   |
| `MissingMetadataError`           | `MISSING_METADATA`            | The container must construct a class but `@injectable()` is missing            | `targetName`                                                   |
| `InvalidMetadataError`           | `INVALID_METADATA`            | The `MetadataReader` returned something the container cannot use               | `targetName`, `reason`                                         |
| `AsyncModuleLoadError`           | `ASYNC_MODULE_LOAD`           | A sync `load()` received an `AsyncModule`                                      | `moduleName`                                                   |
| `SyncDisposalNotSupportedError`  | `SYNC_DISPOSAL_NOT_SUPPORTED` | `[Symbol.dispose]()` was called                                                | —                                                              |
| `MissingScopeContextError`       | `MISSING_SCOPE_CONTEXT`       | A `scoped` binding resolved from a container with no child scope               | `tokenName`                                                    |
| `MissingContainerContextError`   | `MISSING_CONTAINER_CONTEXT`   | A class with `@inject accessor` was `new`-ed outside a container               | `className` (may be `undefined`), `accessorName`               |
| `RebindUnboundTokenError`        | `REBIND_UNBOUND_TOKEN`        | `rebind()` on a token with no own binding in this container                    | `tokenName`                                                    |
| `DisposedContainerError`         | `DISPOSED_CONTAINER`          | Any operation on an already-disposed container                                 | —                                                              |
| `ChainNotRegisteredError`        | `CHAIN_NOT_REGISTERED`        | Refinement (`when*`, scope, `on*`, `id()`) called before `to*()`               | `tokenName`                                                    |
| `ChainAlreadyRegisteredError`    | `CHAIN_ALREADY_REGISTERED`    | A second `to*()` on a chain that already registered its binding                | `tokenName`                                                    |
| `ManyBindingSlotError`           | `MANY_BINDING_SLOT`           | `many()` on a named or tagged binding, or a slot constraint on a member        | `tokenName`                                                    |
| `SelfBindingRequiresClassError`  | `SELF_BINDING_REQUIRES_CLASS` | `toSelf()` on a token that is not a class                                      | `tokenName`                                                    |
| `StaticMemberDecoratorError`     | `STATIC_MEMBER_DECORATOR`     | `@inject` / `@postConstruct` / `@preDestroy` on a static member                | `decoratorName`, `memberName`                                  |
| `SymbolKeyedLifecycleError`      | `SYMBOL_KEYED_LIFECYCLE`      | `@postConstruct` / `@preDestroy` on a symbol-keyed method                      | `decoratorName`, `memberName`                                  |
| `InvalidBindingDeclarationError` | `INVALID_BINDING_DECLARATION` | `binding()` — no strategy, several, or a key the strategy does not allow       | `tokenName`, `reason`                                          |
| `MissingDecoratorMetadataError`  | `MISSING_DECORATOR_METADATA`  | A decorator handed no `context.metadata` — the runtime lacks `Symbol.metadata` | `decoratorName`                                                |
| `UnreachableLifecycleHookError`  | `UNREACHABLE_LIFECYCLE_HOOK`  | `validate()` — a container-level hook for a token nobody binds                 | `tokenName`, `phase`, `reason`                                 |
| `EmptyTagCriteriaError`          | `EMPTY_TAG_CRITERIA`          | `…TaggedAll()` received an empty criterion list                                | `helperName`                                                   |
| `UnreachableConstraintError`     | `UNREACHABLE_CONSTRAINT`      | `validate()` — a constraint expects a slot name nobody declares                | `tokenName`, `requiredName`, `requiredTokenName`, `helperName` |

> **Exact shape:** `src/errors/errors.ts` — every class above, plus `ScopeViolationDetails`.

A message names what went wrong and, where the library can know it, the way out — every misuse error does; a few report
a state rather than a remedy (`CircularDependencyError` names the cycle, `ScopeViolationError` the path,
`DisposedContainerError` the disposal). Two representative examples:

```
No binding for 'app:Logger' matching {"name":"file"}. Available slots: [default, name:console].

Token 'app:Api' requires async resolution because 'app:Database' in its dependency
chain has an async factory. Use container.resolveAsync(app:Api).
```

`ScopeViolationError` is raised by `validate()` alone: a resolve does not check scopes, so a singleton that captures a
transient resolves silently, and one that captures a `scoped` binding from the root fails with
`MissingScopeContextError` instead.

### The boundary between a library bug and a caller error

> **Normative.** `InternalError` means **the library is broken** — a consumer catching one has caught a library bug. No
> user-caused error may therefore carry that type.

Three errors in the table exist precisely because of that rule: `AmbiguousBindingError` (predicates that do not exclude
each other), `StaticMemberDecoratorError`, and `ChainNotRegisteredError` — each is caller misuse, so each has its own
type rather than `InternalError`.

**Errors for callers outside the type system.** `ChainNotRegisteredError` and `SelfBindingRequiresClassError` are nearly
unreachable from TypeScript: the chain's return types ([Fluent chain](#fluent-chain--the-canonical-invariant-order)) and
the type of `bind()` already block most of the way. They exist for JavaScript callers, or callers who have cast through
the types — so that misuse **fails loudly** instead of silently doing nothing — and they belong to the `DiError`
taxonomy so that a `catch (error) { if (error instanceof DiError) … }` does not let them escape.

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

Both come from the rule in [`ActivationHandler` and `DeactivationHandler`](#activationhandler-and-deactivationhandler) —
a hook returning a `Promise` means the resolve must be `resolveAsync()`. The difference is _where_ the async source
sits:

- `AsyncResolutionError` — the source is a binding's factory, known at the point the binding is selected.
- `AsyncActivationError` — the source is a hook, which only reveals itself **after** the instance has been created. The
  container cannot know in advance. `hookKind` says whether it was `postConstruct` or `onActivation`; `methodName` pins
  the exact method when a class has several `@postConstruct()`.

> **The hook has already run when the error is thrown.** A hook cannot be inspected for asyncness before it is called,
> so when `AsyncActivationError` or `AsyncDeactivationError` is raised on a sync lane, the hook body has already
> executed and returned a `Promise`. The container adopts that promise (attaching a no-op rejection handler) so a hook
> that rejects cannot become an unhandled rejection — but any side effect the hook performed has happened. Retry the
> operation on the async lane (`resolveAsync` / `unbindAsync`), which awaits the hook properly.

---

## Public API

> **Normative — the root entry point is complete.** Every name this document specifies is exported from `@codefast/di`:
> the foundation types, `token` and `tag`, `Container`, the builder interfaces, the module factories, the decorators and
> injection helpers, the metadata port, the advanced constraints, the introspection and graph types with their adapters,
> and every error class alongside `DiError`. A caller never needs a subpath to reach a name its code uses, and each
> section above is the authority on the names it introduces. The one group this document describes without the root
> exporting it is the engine's own model — `Binding`, its seven member interfaces and `BindingSlot`
> ([The `Binding` discriminated union](#the-binding-discriminated-union)) — which it specifies because the public
> snapshots are views of it; they are published at `@codefast/di/core/binding` only.

> **Normative — a subpath mirrors the source layout, and that layout is not frozen.** Every module is also published at
> a subpath derived from the built output, so `@codefast/di/core/token`, `@codefast/di/container/container` and the rest
> resolve to the same modules the root re-exports. The introspection group is flattened: `@codefast/di/inspector`,
> `@codefast/di/dependency-graph`, and `@codefast/di/graph-adapters/{dot,mermaid,cytoscape,reactflow}`. Because the map
> follows the source tree, moving a module renames its specifier — import from the root unless you are deliberately
> trimming a bundle.

Because every module is published, most subpaths also carry names the root does not re-export: the engine's
collaborators (`DependencyResolver`, `BindingRegistry`, `ScopeManager`, the plan compiler, `Inspector`,
`buildDependencyGraph`, …) and the helpers they share. Those are implementation surface, not contract — nothing in this
document promises their shape, and they change with the source.

One of them is a deliberate channel: **`@codefast/di/errors/diagnostics`** exports `RESOLUTION_DIAGNOSTICS`, the symbol
a container answers to with its runtime counters — `generatedPlanCount` among them
([Code generation and Content Security Policy](#code-generation-and-content-security-policy)). It is a diagnostic
channel, not part of the resolution contract: a counter may be added or renamed without a rule above changing.

---

## Roadmap

Nothing here is normative. It is intent, and intent is not a commitment — what the library guarantees today is
everything above this section.

Framework adapter packages are **not** planned. A per-request scope is `createChild()` plus `await using`
([Child containers](#child-containers)) — a pattern to document, not a package to publish.

---

## License

Released under the [MIT License](./LICENSE).
