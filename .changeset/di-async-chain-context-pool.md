---
"@codefast/di": patch
---

Thread an async chain's resolution context through the call and pool it, instead of parking chain identity on the resolver. `ctx.resolveAsync()` now hands the callee the context it used, so an inner level reuses it when the owner matches — which removes the resolver's path-identity heuristic, its shared settle callback and its active-level counter, and makes two concurrent chains correct by construction rather than by a fallback branch.

The contexts are pooled, and that is load-bearing rather than an allocation micro-optimization: a per-chain context survives its chain's microtask hops, so under a collecting profile a freshly allocated one is promoted out of the nursery and then collected the expensive way. An ablation that allocated per chain cost **2.5×** on `dynamic-async-chain-8` under a forced GC every 100 samples, which is the reason for the shape.

It does **not** close that row. An earlier draft of this changeset claimed it went from 0.98× to 1.18× of InversifyJS; that figure came from a probe running both library builds in one process, which this harness's README warns is worth ~30% on async chains, and from a 3-trial suite run on a loaded machine. At 5 trials on a quiet machine the row is **0.87×** with a 0.6% / 0.3% IQR — among the tightest numbers in the suite. The mechanism above is real; the win over inversify was not.

A competing hypothesis was tested and rejected: a forced full GC costs the two libraries the same (1.35 ms / 9.76 MB live for di, 1.41 ms / 9.89 MB for inversify), so the cost was never the collection but what di re-established afterwards.
