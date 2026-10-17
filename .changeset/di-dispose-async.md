---
"@codefast/di": minor
---

**Breaking:** `Container#dispose()` is renamed `disposeAsync()`. It returns a `Promise`, so the bare name broke the
package's own rule — unqualified is sync, the `Async` suffix is async — and the spec carried an exception for it that is
now gone. `disposeAsync` is the name TC39's `AsyncDisposableStack` gives the same method, and `[Symbol.asyncDispose]()`
still delegates to it, so `await using` is unchanged. Replace `await container.dispose()` with
`await container.disposeAsync()`; an `AggregateError` from a teardown with several throwing hooks now reads
"disposeAsync() completed, but deactivation hooks threw".
