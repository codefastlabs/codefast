---
"@codefast/cli": minor
---

Add `codefast audit assertions`, which reports every double type assertion through `unknown` or `any` —
`x as unknown as T`, `(x as unknown) as T`, `<T><unknown>x` and the `any` spellings — in `.ts`/`.tsx` files, tests
included. Where the erasure is the point, keep one with `// codefast-allow-double-assertion: <reason>` on its line or
the line above; a directive with no reason, or one that keeps no assertion, is reported too. Exceptions can also go in
`audit.assertions.allowlist`.

`Filesystem.readdir` is replaced by `readdirEntries(path, { recursive })`, which always returns directory entries: every
caller asked for them, and the old `string[] | DirectoryEntry[]` union forced each one to cast or guard.
