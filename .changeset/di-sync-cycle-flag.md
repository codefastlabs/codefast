---
"@codefast/di": minor
---

Every synchronous lane detects a cycle by the binding's `inFlight` flag alone, at any depth; the linear frame scan, the
membership `Set` it switched to past a depth threshold, and the exported `RESOLUTION_SET_THRESHOLD` and
`enterResolutionPath` are gone from `resolution/path/resolution-path`, replaced by `enterSyncPath`, `leaveSyncPath`,
`enterSeededPath`, `leaveSeededPath`, `linkFrameBinding` and `bindingsOf`. A class or `toResolved` binding that resolves
its own token through a nested `container.resolve()` now reports `CircularDependencyError` where it recursed until the
stack overflowed, and a singleton constructing itself that way is reported instead of being built twice.
