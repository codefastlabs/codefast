---
"@codefast/cli": minor
---

Add `codefast audit engines`, which holds each workspace package's own Node floor (`engines.node`) to what runs on it: a
published package declares one as `>=X.Y.Z`, every runtime dependency's `engines.node` admits each release from the
floor up (odd lines below the newest tested one aside), every dev dependency's admits the floor and the newest release
CI tests on (`.node-version`), and the `@types/node` the lockfile resolves declares nothing the floor lacks. A violation
names the dependency, its range and the releases it leaves out. `--json` lists every floor, enough to plan one CI leg
per floor.
