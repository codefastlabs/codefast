---
"@codefast/cli": minor
---

New `codefast audit display-names`: reports every `token()`, `tag()` and module display name off the repo's convention —
`<namespace>:<Name>`, with a kebab-case (or scoped-package) namespace, PascalCase for a token or module and camelCase
for a tag key — across TypeScript and markdown, skipping `tests/`, `benchmarks/`, `.changeset/` and `CHANGELOG.md`.
Exceptions go in `audit.displayNames.allowlist`. Wired into the repo as `pnpm cli:audit:display-names` and into CI.
