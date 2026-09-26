---
"@codefast/di": patch
---

A scope refinement costs less at bind time. `singleton()`, `transient()` and `scoped()` now do nothing when the scope
does not change, and release only what exists when it does, so `bind(T).to(X).singleton()` straight after registration
no longer calls into the scope manager.
