---
"@codefast/di-testing": minor
---

**Breaking:** `TestBedOptions.metadataReader` is typed `VerifiedMetadataReader`, matching `@codefast/di`'s container
option: wrap a custom reader with `verifyingMetadataReader()` from `@codefast/di` first.
