---
"@codefast/tailwind-variants": patch
---

fix(types): default the variant schema to a keyless record when `tv` is called without `variants`, so `className`/`class` accept full `ClassValue` inputs (arrays, objects) instead of being narrowed by a string index signature
