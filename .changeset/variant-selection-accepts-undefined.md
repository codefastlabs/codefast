---
"@codefast/tailwind-variants": patch
---

`VariantSelection` — the type a variant function accepts at its call site — now admits an explicit `undefined` on every
field, so a consumer under `exactOptionalPropertyTypes` can forward a possibly-undefined prop (`variant={variant}`)
without first omitting it. `VariantValues`, which `defaultVariants` declares, stays strict. Types only — no runtime
change.
