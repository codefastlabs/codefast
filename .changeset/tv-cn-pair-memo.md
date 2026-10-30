---
"@codefast/tailwind-variants": patch
---

The `cn` a `createTV` factory returns over a merge function of the caller's answers a repeated call of two strings — a
static class list and the caller's `className` — from a memo keyed on the strings as passed, so a repeat skips both the
join and the merge engine's lookup of a freshly joined key. `cx` joins its arguments in one pass, so a value that is not
a string no longer restarts the join.
