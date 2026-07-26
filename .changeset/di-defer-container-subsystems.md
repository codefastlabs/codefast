---
"@codefast/di": minor
---

Build a container's rarely-used collaborators on first use instead of in its constructor: the inspector, the module ref/binding tables, the scope's in-flight and scoped caches, the registry's named and tagged slot indexes, and the class introspector's metadata caches. A container that only binds and resolves — the common case, and every per-request child container — no longer allocates eleven `Map`s it never reads.

A fresh `Container.create()` retains 2.7 KB instead of 4.8 KB (**43% lighter**), and `parent.createChild()` the same, measured by retention against a forced collection. Every deferred collaborator behaves identically whether or not something touched it first, which `tests/unit/container/deferred-subsystems.test.ts` pins by exercising each one as the first thing a fresh container does.

It is a throughput win too, on the paths that actually build containers: `Container.create()` is **1.80×** faster (230 ns → 127 ns) and a per-request child container plus a resolve through it — `createChild()` + resolve, the shape a web app runs once per request — is **1.31×** faster. Measured by an interleaved A/B with both builds loaded into one process, 13 trials in alternating order, against a control scenario that resolves from a pre-built container and so cannot benefit; the control sat at 0.997–1.009, and median and best-of agreed on both figures.

**Breaking:** `ScopeManager.getAllScoped()` is removed from the `./resolution/scope` subpath. Deferring the scoped cache raised the question of what a bulk reader returns when the cache was never allocated, and this reader had no callers anywhere in the package — so it is gone rather than carrying an empty-map fallback for nobody. `getAllSingletons()` is unaffected; its cache is still eager.

What it does **not** do is close the `realistic-graph-cold-resolve` loss against tsyringe, and the arithmetic says why: 103 ns off container construction is 2.5% of that row's 4.06 µs iteration, so the row moves ~1.5% — measured, and inside the noise floor. That row's gap is GC-attributable (the two libraries are at mutator parity; di only loses once a forced collection is in the loop), so a 13.7% allocation cut was never going to carry it.
