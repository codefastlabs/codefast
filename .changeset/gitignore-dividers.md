---
"@codefast/cli": minor
---

`audit comments` now enforces the section-divider convention in ignore files. `.gitignore`, `.dockerignore`,
`.npmignore`, `.prettierignore`, and `.eslintignore` are scanned for `#`-comment dividers, checked for the canonical
width, and rewritten by `--fix` — the same treatment `.ts`, `.tsx`, and `.css` already get. The code-only content rules
(`@since`, TSDoc grammar, banned fragments) stay off ignore files, which carry the divider convention alone.
