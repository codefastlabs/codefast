---
"@codefast/di": patch
---

A container's class-metadata caches are keyed by the metadata reader and shared by every container that reads through
it, so a child inheriting its parent's reader resolves a class the parent already met without reading its metadata
again; the activation-need cache is built by the first interpreted resolve that asks for it instead of with the
container.
