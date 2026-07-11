---
"@codefast/tracking": major
---

Collapse the export map to group entries — per-file subpaths froze the internal file layout into public API.

**Breaking:** deep subpaths (`./client/*`, `./core/*`, `./server/*`, `./react/*`, and per-file `./destinations/*`) no longer resolve. Import from the group entry instead:

- `@codefast/tracking/core` and `@codefast/tracking/core/*` → `@codefast/tracking` (the root has always re-exported the whole isomorphic core surface).
- `@codefast/tracking/client/*` → `@codefast/tracking/client`; same pattern for `server` and `react`.
- Google helpers → `@codefast/tracking/destinations`.

One destination keeps a dedicated subpath on purpose: `@codefast/tracking/destinations/vercel-analytics` — its top-level `@vercel/analytics` import would make the optional peer mandatory for every barrel consumer.

All entries are unbundled ESM with `sideEffects: false`, so group imports tree-shake per file — the trim changes what is addressable, not what ships.
