---
"@codefast/di": patch
---

Three code samples still imported a name the previous release removed or renamed: the README's decorator sample and the
decorators spec imported `optional` while calling `injectOptional`, and the modules spec imported `SyncModule` while
calling `Module.create`. They import what they call now.
