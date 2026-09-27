---
"@codefast/di": patch
---

`resolveAsync` no longer rejects with `AsyncResolutionError` when a later sibling reads a singleton or scoped binding
synchronously — a `toDynamic` factory's `ctx.resolve`, an `@inject` accessor, a top-level `resolve` — while the async
lane is still materialising it from an earlier sibling. A level of the async lane now yields only where a dependency or
hook really awaits, so an instance built without yielding is cached before the next sibling starts, and only a
materialisation that is genuinely pending is published in flight.
