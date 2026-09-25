---
"@codefast/typescript-config": patch
---

The `typescript` peer range is now `>=5.7.0`, matching what the presets need: every preset sets `target` and `lib` to
`ES2024`, which TypeScript 5.6 and older reject (`TS6046`), so the old `>=5.0.0` range promised releases that could
never compile against them. Installs that already worked are unaffected.
