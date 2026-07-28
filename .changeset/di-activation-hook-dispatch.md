---
"@codefast/di": patch
---

Make resolving through a container-level `onActivation` hook as cheap as resolving without one.

A transient factory binding that carries activation hooks now takes the same `O(1)` `binding.inFlight`
cycle guard as the unhooked lane — the argument for that guard never mentioned hooks, since a hook
runs on the call stack the factory did — and `LifecycleManager` keeps a one-entry token→hooks cache
in front of its map, because a resolve loop asks about the same token every iteration. Together they
halve what the hook lane costs over the plain one. A hook that re-resolves its own token still
reports `CircularDependencyError`, and the flag is still released on every exit path.
