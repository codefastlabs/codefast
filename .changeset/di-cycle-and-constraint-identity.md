---
"@codefast/di": minor
---

Fix two resolution bugs; the second changes what a constraint matches.

- A constructor that resolves its own class back through the container now throws `CircularDependencyError` on every
  resolve. Once the class was served by its compiled plan, the same code overflowed the call stack on the sync lane and
  started an endless chain of promises on the async one.
- **Breaking:** `whenParentIs`, `whenNoParentIs`, `whenAnyAncestorIs`, `whenNoAncestorIs`, `whenParentNamed` and
  `whenAnyAncestorNamed` compare tokens by identity, never by display name, so two tokens named alike no longer satisfy
  each other's constraints. `ResolutionFrame` gains `token`, the token or class the frame resolves, for a custom
  predicate to compare the same way; `ConstraintRequirement.tokenName` becomes `token`.
