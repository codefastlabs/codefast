---
"@codefast/di-testing": minor
---

**Breaking:** a test bed's `dispose()` is renamed `disposeAsync()`, matching `@codefast/di`'s `Container#disposeAsync()`
— it returns a `Promise`, so it carries the `Async` suffix. `await using bed = …compile()` is unchanged; replace
`await bed.dispose()` with `await bed.disposeAsync()`.
