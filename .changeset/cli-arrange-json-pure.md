---
"@codefast/cli": patch
---

Fix `codefast arrange --dry-run --json` printing human-readable preview lines to stdout ahead of the JSON summary, which
broke piping the output to a JSON parser. Dry-run previews are now emitted only in human mode; `--json` writes a single
JSON object.
