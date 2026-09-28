---
"@codefast/di": minor
---

**Breaking:** `@postConstruct()` and `@preDestroy()` now reject a private (`#name`) method, as they already rejected a
static or symbol-keyed one. The lifecycle manager calls a hook by name on the instance, so a private hook passed
`validate()` and then failed at resolve with an `InvalidMetadataError` that blamed the metadata reader, or at
`dispose()` for `@preDestroy()`. Decorating one now throws the new `PrivateLifecycleMethodError` when the class is
defined. The decorators' types also accept only a public, instance, string-named method, and `@inject` only an instance
accessor, so TypeScript reports all of these at the decoration site (TS1240, TS1241). To run private code from a hook,
call it from a public one.
