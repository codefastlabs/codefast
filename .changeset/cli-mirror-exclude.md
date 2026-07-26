---
"@codefast/cli": patch
---

Add `mirror.<pkg>.exclude` — a list of specifiers to leave out of the generated `package.json#exports`, so a package's public surface is a decision rather than a consequence of its `dist/` layout. Patterns are matched against the specifier as it would appear in `exports` (after `strip`), a trailing `/*` drops a whole subtree, and the root export is never excluded.

Until now the only levers were `strip`, extra `exports`, and `preserve: true` — and `preserve` skips the dist scan entirely, so curating a surface meant hand-editing the map that the tool exists to generate. `exclude` closes that gap.
