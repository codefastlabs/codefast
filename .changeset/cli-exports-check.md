---
"@codefast/cli": minor
---

`exports:generate --check` writes nothing and exits `1` when any package's `package.json#exports` would change, so a CI
gate needs no `git diff` after the command. `--dry-run` stays the preview that passes.
