---
"@internal/benchmark-harness": minor
---

A bench child is spawned as the running Node with the suite's `tsx` loader on its entry, the tsconfig handed over
through `TSX_TSCONFIG_PATH`, instead of through `pnpm exec tsx`: the package-manager start cost more than a whole short
child, once per scenario per library. `launchWithPnpmTsx` is `launchWithNodeTsx`, and a `SubprocessLaunch` may carry the
environment its launcher needs.
