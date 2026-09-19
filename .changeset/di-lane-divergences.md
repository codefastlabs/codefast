---
"@codefast/di": patch
---

Fix three lane divergences found by a new differential property test that resolves random graphs through every entry
point and holds them to one answer. A later sibling dependency on the async interpreted lane was selected against the
earlier sibling's frame, so a `when()` predicate such as `whenParentIs` could pick a different binding than the sync
lane did. A dynamic factory that resolved its own token from its synchronous prefix ran a second time before the cycle
was reported, on the lanes that did not flag it. A child container classified a request its parent's bindings all
declined as `TokenNotBoundError` where the parent threw `NoMatchingBindingError`.
