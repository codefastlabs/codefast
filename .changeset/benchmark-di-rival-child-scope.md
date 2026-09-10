---
"@codefast/benchmark-di": minor
---

Bench ditox and injection-js on hierarchical child-scope resolution. Both have real container hierarchy
(`createContainer(parent)` / `resolveAndCreateChild`), so they now run the `child-depth-2-resolve` row — resolving a
root-bound constant from a depth-2 child by walking the parent chain — instead of reading `—`. brandi keeps `—`: its
`clone()` copies bindings rather than linking a parent, so it has no honest equivalent.
