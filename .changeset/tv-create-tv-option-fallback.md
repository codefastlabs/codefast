---
"@codefast/tailwind-variants": patch
---

A `tv` from `createTV` falls back to each shared option the call leaves `undefined`, so `{ twMerge: undefined }` no
longer overrides a shared `twMerge: false`. `cacheResolutions` admits an explicit `undefined`, so a possibly-undefined
value can be forwarded under `exactOptionalPropertyTypes`.
