---
"@codefast/di": patch
---

`MissingMetadataError` for a subclass that inherits declared constructor dependencies no longer advises giving it an
explicit constructor, which is rejected the same way. It points at `@injectable([...deps])` — `@injectable([])` for a
class that takes none — or a `toDynamic()`/`toResolved()` binding.
