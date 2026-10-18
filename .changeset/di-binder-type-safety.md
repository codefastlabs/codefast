---
"@codefast/di": minor
---

**Breaking (types only):** three places the types let through what the library then did wrong or rejected late.

- `@injectable()` with no deps now compiles only on a class whose constructor needs nothing. It used to accept a class
  with required parameters — a subclass inheriting its base's constructor included — and build it with those parameters
  left `undefined`, silently. List the deps, as `@injectable([...])`.
- A `ModuleBuilder` and an `AsyncModuleBuilder` now narrow slot names as a container does: `whenNamed` inside
  `Module.create` took any string. A container and both builders bind through one new `Binder` interface, so the three
  can no longer drift apart.
- `toSelf()` exists only on a chain whose key is a class (`ClassBindToBuilder`); on a token it was accepted by the
  compiler and threw `SelfBindingRequiresClassError` at runtime. An untyped caller still gets that error.

`Binder` and `ClassBindToBuilder` are exported from the package root. Runtime behaviour is unchanged.
