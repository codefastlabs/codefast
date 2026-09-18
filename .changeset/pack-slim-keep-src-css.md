---
"@codefast/cli": patch
"@codefast/ui": patch
"@codefast/tracking": patch
---

Fix `pack-slim` stripping the stylesheet source of packages that export CSS.

`codefast pack-slim` removed the whole `src` directory from a package's published `files`, but `@codefast/ui` and
`@codefast/tracking` ship Tailwind source through `./css/*` → `./src/css/*`, so their published tarballs went out with
no CSS at all and the `./css/*` export resolved to nothing. pack-slim now keeps the `src` subtrees a surviving
`exports`/`imports` target still points into (e.g. `src/css`) and drops the rest of `src`, so the stylesheets ship while
the TypeScript source stays out. Surfaced by the new `publint` publish check.
