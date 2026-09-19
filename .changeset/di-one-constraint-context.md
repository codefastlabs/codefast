---
"@codefast/di": patch
---

Every binding predicate now reads one `ConstraintContext` shape: the shared root context, the context a selection builds
over a live path, an async level's prefix and the inspector's probe are all `DefaultConstraintContext`, exported from
`resolution/context`. A predicate's call site stays monomorphic, and the per-selection object literal with its eager
`ancestors` slice is gone — `ancestors` is now sliced on first read, as `ctx.graph` already did.
