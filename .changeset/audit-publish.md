---
"@codefast/cli": minor
---

Add `codefast audit publish`, a static publish-surface check. It flags `#/`-prefixed internal import specifiers — valid
to the in-repo runners but rejected by Node's ESM resolver on the supported floor, so they break the published package —
and any `exports`/`imports` target the slimmed publish manifest would not ship. It joins the `audit` family and gates
CI, replacing an external `publint` step.
