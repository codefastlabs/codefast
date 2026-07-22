---
"@codefast/di": patch
---

Fix binding-registration order sensitivity: the fluent builder chain commits eagerly, so `bind(x).toDynamic(f).when(p)` (or `.whenNamed(...)` / `.whenTagged(...)`) momentarily registered a default-slot binding whose last-wins commit silently displaced an existing default binding of the same token — and the displaced binding was never restored once the chain narrowed to a predicate or a named/tagged slot. Registering a default binding before a constrained one on the same token therefore lost the default. The commit chain now remembers what an intermediate commit displaced and restores it when the chain settles on a non-conflicting shape; a chain that genuinely ends on the same default slot still replaces the previous default (last-wins unchanged).
