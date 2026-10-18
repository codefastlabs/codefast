---
"@codefast/di": minor
---

**Breaking:** a container now accepts only a verified `MetadataReader`. Wrap a custom reader with
`verifyingMetadataReader()` — now exported from the package root — before passing it as `metadataReader` or binding it
to `MetadataReaderToken`; both are typed `VerifiedMetadataReader`, and a container handed an unwrapped reader throws
`TypeError`. The container used to wrap every reader itself, which pulled the verification into every bundle; it now
ships only in a program that brings a reader of its own. The smallest bind-and-resolve program drops 445 B gzipped
(20,577 → 20,132 B), and `container-create-empty` reads +5.5% in a paired run.
