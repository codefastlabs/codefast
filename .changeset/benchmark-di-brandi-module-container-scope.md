---
"@benchmark/di": patch
---

Fix brandi's `module-cold-from-modules` cell, which measured a warm cache: a dependency module's `inSingletonScope()`
caches on the module's own binding, so every container after the pre-warm reused one instance. The row now binds
`inContainerScope()`, one instance per container like every other side, so **brandi's figure on this row changes
meaning** — it now constructs the graph per iteration and reads slower than before; earlier brandi figures on this row
are not comparable. Every side's sanity check now also asserts one instance within a container and a fresh one in the
next (`isSharedWithinScopeFreshAcross`); the other libraries' measured work is unchanged.
