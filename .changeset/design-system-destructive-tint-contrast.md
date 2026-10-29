---
"@internal/design-system": patch
---

The contrast check reads `destructive` the way the components paint it: as text on `background`, `card` and `popover`,
and on its own rest and hover tints over each, composited in gamma-encoded sRGB. A `CONTRAST_PAIRS` entry can name a
`tint` per scheme for that. The brand book and the `destructive` usage note give the new tints.
