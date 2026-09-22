---
"@codefast/di": patch
---

A `{ name, tag }` request now selects the same binding as its `{ tags: [slotName.of(n), tag] }` spelling, closing two
selection bugs. A name that has been interned nowhere in the process no longer makes the request a miss: the request's
criteria can still be a superset of a slot's, so an index miss falls through to the scan and the parent walk instead of
returning early — the answer no longer depends on whether unrelated code has ever called `whenNamed` with that string.
And the name-plus-tag fast lane now declines to full selection whenever the token carries any `when()` predicate
candidate, so the more-specific rule's predicate step is honoured on this lane as on every other.
