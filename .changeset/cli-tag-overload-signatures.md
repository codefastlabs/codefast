---
"@codefast/cli": minor
---

`codefast tag` stamps every overload signature again, each in its own doc block. Since the move to `oxc-parser` it
stamped only an overloaded function's implementation, the one signature a `.d.ts` drops, so a released overload reached
consumers with no `@since` on any signature they can see.

A declaration with no doc block and a `//` comment on the line above it now fails the run instead of getting a fresh
block there, where the block would stack under a note (which `audit comments` rejects) or split a directive from the
code it governs. The run names each such declaration by file and line, lists it under `blockedDeclarations` in `--json`,
leaves its file untouched, and exits `1`: once a release ships the declaration unstamped, a later run can only stamp a
version that did not introduce it. The `--json` `ok` field now follows the exit code, so a failed target also reports
`ok: false`.
