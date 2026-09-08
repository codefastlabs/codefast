---
"@codefast/cli": minor
---

Expose a programmatic entry point. `@codefast/cli` is now importable — `import { runCli } from "@codefast/cli"` runs the
CLI in-process and resolves to its exit code — in addition to the `codefast` binary. The package ships type declarations
for this entry.
