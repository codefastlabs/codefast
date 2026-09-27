---
"@codefast/di": patch
---

A teardown reads a class's `@preDestroy` methods once for a run of bindings of that class, instead of once per binding,
and names the token only when a hook fails.
