---
"@codefast/ui": patch
"@internal/benchmark-viewer": patch
---

`useAnimatedValue` keeps its pending animation frame in a local object instead of reassigning a captured variable, which
React Compiler's immutability rule rejects; its behavior is unchanged. The benchmark viewer's chart does the same for
its resize frame and now cancels a pending one when it unmounts.
