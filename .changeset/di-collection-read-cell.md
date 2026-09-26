---
"@codefast/di": patch
---

A root-level `resolveAll()` read in a loop over the same token, as an event bus does for every event, is cheaper: the
lookup cache keeps the last collection in front of its map, so a repeat read skips the map lookup.
