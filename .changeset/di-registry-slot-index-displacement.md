---
"@codefast/di": patch
---

Register a binding into a token's record in constant time. Last-wins displacement asked the record's list who occupied
the incoming binding's slot, walking every binding already on the token; the default slot now has its own index entry
beside the two tagged ones, so an add finds and displaces exactly its occupant without the walk. A token that grows a
large collection member by member — the fan-out cold path — was quadratic to build and is now linear: per-bind cost
stays flat instead of climbing with the collection size, and the `resolve-all-cold` rows move from a loss to a win
against the decorator-free rivals. The slot index is dropped in the same step a binding leaves its slot — `many()`
turning it into a member, a predicate making it predicate-only — so a later add never displaces a binding that has
already moved on.
