---
"@codefast/di": minor
---

Reorganize the source tree into subsystem folders — `container/` (container + the extracted fluent binding builders), `resolution/` (resolver, scope, lifecycle, environment, selection/constraints, and the extracted cycle-guard module), and `introspection/` (inspector, dependency graph, and the graph adapters). The root entry keeps exporting everything and now also exports the graph adapters (`toDotGraph`, `toCytoscapeGraph`, `toReactFlowGraph` and their types), so `import { toReactFlowGraph } from "@codefast/di"` is the preferred path. The old `@codefast/di/graph-adapters/*` subpaths still work as deprecated re-exports and will be removed in a future release; deep subpaths of other moved modules follow the new folders (e.g. `@codefast/di/resolver` → `@codefast/di/resolution/resolver`).
