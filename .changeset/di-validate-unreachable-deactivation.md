---
"@codefast/di": patch
---

`validate()` now reports a container-level `onDeactivation` hook that can never run. The builder type blocks
`onDeactivation` on `scoped`/`transient` bindings, but `container.onDeactivation(token, handler)` takes any token with
no such gate, so a hook keyed to a token whose every binding is scoped or transient used to pass validation silently.
`validate()` now raises `UnreachableLifecycleHookError` for it, reusing the mechanism that already catches a hook on an
unbound token. A token that also has a singleton or constant binding, and any `onActivation` hook, stay valid.
