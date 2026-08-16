---
"@codefast/di": minor
---

perf(di)!: derive resolution-path names from frames instead of carrying a second array

Every hop used to push and pop two lockstep arrays — token names for error messages and frames for cycle detection. The
name array is gone: cycle guards, branch extension, escapes, contexts and the cascade carry only the frame stack, and
the names an error or `ctx.graph.resolutionPath` reports are derived from the frames at the moment they are asked for.
Hot lanes pay one push/pop per hop instead of two; only error paths pay the name materialization.

Breaking (internal-module surface; the root export is unchanged):

- `ResolverCallbacks` and the resolution-path helpers take only the frame stack — `enterResolutionPath(stack, frame)`,
  `extendResolutionBranch(stack, depth, frame)`; `OwnedBranchPath` and `extendResolutionStackBranch` are gone
  (`OwnedBranchStack` is the one brand).
- `DependencyResolver.rootPath` is gone; the lending protocol reads `rootStack` alone.
- `ConstraintContext.resolutionPath` is now derived per read from `resolutionStack` — contents are identical, but it is
  no longer the same array object across reads.
