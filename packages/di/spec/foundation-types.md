# Foundation types

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

## `BindingScope`

```ts
type BindingScope = "singleton" | "transient" | "scoped";
```

## `BindingIdentifier`

An opaque branded number — it cannot be constructed by hand from outside the library. It is handed out by `.id()` on a
builder, by `ResolutionFrame.bindingId`, and by `BindingSnapshot.id`, and it is an identity to hand back to
`unbind(id)`, never a value to parse or display.

```ts
declare const BINDING_ID_BRAND: unique symbol;
type BindingIdentifier = number & { readonly [BINDING_ID_BRAND]: true };
```

## `Constructor`

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

## `ActivationHandler` and `DeactivationHandler`

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

## `ResolveOptions`

**Mental model.** A single resolve may carry a hint made of _criteria_. A criterion is one `[key, value]` pair minted
from a declared tag key. A **name is also a criterion** — one of the reserved key `slotName` — so `name` and `tags` feed
one selection model, not two.

**Fields.** All three are optional:

| Field  | Meaning                                                                                                                                                                | Relationship to the others                  |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `name` | Selects a binding declared with `whenNamed(name)`; typed as the names the token declares ([Token API](token.md#token-api))                                             | Sugar for the criterion `slotName.of(name)` |
| `tag`  | Exactly one criterion                                                                                                                                                  | Equivalent to a single element of `tags`    |
| `tags` | An array of criteria, read as a **superset filter**: it matches a binding whose _every_ declared tag is in this array — not "the binding must carry all of these tags" | Several criteria require `tags`             |

The full matching rule is in [Slots and last-wins](binding.md#slots-and-last-wins--the-exact-definition).
`InjectOptions` accepts both `tag` and `tags` and folds `tag` into `tags`, so an `InjectionDescriptor` only ever carries
one spelling.

> **Exact shape:** `src/core/types.ts` — `ResolveOptions`.

### Tag keys and criteria

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
container.bind(Storage).whenTagged(Region.of("eu")).to(S3);
container.resolve(Storage, { tag: Region.of("eu") });
```

### Tag value comparison

> **Normative — tag values compare by `Object.is`, on the fast path too.** The intern cache must keep `-0` separate from
> `+0` to preserve this rule. `NaN` folds to one criterion, because `Object.is(NaN, NaN)` is `true`.

Because interning gives each value exactly one criterion, comparing criteria by **identity** answers exactly as
`Object.is` on the value does — which is why a criterion may never be constructed any other way.

### Passing `tag` and `tags` together

> **Normative.** The request carries the **union** of both sources — equivalent to `tags: [tag, ...tags]`, and
> `InjectOptions` folds it into exactly that shape.

## `ResolutionContext`

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

## `ConstraintContext`

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
without walking its tags — see [Slots and last-wins](binding.md#slots-and-last-wins--the-exact-definition).

> **Normative.** A frame's `slot` reflects the **constraint registered at bind time**, not the hint passed at resolve
> time. The advanced constraints in [Advanced Constraints](constraints.md#advanced-constraints) read exactly this field.

**`BindingKind`** is one of seven values: `class`, `dynamic`, `dynamic-async`, `resolved`, `resolved-async`, `constant`,
`alias`.

> **Exact shape:** `src/core/types.ts` — `ConstraintContext`, `ResolutionFrame`, `BindingKind`.

### `resolutionStack` ordering and its views

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

## `DependencySlot`

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
> adding only what is theirs: a value type parameter and an `index` respectively. Every rule the specification states
> about a dependency's `optional`, `multi`, `name` and `tags` therefore holds for both.

A slot's criteria are a request waiting to be made: `injectionSlotToResolveOptions(slot)` turns the `name` and `tags` of
one into the [`ResolveOptions`](#resolveoptions) that asks for them, omitting a key rather than setting it to
`undefined`, and answering `undefined` when the slot states no criteria. The binding side has its own converter
([Resolving what a snapshot points at](container.md#resolving-what-a-snapshot-points-at)).

> **Exact shape:** `src/injection/dependency-slot.ts` — `DependencySlot`.

## `TokenValue`

A helper type that extracts `Value` from `Token<Value>` or `Constructor<Value>`:

```ts
type TokenValue<Type> = Type extends Token<infer Value> ? Value : Type extends Constructor<infer Value> ? Value : never;
```
