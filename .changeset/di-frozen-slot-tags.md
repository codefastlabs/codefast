---
"@codefast/di": minor
---

perf(di)!: freeze slot tags where they are built so snapshots alias instead of copy

`BindingSnapshot.slot.tags` is now the binding's own frozen array rather than a fresh copy per snapshot per binding —
`lookupBindings()`/`inspect()` skip an allocation per binding, reclaiming the cost the defensive copy had added. The
array is frozen at its two construction sites (the default slot and the builder's re-tag), so the registry stays
uncorruptible.

Breaking: mutating a snapshot's `tags` array — already a type error against `ReadonlyArray` — now throws `TypeError` at
runtime instead of silently editing a private copy.
