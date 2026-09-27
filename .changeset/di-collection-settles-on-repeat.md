---
"@codefast/di": patch
---

A container that reads a collection once no longer builds a value list it never reads again. A root-level `resolveAll`
keeps its stable value list from the second read on, the way an instantiation plan compiles on repeat, so a fresh
container per request pays only for the members it resolves.
