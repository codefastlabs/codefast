---
"@codefast/di": patch
---

Stop allocating a throwaway `Map` on every named resolve. The named-lookup memo upserted with
`getOrInsert(token, new Map())`, whose fallback JavaScript evaluates eagerly — so every call built a
`Map` for the hit that immediately discarded it. It now uses `Map.prototype.getOrInsertComputed` with a
module-level factory, which allocates nothing on a hit and no closure per call: **~1.72×** on
`named-constant-get`, measured paired against the previous build with the order alternated.

The bind-time upserts keep the eager form deliberately — a bind is usually a token's first, so the
fallback is usually the value stored, and the computed form measured slower there.

`@codefast/di` now calls `Map.prototype.getOrInsertComputed` as well as `getOrInsert`; both ship in Node
26+, which the package already required.
