---
"@codefast/di": minor
---

`UnreachableLifecycleHookError` carries a `reason` — `"unbound"` or `"no-deactivatable-binding"` — and an
`onDeactivation` hook on a token whose every binding is transient or scoped is reported as that, rather than as a token
nothing is bound to.
