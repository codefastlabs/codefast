---
"@codefast/di": patch
---

`container.d.ts` declares the disposal globals `Container` names — `Symbol.asyncDispose`, `Symbol.dispose`,
`AsyncDisposable` and `Disposable` — member for member as TypeScript's `ESNext.Disposable` lib and `@types/node` do. On
TypeScript 7 with a `lib` that lacks `esnext.disposable` and no `@types/node` (no `target` and `types: []`, or any
`@codefast/typescript-config` preset), the declaration no longer fails with TS2550, and
`await using container = Container.create()` no longer fails with TS2318. Nothing else from that lib is declared, so
`DisposableStack`, `AsyncDisposableStack` and `SuppressedError`, which Node 22 lacks, stay a type error.
