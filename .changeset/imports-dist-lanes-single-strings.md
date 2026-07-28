---
"@codefast/benchmark-harness": patch
"@codefast/benchmark-viewer": patch
"@codefast/cli": patch
"@codefast/di": patch
"@codefast/tailwind-variants": patch
"@codefast/theme": patch
"@codefast/tracking": patch
"@codefast/ui": patch
---

Collapse the `types` and `default` lanes of `package.json#imports` from fallback arrays to single strings.

Node resolves an imports array by taking the first candidate it can parse, without checking that the file exists and without falling through — a specifier whose first candidate is missing throws `ERR_MODULE_NOT_FOUND` rather than trying the second. `./dist/*/index.js` and `./dist/*/index.d.ts` could therefore never be reached, so they read as a safety net that does not exist. The `source` lane keeps its extension candidates, which only `tsc` and Vite read and both probe.
