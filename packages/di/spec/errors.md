# Error hierarchy

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
| `ChainNotRegisteredError`        | `CHAIN_NOT_REGISTERED`        | A scope, `on*` or `id()` called before `to*()`                                 | `tokenName`                                                    |
| `ChainAlreadyRegisteredError`    | `CHAIN_ALREADY_REGISTERED`    | A slot step or a second `to*()` on a chain that already registered its binding | `tokenName`                                                    |
| `ManyBindingSlotError`           | `MANY_BINDING_SLOT`           | `many()` on a named or tagged binding, or a slot constraint on a member        | `tokenName`                                                    |
| `SelfBindingRequiresClassError`  | `SELF_BINDING_REQUIRES_CLASS` | `toSelf()` on a token that is not a class                                      | `tokenName`                                                    |
| `StaticMemberDecoratorError`     | `STATIC_MEMBER_DECORATOR`     | `@inject` / `@postConstruct` / `@preDestroy` on a static member                | `decoratorName`, `memberName`                                  |
| `SymbolKeyedLifecycleError`      | `SYMBOL_KEYED_LIFECYCLE`      | `@postConstruct` / `@preDestroy` on a symbol-keyed method                      | `decoratorName`, `memberName`                                  |
| `InvalidBindingDeclarationError` | `INVALID_BINDING_DECLARATION` | `binding()` — no strategy, several, or a key the strategy does not allow       | `tokenName`, `reason`                                          |
| `MissingDecoratorMetadataError`  | `MISSING_DECORATOR_METADATA`  | A decorator handed no `context.metadata` — the runtime lacks `Symbol.metadata` | `decoratorName`                                                |
| `UnreachableLifecycleHookError`  | `UNREACHABLE_LIFECYCLE_HOOK`  | `validate()` — a container-level hook for a token nobody binds                 | `tokenName`, `phase`, `reason`                                 |
| `EmptyTagCriteriaError`          | `EMPTY_TAG_CRITERIA`          | `…TaggedAll()` received an empty criterion list                                | `helperName`                                                   |
| `UnreachableConstraintError`     | `UNREACHABLE_CONSTRAINT`      | `validate()` — a constraint expects a slot name nobody declares                | `tokenName`, `requiredName`, `requiredTokenName`, `helperName` |

> **Exact shape:** `src/errors.ts` — every class above, plus `ScopeViolationDetails`.

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

## The boundary between a library bug and a caller error

> **Normative.** `InternalError` means **the library is broken** — a consumer catching one has caught a library bug. No
> user-caused error may therefore carry that type.

Three errors in the table exist precisely because of that rule: `AmbiguousBindingError` (predicates that do not exclude
each other), `StaticMemberDecoratorError`, and `ChainNotRegisteredError` — each is caller misuse, so each has its own
type rather than `InternalError`.

**Errors for callers outside the type system.** `ChainNotRegisteredError` and `SelfBindingRequiresClassError` are nearly
unreachable from TypeScript: the chain's return types
([Fluent chain](README.md#fluent-chain--the-canonical-invariant-order)) and the type of `bind()` already block most of
the way. They exist for JavaScript callers, or callers who have cast through the types — so that misuse **fails loudly**
instead of silently doing nothing — and they belong to the `DiError` taxonomy so that a
`catch (error) { if (error instanceof DiError) … }` does not let them escape.

**Why static members are an error.** `StaticMemberDecoratorError` exists because all three of those decorators act on
**an instance**: `@inject` resolves through the container active while the instance is being constructed, and
`@postConstruct`/`@preDestroy` bracket one instance's lifecycle. A static member belongs to the class, and the container
does not construct classes.

## `MissingMetadataError` vs `InvalidMetadataError`

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

## `AsyncActivationError` vs `AsyncResolutionError`

Both come from the rule in
[`ActivationHandler` and `DeactivationHandler`](foundation-types.md#activationhandler-and-deactivationhandler) — a hook
returning a `Promise` means the resolve must be `resolveAsync()`. The difference is _where_ the async source sits:

- `AsyncResolutionError` — the source is a binding's factory, known at the point the binding is selected.
- `AsyncActivationError` — the source is a hook, which only reveals itself **after** the instance has been created. The
  container cannot know in advance. `hookKind` says whether it was `postConstruct` or `onActivation`; `methodName` pins
  the exact method when a class has several `@postConstruct()`.

> **The hook has already run when the error is thrown.** A hook cannot be inspected for asyncness before it is called,
> so when `AsyncActivationError` or `AsyncDeactivationError` is raised on a sync lane, the hook body has already
> executed and returned a `Promise`. The container adopts that promise (attaching a no-op rejection handler) so a hook
> that rejects cannot become an unhandled rejection — but any side effect the hook performed has happened. Retry the
> operation on the async lane (`resolveAsync` / `unbindAsync`), which awaits the hook properly.
