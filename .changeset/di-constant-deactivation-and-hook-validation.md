---
"@codefast/di": minor
---

`toConstantValue(...).onDeactivation(...)` now runs, and `validate()` reports a hook that can never run.

SPEC §3.4 names `toConstantValue` as one of the two things deactivation applies to ("treat as singleton"), and
`ConstantBindingBuilder` offers `onDeactivation` in the type. The hook was never called.

What made it hard to spot is that it worked whenever an activation hook happened to sit beside it:

```ts
container
  .bind(Pool)
  .toConstantValue(pool)
  .onDeactivation((p) => p.end()); // silent
container
  .bind(Pool)
  .toConstantValue(pool)
  .onActivation((_ctx, p) => p) // unrelated
  .onDeactivation((p) => p.end()); // now it fires
```

The resolver's plain-constant fast path returns `binding.value` with no pipeline, and it decides that on activation
alone — but the step it skips is what records the binding as a cached singleton, and that recording is what teardown
iterates. An activation hook disables the fast path, so the deactivation starts working for a reason that has nothing to
do with it. `dispose()`, `unbind()`, `unbindAll()` and module `unload()` were all affected.

Teardown now finds a constant through the registry instead of relying on that recording. A container that has never held
a constant skips the sweep, so teardown cost is unchanged where there is nothing to find.

**A constant deactivates whether or not anything resolved it.** A singleton only exists after its first resolve, so an
unresolved one has nothing to deactivate; a constant is the opposite — the value is handed in at bind time and exists
from then on. Making the hook depend on whether someone happened to resolve it would make teardown depend on resolution
order. If the value was activated, the hook receives the activated value rather than the bound one.

### `validate()` reports an unreachable hook

Container-level hooks are keyed by token identity, so a class used only as an implementation target matches nothing:

```ts
container.bind(LoggerToken).to(ConsoleLogger);
container.onDeactivation(ConsoleLogger, (l) => l.flush()); // keyed by the class — never runs
```

`validate()` now throws `UnreachableLifecycleHookError` when a container-level hook's token is bound in neither this
container nor any ancestor. Registering a hook before its binding stays valid — the check runs at `validate()`, not at
registration — and a hook for a parent-owned token is accepted, since the child resolves through it.

### Not changed

`transient`, `scoped` and `toAlias` bindings still have no deactivation, and this is not a gap:
`TransientBindingBuilder`, `ScopedBindingBuilder` and `AliasBindingBuilder` do not expose `onDeactivation` at all, so
the compiler rejects it. They appear to accept one only under a runtime that skips type-checking.
