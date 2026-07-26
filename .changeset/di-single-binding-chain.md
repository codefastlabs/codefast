---
"@codefast/di": patch
---

Collapse the fluent binding chain into one object. A single `BindingChain` is now the `BindToBuilder` that `bind()` returns and the kind-specific builder that `to*()` returns, so a `bind()` allocates one builder instead of two.

The `to*()`-before-`when*()` ordering stays enforced, as a type-level guarantee — which is what SPEC §2.4 actually claims. `bind()` is typed `BindToBuilder`, so a refinement before `to*()` does not compile; `tests/types/container-api.test.ts` pins that. For a caller without types, or one who casts past them, every refinement now throws the new **`ChainNotRegisteredError`** naming the token and pointing at `to*()`, rather than silently doing nothing. `whenDefault()` asserts registration for that reason alone, since it otherwise has nothing to do.

The previous revision kept two objects because a unit test asserted the refinement methods were _absent from the object_ `bind()` returns — a stricter reading than the spec, and one that pinned an implementation detail. That test now asserts the contract instead: every refinement throws before `to*()`, nothing is registered when it does, and the chain still works normally afterwards.

This is an API simplification, **not** a throughput win: going from four builder objects per bind to three measured no change above noise, and a fluent API cannot go below one, so the ~19% ceiling recorded in ARCHITECTURE for removing all of them is unreachable rather than pending.
