---
"@benchmark/di": minor
---

Add the `module-cold-128` row: a fresh container built from one module of 128 bindings — half constants, half singleton
factories — resolving the last, per iteration, in each library's native module idiom (`@codefast/di` declared modules,
inversify `ContainerModule`, brandi `createDependencyModule` + `use().from()`, ditox `bindModule`). A shared
`isComposedModule` sanity check asserts every binding resolves, constants are shared and singletons are one per
container.
