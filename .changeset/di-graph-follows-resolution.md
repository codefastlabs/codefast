---
"@codefast/di": minor
---

`generateDependencyGraph({ includeParent: true })` follows resolution's own walk up the chain: every ancestor's bindings
join the graph, a single dependency connects to the nearest container holding a binding its slot matches — a child
binding the request cannot select no longer hides the parent's — and an `injectAll` fans out across the whole chain.
`buildDependencyGraph` takes the ancestor registries, nearest first, in place of the parent registry.
