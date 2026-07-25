---
"@codefast/di": patch
---

Unify sync transient-dynamic cycle detection on a per-binding `inFlight` flag, replacing the shallow lane's `O(depth)` `resolutionPath.includes()` scan and the deep lane's `Map` of generation marks. Sync resolution runs on a single call stack, so a binding marked on factory-enter and cleared on factory-exit is exactly path membership — detection becomes an `O(1)` field read with no hashing, no string scan, and no side table to allocate or grow. The async lane keeps its own per-path check, since async chains can interleave.

Transient-dynamic chains that previously lost now win across the whole depth range (a 32-deep chain went from ~0.55× to ~1.8× of InversifyJS), deep chains widen their lead, and cold container builds get cheaper because there is no per-resolver cycle-tracking structure to allocate. It also fixes a latent correctness bug: because the deep lane now clears a binding's mark when its factory returns, a deep (past-threshold) transient dependency resolved twice via separate sub-branches (a diamond, not a cycle) no longer throws a false `CircularDependencyError`.
