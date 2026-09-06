---
"@codefast/cli": minor
---

`pack-slim` now slims the whole development lane out of the publish manifest, not only the source lane. Alongside `src`,
the `source` conditions, and the `dist` source maps it drops every `imports` entry left pointing outside `files` (the
`#/tests/*` and `#/examples/*` aliases), every script that is not an install or publish lifecycle hook, and
`devDependencies`, so the `package.json` npm shows describes only what a consumer's `tsc` and Node resolve. The CLI's
own tarball now ships its `CHANGELOG.md`.
