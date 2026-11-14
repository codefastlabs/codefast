---
"@codefast/cli": minor
---

An audit's name no longer claims more than it checks:

- `audit:display-names` becomes `audit:di-display-names` (config `audit.diDisplayNames`), and reads only what uses
  `@codefast/di` — the package itself, code that imports it, markdown that names it — so another library's `token()` is
  never reported.
- `audit:rtl` becomes `audit:tailwind-rtl` (config `audit.tailwindRtl`); it checks Tailwind classes only.
- `audit:imports` holds no rules of its own: it bans exactly the import forms `audit.imports.rules` declares, each rule
  a `module`, the forms it bans (`namespace`, `default`, `named:<name>`), an optional `scope` and `umdGlobal`, and a
  `message`. With no rules it reads nothing. The React and Zod rules it used to hardcode move into the config of the
  project that wants them; the new `ImportRule` type describes one.
