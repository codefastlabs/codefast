---
"@codefast/cli": minor
---

New `codefast audit tokens`: reports every `token()` and `tag()` display name declared without a `<namespace>:` prefix,
across TypeScript and markdown, skipping `tests/`, `benchmarks/`, `.changeset/` and `CHANGELOG.md`. Exceptions go in
`audit.tokens.allowlist`. Wired into the repo as `pnpm cli:audit:tokens` and into CI.
