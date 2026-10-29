---
"@internal/design-system": patch
---

The README's Publishing steps work from Claude Code: read the artifact first, then publish the changed `project/` files
with the absolute path of one as the page argument. The `success`, `warning` and raised `control` values name their
nearest Tailwind swatch, so their usage notes read `green-800`, `amber-800` and the like instead of a sentence.
