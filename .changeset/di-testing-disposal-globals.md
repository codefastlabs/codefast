---
"@codefast/di-testing": patch
---

The published `UnitTestBed` declaration type-checks without `@types/node` or the `ESNext.Disposable` lib: it failed with
TS2304 on `AsyncDisposable`, because TypeScript 7 strips the source's `/// <reference lib="esnext.disposable" />` from
emitted declarations. `unit-test-bed.d.ts` now declares the disposal globals it names, as `@codefast/di` does, so
`await using bed = TestBed.solitary(X).compile()` type-checks with any `@codefast/di` in the peer range.
