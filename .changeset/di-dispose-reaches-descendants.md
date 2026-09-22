---
"@codefast/di": minor
---

Disposing a container now reaches its descendants. A child whose parent (or any ancestor) has been disposed is itself
disposed: `isDisposed` reads `true`, and every `resolve`, `has` and mutation is refused with `DisposedContainerError`,
including the child's own bindings — previously a child kept building transients and constants from a torn-down chain,
and `child.has` and `child.resolve` disagreed. The guard keeps the resolve path cheap: a root still reads only its own
`#disposed` field, and a child adds one call-free compare of a dedicated dispose-epoch cell against the epoch at which
its chain was last confirmed live — the ancestor walk runs only after some container in the process is disposed. The
dispose epoch is separate from the state epoch, so a per-request child's dispose does not invalidate the chain-version
memo that keeps deep resolves cheap, and `createChild()` is untouched. `resolveAsync` refuses a disposed chain with a
synchronous throw at the entry, matching how it already guarded a self-disposed container, and `dispose()` stays ungated
so an `await using` child of a disposed ancestor still tears down cleanly.
