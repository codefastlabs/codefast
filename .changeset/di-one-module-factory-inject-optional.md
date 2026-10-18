---
"@codefast/di": minor
---

**Breaking:** two spellings of the same API collapse into one.

- `Module` is the one module factory: `Module.create`, `Module.createAsync` and `Module.fromBindings`. The
  `SyncModule.create`, `SyncModule.fromBindings` and `AsyncModule.create` companions are removed; `SyncModule` and
  `AsyncModule` remain as the types those factories return. Replace `SyncModule.create(` with `Module.create(`,
  `SyncModule.fromBindings(` with `Module.fromBindings(` and `AsyncModule.create(` with `Module.createAsync(`.
- `optional()` is renamed `injectOptional()`, so the descriptor family reads as the resolve family does —
  `inject`/`injectOptional`/`injectAll` beside `resolve`/`resolveOptional`/`resolveAll`. Replace `optional(` with
  `injectOptional(`.
