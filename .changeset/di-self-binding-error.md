---
"@codefast/di": patch
---

`toSelf()` on a token that is not a class now throws `SelfBindingRequiresClassError` instead of a bare
`Error`, so it is catchable as a `DiError` like every other failure this package raises, carries a
`code` and the token name, and is documented in SPEC.

It was the one throw site outside the error taxonomy, and the architecture test could not see it —
that test only read `export class …Error` declarations. It now also fails on any `throw new Error(…)`
under `src/`, and on an error class the root barrel forgets to export.
