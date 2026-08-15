---
"@codefast/di": minor
---

**Breaking:** removed `isToken()`. The guard tested for an object carrying a string `name`, which every `Token` has but
so does anything else — an `InjectionDescriptor` that named its slot passed it, as did any plain `{ name }` object. A
`Token` is a branded structural type with nothing to check at runtime, so the predicate could not be made sound; it
narrowed to `Token<unknown>` on evidence that did not support the claim. Nothing in the package used it.

Discriminating a declared dependency is what `isInjectionDescriptor()` is for, and it stays. Code that called
`isToken(x)` to tell a token from a class wants `typeof x === "function"` instead.
