---
"@codefast/di": minor
---

The lookup memo folds an alias chain of any length exactly, declining on a cycle so the full resolve loop reports it,
instead of giving up past 32 hops. The exported constant `ALIAS_HOP_LIMIT` is removed from
`resolution/cache/binding-lookup-cache`.
