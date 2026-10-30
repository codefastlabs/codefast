---
"@codefast/tailwind-variants": patch
---

A resolver without slots remembers each selection once and the classes callers pass it inside that entry, so a repeated
call builds no cache key, and a caller's class is remembered only from its second sighting — a `className` unique to its
call no longer churns the store.
