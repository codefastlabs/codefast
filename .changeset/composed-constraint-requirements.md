---
"@codefast/di": patch
---

fix(di): a `when()` chain no longer hides a helper's requirement from `validate()`

`.when(whenParentNamed("x")).when(other)` composes one closure out of two predicates, and the composition dropped the
unreachability requirement the name helper had recorded — the constraint stayed impossible to satisfy, `validate()` just
could not see it, a limit the previous changeset stated outright. SPEC's rule carries no such carve-out: `validate()`
throws `UnreachableConstraintError` when no binding declares the slot name a constraint waits for, composed or not.

The composition site now merges both sides' requirements onto the composite predicate, and `validate()` reads the full
list, so a requirement survives any number of `when()` narrowings and either side of the chain can contribute one.
`constraintRequirementOf` keeps its shape and answers the first recorded requirement; the plural
`constraintRequirementsOf` is the reader `validate()` uses. A container that previously validated clean can now throw —
that is the documented rule holding where it silently did not.
