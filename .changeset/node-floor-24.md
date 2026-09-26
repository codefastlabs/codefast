---
"@codefast/di": minor
"@codefast/di-testing": minor
"@codefast/ui": minor
"@codefast/theme": minor
"@codefast/tracking": minor
"@codefast/tailwind-variants": minor
"@codefast/cli": minor
"@codefast/typescript-config": minor
"@benchmark/di": minor
"@benchmark/tailwind-variants": minor
"@internal/benchmark-harness": minor
"@internal/benchmark-viewer": minor
---

`engines.node` is now `>=24.0.0`, up from `>=22.12.0`, and Node 22 is no longer supported. Node 24.0.0 is the first
release with explicit resource management built in (`using`, `await using`, `DisposableStack`, `AsyncDisposableStack`,
`SuppressedError`) and all of ES2025, so the packages use both as the platform ships them instead of shimming them for
an older line. `@types/node` is pinned to `^24`, and the CI matrix runs the unit suite on 24.0.0 itself. Move to Node
24, or stay on the current minor while a deployment still runs Node 22.
