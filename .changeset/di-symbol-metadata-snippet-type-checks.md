---
"@codefast/di": patch
---

`MissingDecoratorMetadataError` suggests installing `Symbol.metadata` as
`(Symbol as { metadata?: symbol }).metadata ??= Symbol.for("Symbol.metadata")`, which type-checks in a `.ts` file; the
bare `Symbol.metadata ??= …` it quoted failed with TS2540, since TypeScript declares the symbol `readonly`.
