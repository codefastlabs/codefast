---
"@codefast/cli": patch
---

The optional `typescript` peer is now `>=7.0.0`. It was published as the repository's own `^7.0.2` pin, which excluded
TypeScript 8 and would have risen with each pin bump instead of staying at the supported floor.
