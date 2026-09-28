---
"@codefast/di": minor
---

**Breaking:** `Container` no longer declares `[Symbol.dispose]`, and `SyncDisposalNotSupportedError` is removed. A
deactivation hook may be async, so a container disposes through `await using` or `dispose()` only, and a synchronous
`using` on one is now a compile error instead of a `SyncDisposalNotSupportedError` at runtime. Replace `using` with
`await using`, and drop any `instanceof SyncDisposalNotSupportedError` check.
