---
"@codefast/di": minor
---

`resolveAll`, `resolveAllAsync` and the value an `injectAll()` dependency delivers are `ReadonlyArray`s, and a
root-level, options-less `resolveAll` hands out the engine's own list — the same array on every call while no registry
in the chain has changed — instead of a copy per read. That list is kept while every member is a hook-free constant or a
hook-free singleton whose instance is cached, so a collection of singleton handlers is one lookup per read. Callers that
mutated the returned array spread it first; a constructor parameter typed `Array<T>` for an `injectAll` dependency
becomes `ReadonlyArray<T>`.
