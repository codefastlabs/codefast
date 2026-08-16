---
"@codefast/di": patch
---

Trim the `resolveAll` selection path so it fits V8's cumulative inlining budget. The chain from `resolveAll` down to the
per-candidate resolve summed to roughly 1040 bytes of bytecode against a 920-byte budget, so TurboFan stopped inlining
partway through it. Three changes cut about 100 of those bytes without changing behaviour: `filterBindings` takes the
slot-match decision from its caller instead of deriving it, the per-candidate predicate is read once rather than twice,
and building a non-root `ConstraintContext` moved to its own function so a selection inlines the test and not the object
literal.

Measured against `benchmarks/di-inversify` (default isolated profile, source-swapped, six alternating paired passes,
median per row): `production-event-bus-dispatch` 1.058×, `resolve-all-strategies-10` 1.045×,
`resolve-all-strategies-100` 1.034×. `constant-resolve` and `resolve-all-named-64` read slightly under parity, both on
rows fast enough that the suite's own guidance says not to read them alone; neither is on the path this touches.
