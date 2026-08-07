---
"@codefast/di": minor
---

`src/` is reorganised by dependency direction, temperature and lane. **Breaking for deep subpath imports only** — the root entry `@codefast/di` and the four `@codefast/di/graph-adapters/*` specifiers are unchanged, and nothing else in this repo imported a deep specifier.

- **`core/`** now holds the model — `token`, `types`, `constructor-type`, `binding`, `binding-scope`, `registry`, `module` — instead of sitting loose beside `index.ts`, so the layering the architecture test enforces is visible in the tree rather than only in prose.
- **`errors/`** separates the taxonomy from its diagnostics. The hot path imports error constructors and nothing else; message building belongs behind the throw, which is what the measured cost of a deeper throw site already said.
- **`injection/`** is new, and it closes a real inversion: `core/binding.ts` and `metadata/metadata-types.ts` imported `InjectionDescriptor` from `decorators/inject.ts` — the model depending on a decorator module, which passed the layering test only because the imports are type-only. The descriptor, its normalisers and the two pure builders (`optional`, `injectAll`) now live at the model layer; `decorators/inject.ts` keeps the one symbol that is actually a decorator. `resolve-options` moves alongside, so `DependencySlot` and the descriptor it derives from are in one place.
- **`ambient/`** takes the module-global active container out of `resolution/environment.ts`, which had been carrying three unrelated jobs. The remainder is renamed `resolution/context.ts`, which is what it is.
- **`lifecycle/`** promotes `LifecycleManager` and `ScopeManager` out of `resolution/`, and **`resolution/{cache,path,plan,select}/`** groups the engine's collaborators by the lane each one serves.

Renamed specifiers: `./binding`, `./constructor-type`, `./module`, `./registry`, `./token`, `./types` → `./core/*`; `./errors` → `./errors/errors`; `./resolution/binding-scope` → `./core/binding-scope`; `./resolution/diagnostics` → `./errors/diagnostics`; `./resolution/lifecycle` → `./lifecycle/lifecycle-manager`; `./resolution/scope` → `./lifecycle/scope-manager`; `./resolution/resolve-options` → `./injection/resolve-options`; `./resolution/{activation-need,binding-lookup-cache,class-introspector}` → `./resolution/cache/*`; `./resolution/resolution-path` → `./resolution/path/resolution-path`; `./resolution/instantiation-plan` → `./resolution/plan/instantiation-plan`; `./resolution/{binding-select,constraints}` → `./resolution/select/*`; `./resolution/environment` → `./resolution/context`.

No behaviour changes. Measured as a paired, alternating, per-scenario A/B against the pre-move build over thirteen scenarios: every median inside the A/A control's own spread, and the one row that looked down at three passes (`fan-out-tree-depth-3-breadth-4`, 0.966) came back at 0.993 over seven passes against an A/A median of 0.991 on the same row.

`tests/unit/architecture.test.ts` gains a check that ARCHITECTURE.md's backticked `tests/…` citations point at files that exist — the existing link check only saw `](src/…)` links, so a moved test file could invalidate a citation silently.

Three re-declared types are now derived, which is structurally identical and breaks nothing: `buildResolutionFrame`'s `slot` parameter is `ResolutionFrame["slot"]` rather than a hand-written shape that had lost both `readonly` modifiers, inlined `BindingTag`'s definition and dropped its tuple labels; `injectionSlotToResolveOptions` takes `Pick<DependencySlot, "name" | "tags">`; and the descriptor's `tags` no longer carries `any` from `PropertyDescriptor.value` into a cast that looked checked.
