---
"@codefast/di": patch
---

Fix a batch of correctness bugs found by a full engine audit:

- Subclass decorators no longer pollute the base class's metadata: defining a decorated subclass used to make the base
  unresolvable and silently dropped the subclass's own hooks and accessors. Lifecycle and accessor metadata now
  aggregate over the base chain (postConstruct base-first, preDestroy derived-first); constructor metadata stays opt-in
  per class.
- A dependency cycle through an `@inject` accessor now throws `CircularDependencyError` instead of overflowing the
  stack.
- A held fluent chain refined after later registry writes can no longer undo an `unbind` or destroy a newer binding; a
  scope refinement evicts the instance cached under the old scope, and a re-slot no longer double-deactivates or re-runs
  the factory of a cached `undefined` singleton.
- `resolveAll`/`resolveAllAsync` materialize a parent-owned singleton at the parent, so a child override no longer leaks
  into the shared instance and `child.dispose()` no longer destroys it.
- Concurrent async resolves of one scoped binding construct one instance; a sync resolve during an in-flight async
  singleton materialization refuses with `AsyncResolutionError` instead of silently double-constructing.
- Container-level activation hooks fire per the binding's owner, matching the SPEC, including through compiled plans.
- Teardown survives throwing hooks (every remaining hook still runs, failures are reported), drains in-flight async
  materializations, deactivates dependents before dependencies, and a disposed parent no longer serves or
  re-materializes singletons through live children. A module whose setup throws rolls back, so a retry load works.
- DOT/Mermaid graph adapters escape token names; `has()`/`hasOwn()` answer ambiguity with `true`; binding snapshots no
  longer alias live registry state; `NoMatchingBindingError` survives bigint and circular tag values; the verifying
  metadata reader checks lifecycle and accessor answers; `resolveOptional` evaluates `when()` predicates once
  (measurably faster on the hit path).
