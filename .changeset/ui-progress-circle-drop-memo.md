---
"@codefast/ui": patch
---

`ProgressCircle` no longer wraps its `progressCircleVariants(...)` call in `useMemo`. A variant function now remembers what each selection resolved to, so the call already returns the same object for the same selection — the hook was re-deriving a dependency array to guard a lookup.
