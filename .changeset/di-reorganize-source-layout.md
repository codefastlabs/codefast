---
"@codefast/di": minor
---

Reorganize the source tree into subsystem folders — `container/` (container + the extracted fluent binding builders), `resolution/` (resolver, scope, lifecycle, environment, selection/constraints, and the extracted cycle-guard module), and `introspection/` (inspector, dependency graph). The root entry keeps exporting everything, and the externally consumed `@codefast/di/graph-adapters/*`, `decorators/*`, and `metadata/*` subpaths are unchanged. Deep subpaths of moved modules follow the new folders (e.g. `@codefast/di/resolver` → `@codefast/di/resolution/resolver`); import from the root entry unless you need a specific file.
