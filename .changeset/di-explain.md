---
"@codefast/di": minor
---

Add `container.explain(token, options)`, which answers why a request selects the binding it does without instantiating
anything. It reads the container chain the way `resolve` does and decides by the same rules, so its answer is the
engine's own. It reports each registry it read with every candidate and its verdict (`eligible`, `slot-mismatch`,
`predicate-refused`, `collection-member`), the rule that decided (`sole-candidate`, `sole-predicate`, `most-criteria`,
`default-alias`, `ambiguous`), the binding the request ends on after every alias, and an `outcome` naming the error
`resolve` would throw when it ends on none. `when()` predicates run as they would in `resolve`, and `options.ancestors`
explains a request made from inside other resolutions, so a predicate that reads the parent sees the one it would.
