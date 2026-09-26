---
"@codefast/cli": minor
---

Remove `codefast audit constants`, the audit that required every upper-case numeric `const` to name its kind in the
comment above it.

Breaking: the `audit constants` subcommand is gone, and `audit.constants` is no longer a config key, so a
`codefast.config` that still sets it fails validation as an unknown key; delete that section.
