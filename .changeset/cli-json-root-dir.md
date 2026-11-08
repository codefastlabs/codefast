---
"@codefast/cli": minor
---

The `--json` output of `audit` and `tag` names the repo root `rootDir` instead of `cwd`, which it never was: it is the
resolved project root, not the directory the command ran in. Both shapes move to `schemaVersion: 2`; read `rootDir`
where a script read `cwd`.
