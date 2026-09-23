---
"@codefast/di": minor
---

Add declared modules: `Module.fromBindings(name, [binding(key, definition), …])` (also `SyncModule.fromBindings`) builds
a `SyncModule` from a list, each `binding()` stating one binding with the fluent chain's own vocabulary — `to`,
`toSelf: true`, `toConstantValue`, `toDynamic`, `toDynamicAsync`, `toResolved` / `toResolvedAsync` with `deps`,
`toAlias`, then `whenNamed`, `whenTagged` (one criterion or several), `when`, `many: true`, `scope` and the lifecycle
hooks. A definition is typed exactly as the chain is — the key alone decides the value type and the slot names, and the
compiler rejects a second strategy, a scope on a constant or an alias, a hook on an alias, `onDeactivation` off a
singleton, and a slot on a collection member. `binding()` checks the same rules at runtime for plain JavaScript and
throws the new `InvalidBindingDeclarationError` (`INVALID_BINDING_DECLARATION`, with `tokenName` and `reason`), or
`ManyBindingSlotError` / `SelfBindingRequiresClassError` as the chain does.

A declared module loads, unloads, ref-counts and imports exactly as the equivalent `Module.create` setup would, and
registers each binding already in its final shape, so a binding with a slot, a scope or a hook skips the chain steps a
fluent setup pays on every load. Nothing a resolve reads changes. `SyncModule`'s `MODULE_SETUP` member now holds either
the setup callback or the declarations.
