---
"@codefast/di": minor
---

`validate()` checks an `optional()` dependency whenever it is bound, so a singleton capturing a bound transient or
scoped dependency through `optional()` is a `ScopeViolationError`; an optional dependency that is not bound still
imposes nothing.
