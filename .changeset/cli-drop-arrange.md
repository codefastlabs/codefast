---
"@codefast/cli": minor
---

Removes the `arrange` command and its `inspect`, `simplify` and `group` subcommands, along with the `arrange` config key
and the `CodefastArrangeConfig` type. oxfmt's `sortTailwindcss` already orders classes inside each `cn()`/`tv()` string
and is checked in CI, so a second, unenforced ordering across strings only drifted. Remove `arrange` from
`codefast.config.*`; the strict schema now rejects it.
