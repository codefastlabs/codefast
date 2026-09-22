---
"@codefast/di": minor
---

Module `unload` is now symmetric with `import`, and `unbindAll` resets module bookkeeping. An `import` inside a module's
setup incremented the imported module's ref-count but nothing ever decremented it, so `unload(A)` left a module `A`
imported behind bound forever — the container now records each module's imports and, when a module's own ref-count
reaches 0, releases the imports it took, unbinding an imported module only when its ref-count reaches 0. And
`unbindAll()` / `unbindAllAsync()` now clear the module ref-count, binding-id and import tables after deactivation, so a
module loaded before `unbindAll` can be `load()`ed again instead of being silently skipped as already-loaded.
