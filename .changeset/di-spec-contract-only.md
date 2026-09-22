---
"@codefast/di": patch
---

`SPEC.md` carries the behavioural contract and nothing else. The source-tree listing, the copied export barrel, the
build configuration and the roadmap of already-shipped work are gone — a reader can now rename any file under `src/`
without contradicting the spec. `Public API` states the surface as a rule instead of a second copy of `index.ts`, which
had already drifted from it, and `Scope and requirements` states the runtime, module format and TypeScript floor a
consumer must bring. New `DECISIONS.md` takes the background and the whole InversifyJS v8 comparison, `README.md` takes
the testing patterns with the `MetadataReader` example corrected to `Container.create({ metadataReader })`, and
`CONTRIBUTING.md` takes the packaging and decorator-toolchain notes.

Checking the spec against the source turned up four public names it never described: `BindingSnapshot.isMany`, the
`DependencySlot` that both `InjectionDescriptor` and `ParamMetadata` extend, and `bindingSlotToResolveOptions`, which
turns a snapshot's slot back into the `ResolveOptions` that selects it. All three are specified now, and the claim that
`toAlias()` returns the one builder with no type parameter is corrected — it has no _value_ type parameter, but it does
carry the token's slot names.
