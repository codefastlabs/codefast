---
"@codefast/di": patch
---

Stop minting two arrays per top-level sync resolve, and stop a pooled resolution context re-storing pointers it already holds.

`--prof` over the four thinnest rows put the largest di-attributed cost in a place none of this package's notes mention: `#acquireSyncResolutionContext` and `DefaultResolutionContext.reset()` together take **22%** of ticks on `fan-out-tree-depth-3-breadth-4` and **16%** on `scale-deep-transient-chain-512`, and `reset()` alone takes **10%** on `container-level-activation-hook`. The reason `reset()` is not free is that a pooled context outlives enough resolves to sit in old space, so each of its five field writes is a pointer store with a write barrier — and three of the five write the same resolver and the same two arrays every time.

Except they did not, because `container.resolve()` handed every call a fresh `[]` pair. So both halves are needed together: a resolver now keeps one sync `rootPath`/`rootStack` pair, lent to a top-level resolve when `rootStack.length === 0` and otherwise replaced by a fresh pair, and `reset()` compares before storing. Every sync lane pops what it pushes, so an empty stack is an exact "nobody holds this"; a nested `container.resolve()` from inside a factory still starts from an empty path, and if a resolve ever left the pair dirty the only consequence is that later resolves mint their own.

Paired A/B against this commit's parent, six passes alternating which side ran first: `constant-resolve` **1.70×**, `container-level-activation-hook` **1.67×**, `realistic-graph-resolve-root` **1.34×**, `fan-out-tree-depth-3-breadth-4` **1.28×**, `scale-deep-transient-chain-512` **1.21×**, `scale-mid-transient-chain-32` 1.16×, `singleton-class-1-dep` 1.13×, `to-alias-redirect` 1.09×, and `dynamic-async-chain-8` 0.99× as the untouched control.

`transient-class-1-dep` reads **0.91×**, negative in all six passes, and the mechanism is the same one that wins the other rows: a fresh array is in new space, so pushing a frame onto it needs no write barrier, while the shared pair is in old space and every push pays one. That row pushes a frame and does nothing else, so it is the one shape where the barrier costs more than the two allocations saved. Kept because it is one row at −9% against five between +21% and +70%.

`tests/unit/resolution/in-flight-invariants.test.ts` pins the lending rule in both directions — a nested root resolve gets its own pair, and a throwing resolve hands the pair back — and both were checked by breaking the guard.
