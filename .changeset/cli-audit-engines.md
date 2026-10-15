---
"@codefast/cli": minor
---

Add `codefast audit engines`, which holds each workspace package's own Node floor (`engines.node`) to the others: a
published package declares one as `>=X.Y.Z`, no lower than the toolchain's or a runtime dependency's, with the
`@types/node` the lockfile resolves on the floor's release line. `--json` lists every floor, enough to plan one CI leg
per floor.
