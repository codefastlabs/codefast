---
"@codefast/di": patch
---

A scoped binding whose scope changes stops handing children the instance they cached before the change. A binding
registered on a parent, resolved from a child, then refined `scoped()` → `transient()` → `scoped()` gave that child its
old scoped instance back, because only the registering container's cache was cleared. Every container now files a scoped
instance under a key the binding replaces when it leaves `scoped`, so the cached instance is never found again.
