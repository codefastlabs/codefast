---
"@codefast/di": minor
---

**Breaking:** `resolveAsync`, `resolveOptionalAsync` and `resolveAllAsync` on a disposed container — or on a child of
one — now return a promise rejected with `DisposedContainerError` instead of throwing it, and `resolveAllAsync(token)`
likewise rejects when a `when()` predicate throws or an alias cycle is followed, so every async method reports its
failure through the promise it returns. Code that awaits these calls, or chains `.catch()`, behaves as before or better;
only a caller that wrapped the call itself in `try`/`catch` without awaiting it no longer sees the error there, and
should await it instead.
