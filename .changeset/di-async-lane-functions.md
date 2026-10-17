---
"@codefast/di": minor
---

**Breaking:** `resolveAsync`, `resolveOptionalAsync`, `resolveAllAsync` and `initializeAsync` are functions that take
the container instead of `Container` methods, so a program that never awaits a resolve leaves the whole async lane out
of its bundle: the minimal program (`Container`, `token`, bind a constant, resolve) drops from 19 145 B to 16 253 B
gzipped in a production build. Replace `container.resolveAsync(token, options)` with
`resolveAsync(container, token, options)`, and likewise for the other three, importing each from `@codefast/di`. A
disposed container, or an object `Container.create()` did not make, is a rejection, as it was.

The resolution context splits the same way. `toDynamic` factories and activation hooks receive a `ResolutionContext`
with `resolve`, `resolveOptional` and `resolveAll`; `toDynamicAsync` factories receive an `AsyncResolutionContext`,
which adds `resolveAsync`, `resolveOptionalAsync` and `resolveAllAsync`. `Resolver` now names the three sync methods,
and the new `AsyncResolver` the three async ones.
