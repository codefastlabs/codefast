---
"@codefast/tailwind-variants": minor
---

**Breaking:** a variant value is read the way upstream `tailwind-variants` reads it, the same in every lane. A slot
component now selects key `"0"` for `0` instead of ignoring it; `""`, `NaN` and `0n` read as `"false"`, so they select a
boolean group's `false` value and no other key; and `null`, an array or an object selects nothing rather than looking up
its string form. Only an omitted or `undefined` value takes the configured default.
