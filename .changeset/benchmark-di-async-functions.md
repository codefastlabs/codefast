---
"@benchmark/di": patch
---

The `@codefast/di` async scenarios call `resolveAsync`, `resolveOptionalAsync`, `resolveAllAsync` and `initializeAsync`
as functions, following `@codefast/di`, and the footprint budget drops to 16 650 B to hold the async lane's removal from
the minimal program.
