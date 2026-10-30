---
"@codefast/tailwind-variants": minor
---

**Breaking:** a compound condition treats `undefined`, `null` and `false` as the same value, inside a list as well, in
compound variants and compound slots of every configuration — the rule upstream `tailwind-variants` applies. A slot
configuration's compound variant on `false` now matches an omitted variant, and a condition on `false` or `[false]`
matches a `null` one.
