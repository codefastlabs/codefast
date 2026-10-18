---
"@codefast/cli": patch
---

`audit display-names` reads a module name from `Module.create`, `Module.createAsync` and `Module.fromBindings` only,
since `@codefast/di` no longer has the `SyncModule` and `AsyncModule` factory companions.
