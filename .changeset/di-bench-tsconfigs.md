---
"@benchmark/di": patch
---

Each library's `tsconfig.<library>.json` now includes only the files that library owns, the ones tsx compiles in its
decorator mode, and `check-types` checks every one of them. The legacy-decorator configs had included the whole parent
harness, and through it the subject's standard-decorator scenarios, so the configs the inversify, tsyringe and
injection-js subprocesses run with failed to type-check without anything noticing.
