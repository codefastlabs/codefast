---
"@codefast/di": patch
---

The foundation-types spec now documents the helpers a custom `when()` constraint reads a frame's `slot.keyMask` with —
`tagKeyMaskOf`, `coversTagKeys` and `NO_TAG_KEYS`, the ones the built-in tag constraints use — with an example that
rules a parent out by its tag keys before comparing any value.
