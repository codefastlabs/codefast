---
"@codefast/di": minor
---

The fluent chain `bind()` returns is now the binding it registers: one object is every builder step, the registry's
record and what the resolver reads, so a plain bind is one allocation instead of three and a copy of every field. Two
names on the `Binding` shapes change to make room for the builder's methods — `id` is `identifier`, and the hook fields
are `activationHook` / `deactivationHook` — and a chain registers exactly once: a second `to*()` throws
`ChainAlreadyRegisteredError` instead of minting a second binding.
