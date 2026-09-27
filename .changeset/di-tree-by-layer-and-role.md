---
"@codefast/di": minor
"@codefast/di-testing": patch
---

**Breaking for deep subpath imports only** — the root entry `@codefast/di` is unchanged. `src/` now follows three rules,
and the published subpaths follow `src/` with no exception: a directory names a family of two or more modules and a lone
module sits flat at its layer; a directory carries the topic and a file its role, so no file repeats its directory's
name; and the exports map is the source tree, so the `strip` that kept the introspection modules at flat specifiers is
gone.

Moves: the `MetadataReader` verification leaves `resolution/cache/class-introspector` for `metadata/verify` — it was the
one value import pointing up from `metadata/` into `resolution/`; the `RESOLUTION_DIAGNOSTICS` channel leaves `errors/`
for `introspection/diagnostics`; the fluent chain's contract leaves `core/binding` for `core/binding-builders`, and the
class implementing it is `container/binding-chain`; `effectiveBindingScope` folds into `core/binding`.

Renamed specifiers: `./errors/errors` → `./errors`; `./errors/diagnostics` → `./introspection/diagnostics`;
`./ambient/active-container` → `./ambient-container`; `./container/binding-builders` → `./container/binding-chain`;
`./core/binding-scope` → gone (`effectiveBindingScope` is in `./core/binding`); `./injection/resolve-options` →
`./injection/dependency-slot`;
`./metadata/{metadata-keys,metadata-types,metadata-reader-token,symbol-metadata-reader,verifying-metadata-reader}` →
`./metadata/{keys,types,reader-token,symbol-reader,verifying-reader}`; `./lifecycle/{lifecycle-manager,scope-manager}` →
`./lifecycle/{hooks,scopes}`; `./decorators/{lifecycle-decorators,decorator-metadata}` →
`./decorators/{lifecycle,metadata-record}`; `./resolution/path/resolution-path` → `./resolution/path`;
`./resolution/plan/{instantiation-plan,plan-codegen}` → `./resolution/plan/{compiler,codegen}`;
`./resolution/select/binding-select` → `./resolution/select/candidates`; `./resolution/cache/binding-lookup-cache` →
`./resolution/cache/lookup`; `./{inspector,explanation,dependency-graph,graph-adapters/*}` →
`./introspection/{inspector,explanation,dependency-graph,graph-adapters/*}`. New: `./core/binding-builders`,
`./metadata/verify`.

`@codefast/di-testing` follows the one specifier it imports, `metadata/verifying-reader`.
