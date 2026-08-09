---
"@codefast/di": minor
---

A chain's `when()` calls now narrow rather than replace. SPEC defines a candidate as a binding that passes **all** of a chain's `when(ctx)` predicates, and §5.4 describes a binding as carrying "one or several constraints combined"; the chain's type says the same by returning `this`. Only the implementation disagreed, and it did so silently — `#reslot` overwrote the predicate field, so the first condition was discarded and never called.

The consequence was worse than a binding being more permissive than written. Specificity prefers a binding that carries a predicate, so a discarded first condition made the constrained binding beat the default one:

```ts
container
  .bind(Logger)
  .to(ConsoleLogger)
  .when((ctx) => ctx.parent !== undefined) // never consulted
  .when((ctx) => ctx.parent?.scope === "singleton");
```

Nothing reported it — not at bind time, not at resolve time, not from `validate()`. A service that should have received the default logger received the constrained one instead.

`whenTagged()` already accumulated, which is what made this a trap rather than a quirk: two adjacent methods with the same chaining syntax and the same `this` return type, one combining and one replacing.

Binding-level `onActivation()` and `onDeactivation()` keep replacing. That reading is pinned by a test and is reasonable for reconfiguring a chain held in a variable, even though the chained spelling reads as combination and the container-level hooks accumulate. Changing it is a separate decision from this one.
