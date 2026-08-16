---
"@codefast/di": patch
---

Stop a deep synchronous resolution from reporting a circular dependency that is not there. The membership set the
resolution path attaches past `RESOLUTION_SET_THRESHOLD` is seeded from the path, and the frames already on it are
handed no set to delete from on unwind — so the set outlived the resolve it was built for, on an array the resolver
reuses. A graph resolved on the interpreted path deeper than that threshold answered its first resolve and threw
`CircularDependencyError` on every later one, and a sibling branch below the attach depth threw within a single resolve.
The set is now dropped as soon as it stops mirroring the path, and rebuilt by the next frame that needs one.
