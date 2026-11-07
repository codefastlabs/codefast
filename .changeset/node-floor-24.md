---
"@codefast/cli": minor
"@codefast/di": minor
"@codefast/di-testing": minor
"@codefast/tailwind-variants": minor
"@codefast/theme": minor
"@codefast/tracking": minor
"@codefast/typescript-config": minor
"@codefast/ui": minor
---

Every `@codefast/*` package now requires Node.js 24.15 or later and drops Node 22. The packages ship as one set, so they
share one floor instead of each sitting on its own 22.x release. `@codefast/typescript-config` removes the `node22.json`
and `node22-dom.json` overlays; extend a preset alone. `codefast audit engines` reports a published package whose floor
differs from the highest one any published package declares.
