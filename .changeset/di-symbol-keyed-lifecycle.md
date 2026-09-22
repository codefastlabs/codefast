---
"@codefast/di": patch
---

`@postConstruct` / `@preDestroy` on a symbol-keyed method now fail at the declaration with the new
`SymbolKeyedLifecycleError`, instead of a misleading `InvalidMetadataError` at resolve that blamed a `MetadataReader`
the caller never configured. The lifecycle reader keys methods by their string name, so a symbol-keyed method could
never be found again; the decorator now rejects it up front, where the mistake is.
