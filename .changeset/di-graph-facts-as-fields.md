---
"@codefast/di": minor
---

The dependency graph states its facts as fields instead of hiding them in a display string. `GraphEdge` gains
`optional: boolean` and `slotName?: string`, so a consumer reads what an edge means rather than parsing `label` (which
stays, as the string the adapters render). `GraphNode` gains `tokenKey`: two tokens that share a display name are now
distinguishable, and the same token keeps its key across graphs from the same process — enough to key a view by, which
`tokenName` never was.

`GraphNode["kind"]` is now `BindingKind | "unbound"` instead of a bare `string`, alongside the already-widened `scope`,
and the React Flow and Cytoscape adapters carry those same unions (plus `tokenKey`, `optional`, `slotName`) instead of
flattening them to `string` — a consumer can narrow on them now. SPEC.md now documents what the graph does and does not
represent: unbound optional placeholders, omitted required-but-unbound deps, `injectAll` fan-out, slot-filtered targets,
unevaluated predicates, and parent shadowing under `includeParent`.
