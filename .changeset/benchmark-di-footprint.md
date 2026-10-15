---
"@benchmark/di": patch
---

`pnpm bench:footprint` bundles each library's smallest bind-and-resolve program for the browser with Rolldown and prints
its minified and gzipped size, with `reflect-metadata` measured alone beside the libraries that ship it.
