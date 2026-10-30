---
"@codefast/tailwind-variants": patch
---

A call that passes a variant's default explicitly resolves from the same cache entry as one that omits it, so a page
mixing `size: "default"` with no `size` at all merges that answer once.
