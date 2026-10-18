---
"@codefast/di": minor
---

**Breaking:** a root-level `resolveAll` / `resolveAllAsync` with no options now hands every caller the same memoized
list while the chain and its activation hooks are unchanged, instead of a fresh copy per read. The result was already
typed `ReadonlyArray`; it is now read-only in fact, and a caller that needs a list of its own copies it (`[...list]`).
Dropping the copy reads `resolve-all-strategies-10` +22%, `resolve-all-strategies-100` +67% and
`production-event-bus-dispatch` +32% in a paired run, with the cold collection rows and the canaries level.
