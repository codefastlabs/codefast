---
"@codefast/di": minor
---

`Token` gains a second type parameter, `Names extends string = string`, declaring the slot names its bindings may use:
`token<Logger, "console" | "file">("Logger")`. `whenNamed`, and `name` in `ResolveOptions` and `InjectOptions`, narrow
to it, so a misspelt name is a compile error and the IDE completes the declared names at every bind and request site.
`Names` is a covariant phantom that defaults to `string`, so existing tokens, class keys and internal `Token<unknown>`
lanes are unchanged; a new `SlotNamesOf<Key>` type reads the set back.
