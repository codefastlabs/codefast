---
"@codefast/di": minor
---

Resolver performance overhaul — the head-to-head benchmark vs InversifyJS 8 now shows 38/38 comparable scenarios won (median 1.82×, isolated mode), up from 7 losing rows. Four techniques, no public-API changes:

- **Chain-versioned lookup memo** — `BindingRegistry` gains a monotonic mutation version; resolvers memoize options-less `token → {binding, owner}` lookups across the parent chain with alias hops folded to the terminal binding. Resolving a root binding from a depth-2 child (or through `toAlias`) is now as fast as resolving it locally.
- **Compiled resolution plans** — a transient class binding whose dependency subgraph is pure static (class/constant/cached-singleton deps, no activation hooks or `postConstruct`) compiles once into a nested-constructor closure, cycle-checked at compile time. Anything dynamic keeps the runtime cycle guard, so error semantics are unchanged.
- **Uniform binding hidden class** — `Registry.add` rebuilds every binding with one fixed field superset so mixed binding kinds no longer turn the resolver's hot property reads megamorphic (~30% throughput loss in processes exercising several kinds).
- **Leaner async transient path** — cleanup runs as a FIFO side listener on the factory promise instead of a derived-promise chain (one less promise and one less microtask hop per level), and activated transient dynamic bindings get a dedicated lane that fetches container hooks once. Behavior note: an unawaited _failing_ `resolveAsync` no longer surfaces as an `unhandledRejection`; await (or `.catch`) the returned promise.
