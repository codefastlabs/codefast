---
"@codefast/di": minor
---

**Breaking:** a `scoped` instance is now deactivated with the child container that cached it. Disposing that child runs
the binding's `onDeactivation`, the container-level `onDeactivation` hooks of the container that owns the binding, and
`@preDestroy()` for every scoped instance it cached, latest first and before its own singletons; unbinding a scoped
binding on the child that cached it deactivates that instance too. `.scoped()` now offers `onDeactivation`, and
`Module.fromBindings` accepts `onDeactivation` with `scope: "scoped"`, so per-request resources — a transaction, a
connection — can be released where they are declared. `validate()` no longer reports a deactivation hook on a
scoped-only token as unreachable. Code that relied on a scoped instance never being torn down, or that closed one by
hand after `dispose()`, should drop the manual close.
