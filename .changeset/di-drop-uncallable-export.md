---
"@codefast/di": minor
---

**Breaking:** `effectiveBindingScope` is no longer exported from the package root. It read a `Binding`,
which `package.json#exports` deliberately withholds, and no public API ever handed one out — so it was
exported and impossible to call. Read a binding's scope from `BindingSnapshot.scope`
(`container.lookupBindings()` / `container.inspect()`) or from `GraphNode.scope`
(`container.generateDependencyGraph()`), both of which have always carried it.

`bindingSlotToResolveOptions` now takes its slot structurally, so the slot on a public
`BindingSnapshot` — where `name` is an optional property rather than a required one holding
`undefined` — is accepted. Passing a `BindingSlot`-shaped literal keeps working.

A type test now asserts each exported function is callable with values a consumer can actually obtain
from the package's own exports, which is what neither of these satisfied.
