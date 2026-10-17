---
"@codefast/di": patch
---

The README writes `validate`, `inspect` and the other introspection functions as the free functions they are —
`validate(container)` rather than a method-style `validate()` — and notes that guarding `validate(container)` with a
dev-only check keeps the introspection code out of a production bundle.
