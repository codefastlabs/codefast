---
"@codefast/di": patch
---

The `ResolutionContext` a factory or activation hook receives narrows `name` to the slot names its token declares, as
`Container#resolve` already did: inside `toDynamic((ctx) => ctx.resolve(LoggerToken, { name: "fiel" }))`, a name the
token does not declare is now a compile error instead of a `NoMatchingBindingError` at resolve time. A token that
declares no names, and a class key, still take any string.
