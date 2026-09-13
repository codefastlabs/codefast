---
"@codefast/di": minor
---

`BindingIdentifier` is a branded number, minted from a process-wide counter, instead of a branded string. The id stays
opaque — obtained from `.id()`, handed back to `unbind(id)`, reported by `inspect()` and the dependency graph — and a
plain bind no longer allocates a string for it. Code that treated the id as a string (interpolating, parsing or storing
it as text) must treat it as a number.
