---
"@codefast/cli": minor
---

New `audit react` subcommand enforcing the repo's React import policy: flags `import * as React` and default `React`
imports (type-only included), plus implicit `React.*` UMD-global type references — the variant both `tsc` and the linter
accept silently through `export as namespace React` in `@types/react`. Configurable via `audit.react.allowlist` in
`codefast.config`; exits non-zero on violations so it can gate CI. The shared workspace walk also skips `.tanstack` and
`.nitro`, keeping TanStack/Nitro build caches out of every scan.
