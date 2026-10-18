---
"@codefast/di": minor
---

**Breaking:** `validate`, `inspect`, `lookupBindings`, `explain` and `generateDependencyGraph` are functions that take
the container instead of `Container` methods, so a bundle that only binds and resolves leaves them out: importing
`Container` and `token` alone drops from 23.2 KB to about 20.6 KB gzipped. `has` and `hasOwn` stay methods. Replace
`container.validate()` with `validate(container)`, `container.explain(token, options)` with
`explain(container, token, options)`, and likewise for the other three, importing each from `@codefast/di`. They refuse
a disposed container with `DisposedContainerError` as the methods did, and an object `Container` did not create with a
`TypeError`.
