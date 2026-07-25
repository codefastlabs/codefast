---
"@codefast/di": patch
---

`toResolved()` and `toResolvedAsync()` now accept injection descriptors — `inject()`, `optional()` and `injectAll()` — in their dependency list, matching what `@injectable([...])` already allowed and what the builder already did at runtime (it normalizes every entry through `normalizeToDescriptor`). Previously the public signature only admitted bare tokens and constructors, so an optional or multi dependency needed a cast even though resolution handled it correctly.

Factory arguments are typed from the descriptor: a bare token gives `Value`, `optional(token)` gives `Value | undefined`, and `injectAll(token)` gives `Array<Value>`. Widening only — existing bare-token call sites are unaffected.
