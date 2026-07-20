---
"@codefast/tracking": minor
---

Let `codefast mirror` generate `package.json#exports` from `dist/`, the same as every other library package (di, theme), instead of hand-curating them under mirror's preserve mode. The per-module build output is unchanged, so mirror emits a subpath for each built module, and the root becomes the client entry.

Breaking:

- The root `@codefast/tracking` is now the **client entry** — it re-exports the isomorphic core plus the whole browser surface (`createClientTracker`, `createConsentRuntime`, the React bindings, the gtag + ad-network destinations). Server code must import the core it needs from `@codefast/tracking/core/*`, not from the root.
- The `./client`, `./server`, `./core`, `./react`, and `./destinations` group barrels are gone. Use the client root for browser code, or a module's own subpath for granular/server imports (`@codefast/tracking/server/initial-consent`, `@codefast/tracking/client/gpc`, …).
- The TanStack Start adapter is now `@codefast/tracking/adapters/tanstack-start` (was `/tanstack-start`); the import-protection deny-list is `@codefast/tracking/tooling/import-protection` (was `/import-protection`). `SERVER_ONLY_SUBPATHS` now denies `server/**` and `adapters/**`.
