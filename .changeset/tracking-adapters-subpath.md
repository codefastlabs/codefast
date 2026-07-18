---
"@codefast/tracking": minor
---

Let `codefast mirror` generate `package.json#exports` from `dist/`, the same as every other library package, instead of hand-curating them under mirror's preserve mode. The tsdown build is unchanged (standard `unbundle`), so mirror now emits a subpath for each built module.

Breaking (deep import only): the TanStack Start adapter moved from `@codefast/tracking/tanstack-start` to `@codefast/tracking/adapters/tanstack-start` (it lives at `src/adapters/tanstack-start.ts`). Update the import; the `SERVER_ONLY_SUBPATHS` deny-list is already re-pointed. Other subpaths are unchanged.
