---
"@codefast/cli": patch
---

Match GitHub's heading-slug algorithm in `audit links`, so a cross-reference that resolves on GitHub resolves in the
audit.

Heading anchors are now slugged the way GitHub does: each space becomes its own hyphen with runs left intact,
underscores are kept as slug characters, and repeated headings gain `-1`, `-2`, … suffixes in heading order. The
previous slugger collapsed whitespace, dropped underscores, and offered only the base slug for duplicates, so a link a
browser lands on could be reported as dangling — the `@remarks` already claimed GitHub parity the code did not deliver.
