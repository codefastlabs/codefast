---
"@codefast/di": minor
---

Retire the async cascade lane: every `resolveAsync` now runs on the branch lane, so a factory's context answers from its
own ancestors before and after an `await`. A `whenParentIs` binding requested after an `await` is now selected as the
sync lane selects it, `ctx.graph.resolutionPath` names the level's own ancestors, and a cycle formed entirely from
post-`await` edges is named from the true root. A transient class or factory root with a statically visible graph is
answered by the compiled async plan. `AsyncCascadeContext` and `resolveAsyncFromCascade` are removed from
`resolution/context`; `ResolutionDiagnostics.builtSubsystems` reports `resolver.asyncRootLevel` once the async lane has
been entered.
