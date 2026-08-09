---
"@codefast/di": minor
---

`@postConstruct` and `@preDestroy` now run for an instance a factory built, not only one `.to(Class)` constructed.

The decorators sit on the class, so the same class behaved differently depending on how it was bound:

```ts
container.bind(Pool).to(Connection); // start() ran
container.bind(Pool).toDynamic(() => new Connection()); // start() did not
```

`lifecycleMethods()` read the methods off `binding.target`, which only a `class` binding has. That is true of the _binding_ — but the _instance_ is a class either way, and it is the instance the hooks belong to. A factory names no class up front, so the class is now read off the value it returned, and re-read whenever a factory returns a different one.

`toConstantValue` is deliberately excluded: the caller built that instance, not the container. `toAlias` too, since the binding it points at has already run them.

### What this cost, and what it bought

The resolver reaches an instance through several specialised lanes that each hand the value back without a pipeline — transient dynamic sync, its async and cascade twins, the compiled instantiation plan, and the general path. A first attempt fixed the general path only and passed 6 of 14 lanes; a second made every factory binding decline its fast lane, which was correct but cost a **0.79× suite geomean**, with async fan-out rows at 0.22×.

What ships keeps every fast lane and adds a check on what each one produced: the class is read from the instance and memoized on the binding, so a factory returning the same class pays one identity comparison rather than a metadata lookup. A process that declares no lifecycle method anywhere skips even that, on one boolean.

Measured against `main` over 65 scenarios: **geomean 0.9399×, median 0.9773×**, worst rows ~0.72×, and no cost at all where nothing declares a hook. The remaining cost is inherent for async lanes — whether an asynchronously produced value carries a hook cannot be known before it exists, so one `.then` per resolve is unavoidable.
