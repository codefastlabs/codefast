---
"@codefast/di": minor
"@codefast/theme": patch
"@codefast/tracking": patch
---

Report the failures that were being swallowed or mislabelled, and derive the types the build emits.

`@codefast/di`:

- `@inject`, `@postConstruct` and `@preDestroy` on a static member now throw
  `StaticMemberDecoratorError` instead of `InternalError`. All three act on one instance, so this is
  caller misuse — and `InternalError` means the library broke, which sent anyone catching it to file
  a bug against their own mistake. SPEC §10 already recorded that mistake for predicate ambiguity.
- `AsyncResolutionError` names the token the caller asked for and the token whose factory is async,
  which is what SPEC has always specified. Every throw site passed the same token twice, so the
  message read "Token 'X' requires async resolution because 'X' in its dependency chain has an async
  factory"; a `resolve(App)` that fails on an async `Database` now says so. `asyncSourceToken`
  defaults to `tokenName` for the case where the requested binding is itself the source.
- A `MetadataReader` that names a `@postConstruct`/`@preDestroy` method the instance does not have
  raises `InvalidMetadataError` instead of skipping the hook — a hook that silently never runs is
  the failure a caller cannot see. `InvalidMetadataError`'s message no longer says "constructor",
  since it now covers both answers; the specifics moved into `reason`.
- `MissingScopeContextError` from `ScopeManager` names its token instead of `"(unknown)"`, and the
  scoped read takes one map lookup where it took two.
- `Token`, `Constructor` and `InjectionDescriptor` declare `out Value`, so the compiler checks the
  covariance the engine already relied on.

Repo-wide: `isolatedDeclarations` is on for every package that emits declarations, so a public type
can always be written down from the source file alone. `allowJs` is gone from the shared base config
— no package has JavaScript sources. `@codefast/theme` and `@codefast/tracking` gained explicit
annotations on four exported constants to satisfy it; the emitted types are unchanged.
`@codefast/ui` and `@codefast/benchmark-viewer` opt out for reasons recorded in their configs.
