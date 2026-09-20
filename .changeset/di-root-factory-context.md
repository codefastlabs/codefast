---
"@codefast/di": patch
---

A transient factory root resolved with `resolveAsync()` is handed one resolution context per binding, built on the first
resolve and reused by every later one — its path is its own frame alone and the request carries no options, so the
context is a function of the binding. The root allocated an array and a context per resolve; it allocates nothing now,
and a concurrent root reads the same, correct, path after an `await`.
