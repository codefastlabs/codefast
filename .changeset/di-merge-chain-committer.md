---
"@codefast/di": patch
---

Fold the fluent chain's registry committer into the chain itself. `bind()` now allocates a `BindingEntry` that carries only the `to*()` calls, and `to*()` a `BindingChain` that commits to the registry directly — one object per bind less than the entry/chain/committer trio, and one `Map` lookup less per binding registered by a module.

The two classes now share a `BindingRegistration` describing where the chain registers, built once per container rather than once per `bind()`. Threading that instead of a loose `(registry, moduleBindingIds, moduleRef)` triple makes the module invariant type-enforced — the id list is present exactly when the chain belongs to a module load — which removes both non-null assertions from the commit path, and drops the constructors from 4 and 5 positional parameters to 2 and 3.

`BindingCommitter` is gone and `BindingEntry`'s constructor now takes `(token, registration)`. Neither is a published entry point any more, so this is internal.

This is a simplification, **not** a throughput win: removing only the committer measured no change above noise. The chain stays two objects because `tests/unit/container/bind-to-builder-order.test.ts` requires `bind()`'s result to lack `when*()` at runtime — that is the test's own guarantee, stricter than SPEC §2.4, which only claims compiler enforcement. The measured ceiling for removing every builder object is ~19% on `realistic-graph-cold-resolve` under a forced GC — recorded in ARCHITECTURE so the lead is not re-tried blind.
