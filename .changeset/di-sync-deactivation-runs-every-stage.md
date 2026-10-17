---
"@codefast/di": patch
---

A sync `unbind()`, `unbindAll()`, `rebind()` or `unload()` that meets an async deactivation hook now runs every
deactivation stage of that instance — container `onDeactivation` hooks, the binding's own `onDeactivation`, then each
`@preDestroy()` — before it throws `AsyncDeactivationError`. It used to stop at the first stage that returned a promise,
and since the binding was already removed, the stages after it could never run. The error is still thrown, and each
returned promise is still left unawaited with its rejection swallowed, so use `unbindAsync()` / `unloadAsync()` wherever
a deactivation hook may be async.
