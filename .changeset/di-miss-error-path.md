---
"@codefast/di": minor
---

`TokenNotBoundError` and `NoMatchingBindingError` now carry `path`: the token names from the outermost request down to
the one that missed, alias hops included. A miss below the token asked for ends its message with that path —
`Path: UserService → UserRepository → Database → app:Logger` — so a deep graph says which consumer needed the binding; a
miss on the token asked for keeps its message as it was. Every lane reports the same path: sync and async, generated
plans, factory bodies, and `explain()` for an ancestor that selects nothing.
