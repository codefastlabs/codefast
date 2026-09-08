---
"@codefast/theme": patch
---

Import Zod as a namespace (`import * as z from "zod"`) so bundlers can tree-shake it. The named `import { z }` kept
Zod's full locale set in the bundle; the appearance provider's browser bundle now drops roughly 80% (~91 KB → ~18 KB
gzip).
