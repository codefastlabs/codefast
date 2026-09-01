---
"@codefast/di": minor
---

Fold the name lane into the tag lane: a slot name is now a criterion of the reserved tag key `slotName`, exported from
the package root.

`whenNamed(n)` ≡ `whenTagged(slotName.of(n))` and `{ name: n }` ≡ `{ tag: slotName.of(n) }` — one selection model, one
matcher, one criterion index. Names take part in key masks, criterion counting (specificity) and the multi-criterion
union lane like any tag, and `whenParentTagged(slotName.of(n))` is now expressible directly.

**Breaking (behavioral):** outcomes change only for a request carrying **both** a `name` and at least one tag. The old
name rule — equality, absence included — excluded every slot that declared no name; under the one-rule model those slots
match whenever their declared criteria are covered by the request, and the most-specific candidate (highest criterion
count, the name counting as one) wins. Requests carrying only a name, only tags, or nothing resolve exactly as before.
Selection stays container-local: a child's matching subset slot answers before a parent's more specific one, exactly as
it always has for tag-only requests. `initializeAsync` instantiates each singleton binding directly instead of
re-selecting by its slot's criteria, and a request's `name` folds through the new `TagKey.peek()` — an intern read that
never mints — so dynamic names no binding declares are never retained.

**Breaking (internal API):** the registry's string-keyed named index, the lookup cache's named lane, and the
`isNameOnlyOptions`/`singleTagOnlyOf` helpers are gone; `singleCriterionOnlyOf` is the one admission test.
`BindingSlot.tags` now carries the reserved criterion and `BindingSlot.name` is its derived view.

Benchmarked paired and alternating (three adjacent source-swap passes): the hottest named rows gained 9–12%, the tag
shorthand row 4%; details and the accepted trade on two codefast-only rows are in `benchmarks/di-inversify/RESULTS.md`.
