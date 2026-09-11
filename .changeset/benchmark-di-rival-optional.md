---
"@benchmark/di": minor
---

Add an `optional-missing-transient` row: a transient class whose one optional dependency is unbound, so every resolve
reconstructs it and checks the absent optional. `@codefast/di`, brandi and ditox all express it (each has real transient
scope plus an optional-token form — `optional()` / `token.optional` / `optional()`); injection-js and the container-only
rivals read `—`, since a cached `get` would check the optional just once.
