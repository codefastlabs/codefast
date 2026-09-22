---
"@codefast/di": patch
---

A lifecycle hook that returns a rejecting `Promise` when reached from a synchronous lane no longer crashes the process.
`runActivationSync` and `runDeactivationSync` call each hook before they can tell it is async, so on discovering a
returned `Promise` they now adopt its rejection (a no-op `.catch`) before throwing `AsyncActivationError` /
`AsyncDeactivationError` — a rejecting `@postConstruct`, `onActivation`, `onDeactivation` or `@preDestroy` can no longer
become an unhandled rejection that ends the process. The hook has still run; retry on `resolveAsync` / `unbindAsync` to
await it properly.
