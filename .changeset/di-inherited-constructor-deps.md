---
"@codefast/di": minor
---

A subclass that inherits declared constructor dependencies but declares none of its own — the natural
`class Derived extends Base {}` with an implicit constructor — is now rejected with `MissingMetadataError` instead of
being built with `undefined` arguments. Constructor metadata is opt-in per class, so an implicit constructor previously
slipped through the `target.length === 0` check and produced a silently-broken instance. The error names the base and
how many dependencies it declares. A subclass whose own `@injectable([])` declares zero deps is unaffected — it is built
with zero arguments, as declared.
