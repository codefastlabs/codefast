---
"@codefast/di": patch
---

`child.has(token)` no longer throws when a parent container is disposed but the child is not. `has` recursed through the
parent's **public** `has`, which asserts the container is live, so a live child that could still `resolve` a
parent-owned token threw `DisposedContainerError` from `has` alone — breaking the `if (c.has(token)) c.resolve(token)`
guard on a healthy container. It now recurses through an internal `#hasInChain` that reads the parent's registry
directly, keeping the disposed-guard on the public entry point of the container being called.
