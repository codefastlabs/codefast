---
"@codefast/di": patch
---

Unloading a module now tears down a binding it registered that a later last-wins bind displaced: a displaced cached
singleton is deactivated, and a displaced constant runs its `onDeactivation`, at that `unload()`/`unloadAsync()` instead
of waiting for `dispose()`. Unload looked each of the module's bindings up in the registry, which a displaced binding
had already left, so it was skipped. The unload also invalidates what the displacing chain holds parked, so a later
`when*()` refinement of that chain can no longer restore a binding of the unloaded module.
