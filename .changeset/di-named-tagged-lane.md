---
"@codefast/di": patch
---

A request carrying a name and one tag is answered from a memoized lookup of the exact two-criterion slot, in either
declaration order, instead of a scan of the token's bindings; a predicate on that binding still runs, and a name no
binding has declared is a miss at once.
