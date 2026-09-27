---
"@codefast/cli": minor
---

Add `codefast audit layers`, which holds a package's `src/` to the layering its architecture states.
`audit.layers.packages` lists each package's layers bottom to top, every entry a family directly under the root — a
directory, or a lone module sitting flat — and the audit reports every value import or re-export that points up the
list, plus every module no layer places. Type-only imports pass whichever way they point; a dynamic `import()` counts as
a value import. A configured name the workspace does not hold, an entry nested below the root, and a family placed twice
are refused before anything is scanned. `audit.layers.allowlist` takes the offending import as written, or
`path:<import>`.
