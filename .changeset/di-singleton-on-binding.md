---
"@codefast/di": minor
---

Keep a singleton's instance on its binding instead of in a per-container table. A binding belongs to exactly one container, so its singleton slot is per-binding — which turns every cached-singleton read from a keyed `Map` lookup into a field read, on the most common resolve shape there is. The scope manager keeps only a lazily-created list of the bindings that have materialized, so disposal and `inspect()` can still enumerate them, and the singleton `Map` is gone entirely.

In the suite, `realistic-graph-resolve-root` — a transient controller over eight cached singletons — went from 10.66M to **12.19M** hz/op, and the `realistic` group geomean from 2.24× to **2.54×** of InversifyJS. That row carries a 2.9% IQR, so it is one of the numbers here worth reading precisely. `singleton-class-1-dep` and cold container build both moved up as well, on rows whose IQR is too wide to attribute confidently.

An interleaved A/B against the previous build, both in one process with a control that cannot benefit, put the same row between 1.09× and 1.40× across four runs — never slower, median and best-of agreeing inside each run, but with a spread that depends on what else the process had run. The suite's figure is the one to cite; the A/B established the direction. A trap worth recording: the control first read 0.88×, which was an artifact of timing an 11 ns call one at a time — batched the way the harness does it, the same control reads 1.02× with a 4% spread.

**Breaking:** `ScopeManager`'s singleton API takes a `Binding` rather than a `BindingIdentifier`, and `hasSingleton`/`getSingleton`/`peekSingleton`/`setSingleton(id, …)`/`getAllSingletons` are replaced by `setSingleton(binding, …)`, `deleteSingleton(binding)` and `cachedSingletons()`. The `SINGLETON_MISS` sentinel is gone; `NO_INSTANCE` on the binding replaces it. None of this is a published entry point any more, so it is internal — but a fork reaching into `./resolution/scope` would notice. `InstantiationPlanDependencyEntry` also drops its `ownerScope` field, which a compiled thunk no longer needs.
