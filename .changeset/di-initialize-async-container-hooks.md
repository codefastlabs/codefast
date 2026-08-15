---
"@codefast/di": patch
---

Warm constants whose only activation handler is container-level during `initializeAsync()`. A `toConstantValue` binding
carrying a per-binding `onActivation` was already resolved and cached by the warm-up, but one whose hook was registered
through `container.onActivation(token, …)` was skipped — so the hook first ran on whichever request happened to resolve
the token, exactly the lazy-init latency `initializeAsync()` exists to remove. The skip now tests both hook channels,
matching how the resolver's own plain-constant fast path decides the same question.

Also tightens `isSyncModule()`, which read a brand field directly and so returned `undefined` rather than `false` for an
async module despite declaring a boolean type predicate, and corrects the `Promise` type assertion on the parent-owned
singleton lane of `resolveAsync`.
