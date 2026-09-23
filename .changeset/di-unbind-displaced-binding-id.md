---
"@codefast/di": patch
---

`unbind(id)` and `unbindAsync(id)` now tear down a binding that a later last-wins bind displaced: its cached singleton
is deactivated, and a displaced constant runs its `onDeactivation`, at that call instead of waiting for `dispose()`. The
id lookup asked only the registry, which a displaced binding had already left, so the call did nothing. The unbind also
invalidates what the displacing chain holds parked, so a later `when*()` refinement of that chain can no longer restore
the unbound binding.
