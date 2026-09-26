---
"@codefast/typescript-config": minor
---

`library-build.json` sets `types: []` instead of `["node"]`, so a build loads only the ambient types its own config
names. A package that runs on Node adds `types: ["node"]` to its `tsconfig.build.json`, which also brings explicit
resource management. A browser or universal package leaves it empty, so a Node global in its source fails the build. No
preset lists `ESNext.Disposable`: a Node program gets explicit resource management from `@types/node` 24 or later, and a
browser program adds it once the browsers it targets ship it, which Safari has not.
