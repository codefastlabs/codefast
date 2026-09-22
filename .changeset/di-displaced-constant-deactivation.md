---
"@codefast/di": minor
---

A constant that a plain last-wins `bind()` displaces now still runs its `onDeactivation` hook at `dispose()`. A
displaced constant left the registry — so the dispose sweep, which walks the registry, never reached it — and, carrying
no cached instance, it was absent from the singleton cache too, falling between the two. The container now records a
displaced constant that still owes a deactivation and drains it at dispose; a refinement that restores the binding (a
`when*()` that moves the winner off the slot) takes it back out of that set, so nothing deactivates twice. The
park-and-restore behaviour of `bind()` is otherwise unchanged.
