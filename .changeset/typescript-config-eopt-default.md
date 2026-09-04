---
"@codefast/typescript-config": minor
---

`exactOptionalPropertyTypes` now defaults to `true` in `base.json`, so every preset (`base`, `library`, `react`) turns
it on and each package inherits one source of truth instead of repeating the flag. Packages not yet ready for it opt out
explicitly with `"exactOptionalPropertyTypes": false` (`@codefast/cli`, `@codefast/tailwind-variants`, and the private
benchmark packages). A consumer extending these presets will now type-check under `exactOptionalPropertyTypes`; set it
back to `false` locally if that surfaces errors you are not ready to fix.
