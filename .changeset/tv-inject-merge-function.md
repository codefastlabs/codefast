---
"@codefast/tailwind-variants": minor
---

**Breaking:** `twMergeConfig` is removed. The `twMerge` option now takes `true` (the default engine's `twMerge`),
`false` (keep every declared class), or a merge function `(classes: string) => string` that replaces the merge for `tv`
and for the `cn` a `createTV` factory returns. Custom class groups move to `twMerge: extendTailwindMerge(config)`, built
by the caller from `cn/config` or any drop-in engine, so no bundle carries the configuration compiler unless the
application builds one. The new `ClassMerger` type names the function the option accepts.
