---
"@codefast/di": patch
---

A resolve that carries options is fast again on a root container. The check that refuses a disposed chain grew in 0.11.0
enough that V8 stopped inlining the lookup behind that entry point; a live root now pays two field reads for it, and
only a child reads the dispose epoch.
