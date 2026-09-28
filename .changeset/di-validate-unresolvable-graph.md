---
"@codefast/di": minor
---

**Breaking:** `validate()` now throws the error `resolve()` would for a singleton graph that cannot resolve — a required
dependency nothing binds (`TokenNotBoundError`), a slot nothing matches (`NoMatchingBindingError`), or a cycle
(`CircularDependencyError`) — with the path from that singleton down to the problem. A parent-owned singleton reached
from a child is now read from the parent's chain, as `resolve` reads it. It still leaves alone what it cannot decide: a
transient or scoped consumer, whose dependencies a child container may bind, and a request only a `when()` candidate
matches. A container that passed `validate()` while holding such a graph now fails it; bind the missing dependency, or
mark it `optional()` when it may be absent.
