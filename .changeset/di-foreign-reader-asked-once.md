---
"@codefast/di": patch
---

A `MetadataReader` passed through `ContainerOptions` is asked about a class once for the life of the reader: its answers
are memoized per class, and every container handed the same reader shares one verifying wrapper. Lifecycle metadata used
to be read on every activation, and each root container asked again.
