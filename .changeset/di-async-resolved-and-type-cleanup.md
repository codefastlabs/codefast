---
"@codefast/di": minor
---

Fix `toResolved` bindings on the async path, and tighten the type surface.

`bind(T).toResolved(factory, deps)` threw `InternalError: resolved binding requires resolution context` from every async
entry point — `resolveAsync`, `resolveAllAsync`, `resolveOptionalAsync`, and any `toDynamicAsync` factory awaiting one.
`requiresResolutionContext()` answers only for the two factory kinds that are handed a context, so a `resolved` binding
legitimately arrives with none; the guard that rejected it never read the context it demanded. The sync lane never had
it.

Type-surface changes, all verified type-identical or strictly wider:

- Optional properties on the public option bags — `ResolveOptions`, `InjectOptions`, `InjectableOptions`, `GraphOptions`
  — are now `?: T | undefined`. Under `exactOptionalPropertyTypes` the old `?: T` rejected a caller holding
  `T | undefined`, which is the shape a real call site has.
- `BindingConstraint` is exported: the `(ctx: ConstraintContext) => boolean` that `when()` takes and every `when*`
  helper returns now has a name instead of fourteen inline spellings.
- `ParamMetadata` and `InjectionDescriptor` extend `DependencySlot`, and the dependency-graph builder uses it directly,
  so the one shape both dependency sources normalise to is enforced by the compiler rather than by four declarations
  that happened to match.
- `PartialBinding` is derived from `Binding` by a distributive `Omit`, so a new binding kind cannot join one union and
  miss the other.
- The inert `const` modifier is gone from type parameters inferred from a token rather than a literal; the four on
  `toResolved`/`toResolvedAsync`, where `deps` is an array literal, stay.
