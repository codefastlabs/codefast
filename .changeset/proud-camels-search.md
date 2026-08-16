---
"@codefast/cli": minor
---

Teach `codefast audit comments` two content checks alongside the divider form: a comment that points at a repo document
(`see …*.md`) and JSDoc `{type}` payloads. Neither is `--fix`-able — the writer restates the invariant or lets the
declaration carry the type — so the report says which defects `--fix` covers.
