---
"@codefast/tailwind-variants": minor
---

**Breaking:** three exported types are renamed or removed so each name says what the type is.

- `ExtendedVariantConfig` is now `ExtensionVariantConfig`: it configures the extension, not the resolver it extends.
- `SlotResolverProps` is removed; a slot resolver takes `VariantSelection`, the same selection a resolver call takes.
- `HasBooleanVariant` and `VariantResolverResult` are removed. Nothing read them: `VariantValue` already admits a
  boolean for a `"true"`/`"false"` group, and `ReturnType` of a resolver gives what a call returns.
