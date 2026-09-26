---
"@codefast/di": patch
"@codefast/di-testing": patch
---

The README states what a program needs for the declarations' disposal members: the explicit resource management types,
which no numbered `lib` declares before ES2027. `@types/node` 24 or later loads them, and so does `ESNext.Disposable` in
`lib`. Without either, TypeScript 7 fails inside `container.d.ts` with TS2550 under `skipLibCheck: false`, and at
`await using` with TS2318. `@codefast/di-testing` drops a `/// <reference lib="esnext.disposable" />` that TypeScript 7
stripped from its emitted declarations anyway, and takes the lib from its `tsconfig.json` instead.
