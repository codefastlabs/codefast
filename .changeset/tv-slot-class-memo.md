---
"@codefast/tailwind-variants": patch
---

A slot called with props that carry only `class` or `className` — how a sub-component passes on the `className` it was
given — no longer re-resolves the slot on every call. An absent or empty class returns the slot's memoised answer, and a
present one is merged onto the call's shared text, so `root({ className })` costs a lookup instead of a full resolve and
merge. Answers are unchanged.
