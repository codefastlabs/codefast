---
"@codefast/tracking": major
---

Collapse the export map to group entries — per-file subpaths froze the internal file layout into public API.

**Breaking:** deep subpaths (`./client/*`, `./core/*`, `./server/*`, `./react/*`, and most `./destinations/*`) no longer resolve. Import from the group entry instead:

- `@codefast/tracking/core` and `@codefast/tracking/core/*` → `@codefast/tracking` (the root has always re-exported the whole isomorphic core surface).
- `@codefast/tracking/client/*` → `@codefast/tracking/client`.
- `@codefast/tracking/server/*` → `@codefast/tracking/server`.
- `@codefast/tracking/react/*` → `@codefast/tracking/react`.
- `@codefast/tracking/destinations/google-analytics|google-tag-manager|http|shared|google-consent` → `@codefast/tracking/destinations`.

Two destinations keep dedicated subpaths on purpose:

- `@codefast/tracking/destinations/vercel-analytics` — its top-level `@vercel/analytics` import would make the optional peer mandatory for every barrel consumer.
- `@codefast/tracking/destinations/ga4-measurement-protocol` — carries a server `apiSecret`; keeping it out of the barrel is what lets `SERVER_ONLY_IMPORT_SPECIFIERS` deny it in client builds.

All entries are unbundled ESM with `sideEffects: false`, so group imports tree-shake per file — the trim changes what is addressable, not what ships.
