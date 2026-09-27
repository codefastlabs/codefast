---
"@codefast/di": patch
---

Every read on a child container is cheaper. The child's check that no ancestor was disposed is now one epoch compare
that V8 inlines into each entry point, the walk up the chain runs only after some container was disposed, and a new
child starts confirmed live, so a per-request child skips the walk on its first read.
