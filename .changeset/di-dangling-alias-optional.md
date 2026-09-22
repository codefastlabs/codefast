---
"@codefast/di": patch
---

`resolveOptional`, `resolveOptionalAsync`, `resolveAll` and `resolveAllAsync` no longer throw when they reach an alias
whose chain ends at a token nothing matches. An alias is a transparent pointer, so a dangling chain is the same miss the
target itself would be: the optional lanes return `undefined`, and a dangling alias member is skipped from a collection
rather than failing the whole fan-out. A required `resolve` / `resolveAsync` still throws, and an alias **cycle** still
throws `CircularDependencyError` — a cycle has no absent reading.
