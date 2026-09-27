---
"@codefast/di": patch
---

A resolve that carries options on a root container gets back much of the speed 0.11.0 took from it. The check that
refuses a disposed chain grew in that release enough that V8 stopped inlining the lookup behind that entry point; a live
root now pays two field reads for it, and only a child reads the dispose epoch.
