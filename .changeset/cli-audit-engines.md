---
"@codefast/cli": minor
---

Add `codefast audit engines`, which holds each workspace package's own Node floor (`engines.node`) to what runs on it: a
published package declares one as `>=X.Y.Z`, inside the `engines.node` of every runtime and dev dependency, with the
`@types/node` the lockfile resolves declaring nothing the floor lacks. `--json` lists every floor, enough to plan one CI
leg per floor.
