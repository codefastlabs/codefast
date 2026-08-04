---
"@codefast/di": minor
---

A `resolve` whose tags match several bindings now takes the one declaring the most tags, instead of throwing `AmbiguousBindingError`.

Tags on a binding are its own conditions, not a filter the request must match exactly, so naming more tags satisfies more bindings rather than fewer. Given `whenTagged("fuel","petrol")` and a specialisation `whenTagged("fuel","petrol").whenTagged("size","v8")`, a request for `{fuel}` skipped the specialisation — it also requires `size` — and a request for `{fuel, size}` satisfied both and was ambiguous. No request reached the specialisation at all, so declaring one was pointless.

That is the dispatch model, the same one routing, media queries and overload resolution use, and every one of those pairs it with a most-specific-wins rule for exactly this reason. This adds the rule that was missing: a candidate declaring more tags than every other is the more specific match. `{fuel}` now resolves the general binding and `{fuel, size}` the specialisation, which is what both the filter reading and the dispatch reading of tags predict.

Selection order is predicate first, then tag count, then throw. Predicate keeps its precedence because it is the older rule and re-ordering would re-decide resolutions that already succeed; with this order, every call that resolved before resolves to the same binding, and only calls that previously threw can now return. An equal tag count is still genuinely ambiguous — `{fuel:petrol}` against `{size:v8}` with both tags requested has no more specific side — and `resolveAll` is untouched, since specificity only applies where one binding must be chosen.

The new comparison sits on the branch that used to throw, so no successful resolve reaches it. Paired A/B over three passes, alternating order, per-scenario isolation: the four rows whose requests reach candidate selection and two controls all land in parity, 0.986×–1.040× against a control spread of 0.993×–1.018×.
