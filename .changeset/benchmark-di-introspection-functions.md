---
"@benchmark/di": patch
---

The introspection and validation scenarios call `validate`, `inspect`, `lookupBindings` and `generateDependencyGraph` as
functions that take the container, following `@codefast/di`.
