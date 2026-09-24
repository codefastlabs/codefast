---
"@codefast/di": minor
---

Decorators report a runtime without `Symbol.metadata` as `MissingDecoratorMetadataError` at the declaration, naming the
decorator and the fix (`(Symbol as { metadata?: symbol }).metadata ??= Symbol.for("Symbol.metadata")` in a module
imported first), instead of failing with a bare `TypeError` on the first metadata write. TypeScript compiles
`context.metadata` to `undefined` on such a runtime; the library does not install the symbol itself, since the package
declares no side effects.
