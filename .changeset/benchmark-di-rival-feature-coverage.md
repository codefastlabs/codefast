---
"@benchmark/di": minor
---

Expand cross-library coverage so each rival is measured on every feature it natively supports, not just the shared core.
New feature-fair rows, each using every library's own idiom (mechanism differences documented per row):

- **resolveAll collection** (`resolve-all-strategies-*`): ditox (`bindMultiValue`), injection-js (`multi: true`) and
  tsyringe (repeated `register`) join `@codefast/di` and inversify — surfacing that ditox and injection-js cache the
  collection array while di, inversify and tsyringe rebuild it.
- **conditional injection by consumer tag** (`conditional-injection-tagged`): brandi's `when`/`tagged` idiom against
  di's `inject(token, { tag })`.
- **cold module composition** (`module-cold-from-modules`): inversify (`load`), ditox (`bindModule`) and brandi
  (`use().from()`) against di's `Container.fromModules`.
- **cold async single-hop** (`async-init-single-hop`): inversify (`getAsync`) and brandi (`AsyncFactory`) against di's
  `resolveAsync`.
- **per-request scoped lifetime** (`scoped-binding-per-child`): awilix (`createScope` + `scoped()`), tsyringe
  (`ContainerScoped`), brandi (`inContainerScope`) and ditox (scoped `bindFactory`) join di and inversify.
- **disposal teardown hooks** (`lifecycle-pre-destroy-unbind`): ditox (`onRemoved`) and tsyringe (`dispose()`) join di
  and inversify.

Awilix stays `—` on disposal (its `dispose()` is async-only), and tagged multi-key resolution stays `@codefast/di`-only
(inversify's `GetOptions` accepts a single tag).
