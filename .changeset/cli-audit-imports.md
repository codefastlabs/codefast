---
"@codefast/cli": minor
---

Generalize `audit react` into `audit imports` — a rule-driven import-policy audit. It keeps the React policy (members
imported by name; no `import * as React`, default `React`, or implicit `React.*` UMD-global type reference) and adds a
Zod policy for front-end packages: a named `import { z } from "zod"` pins Zod's full locale set into the bundle, so the
namespace form (`import * as z from "zod"`) is required there. Adding another library is one rule entry.

Breaking: the subcommand is now `audit imports` (was `audit react`), the config key is `audit.imports` (was
`audit.react`), and the convenience script is `cli:audit:imports` (was `cli:audit:react`).
