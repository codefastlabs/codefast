---
"@codefast/di": minor
---

Publish an intentional export surface: 13 subpaths instead of 36. The engine's collaborators — `resolution/*`, `registry`, `container/*`, `binding`, `constructor-type`, and the `metadata` internals — are no longer entry points. They carry the invariants documented in ARCHITECTURE.md, and publishing them meant every internal refactor was technically a breaking change. Everything a consumer needs stays reachable from the root export, which already re-exports the builder interfaces, `Constructor`, `MetadataReader`, `effectiveBindingScope`, and the resolve-options helpers.

**This also repairs a silent break.** The surface was generated from `dist/`, so reorganising `src/` into `container/`, `resolution/` and `introspection/` renamed twelve already-published entry points — `./inspector` → `./introspection/inspector`, `./dependency-graph` → `./introspection/dependency-graph`, `./graph-adapters/*` → `./introspection/graph-adapters/*`, `./container` → `./container/container`, and the whole flat `./resolver`/`./scope`/`./lifecycle`/`./environment`/`./constraints`/`./binding-select`/`./binding-scope`/`./resolve-options` set — with no changeset saying so. The consumer-facing ones (`./inspector`, `./dependency-graph`, `./graph-adapters/*`) are back at the specifiers they shipped under; `examples/tanstack-start` imports two of them and would have broken on its next upgrade.

**Breaking:** the internal subpaths listed above are gone. Import from the package root instead.
