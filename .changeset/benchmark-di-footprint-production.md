---
"@benchmark/di": patch
---

`bench:footprint` bundles every library under the conditions a production `vite build` resolves, so a package's
`production` lane is what it measures, and the `@codefast/di` budget drops to 19 550 B to hold the smaller production
messages.
