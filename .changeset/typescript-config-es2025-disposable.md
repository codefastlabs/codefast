---
"@codefast/typescript-config": minor
---

The presets' `lib` and `target` move from `ES2024` to `ES2025`, the newest edition that Node 24 and the supported
browsers both ship. `base.json`, and so `react.json` and `next.json`, lists `DOM`, `DOM.Iterable` and `ES2025`;
`library.json` lists `ES2025`. A program on a preset can use ES2025 builtins with no `lib` entry of its own, and a
builtin newer than that, such as `Map.prototype.getOrInsert`, is still a type error.
