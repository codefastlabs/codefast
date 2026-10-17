---
"@codefast/di": patch
---

Move three cold paths out of the resolver to the modules they belong to: a class's constructor-parameter settle (and its
`MissingMetadataError`) to the class introspector, a root collection's stable-value check beside its memo in
`resolution/cache/lookup`, and `validate`'s miss check to `introspection/validation`, which reads the chain through the
new `DependencyResolver.bindingsForValidate()` in place of `missForValidate()`. `ARCHITECTURE.md` replaces the
resolver's line budget with the rule for what `resolution/resolver.ts` holds.
