---
"@codefast/di": minor
---

Reorganize the source tree into subsystem folders — `container/` (container + the extracted fluent binding builders), `resolution/` (resolver, scope, lifecycle, environment, selection/constraints, and the extracted cycle-guard module), and `introspection/` (inspector, dependency graph, and the graph adapters). The root entry keeps exporting everything and now also exports the graph adapters (`toDotGraph`, `toCytoscapeGraph`, `toReactFlowGraph` and their types), so `import { toReactFlowGraph } from "@codefast/di"` is the preferred path.

Breaking (0.x minor): the `@codefast/di/graph-adapters/*` subpaths are removed — import the adapters from the root entry or from `@codefast/di/introspection/graph-adapters/*`. Deep subpaths of other moved modules follow the new folders (e.g. `@codefast/di/resolver` → `@codefast/di/resolution/resolver`).
