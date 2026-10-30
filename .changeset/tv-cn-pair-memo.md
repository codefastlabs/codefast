---
"@codefast/tailwind-variants": patch
---

`cn` answers a repeated call of two strings — a static class list and the caller's `className` — from a memo keyed on
the strings as passed, so a repeat skips both the join and the merge engine's lookup of a freshly joined key. The `cn` a
`createTV` factory returns does the same through its own merge. `cx` and `cn` join their arguments in one pass, so a
value that is not a string no longer restarts the join.
