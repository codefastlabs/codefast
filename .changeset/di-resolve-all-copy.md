---
"@codefast/di": patch
---

A root-level, options-less `resolveAll` and `resolveAllAsync` hand each caller a copy of the memoized list instead of
the list itself, so a caller that writes into its result — `push`, `sort`, `reverse` — can no longer rewrite what the
next caller reads. The memo behind it, and the predicate and candidate evaluation it saves, are unchanged.
