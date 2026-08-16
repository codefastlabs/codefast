---
"@codefast/di": patch
---

perf(di): lend a sync escape's seed stack instead of copying it per call

A compiled plan's escape re-enters the runtime resolver seeded with its ancestor frames, and minted a fresh
`[...frames]` on every call because the resolver pushes and pops on the array it is given. Every sync lane pops what it
pushes, so the owned array still holds exactly the seed when a call returns — the thunk now lends one array, the
resolver's own root-stack rule one level down. A dirty return (length not restored) drops the array and the next call
mints; re-entering the same thunk without a genuine cycle is impossible — every route back to the same plan node crosses
a binding that is still in flight — so the claimed branch is a one-compare defence rather than a hot case. The async
escape lane keeps copying: it lives across awaits, where "the call returned" and "the stack is free" are different
moments.

The win is bigger than removing one small allocation, and the mechanism is the context pool: a pooled resolution context
is reused only for the array pair it already holds, so a fresh array per escape forced a fresh context per escape — the
lent array keeps its identity across calls and the pool starts hitting. Measured paired against the previous build, six
alternating passes, all five escape rows positive in every pass: `plan-escape-factory-dep` **1.41×** (1.331–1.460),
`plan-escape-scoped-dep` **1.23×**, `plan-escape-optional-dep` **1.14×**, `plan-escape-hooked-dep` **1.12×**,
`plan-escape-multi-dep` **1.11×**; the no-escape `plan-deps-inlined` control holds parity and
`realistic-graph-resolve-root`, whose root plan escapes once for a singleton materialization, reads 1.03×. A new test
pins that a throwing escape leaves the thunk reusable.
