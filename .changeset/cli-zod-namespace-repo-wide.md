---
"@codefast/cli": minor
---

`codefast audit imports` now enforces the Zod namespace form (`import * as z from "zod"`) in every workspace package,
not only the front-end/bundled ones. The rule's `scope` restriction is dropped, so a named `import { z } from "zod"` is
flagged everywhere — backend/tsc packages such as `cli` itself included. Type-only imports
(`import type { ZodType } from "zod"`) stay allowed; only the value `z` is banned.
