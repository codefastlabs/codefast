---
"@codefast/di": patch
---

Collapse the sync transient-dynamic resolver into a single lane and memoize each binding's resolution frame on the binding itself.

The separate deep lane existed to escape an `O(depth)` `resolutionPath.includes()` cycle scan past ~32 levels. With cycle detection now an `O(1)` `binding.inFlight` mark there is nothing to escape, so the depth split, its shared-context bookkeeping, its reentrancy fallback, and the per-resolver frame `Map` are all gone — the smaller function also inlines better. Frames derive only from immutable binding fields, so caching one per binding replaces a `Map` lookup per hop and a `Map` insert per binding per container.

Faster at every chain depth measured (8 → 512), e.g. a 32-deep transient chain improved ~39% and cold container build ~62%, which turns the cold-build result against Awilix from a loss into a win in the default benchmark profile.
