---
"@codefast/di": patch
---

A request with criteria that matches no slot is fast again when the container holds no alias: `resolveOptional()` of a
missing tagged slot no longer probes for a default-slot alias to forward to in a registry that never held one.
