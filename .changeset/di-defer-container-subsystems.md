---
"@codefast/di": patch
---

Build a container's rarely-used collaborators on first use instead of in its constructor: the inspector, the module ref/binding tables, the scope's in-flight and scoped caches, the registry's named and tagged slot indexes, and the class introspector's metadata caches. A container that only binds and resolves — the common case, and every per-request child container — no longer allocates eleven `Map`s it never reads.

A fresh `Container.create()` retains 2.7 KB instead of 4.8 KB (**43% lighter**), and `parent.createChild()` the same, measured by retention against a forced collection. Deferral is an allocation decision only: every deferred collaborator behaves identically whether or not something touched it first, which `tests/unit/container/deferred-subsystems.test.ts` pins by exercising each one as the first thing a fresh container does.

**Breaking:** `ScopeManager.getAllScoped()` is removed from the `./resolution/scope` subpath. Deferring the scoped cache raised the question of what a bulk reader returns when the cache was never allocated, and this reader had no callers anywhere in the package — so it is gone rather than carrying an empty-map fallback for nobody. `getAllSingletons()` is unaffected; its cache is still eager.

This does **not** close the `realistic-graph-cold-resolve` loss against tsyringe. That row's gap is GC-attributable — the two libraries are at mutator parity and di only loses once a forced collection is in the loop — and cutting 13.7% of the row's allocation moved throughput by less than the suite's ~5% noise floor, verified against an in-run control scenario that laziness cannot affect. The footprint reduction is the reason to keep this, not a throughput claim.
