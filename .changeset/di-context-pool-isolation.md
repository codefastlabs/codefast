---
"@codefast/di": minor
---

fix(di)!: keep a factory's ctx on its own resolution path across a nested top-level resolve

The depth-indexed sync context pool reused a pooled context by resetting it onto whatever array pair the next
acquisition carried. A nested `container.resolve()` inside a factory mints its own path arrays and reaches the same
depth as the frame still holding that pooled context, so the outer factory's `ctx` was silently re-pointed at the nested
resolve's arrays — `ctx.resolve` then evaluated `when()` predicates against an empty ancestor chain and selected the
wrong binding, and `ctx.graph` reported an empty path. A pooled context is now reused only for the array pair it already
holds; a mismatch mints a fresh context, and only the resolver's two stable pairs may claim a pool slot.

Breaking (type/API surface, no behavioral change for correct programs):

- `ConstraintContext.currentResolveOptions` is now `Readonly<ResolveOptions>` — the object was already frozen at
  runtime, so a write through it always threw; it is now a compile error.
- `ScopeManager.hasScoped`/`getScoped` are removed — dead since `readScoped` replaced the two-read shape.
- Diagnostics getters renamed for role: `BindingRegistry.isBuilt` → `isNamedIndexBuilt`/`isTaggedIndexBuilt` (the tagged
  index was previously unobservable), `ScopeManager.isBuilt` → `isScopedCacheBuilt`, `LifecycleManager.isBuilt` →
  `isActivationTableBuilt`. `builtSubsystems` now also reports `registry.taggedIndex`.
- `TagKeyMask` is exported from the package root.
