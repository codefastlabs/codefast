---
"@codefast/tailwind-variants": minor
---

**Breaking:** a numeric variant key is typed in both spellings the resolver reads it by, so `cols: { 1: "…" }` accepts
`cols: "1"` and `cols: { "1": "…" }` accepts `cols: 1`. `VariantProps` widens to match: code that narrows such a prop to
the numbers alone now has to admit the strings too. `defaultVariants` also accepts an explicit `undefined`.
