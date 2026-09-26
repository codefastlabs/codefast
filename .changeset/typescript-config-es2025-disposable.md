---
"@codefast/typescript-config": minor
---

The presets' `lib` and `target` move from `ES2024` to `ES2025`, the newest edition Node 24 fully supports, and `lib`
adds `ESNext.Disposable` for the explicit resource management Node 24 ships natively. `base.json`, and so `react.json`
and `next.json`, lists `DOM`, `DOM.Iterable`, `ES2025` and `ESNext.Disposable`; `library.json` lists `ES2025` and
`ESNext.Disposable`. A program on a preset can use ES2025 builtins and `using` with no `lib` entry of its own, and a
builtin newer than both, such as `Map.prototype.getOrInsert`, is still a type error.
