---
"@codefast/di": patch
---

Unify transient-dynamic cycle detection on a dense typed-array in-flight marker (`Uint8Array` indexed by a per-binding `index`), replacing the shallow path's `O(depth)` `resolutionPath.includes()` scan and the deep path's `Map`-based generation marks. Cycle detection is now `O(1)` with no hashing and no string scan, and both lanes share one mechanism.

This turns the previously-lost shallow/mid transient-dynamic chains into wins (e.g. a 32-deep chain went from ~0.55× to ~1.3× of InversifyJS) and widens the deep-chain lead, while every transient-dynamic resolve gets slightly cheaper. It also fixes a latent correctness bug: because the deep path now clears a binding's mark when its factory returns, a deep (past-threshold) transient dependency resolved twice via separate sub-branches (a diamond, not a cycle) no longer throws a false `CircularDependencyError`.
