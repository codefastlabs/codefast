---
"@codefast/di": minor
---

A custom `MetadataReader` can now actually reach resolution, and the ambient container is public API:

- **`Container.create({ metadataReader })`** — new `ContainerOptions`. A container hands its reader to the resolver it
  builds in its constructor, so a `MetadataReaderToken` binding on that same container was always too late: resolution
  kept the decorator reader and any undecorated class threw `MissingMetadataError`, while
  `validate()`/`inspect()`/`generateDependencyGraph()` re-read the token and honoured it — the two halves disagreed. The
  option is in place before the resolver exists and is inherited by children; the binding path still works in its one
  working shape (bound on a parent, used from a child).
- **One container, one reader.** That asymmetry is gone rather than documented: a container now answers every question —
  resolve, `validate()`, `inspect()`, `generateDependencyGraph()`, `unbind*` — with the reader its resolver was built
  with, so introspection cannot describe a class differently from how it is instantiated. As a side effect those paths
  no longer re-scan the registry for `MetadataReaderToken` on every call.
- **`runWithContainer` / `getActiveContainer` are exported from the root entry**, alongside the metadata pieces needed
  to write a reader without reaching for subpaths: `defaultMetadataReader`, `SymbolMetadataReader`, and the
  `ConstructorMetadata` / `LifecycleMetadata` / `ParamMetadata` types. `toMermaidGraph` joins the other graph adapters
  on the barrel.
- **A `MetadataReader`'s answer is verified, not trusted.** The seam returned `ConstructorMetadata` by cast, so a
  hand-written reader that forgot `params` produced a bare `TypeError` from the plan compiler — no `code`, no class name
  — while `validate()` passed the same container because its cold path defended with `?? []`. New `InvalidMetadataError`
  names the class and the defect. A supplied reader is wrapped once at container construction so resolve, `validate()`
  and `generateDependencyGraph()` all see verified answers; the decorator reader writes the metadata it later reads, so
  a container that supplies none is left on the path it always took.
- **Fix: `MissingContainerContextError` named the accessor where it meant the class.** Constructing a class with
  `@inject` accessors outside a container context reported `Class 'clock' … container.resolve(clock)` instead of the
  class it was told to name (SPEC §7.5 already specified the class). The error now carries
  `className: string | undefined` and `accessorName: string | symbol` instead of a single flattened `targetName`, and
  phrases itself accordingly — the word "Class" leaves the sentence when there is no class to name. **Breaking:**
  `targetName` is gone from this error.
- New examples `18-ambient-container` and `19-custom-metadata-reader`; SPEC §6.1, §6.11, §7.4 and §7.5 updated.
