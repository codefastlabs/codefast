---
"@codefast/di": patch
---

Collapse the resolver's duplicated logic onto one rule per question, and fix the two places where a
second copy had drifted.

- `resolveAll(token, { name })` now evaluates a `when()` predicate on a named binding, as `resolve`
  always did. The name index answers the slot; the predicate is a further constraint, and the
  fast lane was returning a candidate `resolve` refuses.
- Refining a binding's scope after its first resolve (`bind(T).toDynamic(f)` … later `.singleton()`)
  now reports the new scope to `when()` predicates that read `ctx.parent.scope`. The resolution
  frame is memoized on the binding and derives from `scope`, so the refinement has to drop it.

Internally: slot matching, name-only requests, and the alias walk each exist once; a class's
constructor params and a `toResolved` factory's descriptors resolve through one routine per lane;
`scope` is declared by every binding kind, so the engine reads it as a plain field. No public API
changed. Resolution throughput is unchanged or better across the benchmark suite — `resolveOptional`
~1.5×, transient class and `toResolved` construction ~1.35–1.44×, constants and named lookups
~1.3×, with the deep/wide graph rows at parity.
