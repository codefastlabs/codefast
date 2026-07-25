---
"@codefast/di": minor
---

`container.validate()` now reports a captive dependency when a singleton depends on a **transient or scoped `toDynamic` / `toDynamicAsync` binding**. Previously any dynamic terminal was classified opaque and its declared scope went unchecked, so the most common form of the bug — a singleton capturing one instance of something bound transient — passed validation silently.

A factory's _body_ remains opaque: `validate()` still does not descend into it, so whatever the factory resolves internally is not reported. Only the declared scope of the dependency edge is judged, which is the part the container actually knows.

**Breaking:** a container that wires a singleton to a transient or scoped dynamic binding now throws `ScopeViolationError` from `validate()` where it previously passed. Either widen the dependency's scope, or inject a factory instead of the value if a fresh instance per use is intended.
