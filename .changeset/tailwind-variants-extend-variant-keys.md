---
"@codefast/tailwind-variants": patch
---

`tv({ extend })` keeps the extended resolver's variant and slot names when the extension declares no `variants` or
`slots` of its own. With nothing to infer from, the extension's schema fell back to its string-indexed constraint, so
the merged props took any key: `button({ sise: "sm" })` and `VariantProps<typeof button>` accepted a misspelt variant,
and a slot resolver accepted any slot name, though an unknown variant value was still caught. An extension that only
adds `base` or `compoundVariants` is now typed exactly like the resolver it extends. Compounds and defaults no longer
take part in inferring the extension's schema, so they cannot widen it either.
