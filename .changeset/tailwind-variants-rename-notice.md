---
"@codefast/tailwind-variants": patch
---

`@codefast/tailwind-variants` will be renamed `@codefast/tv` in a future release, and the README now says so at the top.
Only the name changes: when that release lands, replace the dependency
(`pnpm remove @codefast/tailwind-variants && pnpm add @codefast/tv`) and change every
`from "@codefast/tailwind-variants"` import to `from "@codefast/tv"`. Code that imports `tv` and `cn` through
`@codefast/ui/lib/utils` instead needs no change. Nothing changes in this release, and `@codefast/tailwind-variants`
stays the package to install until then.
