---
"@codefast/di": patch
---

Every resolution lane now answers a graph identically. A per-request child that misses a token its parent's bindings all
declined reports `NoMatchingBindingError` as the parent does, not `TokenNotBoundError`; a sibling on the async
interpreted lane is selected against its own path rather than the earlier sibling's frame; a dynamic factory that
resolves its own token from its synchronous prefix is reported as a cycle before it runs a second time.
