---
"@codefast/cli": minor
---

Export `defineConfig` and the `CodefastConfig` type so `codefast.config.*` is authored with full editor autocomplete and
type-checking instead of by memory — `import { defineConfig } from "@codefast/cli"`, or a
`/** @type {import("@codefast/cli").CodefastConfig} */` JSDoc annotation in a plain `.js` config. The `mirror`
per-package `source`/`types`/`import` fields are now optional in the type (they already default to `true`), so a minimal
entry type-checks.
