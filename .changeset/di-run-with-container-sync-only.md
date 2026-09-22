---
"@codefast/di": minor
---

`runWithContainer` is now typed as synchronous-only. The ambient container lives in a module-level variable restored in
a `finally`, so it lasts only the callback's synchronous run — it does not survive an `await`. A callback returning a
`Promise` was silently accepted and lost the context; its return type is now
`Result extends Promise<unknown> ? never : Result`, so an async callback resolves to `never`.
`MissingContainerContextError` now says the context does not survive an `await`, and the TSDoc, README and SPEC state
the sync-only constraint. The engine internals are unchanged — they only ever ran synchronous callbacks.
