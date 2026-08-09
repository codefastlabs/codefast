---
"@codefast/di": minor
---

Two constraints that could never hold are now reported instead of quietly resolving to the default binding.

`whenParentTaggedAll([])` reads as a requirement but matches every parent — "carries all of no criteria" is vacuously true, so the constraint silently weakens to "has a parent at all", and specificity still ranks it above an unconstrained binding. Both `…TaggedAll` helpers now throw `EmptyTagCriteriaError` at the call site. An empty list is what a filtered array or an absent config produces, which is exactly when nobody is watching.

`whenParentNamed("typo")` waits on a bare string, so a misspelling produces a constraint nothing can satisfy, with no error at bind time, at resolve time, or from `validate()`. The name helpers now record what they wait for on the predicate itself, and `validate()` throws `UnreachableConstraintError` when no binding in the container or its ancestors declares that slot name.

Neither touches resolution: the criteria check runs where the helper is called, and the name check runs inside `validate()`. The requirement rides on the predicate under a symbol that resolution never reads.

One limit, stated because it is easy to assume otherwise: chaining `.when(whenParentNamed("x")).when(other)` composes a new closure, and the requirement does not survive that. The constraint is still unreachable; `validate()` just cannot see it.
