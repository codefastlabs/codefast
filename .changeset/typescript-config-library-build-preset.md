---
"@codefast/typescript-config": minor
---

Add a `library-build.json` preset holding the shared emit options for the native `tsc` package build (`noEmit: false`, `declaration`, `declarationMap`, `sourceMap`, `types: ["node"]`). Each package's `tsconfig.build.json` now uses array `extends` (`["./tsconfig.json", "@codefast/typescript-config/library-build.json"]`) and keeps only its local `outDir`/`rootDir` and `include` — dropping the duplicated emit block across all library packages. Path-relative options stay local because `extends` resolves them against the file that declares them.
