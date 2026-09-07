---
"@codefast/di": minor
---

`Token` gains a second type parameter, `Names extends string = string`, declaring the slot names its bindings may use:
`token<Logger, "console" | "file">("Logger")`. `whenNamed`, and `name` in `ResolveOptions` and `InjectOptions`, narrow
to it, so a misspelt name is a compile error and the IDE completes the declared names at every bind and request site.
`Names` is a covariant phantom that defaults to `string`, so existing tokens, class keys and internal `Token<unknown>`
lanes are unchanged; a new `SlotNamesOf<Key>` type reads the set back.

**Breaking:** `whenParentNamed` and `whenAnyAncestorNamed` now take the parent token first —
`whenParentNamed(Database, "primary")` — and match only when that frame resolves that token at that slot. A slot name is
a label on one token's bindings, so the token is part of the question and is what types the name; a label shared across
tokens is what a tag key is for. `validate()` checks the name on that token's bindings and `UnreachableConstraintError`
carries the new `requiredTokenName`. The reserved criterion handed to a `…Tagged` helper
(`whenParentTagged(slotName.of("x"))`) is now validated too, as it is the same bare string.
