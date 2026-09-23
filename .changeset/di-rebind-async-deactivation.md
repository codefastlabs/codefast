---
"@codefast/di": minor
---

A sync `rebind()` whose old binding owes an async deactivation now fails exactly like a sync `unbind()` whatever shape
the token has: `rebind()` itself throws `AsyncDeactivationError`, the old bindings are removed, and nothing is
committed. A lone default binding used to let `rebind()` pass and then throw from `.to*()` after the replacement was
already registered.
