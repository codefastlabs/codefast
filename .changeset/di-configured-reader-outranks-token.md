---
"@codefast/di": patch
---

A reader passed through `ContainerOptions.metadataReader` now outranks a `MetadataReaderToken` binding for that
container's children too, at every depth, as it already did for the container itself; a token binding still reaches the
children of a container given no reader.
