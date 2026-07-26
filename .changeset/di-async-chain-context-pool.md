---
"@codefast/di": patch
---

Thread an async chain's resolution context through the call and pool it, instead of parking chain identity on the resolver. `ctx.resolveAsync()` now hands the callee the context it used, so an inner level reuses it when the owner matches — which removes the resolver's path-identity heuristic, its shared settle callback and its active-level counter, and makes two concurrent chains correct by construction rather than by a fallback branch.

The contexts are pooled, and that is load-bearing rather than an allocation micro-optimization: a per-chain context survives its chain's microtask hops, so under a collecting profile a freshly allocated one is promoted out of the nursery and then collected the expensive way. Measured against the previous build under the same forced-GC hook, `dynamic-async-chain-8` goes from 0.98× to 1.18× of InversifyJS (n=3 each) with the no-GC profile unchanged — closing the last documented loss in the suite, whose mechanism had been recorded as unidentified. A competing hypothesis was tested and rejected: a forced full GC costs the two libraries the same (1.35 ms / 9.76 MB live for di, 1.41 ms / 9.89 MB for inversify), so the cost was never the collection but what di re-established afterwards.
