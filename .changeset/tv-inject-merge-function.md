---
"@codefast/tailwind-variants": minor
---

**Breaking:** `twMergeConfig` is removed. The `twMerge` option now takes `true` (the default, `tailwind-merge`'s
`twMerge`), `false` (keep every declared class), or a merge function `(classes: string) => string` that replaces the
merge for `tv` and for the `cn` a `createTV` factory returns. Custom class groups move to
`twMerge: extendTailwindMerge(config)`, built by the caller from `tailwind-merge` or any drop-in engine.

The package now imports only `twMerge` from `tailwind-merge`, so a bundler alias from `tailwind-merge` to a drop-in
engine such as `cn` reaches it too, and no bundle carries the configuration compiler unless the application builds one.
The new `ClassMerger` type names the function the option accepts.
