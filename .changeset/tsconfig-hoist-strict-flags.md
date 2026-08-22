---
"@codefast/typescript-config": minor
---

chore(typescript-config): hoist noImplicitOverride and verbatimModuleSyntax into the base preset

Both flags were copy-pasted across five workspace tsconfigs and were absent from the shared preset. They now live in
`base.json`, so every workspace inherits them and the redundant per-package copies are removed. Enabling them repo-wide
was verified to produce zero new type errors. `exactOptionalPropertyTypes` is intentionally left per-package: turning it
on everywhere surfaces mostly-benign errors in the component/CLI packages, so it stays opt-in for the logic-heavy
packages that benefit from it.
