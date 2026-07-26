---
"@codefast/di": patch
---

Split the resolver's self-contained caches into named collaborators — `BindingLookupCache` (the chain-versioned options-less lookup memo), `ClassIntrospector` (per-class metadata, `@postConstruct` discovery, accessor injection, instantiation) and `ActivationNeedCache` (per-binding activation need, versioned on the lifecycle manager). The engine class keeps the sync and async pipelines, which genuinely need the same private state on every hop, and `ARCHITECTURE.md` now records the layering, the invariants each hot path depends on, and the rule that separates a legitimate threshold (choosing an implementation) from the kind that was removed (choosing a semantics).

New subpaths `@codefast/di/resolution/{activation-need,binding-lookup-cache,class-introspector}`; `@codefast/di/resolution/class-plan` is now `@codefast/di/resolution/instantiation-plan`, correcting an export map that had been stale since the module was renamed.
